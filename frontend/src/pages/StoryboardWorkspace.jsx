// src/pages/StoryboardWorkspace.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import ImagePickerModal from '@/components/Common/ImagePickerModal.jsx';
import { getStoryboard, ensureScenes, updateScene, clearScene } from '@/services/data/storyboards.js';
import { FastAPI } from '@/services/network/NetWork.js'

const StoryboardWorkspace2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sb, setSb] = useState(null);
  const [index, setIndex] = useState(0); // 0-based
  const [showMemo, setShowMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // 불러오기 & 씬 보장
  const load = useCallback(() => {
    const updated = ensureScenes(id, 6);
    setSb(updated || getStoryboard(id));
  }, [id]);

  useEffect(() => {
    load();
    setIndex(0);
  }, [load]);

  const scenes = useMemo(() => (sb?.scenes || []).slice(0, 6), [sb]);
  const total = scenes.length || 0;
  const current = scenes[index];

  const canPrev = index > 0;
  const canNext = index < total - 1;

  const goPrev = useCallback(() => { if (canPrev) setIndex(i => i - 1); }, [canPrev]);
  const goNext = useCallback(() => { if (canNext) setIndex(i => i + 1); }, [canNext]);

  // 키보드 ← / →
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  // 메모 편집
  const openMemo = () => {
    setMemoDraft(current?.note || '');
    setShowMemo(true);
  };
  const saveMemo = async () => {
    await updateScene(id, current.no, { note: memoDraft });
    setShowMemo(false);
    load();
  };

  // 이미지 선택
  const openPicker = () => setShowPicker(true);
  const selectImage = async (url) => {
    await updateScene(id, current.no, { image: url });
    setShowPicker(false);
    load();
  };

  // 씬 삭제(초기화)
  const deleteScene = async () => {
    const ok = window.confirm('이 씬의 이미지/메모를 삭제하시겠습니까?');
    if (!ok) return;
    await clearScene(id, current.no);
    load();
  };

  // 🔸 저장 버튼 핸들러
  const handleSave = useCallback(async () => {
    const ok = window.confirm('스토리보드를 저장하시겠습니까?');
    if (!ok) return;

    // ⚠️ 현재 구조에선 updateScene 호출 시 즉시 저장됨.
    // 별도 커밋 로직이 있다면 여기에서 호출:
    // await saveStoryboard(id);

    window.alert('저장되었습니다.');
  }, [id]);

  // 아이콘 (충돌 방지용 인라인 SVG)
  const IconTrash = ({ size=22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z" fill="currentColor"/>
    </svg>
  );
  const IconPencil = ({ size=22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
    </svg>
  );

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

  return (
    <main className="sbw-page" aria-label="스토리보드 작업공간">
      <div className="container-fluid sbw-container">
        {/* 상단 바 */}
        <header className="sbw-bar">
          <button
            className="btn btn-link p-0 sbw-back"
            onClick={() => navigate('/storyboards')}
            aria-label="라이브러리로 돌아가기"
          >
            ←
          </button>

          <h3 className="sbw-title m-0" title={sb.title}>{sb.title}</h3>

          {/* 🔸 메타 + 저장 버튼 (우측 정렬) */}
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

        {/* 스테이지 (좌/우 네비게이션을 캔버스 “밖”으로) */}
        <section className="sbw-stage" aria-live="polite">
          <button
            type="button"
            className="sbw-nav sbw-nav-left"
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="이전 씬"
            title="이전 씬"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <div className="sbw-canvas-wrap">
            <div
              className="sbw-canvas"
              role="button"
              tabIndex={0}
              aria-label={`씬 ${current?.no} 클릭하여 이미지 선택`}
              title="클릭하여 이미지 선택"
              onClick={openPicker}
              onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openPicker(); }}}
            >
              {current?.image ? (
                <img src={current.image} alt="" className="sbw-canvas-img" />
              ) : (
                <div className="sbw-canvas-placeholder">{`씬 ${current?.no}`}</div>
              )}

              {/* 우상단 삭제 */}
              <button
                type="button"
                className="sbw-fab sbw-fab-delete"
                onClick={(e)=>{ e.stopPropagation(); deleteScene(); }}
                aria-label="씬 삭제"
                title="씬 삭제"
              >
                <IconTrash size={22}/>
              </button>

              {/* 좌하단 메모 */}
              <button
                type="button"
                className="sbw-fab sbw-fab-memo"
                onClick={(e)=>{ e.stopPropagation(); openMemo(); }}
                aria-label="메모 작성/수정"
                title="메모 작성/수정"
              >
                <IconPencil size={22}/>
              </button>
            </div>
          </div>

          <button
            type="button"
            className="sbw-nav sbw-nav-right"
            onClick={goNext}
            disabled={!canNext}
            aria-label="다음 씬"
            title="다음 씬"
          >
            <span aria-hidden="true">›</span>
          </button>
        </section>

        {/* 하단 썸네일 스트립 */}
        <section className="sbw-strip" aria-label="씬 바로가기">
          {scenes.map((s, i) => (
            <button
              key={s.no}
              className={`sbw-thumb ${i===index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`씬 ${s.no}로 이동`}
              title={`씬 ${s.no}`}
            >
              <div className="sbw-thumb-box">
                {s.image
                  ? <img src={s.image} alt="" className="w-100 h-100 object-fit-cover" />
                  : <span className="sbw-thumb-no">{s.no}</span>}
              </div>
              <div className="sbw-thumb-meta">
                <span className="sbw-thumb-title">{s.title || `씬 ${s.no}`}</span>
                {s.note && <span className="sbw-thumb-note" title={s.note}>{s.note}</span>}
              </div>
            </button>
          ))}
        </section>
      </div>

      {/* 메모 모달 */}
      <Modal show={showMemo} onHide={()=>setShowMemo(false)} centered>
        <Modal.Header closeButton><Modal.Title>메모 수정 – 씬 {current?.no}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>메모</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={memoDraft}
              onChange={e=>setMemoDraft(e.target.value)}
              placeholder="이 씬에 대한 메모를 입력하세요"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowMemo(false)}>취소</Button>
          <Button variant="primary" onClick={saveMemo}>저장</Button>
        </Modal.Footer>
      </Modal>

      {/* 이미지 픽커 모달: 큰 화면 클릭과 동일 동작 */}
      <ImagePickerModal
        show={showPicker}
        onClose={()=>setShowPicker(false)}
        onSelect={selectImage}
      />
    </main>
  );
}

const StoryboardWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sb, setSb] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [current, setCurrent] = useState([]);
  const [index, setIndex] = useState(0); // 0-based
  const [showMemo, setShowMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [total, setTotal] = useState(0);
  const canPrev = index > 0;
  const canNext = index < total - 1;
  const goPrev = useCallback(() => { if (canPrev) setIndex(i => i - 1); }, [canPrev]);
  const goNext = useCallback(() => { if (canNext) setIndex(i => i + 1); }, [canNext]);
  
  const baseUrl1 = import.meta.env.VITE_APP_GATEWAY_URL || 'http://localhost:7000';
  const getFile = (fileNo) =>  (fileNo == 0) ? null : baseUrl1 + "/oauth/file/u/" + fileNo;

  // 불러오기 & 씬 보장
  const load = useCallback(() => { if(scenes.length > 0) setCurrent(scenes[index]) }, [id, index]);
  
  // 씬 삭제(초기화)
  const deleteScene = async () => {
    const ok = window.confirm('이 씬의 이미지/메모를 삭제하시겠습니까?');
    if (!ok) return;
    setScenes(data => data.map(row => row.no === current.no ? {...row, fileNo: 0, caption: ""} : row))
    // await clearScene(id, current.no);
    // load();
  };

  // 🔸 저장 버튼 핸들러
  const handleSave = useCallback(async () => {
    const ok = window.confirm('스토리보드를 저장하시겠습니까?');
    if (!ok) return;

    // ⚠️ 현재 구조에선 updateScene 호출 시 즉시 저장됨.
    // 별도 커밋 로직이 있다면 여기에서 호출:
    // await saveStoryboard(id);

    window.alert('저장되었습니다.');
  }, [id]);

  // 아이콘 (충돌 방지용 인라인 SVG)
  const IconTrash = ({ size=22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z" fill="currentColor"/>
    </svg>
  );
  const IconPencil = ({ size=22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
    </svg>
  );

  // 메모 편집
  const openMemo = () => {
    setMemoDraft(current?.caption || '');
    setShowMemo(true);
  };
  const saveMemo = async () => {
    setScenes(data => data.map(row => row.no === current.no ? {...row, ["caption"]: memoDraft} : row))
    setShowMemo(false);
  };

  // 이미지 선택
  const openPicker = () => setShowPicker(true);
  const selectImage = async (url) => {
    // await updateScene(id, current.no, { image: url });
    // setShowPicker(false);
  };
  
  useEffect(()=>{
    load()
  }, [index])

  useEffect(()=>{
    setCurrent(scenes[index])
  }, [scenes])

  useEffect(()=>{
    FastAPI("POST", `/storyboard/${id}`, {})
    .then(res => {
      if(res.status) {
        setSb(res.result.story_board)
        setScenes(res.result.story_board_detail)
        if(res.result.story_board_detail.length > 0)
        setCurrent(res.result.story_board_detail[0])
        setIndex(0)
        setTotal(res.result.story_board_detail.length)
      }
    })
  }, [])

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

  return (
    <main className="sbw-page" aria-label="스토리보드 작업공간">
      <div className="container-fluid sbw-container">
        {/* 상단 바 */}
        <header className="sbw-bar">
          <button
            className="btn btn-link p-0 sbw-back"
            onClick={() => navigate('/storyboards')}
            aria-label="라이브러리로 돌아가기"
          >
            ←
          </button>

          <h3 className="sbw-title m-0" title={sb.title}>{sb.title}</h3>

          {/* 🔸 메타 + 저장 버튼 (우측 정렬) */}
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

        {/* 스테이지 (좌/우 네비게이션을 캔버스 “밖”으로) */}
        <section className="sbw-stage" aria-live="polite">
          <button
            type="button"
            className="sbw-nav sbw-nav-left"
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="이전 씬"
            title="이전 씬"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <div className="sbw-canvas-wrap">
            <div
              className="sbw-canvas"
              role="button"
              tabIndex={0}
              aria-label={`씬 ${current?.no} 클릭하여 이미지 선택`}
              title="클릭하여 이미지 선택"
              onClick={openPicker}
              onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openPicker(); }}}
            >
              {current?.fileNo ? (
                <img src={getFile(current.fileNo)} alt="" className="sbw-canvas-img" />
              ) : (
                <div className="sbw-canvas-placeholder">{`씬 ${current?.order}`}</div>
              )}

              {/* 우상단 삭제 */}
              <button
                type="button"
                className="sbw-fab sbw-fab-delete"
                onClick={(e)=>{ e.stopPropagation(); deleteScene(); }}
                aria-label="씬 삭제"
                title="씬 삭제"
              >
                <IconTrash size={22}/>
              </button>

              {/* 좌하단 메모 */}
              <button
                type="button"
                className="sbw-fab sbw-fab-memo"
                onClick={(e)=>{ e.stopPropagation(); openMemo(); }}
                aria-label="메모 작성/수정"
                title="메모 작성/수정"
              >
                <IconPencil size={22}/>
              </button>
            </div>
          </div>

          <button
            type="button"
            className="sbw-nav sbw-nav-right"
            onClick={goNext}
            disabled={!canNext}
            aria-label="다음 씬"
            title="다음 씬"
          >
            <span aria-hidden="true">›</span>
          </button>
        </section>

        {/* 하단 썸네일 스트립 */}
        <section className="sbw-strip" aria-label="씬 바로가기">
          {scenes?.map((s, i) => { 
            return (
              <button
                key={s.no}
                className='sbw-thumb'
                // className={`sbw-thumb ${index === i ? 'is-active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`씬 ${s.order}로 이동`}
                title={`씬 ${s.order}`}
              >
                <div className="sbw-thumb-box">
                  {s.fileNo
                    ? <img src={getFile(s.fileNo)} alt="" className="w-100 h-100 object-fit-cover" />
                    : <span className="sbw-thumb-no">{s.order}</span>}
                </div>
                <div className="sbw-thumb-meta">
                  <span className="sbw-thumb-title">{s.title || `씬 ${s.order}`}</span>
                  {s.caption && <span className="sbw-thumb-note" title={s.caption}>{s.caption}</span>}
                </div>
              </button>
            )}
          )}
        </section>
      </div>

      {/* 메모 모달 */}
      <Modal show={showMemo} onHide={()=>setShowMemo(false)} centered>
        <Modal.Header closeButton><Modal.Title>메모 수정 – 씬 {current?.order}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>메모</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={memoDraft}
              onChange={e=>setMemoDraft(e.target.value)}
              placeholder="이 씬에 대한 메모를 입력하세요"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowMemo(false)}>취소</Button>
          <Button variant="primary" onClick={saveMemo}>저장</Button>
        </Modal.Footer>
      </Modal>

      {/* 이미지 픽커 모달: 큰 화면 클릭과 동일 동작 */}
      <ImagePickerModal
        show={showPicker}
        onClose={()=>setShowPicker(false)}
        onSelect={selectImage}
      />
    </main>
  );
}

export default StoryboardWorkspace