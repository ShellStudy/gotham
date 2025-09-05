// src/Canvas/hooks/drawing/cursor.js
export function getCursor({ tool, size }) {
  if (tool === 'eraser') return 'cell';
  if (tool === 'brush') return 'crosshair';
  // line/rect/ellipse/star 등
  return 'crosshair';
}
