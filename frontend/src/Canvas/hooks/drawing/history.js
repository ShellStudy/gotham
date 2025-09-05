// src/Canvas/hooks/drawing/history.js
export function createHistory() {
  return { stack: [], index: -1, limit: 30 };
}

export function pushSnapshot(canvas, ctx, hist, setHist) {
  try {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const stack = hist.index < hist.stack.length - 1
      ? hist.stack.slice(0, hist.index + 1)
      : hist.stack.slice();
    stack.push(img);
    while (stack.length > hist.limit) stack.shift();
    setHist({ stack, index: stack.length - 1, limit: hist.limit });
  } catch {}
}

export function undoSnapshot(canvas, ctx, hist, setHist) {
  if (hist.index < 0) return;
  const nextIndex = hist.index - 1;
  if (nextIndex >= 0) {
    const img = hist.stack[nextIndex];
    ctx.putImageData(img, 0, 0);
    setHist({ ...hist, index: nextIndex });
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHist({ ...hist, index: -1 });
  }
}

export function clearHistory(setHist) {
  setHist(createHistory());
}
