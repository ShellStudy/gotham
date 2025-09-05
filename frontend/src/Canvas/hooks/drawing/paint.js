// src/Canvas/hooks/drawing/paint.js
let lastX = 0, lastY = 0, painting = false;

export function setCompositeMode(ctx, tool) {
  ctx.globalCompositeOperation = (tool === 'eraser') ? 'destination-out' : 'source-over';
}

export function beginStroke(ctx, { x, y, tool, color, size, stroke, strokeWidth }) {
  painting = true;
  lastX = x; lastY = y;

  if (tool === 'brush' || tool === 'eraser') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size || 8;
    ctx.strokeStyle = (tool === 'eraser') ? 'rgba(0,0,0,1)' : (color || '#111');
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else {
    // TODO: line/rect/ellipse/star 등은 별도 벡터 엔진에서 지원
    ctx.lineWidth = strokeWidth || 3;
    ctx.strokeStyle = stroke || '#111';
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
}

export function drawStroke(ctx, { x, y, tool, color, size, stroke, strokeWidth }) {
  if (!painting) return;

  if (tool === 'brush' || tool === 'eraser') {
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  } else {
    // TODO: 벡터 모드에서는 임시로 프리핸드로 처리
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  }
}

export function endStroke(ctx, tool) {
  if (!painting) return;
  ctx.closePath();
  painting = false;
}
