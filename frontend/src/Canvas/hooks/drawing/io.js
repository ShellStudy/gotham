// src/Canvas/hooks/drawing/io.js
import { useEffect } from 'react';

export function ensureHiDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(width * dpr));
  const h = Math.max(1, Math.floor(height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
    ctx.scale(dpr, dpr);
  }
}

export function exportDataURL(canvas, type = 'image/png', quality) {
  return canvas.toDataURL(type, quality);
}

export async function importDataURL(canvas, ctx, dataURL) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataURL; });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const dpr = window.devicePixelRatio || 1;
  ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
}

export function useResizeToContainer(containerRef, canvasRef, onReady) {
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ensureHiDPI(canvas, ctx);
      onReady?.(canvas);
    });
    ro.observe(container);

    // 초기 사이즈 강제
    const rect = container.getBoundingClientRect();
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ensureHiDPI(canvas, ctx);
    onReady?.(canvas);

    return () => ro.disconnect();
  }, [containerRef, canvasRef, onReady]);
}
