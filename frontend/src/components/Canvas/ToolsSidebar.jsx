// src/components/Canvas/ToolsSidebar.jsx
import React from 'react';

/**
 * Illustrator 스타일 사이드바 (기존 CSS 클래스 유지)
 * - 툴: select | brush | eraser | line | rect | ellipse | star
 * - 스타일: stroke, fill('none' 지원), strokeWidth
 * - 저장/로드: 임시(브라우저) / DB(모의) - 같은 영역(.tools-actions) 내 배치
 */
export default function ToolsSidebar({
  open, onClose,

  tool, setTool,
  size, setSize,
  stroke, setStroke,
  fill, setFill,
  strokeWidth, setStrokeWidth,

  onUndo, onClear, hasHistory,

  onSaveDraft, savingDraft = false,
  onSaveDB,    savingDB   = false,

  // ▼ 추가: 로드 패널 토글 & 목록 & 로드 콜백
  dbOpen, onToggleDB,
  dbItems = [], onLoadDB,
}) {
  const tools = [
    { key: 'select',  label: '선택',    icon: '🖱️', title: '선택/이동/리사이즈 (V)' },
    { key: 'brush',   label: '브러시',  icon: '✏️', title: '브러시 (B)' },
    { key: 'eraser',  label: '지우개',  icon: '🧽', title: '지우개 (E)' },
    { key: 'line',    label: '라인',    icon: '／',  title: '직선 (\\) — Shift=45°' },
    { key: 'rect',    label: '사각형',  icon: '▭',  title: '사각형 (M) — Shift=정사각, Alt=중심' },
    { key: 'ellipse', label: '타원',    icon: '◯',  title: '타원 (L) — Shift=원, Alt=중심' },
    { key: 'star',    label: '별',      icon: '✶',  title: '별 (S) — Alt=중심, ↑/↓ 포인트 수' },
  ];

  const swapStrokeFill = () => {
    if (fill === 'none') return;
    const s = stroke;
    setStroke(fill);
    setFill(s);
  };

  const fmt = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  return (
    <aside id="tools" className={`tools ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-label="도구">
      <div className="tools-head">
        <strong>도구</strong>
        <button type="button" className="btn-close" aria-label="닫기" onClick={onClose}/>
      </div>

      {/* 툴 버튼군 */}
      <div className="tool">
        <label className="label">툴</label>
        <div className="seg" role="tablist" aria-label="Draw Tools">
          {tools.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tool===t.key}
              className={`seg-btn ${tool===t.key ? 'is-active' : ''}`}
              title={t.title}
              onClick={()=>setTool(t.key)}
            >
              <span aria-hidden>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 브러시/지우개 두께 */}
      {(tool==='brush' || tool==='eraser') && (
        <div className="tool">
          <label className="label">{tool==='eraser' ? '지우개 두께' : '브러시 두께'}: {size}px</label>
          <input type="range" min={1} max={128} step={1} value={size} onChange={e=>setSize(+e.target.value)} />
        </div>
      )}

      {/* 벡터 스타일 */}
      {tool!=='eraser' && (
        <>
          <div className="tool">
            <label className="label">스트로크</label>
            <div className="seg">
              <input type="color" value={stroke} onChange={e=>setStroke(e.target.value)} />
              <span style={{marginLeft:8}}>{stroke}</span>
              <button type="button" className="seg-btn" style={{marginLeft:'auto'}} onClick={swapStrokeFill} title="스트로크/채움 교체 (X)">↔︎ 교체</button>
            </div>
          </div>
          <div className="tool">
            <label className="label">채움</label>
            <div className="seg">
              <input type="color" value={fill==='none' ? '#ffffff' : fill} onChange={e=>setFill(e.target.value)} disabled={fill==='none'} />
              <button type="button" className={`seg-btn ${fill==='none' ? 'is-active' : ''}`} onClick={()=>setFill('none')}>채움 없음</button>
              <span style={{marginLeft:8, opacity:.75}}>{fill}</span>
            </div>
          </div>
          <div className="tool">
            <label className="label">스트로크 두께: {strokeWidth}px</label>
            <input type="range" min={1} max={24} step={1} value={strokeWidth} onChange={e=>setStrokeWidth(+e.target.value)} />
          </div>
        </>
      )}

      {/* 하단 액션 (되돌리기/지우기/저장/로드) */}
      <div className="tools-actions" role="group" aria-label="편집 및 저장">
        <button type="button" className="btn btn-undo"  onClick={onUndo} disabled={!hasHistory}>되돌리기</button>
        <button type="button" className="btn btn-clear" onClick={onClear}>지우기</button>

        <button type="button" className="btn btn-save" onClick={onSaveDraft} disabled={!!savingDraft}>
          {savingDraft ? '저장 중…' : '💾 임시 저장(브라우저)'}
        </button>

        <button type="button" className="btn" onClick={onSaveDB} disabled={!!savingDB} title="Ctrl/⌘+S">
          {savingDB ? '저장 중…' : '🗄️ 저장(DB·모의)'}
        </button>

        <button type="button" className="btn" onClick={onToggleDB} aria-expanded={!!dbOpen}>
          📂 로드(DB)
        </button>

        {dbOpen && (
          <div className="db-list" role="list" aria-label="저장된 캔버스 목록">
            {(!dbItems || dbItems.length===0) && (
              <div className="db-empty">저장된 항목이 없습니다.</div>
            )}
            {dbItems && dbItems.map(item => (
              <button
                key={item.id}
                className="db-item"
                role="listitem"
                title={fmt(item.createdAt)}
                onClick={()=>onLoadDB?.(item.id)}
              >
                <span className="name">{item.name}</span>
                <span className="meta">{fmt(item.createdAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
