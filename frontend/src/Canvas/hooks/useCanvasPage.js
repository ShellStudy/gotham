// src/Canvas/hooks/useCanvasPage.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRoot } from '@/services/core/RootProvider.jsx';
import useCanvasDrawing from '@/Canvas/hooks/useCanvasDrawing.js';
import useDrafts from '@/Canvas/hooks/useDrafts.js';
import useGeneration from '@/Canvas/hooks/useGeneration.js';
import * as mockdb from '@/services/data/mockdb.js';
import { MODEL_OPTIONS, getModelLabel } from '@/config/models.js';
import { ASPECT_OPTIONS, getAspectLabel } from '@/config/aspects.js';

export default function useCanvasPage() {
  const { access } = useRoot();
  const [search] = useSearchParams();
  const draftParam = search.get('draft') || null;

  // UI
  const [toolsOpen, setToolsOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [aspectOpen, setAspectOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  // Tools / Styles
  const [tool, setTool] = useState('brush');
  const [size, setSize] = useState(8);
  const [color, setColor] = useState('#111111');
  const [stroke, setStroke] = useState('#111111');
  const [fill, setFill] = useState('none');
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Model / Aspect
  const [model, setModel] = useState('img2img_real');
  const [aspect, setAspect] = useState(null);

  // Prompt / Result
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  // Overlays
  const [overlayProgress, setOverlayProgress] = useState(null);
  const [toast, setToast] = useState(null);
  const progTimerRef = useRef(null);

  // Canvas hook
  const {
    containerRef, canvasRef,
    onPointerEnter, onPointerLeave, onPointerDown, onPointerMove, onPointerUp: _onPointerUp,
    undo, clear, historyCount, toDataURL, cursor, loadFromDataURL,
    getSelectionInfo, polygonSidesDelta,
  } = useCanvasDrawing({
    tool, color, size, stroke, fill, strokeWidth, enabled: access,
  });

  // Init image (img2img)
  const [initImage, setInitImage] = useState(null);

  const getSaveDataURL = useCallback(() => {
    if (initImage) return initImage;
    try {
      const webp = toDataURL('image/webp', 0.85);
      if (webp?.startsWith('data:image/webp')) return webp;
    } catch {}
    try {
      const jpg = toDataURL('image/jpeg', 0.9);
      if (jpg?.startsWith('data:image/jpeg')) return jpg;
    } catch {}
    return toDataURL();
  }, [initImage, toDataURL]);

  // Drafts
  const { draftId, saving, saveNow, markDirty } = useDrafts({
    access, draftParam, getSaveDataURL, loadFromDataURL,
    metaDeps: { tool, size, aspect, hasInitImage: !!initImage, stroke, fill, strokeWidth, brushColor: color },
    onLoaded: (doc) => {
      setPrompt(doc.prompt || '');
      setModel(doc.model || 'img2img_real');
      if (doc.meta?.aspect) setAspect(doc.meta.aspect);
      if (doc.initImageDataURL) setInitImage(doc.initImageDataURL);
      if (doc.meta?.stroke) setStroke(doc.meta.stroke);
      if (doc.meta?.fill) setFill(doc.meta.fill);
      if (doc.meta?.strokeWidth) setStrokeWidth(doc.meta.strokeWidth);
      if (doc.meta?.brushColor) setColor(doc.meta.brushColor);
    },
    getAdditionalDraftFields: () => ({ prompt, model, initImageDataURL: initImage || null }),
  });

  const onPointerUp = useCallback((e) => { _onPointerUp?.(e); markDirty(); }, [_onPointerUp, markDirty]);

  // Generation
  const { isGenerating, error, setError, resultUrl: genUrl, generate } = useGeneration({ getSaveDataURL });
  useEffect(() => { if (genUrl) setResultUrl(genUrl); }, [genUrl]);

  useEffect(() => {
    if (!resultUrl) return;
    setToast({ type: 'ok', msg: '이미지 생성 완료!' });
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [resultUrl]);

  useEffect(() => {
    if (!error) return;
    setToast({ type: 'err', msg: error });
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => () => { if (progTimerRef.current) clearInterval(progTimerRef.current); }, []);

  const canGenerate = useMemo(() => prompt.trim().length > 0 && !isGenerating, [prompt, isGenerating]);

  const handleGenerate = useCallback(async () => {
    setResultUrl('');
    setResultOpen(false);
    setToast(null);

    let p = 1;
    setOverlayProgress({ value: p, label: '이미지 생성 중…' });
    if (progTimerRef.current) clearInterval(progTimerRef.current);
    progTimerRef.current = setInterval(() => {
      p = Math.min(95, p + 2 + Math.random() * 6);
      setOverlayProgress(prev => (prev ? { ...prev, value: Math.round(p) } : null));
    }, 120);

    const url = await generate({ prompt, model, aspect });

    if (progTimerRef.current) { clearInterval(progTimerRef.current); progTimerRef.current = null; }
    let end = p;
    const fin = setInterval(() => {
      end = Math.min(100, end + 5 + Math.random() * 10);
      setOverlayProgress(prev => (prev ? { ...prev, value: Math.round(end) } : null));
      if (end >= 100) {
        clearInterval(fin);
        setTimeout(() => {
          setOverlayProgress(null);
          setResultOpen(true);
        }, 120);
      }
    }, 40);
  }, [generate, prompt, model, aspect]);

  // Mock DB
  const [savingDB, setSavingDB] = useState(false);
  const [dbOpen, setDbOpen] = useState(false);
  const [dbItems, setDbItems] = useState([]);
  const refreshDB = useCallback(() => setDbItems(mockdb.list()), []);
  const toggleDB = useCallback(() => { setDbOpen(v => { const n = !v; if (n) refreshDB(); return n; }); }, [refreshDB]);

  const defaultDBName = useCallback(() => {
    const base = (prompt || 'Canvas').trim().slice(0, 20) || 'Canvas';
    const d = new Date();
    const p = (n) => String(n).padStart(2,'0');
    return `${base}-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }, [prompt]);

  const handleSaveDraft = useCallback(async () => {
    try {
      await saveNow();
      setError('');
      setToast({ type: 'ok', msg: '브라우저에 임시 저장 완료' });
    } catch {
      setError('임시 저장 중 오류가 발생했습니다.');
      setToast({ type: 'err', msg: '임시 저장 실패' });
    }
  }, [saveNow, setError]);

  const handleSaveDB = useCallback(async () => {
    setSavingDB(true);
    try {
      const dataUrl = getSaveDataURL();
      if (!dataUrl) throw new Error('no image');
      const name = (window.prompt?.('저장할 이름(프로젝트/파일명)', defaultDBName()) || '').trim();
      if (!name) { setSavingDB(false); return; }
      mockdb.save({
        name,
        imageDataURL: dataUrl,
        meta: { tool, size, aspect, prompt, model, draftId, stroke, fill, strokeWidth, brushColor: color },
      });
      refreshDB();
      setToast({ type: 'ok', msg: 'DB(모의) 저장 완료' });
    } catch {
      setToast({ type: 'err', msg: 'DB(모의) 저장 실패' });
    } finally {
      setSavingDB(false);
    }
  }, [getSaveDataURL, defaultDBName, tool, size, aspect, prompt, model, draftId, stroke, fill, strokeWidth, color, refreshDB]);

  const handleLoadFromDB = useCallback((id) => {
    try {
      const rec = mockdb.get(id);
      if (!rec) { setToast({ type: 'err', msg: '항목을 찾을 수 없습니다.' }); return; }
      if (rec.imageDataURL) loadFromDataURL(rec.imageDataURL);
      const m = rec.meta || {};
      if (typeof m.prompt === 'string') setPrompt(m.prompt);
      if (typeof m.model  === 'string') setModel(m.model);
      if (m.aspect) setAspect(m.aspect);
      if (m.stroke) setStroke(m.stroke);
      if (m.fill) setFill(m.fill);
      if (m.strokeWidth) setStrokeWidth(m.strokeWidth);
      if (m.brushColor) setColor(m.brushColor);
      setToast({ type: 'ok', msg: `"${rec.name || '(무제)'}" 불러오기 완료` });
      setDbOpen(false);
    } catch {
      setToast({ type: 'err', msg: '로드 중 오류가 발생했습니다.' });
    }
  }, [loadFromDataURL]);

  // Shortcuts
  const handleUndo = useCallback(() => { undo(); markDirty(); }, [undo, markDirty]);

  useEffect(() => {
    if (!access) return;
    const isEditable = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      if (el.isContentEditable) return true;
      const role = (el.getAttribute && el.getAttribute('role')) || '';
      return role === 'textbox';
    };
    const onKeySave = (e) => {
      if (modelOpen || aspectOpen) return;
      if (isEditable(e.target)) return;
      const key = String(e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 's') { e.preventDefault(); handleSaveDB(); }
    };
    window.addEventListener('keydown', onKeySave);
    return () => window.removeEventListener('keydown', onKeySave);
  }, [access, modelOpen, aspectOpen, handleSaveDB]);

  useEffect(() => {
    if (!access) return;
    const isEditable = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      if (el.isContentEditable) return true;
      const role = (el.getAttribute && el.getAttribute('role')) || '';
      return role === 'textbox';
    };
    const onKeyUndo = (e) => {
      if (modelOpen || aspectOpen) return;
      if (isEditable(e.target)) return;
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (historyCount > 0) handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyUndo);
    return () => window.removeEventListener('keydown', onKeyUndo);
  }, [access, modelOpen, aspectOpen, historyCount, handleUndo]);

  useEffect(() => {
    if (!access) return;
    const isEditable = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      if (el.isContentEditable) return true;
      const role = (el.getAttribute && el.getAttribute('role')) || '';
      return role === 'textbox';
    };
    const onKeyPoly = (e) => {
      if (modelOpen || aspectOpen) return;
      if (isEditable(e.target)) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (!getSelectionInfo || !polygonSidesDelta) return;
        const sel = getSelectionInfo();
        if (!sel) return;
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          if (sel.type === 'rect' || sel.type === 'ellipse') polygonSidesDelta(0, 'up');
          else polygonSidesDelta(+1);
        } else {
          if (sel.type === 'rect' || sel.type === 'ellipse') polygonSidesDelta(0, 'down');
          else polygonSidesDelta(-1);
        }
      }
    };
    window.addEventListener('keydown', onKeyPoly);
    return () => window.removeEventListener('keydown', onKeyPoly);
  }, [access, modelOpen, aspectOpen, getSelectionInfo, polygonSidesDelta]);

  // Stroke ↔ Brush 동기화
  useEffect(() => { setColor(stroke); }, [stroke]);

  const readFilesToDataURL = useCallback((files) => new Promise((resolve, reject) => {
    const f = files?.[0];
    if (!f || !/^image\//.test(f.type)) return reject(new Error('이미지가 아닙니다.'));
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(f);
  }), []);

  const handleInitSelect = useCallback(async (files) => {
    try { const dataUrl = await readFilesToDataURL(files); setInitImage(dataUrl); markDirty(); } catch {}
  }, [readFilesToDataURL, markDirty]);

  const handleInitClear = useCallback(() => { setInitImage(null); markDirty(); }, [markDirty]);

  const pageClass = `canvas-page ${resultOpen ? 'is-sheet-open' : ''}`;

  return {
    access, pageClass,
    // Stage
    stageProps: {
      containerRef, canvasRef, onPointerEnter, onPointerLeave, onPointerDown, onPointerMove, onPointerUp, cursor, brushSize: size, tool,
    },
    isGenerating,
    // Sidebar
    sidebarProps: {
      open: toolsOpen, onClose: () => setToolsOpen(false),
      tool, setTool, size, setSize, stroke, setStroke, fill, setFill, strokeWidth, setStrokeWidth,
      onUndo: handleUndo, onClear: clear, hasHistory: historyCount > 0,
      onSaveDraft: handleSaveDraft, savingDraft: saving,
      onSaveDB: handleSaveDB, savingDB,
      dbOpen, onToggleDB: toggleDB, dbItems, onLoadDB: handleLoadFromDB,
    },
    // PromptDock
    promptProps: {
      open: dockOpen, setOpen: setDockOpen,
      prompt, setPrompt, canGenerate, onGenerate: handleGenerate, isGenerating,
      toolsOpen, onToggleTools: () => setToolsOpen(v => !v),
      modelLabel: getModelLabel(model), onOpenModelPicker: () => setModelOpen(true),
      aspectLabel: getAspectLabel(aspect), onOpenAspectPicker: () => setAspectOpen(true),
      initImage, onInitSelect: handleInitSelect, onInitClear: handleInitClear,
      overlayProgress, overlayToast: toast,
    },
    // Modals
    modelModalProps: {
      show: modelOpen, onHide: () => setModelOpen(false),
      value: model, onSelect: (v) => { setModel(v); setModelOpen(false); },
      options: MODEL_OPTIONS,
    },
    aspectModalProps: {
      show: aspectOpen, onHide: () => setAspectOpen(false),
      value: aspect, onSelect: (v) => { setAspect(v); setAspectOpen(false); },
      options: ASPECT_OPTIONS,
    },
    // Result
    resultProps: {
      key: resultUrl, url: resultUrl, open: resultOpen, onOpenChange: setResultOpen, onClose: () => setResultUrl(''),
    },
  };
}
