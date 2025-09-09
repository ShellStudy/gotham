// src/components/Canvas/ResultPanel.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Bottom Sheet Result Panel (fixed overlay)
 * - open: boolean
 * - onOpenChange(boolean)
 * - url: 결과 이미지(없어도 열림)
 * - onClose(): 닫기 호출
 *
 * 제스처
 * - 하단 엣지(24px) 위로 드래그 → 열기
 * - 시트 아무 곳에서 아래로 드래그 → 닫기 (단, 인터랙티브 요소 제외)
 * - 상단 그랩 핸들 드래그 → 높이 조절 (60~100vh)
 * - 스크림 클릭 / ESC → 닫기
 */
export default function ResultPanel({ open, onOpenChange, url, onClose }) {
  // ===== Height control (vh) ===========================================
  const [sheetVh, setSheetVh] = useState(86);           // 기본 86vh
  const minVh = 60, maxVh = 100;
  const [viewportH, setViewportH] = useState(() => window.innerHeight);
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const heightPx = Math.round(viewportH * (sheetVh / 100));

  // ===== Open/Close swipe =============================================
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startTranslateRef = useRef(0);
  const [translate, setTranslate] = useState(null);

  // ===== Resize by grab handle ========================================
  const [resizing, setResizing] = useState(false);
  const startResizeYRef = useRef(0);
  const startVhRef = useRef(sheetVh);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const currentTranslate = dragging
    ? clamp(translate ?? (open ? 0 : heightPx), 0, heightPx)
    : (open ? 0 : heightPx);

  const getY = (e) => e.touches?.[0]?.clientY ?? e.clientY ?? 0;

  // 인터랙티브 요소 클릭 시 드래그 시작 안 함
  const isInteractive = (target) =>
    !!(target.closest?.('button, a, input, select, textarea, label, [data-nodrag]'));

  // --- Open/Close drag handlers (시트 배경에서)
  const beginDrag = (y) => {
    setDragging(true);
    startYRef.current = y;
    startTranslateRef.current = open ? 0 : heightPx;
    setTranslate(startTranslateRef.current);
  };
  const moveDrag = (y) => {
    if (!dragging) return;
    const dy = y - startYRef.current; // 위로 - , 아래로 +
    setTranslate(clamp(startTranslateRef.current + dy, 0, heightPx));
  };
  const endDrag = () => {
    if (!dragging) return;
    const th = heightPx * 0.45;          // 45% 스냅 임계값
    const nextOpen = currentTranslate < th;
    setDragging(false);
    setTranslate(null);
    onOpenChange?.(nextOpen);
    if (!nextOpen) onClose?.();
  };

  const onSheetDown = (e) => {
    if (isInteractive(e.target) || resizing) return; // ✖︎ 버튼 등 방해하지 않음
    const y = getY(e);
    beginDrag(y);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
  };
  const onSheetMove = (e) => moveDrag(getY(e));
  const onSheetUp = (e) => {
    endDrag();
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
  };

  // --- Bottom edge hot-zone (항상 활성)
  const onEdgeDown = (e) => beginDrag(getY(e));
  const onEdgeMove = (e) => moveDrag(getY(e));
  const onEdgeUp   = () => endDrag();

  // --- Resize via top grab handle
  const onGrabDown = (e) => {
    e.stopPropagation(); // 시트 드래그와 구분
    setResizing(true);
    startResizeYRef.current = getY(e);
    startVhRef.current = sheetVh;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
  };
  const onGrabMove = (e) => {
    if (!resizing) return;
    const dy = getY(e) - startResizeYRef.current; // 위로 - , 아래로 +
    const deltaVh = -(dy / viewportH) * 100;      // 위로 드래그 시 +vh
    setSheetVh(clamp(startVhRef.current + deltaVh, minVh, maxVh));
  };
  const onGrabUp = (e) => {
    setResizing(false);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
  };

  // ESC 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange, onClose]);

  const closeViaScrim = () => { onOpenChange?.(false); onClose?.(); };

  return (
    <>
      {/* 스크림 (배너까지 덮는 fixed) */}
      <div
        className={`sheet-scrim ${open || dragging ? 'is-on' : ''}`}
        style={{ opacity: 1 - currentTranslate / heightPx }}
        onClick={closeViaScrim}
      />

      {/* 하단 엣지 핫존 (항상 활성) */}
      <div
        className="sheet-edge"
        role="button"
        aria-label="결과 시트 열기"
        onMouseDown={onEdgeDown}
        onMouseMove={onEdgeMove}
        onMouseUp={onEdgeUp}
        onTouchStart={onEdgeDown}
        onTouchMove={onEdgeMove}
        onTouchEnd={onEdgeUp}
      />

      {/* 결과 시트 (fixed, 둥근 모서리) */}
      <aside
        className={`result-sheet ${dragging ? 'is-dragging' : ''}`}
        style={{ transform: `translateY(${currentTranslate}px)`, height: `${sheetVh}vh` }}
        onPointerDown={onSheetDown}
        onPointerMove={onSheetMove}
        onPointerUp={onSheetUp}
        onPointerCancel={onSheetUp}
        aria-label="결과 시트"
      >
        <div className="result-head">
          {/* 🔧 그랩 핸들: 리사이즈 전용 */}
          <div
            className="sheet-grabber"
            role="separator"
            aria-label="크기 조절"
            onPointerDown={onGrabDown}
            onPointerMove={onGrabMove}
            onPointerUp={onGrabUp}
            onPointerCancel={onGrabUp}
          />
          <strong>결과</strong>
          <div className="spacer" />
          {/* ✖︎ 닫기: data-nodrag로 드래그 무시 */}
          <button className="btn-close" data-nodrag aria-label="닫기" onClick={closeViaScrim} />
        </div>

        <div className="result-body">
          {url ? (
            <img src={url} alt="생성 결과" style={{minWidth: '30%', minHeight: '80%', maxHeight: '100%', objectFit: 'cover'}}/>
          ) : (
            <div className="result-empty">
              <div className="re-ico" aria-hidden>🖼️</div>
              <div className="re-title">아직 결과가 없어요</div>
              <div className="re-sub">그림을 그리고 프롬프트로 이미지를 생성해 보세요.</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
