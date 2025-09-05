import aspectLabel from '../../library/utils/aspectLabel.js';

export default function Lightbox({ open, item, onClose }) {
  if (!open || !item) return null;
  return (
    <>
      <div className="lib-scrim" onClick={onClose} />
      <div className="lib-lightbox" role="dialog" aria-modal="true">
        <div className="lib-lightbox-head">
          <strong>상세 보기</strong>
          <div className="spacer" />
          <button className="btn-close" aria-label="닫기" onClick={onClose} />
        </div>
        <div className="lib-lightbox-body">
          <img src={item.url} alt={item.prompt ?? '이미지'} />
          <div className="lib-meta">
            {item.prompt && <div className="meta-row"><b>프롬프트</b><span>{item.prompt}</span></div>}
            {item.model &&  <div className="meta-row"><b>모델</b><span>{item.model}</span></div>}
            {(item.width && item.height) && (
              <div className="meta-row">
                <b>사이즈</b>
                <span>{item.width}×{item.height} ({aspectLabel(item.width,item.height)})</span>
              </div>
            )}
            {item.createdAt && (
              <div className="meta-row"><b>생성</b><span>{new Date(item.createdAt).toLocaleString()}</span></div>
            )}
            <div className="meta-actions">
              <a className="btn btn-mini" href={item.url} target="_blank" rel="noreferrer">새 탭에서 보기</a>
              <a className="btn btn-mini" href={item.url} download>다운로드</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
