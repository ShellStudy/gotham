export default function LibraryToolbar({
  // drafts
  qDraft, setQDraft,
  qByDraft, setQByDraft,
  aspectDraft, setAspectDraft,
  sortDraft, setSortDraft,

  // actions
  onApplySearch,

  // delete flow
  selectMode,
  selectedCount,
  onEnterDeleteMode,
  onCancelDeleteMode,
  onBulkDelete,
}) {
  return (
    <div className="lib-toolbar">
      <div className="lt-left">
        <div className="search">
          <div className="input-group">
            <select
              className="custom-select"
              value={qByDraft}
              onChange={(e)=>setQByDraft(e.target.value)}
              aria-label="검색 대상"
              title="검색 대상"
            >
              <option value="prompt">프롬프트</option>
              <option value="model">모델</option>
              <option value="memo">메모</option>
            </select>
            <input
              className="form-control"
              type="search"
              value={qDraft}
              onChange={(e)=>setQDraft(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ onApplySearch(); } }}
              placeholder="검색어 입력…"
              aria-label="검색"
            />
            <div className="input-group-append">
              <button className="btn btn-outline-secondary" type="button" style={{borderRadius: '0 5px 5px 0'}} onClick={onApplySearch} title="검색 확정">검색</button>
            </div>
            {/* <button className="btn btn-mini" onClick={onApplySearch} title="검색 확정">검색</button> */}
          </div>
        </div>
      </div>

      <div className="lt-right">
        <div className="filters">
          <button
            className={`chip ${aspectDraft==='all'?'is-active':''}`}
            onClick={()=>setAspectDraft('all')}
            aria-pressed={aspectDraft==='all'}
          >전체</button>
          {['1:1','4:3','3:4','16:9','9:16'].map(r => (
            <button
              key={r}
              className={`chip ${aspectDraft===r?'is-active':''}`}
              onClick={()=>setAspectDraft(r)}
              aria-pressed={aspectDraft===r}
            >{r}</button>
          ))}
        </div>
        <div className="filters">
          <div className="sort">
            <select
              value={sortDraft}
              onChange={(e)=>setSortDraft(e.target.value)}
              aria-label="정렬"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
          </div>

          {!selectMode ? (
            <div className="select-controls">
              <button className="btn btn-mini danger" onClick={onEnterDeleteMode}>
                삭제
              </button>
            </div>
          ) : (
            <div className="select-controls">
              <span className="sel-count">{selectedCount}개 선택</span>
              <div className="btn-group mx-2">
                <button
                  className="btn btn-mini danger"
                  onClick={onBulkDelete}
                  disabled={selectedCount===0}
                  title={selectedCount ? `${selectedCount}개 삭제` : '삭제'}
                >
                  삭제 확정
                </button>
                <button className="btn btn-mini" onClick={onCancelDeleteMode}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
