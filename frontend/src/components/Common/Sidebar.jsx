// src/components/Sidebar.jsx
import React from 'react';

/**
 * Reusable slide-in Sidebar
 * Props:
 * - open: boolean
 * - onClose(): void
 * - side: 'right' | 'left' (default: 'right')
 * - header?: ReactNode
 * - children: content
 */
export default function Sidebar({ open, onClose, side='right', header=null, children }) {
  return (
    <>
      <aside
        className={`sidebar floating slide ${open ? 'is-open' : ''} ${side === 'left' ? 'from-left' : 'from-right'}`}
        aria-label="작업 사이드바"
        aria-hidden={!open}
      >
        <div className="sidebar-head">
          {header || <strong>사이드바</strong>}
          <div className="spacer" />
          <button className="btn-close" aria-label="닫기" onClick={onClose} />
        </div>
        <div className="sidebar-body">{children}</div>
      </aside>
      {open && <button className="scrim" aria-label="사이드바 닫기" onClick={onClose} />}
    </>
  );
}
