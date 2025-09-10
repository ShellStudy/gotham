// src/components/Canvas/PromptDock.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function PromptDock({
  open, setOpen,
  prompt, setPrompt,
  canGenerate, onGenerate,
  isGenerating, /* error (미사용: 오버레이로 대체) */
  // 도구/모델/비율
  toolsOpen, onToggleTools,
  modelLabel = '모델 선택', onOpenModelPicker,
  aspectLabel = '1:1', onOpenAspectPicker,
  // 업로드 이미지 (미리보기/선택/삭제)
  initImage,                    // dataURL | null
  onInitSelect,                 // (FileList) => void
  onInitClear,                  // () => void
  // 도크 위치는 하단 고정(사용 안 함)
  position = 'bottom',
  // ✅ 도크 우상단 오버레이
  overlayProgress,              // { value:number, label?:string } | null
  overlayToast,                 // { type:'ok'|'err', msg:string } | null
}) {
  const innerRef = useRef(null);
  const fileRef = useRef(null);
  const [dockH, setDockH] = useState(120);

  const dockClass = `dock ${open ? 'is-open' : 'is-closed'}`;

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setDockH(el.offsetHeight || 120);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const openPicker = () => fileRef.current?.click();
  const onDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length) onInitSelect?.(files);
  };
  const clearImage = () => {
    fileRef.current.value = null;
    onInitClear?.();
  }

  // 진행 값 보정(0~100)
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));

  return (
    <>
      <div id="dock" className={dockClass} role="region" aria-label="프롬프트 도크">
        <div ref={innerRef} className="dock-inner">
          {/* ===== 업로드 이미지 타일 ===== */}
          {/* {overlayProgress ? (
            <div
              className="dock-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clamp(overlayProgress.value)}
              aria-label={overlayProgress.label || '진행률'}
              title={overlayProgress.label || '진행 중'}
            >
              <div className="track">
                <div className="bar" style={{ width: `${clamp(overlayProgress.value)}%` }} />
              </div>
              <span className="p-label">
                {overlayProgress.label || `${clamp(overlayProgress.value)}%`}
              </span>
            </div>
          ) : overlayToast ? (
            <div
              className={`dock-toast ${overlayToast.type === 'ok' ? 'ok' : 'err'}`}
              role="status"
              aria-live="polite"
            >
              {overlayToast.msg}
            </div>
          ) : null} */}
          <div className="dock-assets">
            <div
              className={`init-tile ${initImage ? 'has-image' : ''}`}
              role="button"
              tabIndex={0}
              onClick={openPicker}
              onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && openPicker()}
              onDragOver={(e)=> e.preventDefault()}
              onDrop={onDrop}
              aria-label="이미지 추가"
              title="이미지 추가 (클릭 또는 드래그 앤 드롭)"
            >
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e)=> onInitSelect?.(e.target.files)} />
              {initImage ? (
                <img className="init-thumb" src={initImage} alt="업로드 이미지 미리보기" style={{position: 'static'}} />
              ) : (
                <div className="init-empty">
                  <div className="plus">＋</div>
                  <div className="label">이미지 추가</div>
                </div>
              )}
            </div>
            {initImage && (
              <button
                type="button" onClick={clearImage} aria-label="업로드 이미지 제거" title="제거" className="init-remove" 
                style={{zIndex: '100', position: 'absolute', top: '15px', left: '95px', border: 'none', borderRadius: '50%', opacity: '0.7'}}
              >✕</button>
            )}
          </div>

          {/* ===== 프롬프트 / 액션 ===== */}
          <textarea
            className="prompt"
            placeholder="프롬프트를 입력하세요…"
            value={prompt}
            onChange={(e)=>setPrompt(e.target.value)}
            rows={2}
          />

          <div className="dock-actions">
            <button
              type="button"
              className={`dock-btn dock-btn--ghost ${toolsOpen ? 'is-active' : ''}`}
              aria-pressed={!!toolsOpen}
              onClick={() => onToggleTools?.()}
              title="작업도구 열기/닫기"
            >
              🛠 작업도구
            </button>

            <button
              type="button"
              className="dock-btn dock-btn--ghost"
              onClick={() => onOpenModelPicker?.()}
              title="모델 선택"
            >
              모델: <strong>{modelLabel}</strong>
            </button>

            <button
              type="button"
              className="dock-btn dock-btn--ghost"
              onClick={() => onOpenAspectPicker?.()}
              title="이미지 비율"
            >
              비율: <strong>{aspectLabel}</strong>
            </button>

            <button
              type="button"
              className="dock-btn dock-btn--primary"
              disabled={!canGenerate || isGenerating}
              onClick={onGenerate}
            >
              {isGenerating ? '생성 중…' : '이미지 생성'}
            </button>

            {/* ❌ 인라인 에러 텍스트 제거: 완료/오류는 오버레이로만 표시 */}
          </div>
        </div>
      </div>

      {/* 도크 열/닫기 토글 */}
      <button
        type="button"
        className={`dock-toggle ${open ? 'is-open' : 'is-closed'}`}
        aria-expanded={open}
        aria-controls="dock"
        onClick={()=>setOpen(v=>!v)}
        title={open ? '도크 닫기' : '도크 열기'}
        style={{ bottom: open ? (dockH + 8) : 8 }}
      >
        {open ? 'v' : '^'}
      </button>
    </>
  );
}