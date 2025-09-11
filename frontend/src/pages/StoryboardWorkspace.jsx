import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ImagePickerModal from '@/components/Common/ImagePickerModal.jsx';
import { useRoot } from '@/services/core/RootProvider.jsx';
import { FastAPI } from '@/services/network/Network.js';

export default function StoryboardWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBoardFile } = useRoot();

  // ---------- state ----------
  const [sb, setSb] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [current, setCurrent] = useState(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);

  const [showPicker, setShowPicker] = useState(false);

  // 자막(메모) 오버레이
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);

  // 삭제 모드 & 선택 상태
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // 자막 편집용 refs (언컨트롤드)
  const subtitleRef = useRef(null);
  const subtitleBeforeEditRef = useRef('');
  const isComposingRef = useRef(false);

  // ---------- utils ----------
  // const sceneIdOf = (scene, idx) => (scene?.no != null ? `no:${scene.no}` : `idx:${idx}`);
  const sceneIdOf = (scene, idx) => (scene?.no != null ? scene.no : idx);
  const isSelected = (id) => selectedIds.has(id);
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canPrev = index > 0;
  const canNext = index < Math.max(0, total - 1);

  // ---------- fetch ----------
  useEffect(() => {
    FastAPI('POST', `/storyboard/${id}`, {})
      .then((res) => {
        if (!res?.status) return;
        const board = res.result?.story_board;
        const list = res.result?.story_board_detail;
        setSb(board);
        setScenes(list);
        setTotal(list.length || 0);
        setIndex(0);
        setCurrent(list[0] || null);
      })
      .catch((e) => console.error(e));
  }, [id]);

  // index → current 반영 + 자막 DOM 초기화(언컨트롤드)
  useEffect(() => {
    if (scenes.length > 0) {
      const cur = scenes[index] || null;
      setCurrent(cur);
      subtitleBeforeEditRef.current = cur?.caption || '';
      if (subtitleRef.current) {
        subtitleRef.current.value = cur?.caption || '';
      }
      setIsEditingSubtitle(false);
    } else {
      setCurrent(null);
      subtitleBeforeEditRef.current = '';
      if (subtitleRef.current) subtitleRef.current.value = '';
      setIsEditingSubtitle(false);
    }
  }, [index, scenes]);

  // 자막 토글 ON 시 현재 캡션을 contentEditable에 주입(placeholder 방지)
  useEffect(() => {
    if (!showSubtitle) return;
    const el = subtitleRef.current;
    const value = current?.caption || '';
    subtitleBeforeEditRef.current = value;
    if (el) el.value = value;
    setIsEditingSubtitle(false);
  }, [showSubtitle, current]);

  // ---------- nav ----------
  const goPrev = useCallback(() => { if (canPrev) setIndex((i) => i - 1); }, [canPrev]);
  const goNext = useCallback(() => { if (canNext) setIndex((i) => i + 1); }, [canNext]);

  // ---------- delete mode ----------
  const toggleDeleteMode = () => {
    setIsDeleteMode((on) => {
      if (on) setSelectedIds(new Set()); // 끌 때 선택 해제
      return !on;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const ok = window.confirm(`선택한 ${selectedIds.size}개 씬의 이미지/메모를 삭제할까요?`);
    if (!ok) return;

    const storyboards = Array.from(selectedIds).join(",");
    FastAPI("DELETE", `/storyboard/detail`, { "no": id, storyboards })
    .then(res => {
      if (res?.status) {
        const board = res.result?.story_board;
        const list = res.result?.story_board_detail;
        setSb(board);
        setScenes(list);
        setTotal(list.length || 0);
        setIndex(0);
        setCurrent(list[0] || null);
      }
      setSelectedIds(new Set());
      setIsDeleteMode(false);
    });
  };

  // 기존 개별 삭제 FAB는 "삭제 모드 토글"로 변경
  const onTrashFabClick = (e) => {
    // e.stopPropagation();
    toggleDeleteMode();
  };

  // ---------- save ----------
  const handleSave = useCallback(() => {
    // ⚠️ 백엔드 통신부 미변경 (기존 저장 경로 사용)
    // window.alert('저장되었습니다.');
    FastAPI("PUT","/storyboard/detail", {"storyboards": JSON.stringify(scenes)})
    .then(res => {
      if(res?.status) window.alert('저장되었습니다.');
    })
  }, [scenes]);

  // ---------- image picker ----------
  const openPicker = () => {
    if (isDeleteMode) return;
    setShowPicker(true);
  };
  const selectImage = (item) => {
    if (!current || !item) return;
    setScenes((list) =>
      list.map((row) => {
        if (row.no !== current.no) return row;
        const next = { ...row };
        if (item.fileNo != null) next.fileNo = item.fileNo;
        if (item.attachPath) next.attachPath = item.attachPath;
        return next;
      })
    );
    setShowPicker(false);
  };

  // ---------- subtitle editing (언컨트롤드) ----------
  const commitSubtitle = useCallback(() => {
    if (!current || !subtitleRef.current) return;
    const val = subtitleRef.current.value ?? '';
    if (val !== (current.caption || '')) {
      setScenes((list) =>
        list.map((row) =>
          row.no === current.no ? { ...row, caption: val } : row
        )
      );
    }
    subtitleBeforeEditRef.current = val;
    setIsEditingSubtitle(false);
  }, [current]);

  const revertSubtitle = useCallback(() => {
    if (!subtitleRef.current) return;
    subtitleRef.current.value = subtitleBeforeEditRef.current || '';
    setIsEditingSubtitle(false);
  }, []);

  const onSubtitleKeyDown = (e) => {
    if (isComposingRef.current) return; // IME 조합 중엔 단축키 금지

    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    if (isCmdOrCtrl && e.key === 'Enter') {
      e.preventDefault();
      commitSubtitle();
      subtitleRef.current?.blur();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      revertSubtitle();
      subtitleRef.current?.blur();
      return;
    }
    e.stopPropagation(); // 캔버스 이벤트 전파 방지
  };

  const onSubtitleFocus = () => {
    setIsEditingSubtitle(true);
    requestAnimationFrame(() => {
      const el = subtitleRef.current;
      if (!el) return;
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    });
  };

  const onCompositionStart = () => { isComposingRef.current = true; };
  const onCompositionEnd = () => { isComposingRef.current = false; };

  // 토글 핸들러: OFF 직전 현재 입력값 임시 보관, ON은 useEffect가 복원
  const onToggleSubtitle = (checked) => {
    if (!checked) {
      const el = subtitleRef.current;
      if (el) {
        subtitleBeforeEditRef.current = el.textContent ?? subtitleBeforeEditRef.current;
      }
    }
    setShowSubtitle(checked);
  };
  
  useEffect(() => {
  const opts = { capture: true }; // 다른 핸들러보다 먼저 선점
  const onGlobalKey = (e) => {
    // 1) 모달 열림/자막 편집/한글 조합 중이면 무시
    if (showPicker || isEditingSubtitle || isComposingRef.current) return;

    // 2) 폼/편집 가능한 요소 포커스 시 무시
    const t = e.target;
    if (t?.isContentEditable) return;
    const tag = t?.tagName?.toLowerCase?.() || '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return;

    // 3) 좌우 이동
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  window.addEventListener('keydown', onGlobalKey, opts);
  return () => window.removeEventListener('keydown', onGlobalKey, opts);
}, [goPrev, goNext, showPicker, isEditingSubtitle]);
  // ---------- render guards ----------
  if (!sb) {
    return (
      <main className="sbw-page">
        <div className="container py-4">
          <p>스토리보드를 찾을 수 없습니다.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/storyboards')}>← 돌아가기</button>
        </div>
      </main>
    );
  }

  const currentId = sceneIdOf(current, index);

  const subTitleEvent = (e) => {
    setScenes((list) =>
      list.map(row => {
        if (row.no === current.no) return {...row, caption: e.target.value};
        return row;
      })
    );
  }

  return (
    <main className="sbw-page" aria-label="스토리보드 작업공간">
      <div className="container-fluid sbw-container">
        {/* top bar */}
        <header className="sbw-bar">
          <button
            className="btn btn-link p-0 sbw-back"
            onClick={() => navigate('/storyboards')}
            aria-label="라이브러리로 돌아가기"
          >
            ←
          </button>

          <h3 className="sbw-title m-0" title={sb.title || 'Storyboard'}>{sb.title || 'Storyboard'}</h3>

          <div className="sbw-right">
            <div className="sbw-meta" aria-live="polite">{index + 1} / {total}</div>
            
            <Button
              variant="success"
              size="sm"
              className="sbw-save"
              onClick={handleSave}
              aria-label="스토리보드 저장"
              title="스토리보드 저장"
            >
              저장
            </Button>
          </div>
        </header>

        {/* stage: outside nav columns */}
        <section className="sbw-stage" aria-live="polite">
          <button
            type="button"
            className="sbw-nav sbw-nav-left"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={!canPrev}
            aria-label="이전 씬"
            title="이전 씬"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <div className="sbw-canvas-wrap">
            <div
              className="sbw-canvas"
              role={isDeleteMode ? 'group' : 'button'}
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isDeleteMode) {
                  toggleSelect(currentId);
                } else {
                  openPicker();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!isDeleteMode) openPicker();
                }
                if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
                if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
              }}
              aria-label={isDeleteMode ? '삭제 모드: 현재 씬 선택/해제' : '이미지 선택/변경'}
            >
              {current.attachPath ? (
                <img src={getBoardFile(current.attachPath)} alt="" className="sbw-canvas-img" />
              ) : (
                <div className="sbw-canvas-placeholder">{`씬 ${current?.order ?? current?.no ?? ''}`}</div>
              )}

              {/* 삭제 모드용 체크박스 (캔버스 상단 좌측) */}
              {
              // isDeleteMode && (
              //   <label
              //     className="form-check sbw-selectbox"
              //     onClick={(e) => e.stopPropagation()}
              //   >
              //     <input
              //       type="checkbox"
              //       className="form-check-input"
              //       checked={isSelected(currentId)}
              //       onChange={() => toggleSelect(currentId)}
              //       aria-checked={isSelected(currentId)}
              //       aria-label="현재 씬 선택"
              //     />
              //   </label>
              // )
              }
              {/* FABs */}
              {/* <button
                type="button"
                className="sbw-fab sbw-fab-delete"
                onClick={onTrashFabClick}
                aria-label={isDeleteMode ? '삭제 모드 종료' : '삭제 모드 활성화'}
                title={isDeleteMode ? '삭제 모드 종료' : '삭제 모드 활성화'}
              >
                <IconTrash size={22} />
              </button> */}

              {/* {!isDeleteMode && (
                <button
                  type="button"
                  className="sbw-fab sbw-fab-memo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSubtitle(true);
                    requestAnimationFrame(() => {
                      const el = subtitleRef.current;
                      if (!el) return;
                      el.focus();
                      const sel = window.getSelection();
                      const range = document.createRange();
                      range.selectNodeContents(el);
                      range.collapse(false);
                      sel.removeAllRanges();
                      sel.addRange(range);
                      setIsEditingSubtitle(true);
                    });
                  }}
                  aria-label="자막 편집"
                  title="자막 편집"
                >
                  <IconPencil size={22} />
                </button>
              )} */}
            </div>

            {/* FABs */}
            <button
              type="button"
              className="sbw-fab sbw-fab-delete"
              onClick={onTrashFabClick}
              aria-label={isDeleteMode ? '삭제 모드 종료' : '삭제 모드 활성화'}
              title={isDeleteMode ? '삭제 모드 종료' : '삭제 모드 활성화'}
              disabled={isDeleteMode}
            >
              <IconTrash size={22} />
            </button>

            {/* 자막 오버레이 (삭제 모드에서는 편집 비활성화) */}
            {showSubtitle && !isDeleteMode && (
              <div
                className="sbw-subtitle sbw-submemo"
                // onMouseDown={(e) => e.stopPropagation()}
                // onClick={(e) => e.stopPropagation()}
              >
                <textarea ref={subtitleRef} onChange={subTitleEvent} type='text' className={`sbw-subtitle-edit ${isEditingSubtitle ? ' is-editing' : ''}`} placeholder="자막(메모)을 입력하세요"></textarea>

                {/* <div
                  ref={subtitleRef}
                  className={`sbw-subtitle-edit${isEditingSubtitle ? ' is-editing' : ''}`}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="자막(메모) 입력"
                  data-placeholder="자막(메모)을 입력하세요" // (Ctrl/Cmd + Enter 저장, Esc 취소)
                  onKeyDown={onSubtitleKeyDown}
                  onFocus={onSubtitleFocus}
                  onBlur={commitSubtitle}
                  onCompositionStart={onCompositionStart}
                  onCompositionEnd={onCompositionEnd}
                  spellCheck={false}
                /> */}
              </div>
            )}

            {/* tools / hints */}
            <div className="sbw-tools">
              <small className="text-muted">
                {isDeleteMode
                  ? '썸네일 또는 캔버스 좌측 체크박스로 씬을 선택하세요.'
                  : '캔버스를 클릭하면 이미지 선택(목록) 창이 열립니다.'}
              </small>

              <Form.Check
                type="switch"
                id="sbwToggleSubtitle"
                label="자막 표시"
                className="ms-2"
                checked={showSubtitle}
                onChange={(e) => onToggleSubtitle(e.target.checked)}
                disabled={isDeleteMode}
                title={isDeleteMode ? '삭제 모드에서는 비활성화' : ''}
              />

              {isDeleteMode && (
                <div className="ms-2 d-flex align-items-center" aria-live="polite">
                  <span className="text-muted">
                    선택됨: <b>{selectedIds.size}</b> / {total}
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ms-2"
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0}
                  >
                    선택 삭제
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="ms-2"
                    onClick={() => { setSelectedIds(new Set()); setIsDeleteMode(false); }}
                  >
                    취소
                  </Button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="sbw-nav sbw-nav-right"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={!canNext}
            aria-label="다음 씬"
            title="다음 씬"
          >
            <span aria-hidden="true">›</span>
          </button>
        </section>

        {/* bottom thumbnails */}
        <section className="sbw-strip" aria-label="씬 바로가기">
          {scenes.map((s, i) => {
            const sid = sceneIdOf(s, i);
            const selected = isSelected(sid);
            return (
              <div style={{position: 'relative'}} key={s.order}>
                <button                  
                  className={`sbw-thumb ${i === index ? 'is-active' : ''} ${selected ? 'is-picked' : ''}`}
                  style={{width: '100%'}}
                  onClick={(e) => {
                    // e.stopPropagation();
                    if (isDeleteMode) {
                      toggleSelect(sid);
                    } else {
                      setIndex(i);
                    }
                  }}
                  aria-pressed={i === index}
                  aria-label={`${i + 1}번째 씬${isDeleteMode ? (selected ? ' 선택됨' : ' 선택 안 됨') : ''}`}
                  title={`씬 ${i + 1}`}
                >
                  <div className="sbw-thumb-box">
                    {s.attachPath ? (
                      <img src={getBoardFile(s.attachPath)} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      <span className="sbw-thumb-no">{s.order ?? s.no ?? i + 1}</span>
                    )}
                  </div>
                  <div className="sbw-thumb-meta">
                    <div className="sbw-thumb-title">씬 {s.order ?? s.no ?? i + 1}</div>
                    <div className="sbw-thumb-note">{s.caption || '메모 없음'}</div>
                  </div>
                </button>
                {/* 삭제 모드용 체크박스 오버레이 */}
                {isDeleteMode && (
                  <span
                    className="sbw-thumb-check"
                    style={{position: 'absolute', top: '5px', left: '5px', display: 'none'}}
                    // onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected}
                      onChange={() => toggleSelect(sid)}
                      aria-label="씬 선택"
                    />
                  </span>
                )}
              </div>
            );
          })}
        </section>
      </div>

      {/* 이미지 선택 모달: 목록형 + X 버튼만 */}
      <ImagePickerModal
        show={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={selectImage}
      />
    </main>
  );
}

/* ---- inline icons (충돌 방지용) ---- */
function IconTrash({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z" fill="currentColor" />
    </svg>
  );
}
function IconPencil({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.19-.19.29-.44.29-.71 0-.27-.1-.52-.29-.71l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.82z" fill="currentColor" />
    </svg>
  );
}
