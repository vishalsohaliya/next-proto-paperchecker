import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Canvas, PencilBrush, IText, Rect, Ellipse, FabricImage, Line } from 'fabric';

const CROSSHAIR_TOOLS = ['text', 'stamp', 'rect', 'circle', 'line', 'erase'];

function hexToRgba(color, alpha) {
  if (color && color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(99,102,241,${alpha})`;
}

function applyStyleToObject(obj, s) {
  obj.set({
    borderColor: s.borderColor,
    cornerColor: s.cornerColor,
    cornerStrokeColor: s.cornerStrokeColor,
    cornerStyle: s.cornerStyle,
    cornerSize: s.cornerSize,
    transparentCorners: s.transparentCorners,
    borderDashArray: s.borderDashArray,
    borderScaleFactor: 1.5,
  });
}

function applyStyleToCanvas(canvas, s) {
  canvas.selectionColor = hexToRgba(s.borderColor, 0.08);
  canvas.selectionBorderColor = s.borderColor;
  canvas.selectionLineWidth = 1.5;
}

const AnnotationLayer = forwardRef(function AnnotationLayer(
  { width, height, tool, stampUrl, onStampConsumed, zoom, initialJson, selectionStyle, shapeStyle },
  ref,
) {
  const lowerRef = useRef(null);
  const fabricRef = useRef(null);

  const toolRef = useRef(tool);
  const stampUrlRef = useRef(stampUrl);
  const onStampConsumedRef = useRef(onStampConsumed);
  const zoomRef = useRef(zoom);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const selectionStyleRef = useRef(selectionStyle);
  const shapeStyleRef = useRef(shapeStyle);

  toolRef.current = tool;
  stampUrlRef.current = stampUrl;
  onStampConsumedRef.current = onStampConsumed;
  zoomRef.current = zoom;
  widthRef.current = width;
  heightRef.current = height;
  selectionStyleRef.current = selectionStyle;
  shapeStyleRef.current = shapeStyle;

  useImperativeHandle(ref, () => ({
    getFabric() {
      return fabricRef.current;
    },
    toJSON() {
      const json = fabricRef.current?.toJSON() ?? { objects: [] };
      const { viewportTransform: _vt, ...rest } = json;
      return rest;
    },
    async loadJSON(json) {
      const c = fabricRef.current;
      if (!c) return;
      const safe = { ...(json ?? { objects: [] }) };
      delete safe.viewportTransform;
      await c.loadFromJSON(safe);
      applyStyleToCanvas(c, selectionStyleRef.current);
      c.getObjects().forEach((obj) => applyStyleToObject(obj, selectionStyleRef.current));
      const z = zoomRef.current;
      c.setZoom(z);
      c.setDimensions({ width: widthRef.current * z, height: heightRef.current * z });
      c.requestRenderAll();
    },
    calcOffset() {
      fabricRef.current?.calcOffset();
    },
  }));

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !width || !height) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({ width: width * zoom, height: height * zoom });
    canvas.requestRenderAll();
  }, [zoom, width, height]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = tool === 'draw';
    // Only enable rubber-band group-selection for the Select tool.
    // Leaving it on for rect/circle/text/stamp causes Fabric's rubber-band
    // rectangle to render on top of the shape being drawn, creating a ghost
    // border offset from the actual shape stroke.
    canvas.selection = tool === 'select';
    canvas.defaultCursor = CROSSHAIR_TOOLS.includes(tool)
      ? tool === 'erase'
        ? 'cell'
        : 'crosshair'
      : 'default';
    canvas.skipTargetFind = tool === 'draw';
    canvas.requestRenderAll();
  }, [tool]);

  // Re-apply selection style to all existing objects and the canvas whenever style changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    applyStyleToCanvas(canvas, selectionStyle);
    canvas.getObjects().forEach((obj) => applyStyleToObject(obj, selectionStyle));
    canvas.requestRenderAll();
  }, [selectionStyle]);

  useEffect(() => {
    if (!width || !height || !lowerRef.current) return;

    const canvas = new Canvas(lowerRef.current, {
      width,
      height,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
    });
    fabricRef.current = canvas;

    applyStyleToCanvas(canvas, selectionStyleRef.current);

    const brush = new PencilBrush(canvas);
    brush.color = '#111827';
    brush.width = 2;
    canvas.freeDrawingBrush = brush;

    canvas.isDrawingMode = false;
    canvas.selection = true;

    let drawingShape = false;
    let origX = 0;
    let origY = 0;
    let shapeInProgress = null;

    const onObjectAdded = ({ target }) => {
      applyStyleToObject(target, selectionStyleRef.current);
    };

    canvas.on('object:added', onObjectAdded);

    const onMouseDown = (opt) => {
      const t = toolRef.current;
      const { x, y } = opt.scenePoint;

      if (t === 'erase' && opt.target) {
        canvas.remove(opt.target);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        return;
      }

      if (t === 'stamp' && stampUrlRef.current && !opt.target) {
        FabricImage.fromURL(stampUrlRef.current).then((img) => {
          const maxSide = 200;
          const scale = Math.min(maxSide / (img.width || 1), maxSide / (img.height || 1), 1);
          img.set({ left: x, top: y, scaleX: scale, scaleY: scale });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
          onStampConsumedRef.current?.();
        });
        return;
      }

      if (t === 'text' && !opt.target) {
        const text = new IText('Text', {
          left: x,
          top: y,
          fontSize: 18,
          fill: '#111827',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.requestRenderAll();
        return;
      }

      if ((t === 'rect' || t === 'circle' || t === 'line') && !opt.target) {
        drawingShape = true;
        origX = x;
        origY = y;

        // selectable/evented/hasBorders/hasControls are all disabled during the draw
        // gesture so Fabric never renders the selection chrome on top of the shape's
        // own stroke, which would cause a doubled / offset border while dragging.
        const drawingProps = {
          selectable: false,
          evented: false,
          hasBorders: false,
          hasControls: false,
        };

        const ss = shapeStyleRef.current;
        const shapeFill = ss.transparentFill
          ? 'transparent'
          : hexToRgba(ss.fill, ss.fillOpacity);
        const shapeProps = {
          fill: shapeFill,
          stroke: ss.stroke,
          strokeWidth: ss.strokeWidth,
          strokeUniform: true,
          ...drawingProps,
        };

        if (t === 'rect') {
          shapeInProgress = new Rect({
            left: origX,
            top: origY,
            width: 0,
            height: 0,
            ...shapeProps,
          });
        } else if (t === 'circle') {
          shapeInProgress = new Ellipse({
            left: origX,
            top: origY,
            rx: 0,
            ry: 0,
            ...shapeProps,
          });
        } else {
          shapeInProgress = new Line([origX, origY, origX, origY], {
            fill: '',
            stroke: ss.stroke,
            strokeWidth: ss.strokeWidth,
            strokeUniform: true,
            ...drawingProps,
          });
        }
        canvas.add(shapeInProgress);
        canvas.discardActiveObject();
      }
    };

    const onMouseMove = (opt) => {
      if (!drawingShape || !shapeInProgress) return;
      const { x, y } = opt.scenePoint;
      const w = Math.abs(x - origX);
      const h = Math.abs(y - origY);
      const left = Math.min(origX, x);
      const top = Math.min(origY, y);
      const ty = (shapeInProgress.type || '').toLowerCase();
      if (ty === 'line') {
        shapeInProgress.set({ x1: origX, y1: origY, x2: x, y2: y });
      } else if (ty === 'ellipse') {
        shapeInProgress.set({ left, top, rx: w / 2, ry: h / 2 });
      } else {
        shapeInProgress.set({ left, top, width: w, height: h });
      }
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (drawingShape && shapeInProgress) {
        const shape = shapeInProgress;
        shape.set({
          selectable: true,
          evented: true,
          hasBorders: true,
          hasControls: true,
        });
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
      }
      drawingShape = false;
      shapeInProgress = null;
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    const onKeyDown = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const active = canvas.getActiveObject();
      if (!active) return;
      if (active instanceof IText && active.isEditing) return;
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    };
    window.addEventListener('keydown', onKeyDown);

    const boot = { ...(initialJson ?? { objects: [] }) };
    delete boot.viewportTransform;
    canvas.loadFromJSON(boot).then(() => {
      applyStyleToCanvas(canvas, selectionStyleRef.current);
      canvas.getObjects().forEach((obj) => applyStyleToObject(obj, selectionStyleRef.current));
      const z = zoomRef.current;
      canvas.setZoom(z);
      canvas.setDimensions({ width: widthRef.current * z, height: heightRef.current * z });
      canvas.requestRenderAll();
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      canvas.off('object:added', onObjectAdded);
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  if (!width || !height) return null;

  return (
    <div className="fabricSlot" style={{ width: width * zoom, height: height * zoom }}>
      <canvas ref={lowerRef} width={width} height={height} />
    </div>
  );
});

export default AnnotationLayer;
