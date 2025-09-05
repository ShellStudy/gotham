// src/services/useCanvasDrawing.js
import { useRef, useEffect, useState, useCallback } from 'react';

export default function useCanvasDrawing({
  tool,                  // 'select' | 'brush' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'star'
  color, size,           // 래스터(브러시/지우개)
  stroke, fill, strokeWidth, // 벡터 스타일
  enabled
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const docRef = useRef(null);
  const dctxRef = useRef(null);

  const viewRef = useRef({ scaleCss: 1, dxCss: 0, dyCss: 0, W: 0, H: 0, dpr: 1 });

  // rAF
  const presentCbRef = useRef(()=>{});
  const rafRef = useRef(0);
  const schedulePresent = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(()=>{ rafRef.current=0; presentCbRef.current(); }); };

  // 커서
  const [cursor, setCursor] = useState({ x:0, y:0, visible:false, rCss:Math.max(2, Math.round(size/2)) });
  useEffect(()=> setCursor(c=>({ ...c, rCss: Math.max(2, Math.round(size/2)) })), [size]);
  const dpr = () => window.devicePixelRatio || 1;

  // 벡터 레이어
  const vecRef = useRef([]);                // [{id,type,x,y,w,h, stroke, fill, strokeWidth, sides?, innerRatio?}]
  const selectedIdRef = useRef(null);

  // 생성(앵커) 상태
  const creatingRef = useRef(null);         // {id,type,x0,y0,center:boolean, x,y,w,h, stroke,fill,strokeWidth, sides?, innerRatio?}

  // 리사이즈/이동 상태
  const dragRef = useRef(null);             // {kind:'move'|'resize', handle, orig:{...}, offX,offY}

  // 히스토리(문서+벡터)
  const historyRef = useRef([]);
  const [historyCount, setHistoryCount] = useState(0);
  const MAX_HIST = 80;

  const snapshot = () => {
    try {
      const doc = docRef.current, dctx = dctxRef.current;
      const img = dctx.getImageData(0,0,doc.width,doc.height);
      const vec = JSON.parse(JSON.stringify(vecRef.current));
      return { w:doc.width, h:doc.height, img, vec };
    } catch (e) {
      console.warn('[useCanvasDrawing] snapshot failed', e);
      return null;
    }
  };
  const pushHistory = () => {
    const s = snapshot(); if (!s) return;
    const arr = historyRef.current;
    if (arr.length>=MAX_HIST) arr.shift();
    arr.push(s);
    setHistoryCount(arr.length);
  };
  const restore = (s) => {
    if (!s) return false;
    const { w,h,img,vec } = s;
    if (!docRef.current || docRef.current.width!==w || docRef.current.height!==h) {
      const off = document.createElement('canvas'); off.width=w; off.height=h;
      const dctx = off.getContext('2d', { willReadFrequently: true });
      docRef.current=off; dctxRef.current=dctx;
      recomputeView();
    }
    try { dctxRef.current.putImageData(img,0,0); } catch { return false; }
    vecRef.current = JSON.parse(JSON.stringify(vec));
    selectedIdRef.current=null;
    schedulePresent();
    return true;
  };
  const undo = () => {
    const arr = historyRef.current;
    if (!arr.length) return;
    const s = arr.pop();
    setHistoryCount(arr.length);
    restore(s);
  };

  // 문서 보장
  const ensureDoc = useCallback((w,h)=>{
    if (docRef.current) return;
    const off = document.createElement('canvas'); off.width=w|0; off.height=h|0;
    const dctx = off.getContext('2d', { willReadFrequently: true });
    dctx.fillStyle='#fff'; dctx.fillRect(0,0,off.width,off.height);
    docRef.current=off; dctxRef.current=dctx;
  },[]);

  // 뷰 재계산
  const recomputeView = useCallback(()=>{
    const cont = containerRef.current, canvas = canvasRef.current, doc = docRef.current;
    if (!cont || !canvas || !doc) return;
    const W = Math.max(1, cont.clientWidth), H = Math.max(1, cont.clientHeight), _dpr=dpr();
    canvas.width = Math.floor(W*_dpr); canvas.height = Math.floor(H*_dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    const rC=W/H, rD=doc.width/doc.height;
    let scaleCss, dxCss=0, dyCss=0;
    if (rD>rC) { scaleCss=W/doc.width; dyCss=(H-doc.height*scaleCss)/2; }
    else { scaleCss=H/doc.height; dxCss=(W-doc.width*scaleCss)/2; }
    viewRef.current = { scaleCss, dxCss, dyCss, W, H, dpr:_dpr };
    schedulePresent();
  },[]);

  // 마운트
  useEffect(()=>{
    if (!enabled) return;
    const cont = containerRef.current, canvas = canvasRef.current;
    if (!cont || !canvas) return;
    ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });

    const W0 = Math.max(1, cont.clientWidth), H0 = Math.max(1, cont.clientHeight);
    ensureDoc(W0*dpr(), H0*dpr());

    const drawPolyPath = (ctx, cx, cy, rx, ry, sides, rot= -Math.PI/2) => {
      const n = Math.max(3, Math.floor(sides));
      for (let i=0;i<n;i++){
        const a = rot + i*(2*Math.PI/n);
        const px = cx + Math.cos(a)*rx;
        const py = cy + Math.sin(a)*ry;
        if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath();
    };
    const drawStarPath = (ctx, cx, cy, rx, ry, sides, innerRatio=0.5, rot= -Math.PI/2) => {
      const n = Math.max(3, Math.floor(sides));
      const rInX = rx*innerRatio, rInY = ry*innerRatio;
      for (let i=0;i<n;i++){
        const aOuter = rot + i*(2*Math.PI/n);
        const aInner = aOuter + Math.PI/n;
        const ox = cx + Math.cos(aOuter)*rx;
        const oy = cy + Math.sin(aOuter)*ry;
        const ix = cx + Math.cos(aInner)*rInX;
        const iy = cy + Math.sin(aInner)*rInY;
        if (i===0) ctx.moveTo(ox,oy); else ctx.lineTo(ox,oy);
        ctx.lineTo(ix,iy);
      }
      ctx.closePath();
    };

    const present = () => {
      const { scaleCss, dxCss, dyCss, W, H, dpr:_dpr } = viewRef.current;
      const ctx = ctxRef.current, doc = docRef.current;
      if (!ctx || !doc) return;

      ctx.setTransform(_dpr,0,0,_dpr,0,0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);

      const dw = doc.width*scaleCss, dh = doc.height*scaleCss;
      ctx.drawImage(doc,0,0,doc.width,doc.height, dxCss,dyCss, dw,dh);

      const renderVec = (o) => {
        const s = scaleCss;
        const x = dxCss + o.x*s, y = dyCss + o.y*s, w=o.w*s, h=o.h*s;
        const stroked = o.stroke && o.strokeWidth>0;
        const filled  = o.fill && o.fill!=='none';
        ctx.save();
        ctx.lineWidth = Math.max(1, o.strokeWidth*s);
        if (stroked) ctx.strokeStyle = o.stroke;
        if (filled) ctx.fillStyle = o.fill;

        if (o.type==='rect') {
          if (filled) ctx.fillRect(x,y,w,h);
          if (stroked) ctx.strokeRect(x,y,w,h);
        } else if (o.type==='ellipse') {
          ctx.beginPath();
          ctx.ellipse(x+w/2,y+h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, Math.PI*2);
          if (filled) ctx.fill();
          if (stroked) ctx.stroke();
        } else if (o.type==='line') {
          ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y+h);
          if (stroked) ctx.stroke();
        } else if (o.type==='poly') {
          ctx.beginPath(); drawPolyPath(ctx, x+w/2, y+h/2, Math.abs(w/2), Math.abs(h/2), o.sides||5);
          if (filled) ctx.fill();
          if (stroked) ctx.stroke();
        } else if (o.type==='star') {
          ctx.beginPath(); drawStarPath(ctx, x+w/2, y+h/2, Math.abs(w/2), Math.abs(h/2), o.sides||5, o.innerRatio??0.5);
          if (filled) ctx.fill();
          if (stroked) ctx.stroke();
        }
        ctx.restore();
      };
      vecRef.current.forEach(renderVec);

      // 선택 표시 + 핸들
      const selId = selectedIdRef.current;
      if (selId) {
        const o = vecRef.current.find(v=>v.id===selId);
        if (o) {
          const s = scaleCss;
          const x = dxCss + o.x*s, y = dyCss + o.y*s, w=o.w*s, h=o.h*s;
          ctx.save();
          ctx.setLineDash([6,3]);
          ctx.strokeStyle='#1b1f23';
          ctx.lineWidth=1;
          ctx.strokeRect(x,y,w,h);
          const hs=8;
          const pts = [
            [x,y],[x+w/2,y],[x+w,y],
            [x,y+h/2],[x+w,y+h/2],
            [x,y+h],[x+w/2,y+h],[x+w,y+h]
          ];
          ctx.fillStyle='#fff'; ctx.strokeStyle='#1b1f23';
          pts.forEach(([px,py])=>{ ctx.beginPath(); ctx.rect(px-hs/2, py-hs/2, hs, hs); ctx.fill(); ctx.stroke(); });
          ctx.restore();
        }
      }

      // 생성 프리뷰
      if (creatingRef.current) renderVec(creatingRef.current);
    };
    presentCbRef.current = present;

    recomputeView();
    const ro = new ResizeObserver(recomputeView);
    ro.observe(cont);
    return ()=>{ ro.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current=0; };
  }, [enabled, ensureDoc, recomputeView]);

  // 좌표 변환
  const toDocXY = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    const xCss = clientX - rect.left, yCss = clientY - rect.top;
    const { scaleCss, dxCss, dyCss } = viewRef.current;
    return { x:(xCss-dxCss)/scaleCss, y:(yCss-dyCss)/scaleCss, shift:e.shiftKey, alt:e.altKey };
  };
  const toCssXY = (e) => {
    const rect = containerRef.current?.getBoundingClientRect?.(); if (!rect) return {x:0,y:0};
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // 히트테스트
  const hitHandle = (o, x, y) => {
    const hs = 8 / (viewRef.current.scaleCss || 1);
    const corners = [
      {k:'nw', px:o.x,       py:o.y      },
      {k:'n',  px:o.x+o.w/2, py:o.y      },
      {k:'ne', px:o.x+o.w,   py:o.y      },
      {k:'w',  px:o.x,       py:o.y+o.h/2},
      {k:'e',  px:o.x+o.w,   py:o.y+o.h/2},
      {k:'sw', px:o.x,       py:o.y+o.h  },
      {k:'s',  px:o.x+o.w/2, py:o.y+o.h  },
      {k:'se', px:o.x+o.w,   py:o.y+o.h  },
    ];
    for (const c of corners) if (Math.abs(x-c.px)<=hs && Math.abs(y-c.py)<=hs) return c.k;
    return null;
  };
  const hitObject = (x,y) => {
    const list = vecRef.current;
    for (let i=list.length-1;i>=0;i--){
      const o=list[i];
      if (o.type==='line'){
        const tol = Math.max(4, o.strokeWidth) / (viewRef.current.scaleCss||1);
        const x1=o.x, y1=o.y, x2=o.x+o.w, y2=o.y+o.h;
        const A=x-x1, B=y-y1, C=x2-x1, D=y2-y1;
        const dot=A*C+B*D, len=C*C+D*D;
        let t=len?dot/len:-1; t=Math.max(0,Math.min(1,t));
        const px=x1+C*t, py=y1+D*t;
        if (Math.hypot(x-px, y-py) <= tol) return o;
      } else {
        const xmin=Math.min(o.x,o.x+o.w), xmax=Math.max(o.x,o.x+o.w);
        const ymin=Math.min(o.y,o.y+o.h), ymax=Math.max(o.y,o.y+o.h);
        if (x>=xmin&&x<=xmax&&y>=ymin&&y<=ymax) return o;
      }
    }
    return null;
  };

  // 래스터 드로잉(브러시/지우개)
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPtRef = useRef(null);
  const drawBrush = (x,y,first=false)=>{
    const dctx = dctxRef.current;
    const { scaleCss } = viewRef.current;
    const px = Math.max(0.5, size/(scaleCss||1));
    dctx.lineCap='round'; dctx.lineJoin='round'; dctx.lineWidth=px;
    dctx.strokeStyle = color;
    dctx.globalCompositeOperation = (tool==='eraser')?'destination-out':'source-over';
    if (first){ dctx.beginPath(); dctx.moveTo(x,y); }
    else { dctx.lineTo(x,y); }
    dctx.stroke();
    schedulePresent();
  };

  // 포인터 핸들러
  const onPointerDown = (e) => {
    if (!enabled) return;
    e.preventDefault?.();
    setCursor(c=>({ ...c, ...toCssXY(e), visible:true }));

    const { x, y, shift, alt } = toDocXY(e);
    const doc = docRef.current;
    if (x<0||y<0||x>doc.width||y>doc.height) return;

    try { canvasRef.current?.setPointerCapture?.(e.pointerId); } catch {}

    // 변경 전 스냅샷
    pushHistory();

    if (tool==='select') {
      // 핸들 우선
      const selId = selectedIdRef.current;
      if (selId) {
        const sel = vecRef.current.find(v=>v.id===selId);
        const handle = sel && hitHandle(sel,x,y);
        if (handle) { dragRef.current = { kind:'resize', handle, orig:{...sel} }; setIsDrawing(true); return; }
      }
      // 오브젝트 선택/이동
      const hit = hitObject(x,y);
      if (hit) {
        selectedIdRef.current = hit.id;
        dragRef.current = { kind:'move', offX: x-hit.x, offY: y-hit.y, orig:{...hit} };
        setIsDrawing(true);
      } else {
        selectedIdRef.current = null;
        dragRef.current = null;
        schedulePresent();
      }
      return;
    }

    if (tool==='brush' || tool==='eraser') {
      setIsDrawing(true); lastPtRef.current={x,y}; drawBrush(x,y,true);
      return;
    }

    // 도형 생성(앵커 고정: 마우스다운 시 결정)
    const t = (tool==='ellipse')?'ellipse' : (tool==='rect')?'rect' : (tool==='line')?'line' : (tool==='star')?'star':'poly';
    const obj = {
      id: 'v_' + Math.random().toString(36).slice(2,8) + Date.now().toString(36),
      type: t,
      x0: x, y0: y, center: !!alt,   // ⬅️ Alt는 "중심부터" 모드, 드래그 중 바뀌어도 anchor는 고정
      x, y, w:0, h:0,
      stroke: stroke || '#111',
      fill: fill || 'none',
      strokeWidth: Math.max(1, strokeWidth||1),
      sides: (t==='star'||t==='poly') ? 5 : undefined,
      innerRatio: (t==='star') ? 0.5 : undefined,
    };
    creatingRef.current = obj;
    setIsDrawing(true);
    schedulePresent();
  };

  const onPointerMove = (e) => {
    setCursor(c=>({ ...c, ...toCssXY(e), visible:true }));
    if (!isDrawing) return;
    if ('buttons' in e && e.buttons===0) { onPointerUp(e); return; }

    const { x, y, shift } = toDocXY(e);

    if (tool==='select') {
      const selId = selectedIdRef.current;
      const drag = dragRef.current;
      if (!selId || !drag) return;
      const list = vecRef.current;
      const o = list.find(v=>v.id===selId);
      if (!o) return;

      if (drag.kind==='move') {
        o.x = x - (drag.offX ?? 0);
        o.y = y - (drag.offY ?? 0);
        schedulePresent();
        return;
      }
      if (drag.kind==='resize') {
        // 반대편 앵커 고정 (Alt 중심 리사이즈는 제거)
        const s = drag.orig;
        let x1=s.x, y1=s.y, x2=s.x+s.w, y2=s.y+s.h;
        const apply = (k)=>{
          if (k.includes('n')) y1 = y;
          if (k.includes('s')) y2 = y;
          if (k.includes('w')) x1 = x;
          if (k.includes('e')) x2 = x;
          if (k==='n' || k==='s') x2 = s.x + s.w;
          if (k==='e' || k==='w') y2 = s.y + s.h;
        };
        apply(drag.handle);

        if (shift && o.type!=='line') {
          const cw=Math.abs(x2-x1), ch=Math.abs(y2-y1), m=Math.max(cw,ch);
          // 정비율 고정
          if (drag.handle.includes('n')) y1 = y2 - m; else if (drag.handle.includes('s')) y2 = y1 + m;
          if (drag.handle.includes('w')) x1 = x2 - m; else if (drag.handle.includes('e')) x2 = x1 + m;
        }
        o.x=Math.min(x1,x2); o.y=Math.min(y1,y2);
        o.w=Math.max(x1,x2)-o.x; o.h=Math.max(y1,y2)-o.y;
        schedulePresent();
        return;
      }
      return;
    }

    if (tool==='brush' || tool==='eraser') { drawBrush(x,y,false); lastPtRef.current={x,y}; return; }

    // 도형 생성 진행 (앵커 고정)
    const cur = creatingRef.current; if (!cur) return;

    const x0 = cur.x0, y0 = cur.y0;
    let x1, y1, x2, y2;

    if (cur.type==='line') {
      // 시작앵커 고정 + Shift 45° 스냅
      let dx = x - x0, dy = y - y0;
      if (shift) {
        const ang = Math.atan2(dy, dx), step = Math.PI/4;
        const len = Math.hypot(dx, dy);
        const snapped = Math.round(ang/step)*step;
        dx = Math.cos(snapped)*len; dy = Math.sin(snapped)*len;
      }
      cur.x = x0; cur.y = y0; cur.w = dx; cur.h = dy;
      schedulePresent();
      return;
    }

    // 사각/타원/폴리/별: 중심모드 여부에 따라 bbox 계산 (앵커 x0,y0는 고정)
    if (cur.center) {
      const dx = Math.abs(x - x0), dy = Math.abs(y - y0);
      let w = dx*2, h = dy*2;
      if (shift && (cur.type==='rect' || cur.type==='ellipse' || cur.type==='poly' || cur.type==='star')) {
        const m = Math.max(w,h); w=m; h=m;
      }
      cur.x = x0 - w/2; cur.y = y0 - h/2; cur.w = w; cur.h = h;
    } else {
      x1 = Math.min(x0,x); y1 = Math.min(y0,y);
      x2 = Math.max(x0,x); y2 = Math.max(y0,y);
      if (shift && (cur.type==='rect' || cur.type==='ellipse' || cur.type==='poly' || cur.type==='star')) {
        const w=x2-x1, h=y2-y1, m=Math.max(w,h);
        if (x < x0) x1 = x2 - m; else x2 = x1 + m;
        if (y < y0) y1 = y2 - m; else y2 = y1 + m;
      }
      cur.x = x1; cur.y = y1; cur.w = x2-x1; cur.h = y2-y1;
    }
    // 스타일 갱신(프리뷰도 최신 스타일)
    cur.stroke = stroke || cur.stroke;
    cur.fill = fill || cur.fill;
    cur.strokeWidth = Math.max(1, strokeWidth || cur.strokeWidth);
    schedulePresent();
  };

  const onPointerUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    try { if (e?.pointerId!=null) canvasRef.current?.releasePointerCapture?.(e.pointerId); } catch {}
    setCursor(c=>({ ...c, visible:true }));

    if (tool==='brush' || tool==='eraser') { lastPtRef.current=null; return; }

    if (tool==='select') { dragRef.current=null; return; }

    const cur = creatingRef.current;
    if (cur) {
      if (cur.type!=='line' && (cur.w<1 || cur.h<1)) { creatingRef.current=null; schedulePresent(); return; }
      if (cur.type==='line' && Math.hypot(cur.w,cur.h)<1) { creatingRef.current=null; schedulePresent(); return; }
      vecRef.current = [...vecRef.current, { ...cur }];
      selectedIdRef.current = cur.id;
      creatingRef.current=null;
      schedulePresent();
    }
  };

  const onPointerEnter = (e)=> setCursor({ ...toCssXY(e||{}), visible:true, rCss:Math.max(2, Math.round(size/2)) });
  const onPointerLeave = ()=> { setIsDrawing(false); creatingRef.current=null; dragRef.current=null; setCursor(c=>({ ...c, visible:false })); };

  // 선택 후 스타일 변경 자동 반영 (select 모드에서만)
  const prevStyleRef = useRef({ id:null, stroke, fill, strokeWidth });
  useEffect(()=>{
    if (tool!=='select') return;
    const selId = selectedIdRef.current; if (!selId) return;
    const o = vecRef.current.find(v=>v.id===selId); if (!o) return;

    const prev = prevStyleRef.current;
    const changed =
      prev.id!==selId || prev.stroke!==stroke || prev.fill!==fill || prev.strokeWidth!==strokeWidth;

    if (changed) {
      pushHistory();
      o.stroke = stroke;
      o.fill = fill;
      o.strokeWidth = Math.max(1, strokeWidth);
      prevStyleRef.current = { id: selId, stroke, fill, strokeWidth };
      schedulePresent();
    }
  }, [tool, stroke, fill, strokeWidth]);

  // 명령
  const clear = () => {
    pushHistory();
    const doc = docRef.current, dctx = dctxRef.current;
    dctx.fillStyle='#fff'; dctx.fillRect(0,0,doc.width,doc.height);
    vecRef.current=[]; selectedIdRef.current=null;
    schedulePresent();
  };

  // 내보내기(문서+벡터 합성)
  const toDataURL = (type, quality) => {
    const doc = docRef.current;
    const off = document.createElement('canvas'); off.width=doc.width; off.height=doc.height;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(doc,0,0);
    const draw = (o)=>{
      const stroked = o.stroke && o.strokeWidth>0;
      const filled = o.fill && o.fill!=='none';
      ctx.save(); ctx.lineWidth=o.strokeWidth;
      if (stroked) ctx.strokeStyle=o.stroke;
      if (filled) ctx.fillStyle=o.fill;
      if (o.type==='rect'){ if (filled) ctx.fillRect(o.x,o.y,o.w,o.h); if (stroked) ctx.strokeRect(o.x,o.y,o.w,o.h); }
      else if (o.type==='ellipse'){ ctx.beginPath(); ctx.ellipse(o.x+o.w/2,o.y+o.h/2, Math.abs(o.w/2),Math.abs(o.h/2),0,0,Math.PI*2); if (filled) ctx.fill(); if (stroked) ctx.stroke(); }
      else if (o.type==='line'){ ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(o.x+o.w,o.y+o.h); if (stroked) ctx.stroke(); }
      else if (o.type==='poly'){ ctx.beginPath(); // 간단 재구현
        const cx=o.x+o.w/2, cy=o.y+o.h/2, rx=Math.abs(o.w/2), ry=Math.abs(o.h/2), n=Math.max(3,o.sides|0);
        for(let i=0;i<n;i++){ const a=-Math.PI/2 + i*(2*Math.PI/n); const px=cx+Math.cos(a)*rx; const py=cy+Math.sin(a)*ry; if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
        ctx.closePath(); if (filled) ctx.fill(); if (stroked) ctx.stroke();
      }
      else if (o.type==='star'){ ctx.beginPath();
        const cx=o.x+o.w/2, cy=o.y+o.h/2, rx=Math.abs(o.w/2), ry=Math.abs(o.h/2), n=Math.max(3,o.sides|0), rix=rx*(o.innerRatio??0.5), riy=ry*(o.innerRatio??0.5);
        for(let i=0;i<n;i++){ const ao=-Math.PI/2 + i*(2*Math.PI/n); const ai=ao+Math.PI/n; const ox=cx+Math.cos(ao)*rx, oy=cy+Math.sin(ao)*ry; const ix=cx+Math.cos(ai)*rix, iy=cy+Math.sin(ai)*riy; if(i===0)ctx.moveTo(ox,oy); else ctx.lineTo(ox,oy); ctx.lineTo(ix,iy); }
        ctx.closePath(); if (filled) ctx.fill(); if (stroked) ctx.stroke();
      }
      ctx.restore();
    };
    vecRef.current.forEach(draw);
    try { return type? off.toDataURL(type,quality) : off.toDataURL(); } catch { return off.toDataURL(); }
  };

  const loadFromDataURL = useCallback((dataURL)=> new Promise((resolve)=>{
    pushHistory();
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth||img.width, h = img.naturalHeight||img.height;
      const off = document.createElement('canvas'); off.width=w; off.height=h;
      const dctx = off.getContext('2d', { willReadFrequently: true });
      dctx.fillStyle='#fff'; dctx.fillRect(0,0,w,h); dctx.drawImage(img,0,0);
      docRef.current=off; dctxRef.current=dctx;
      vecRef.current=[]; selectedIdRef.current=null;
      recomputeView(); resolve(true);
    };
    img.src = dataURL;
  }), [recomputeView]);

  const setAspectRatio = useCallback((ratioStr)=>{
    if (!ratioStr || !/^\d+:\d+$/.test(ratioStr)) return false;
    const [a,b] = ratioStr.split(':').map(n=>Math.max(1,parseInt(n,10)));
    const r = a/b;
    const oldDoc = docRef.current; if (!oldDoc) return false;
    const W=oldDoc.width, H=oldDoc.height, rOld=W/H;
    if (Math.abs(rOld-r)<1e-6) { recomputeView(); return true; }
    pushHistory();
    let Wn=W, Hn=H;
    if (rOld<r) Wn=Math.ceil(H*r); else Hn=Math.ceil(W/r);
    const n = document.createElement('canvas'); n.width=Wn; n.height=Hn;
    const nd = n.getContext('2d', { willReadFrequently: true });
    nd.fillStyle='#fff'; nd.fillRect(0,0,Wn,Hn);
    const dx=((Wn-W)/2)|0, dy=((Hn-H)/2)|0; nd.drawImage(oldDoc, dx,dy);
    docRef.current=n; dctxRef.current=nd; recomputeView(); return true;
  }, [recomputeView]);

  // ---- 외부에 제공: 선택 정보 & 다각형 사이드 변경 ---------------------
  const getSelectionInfo = () => {
    const id = selectedIdRef.current; if (!id) return null;
    const o = vecRef.current.find(v=>v.id===id); if (!o) return null;
    return { id:o.id, type:o.type, sides:o.sides, innerRatio:o.innerRatio };
  };

  const polygonSidesDelta = (delta, seedFrom) => {
    const id = selectedIdRef.current; if (!id) return;
    const o = vecRef.current.find(v=>v.id===id); if (!o) return;
    pushHistory();
    if (o.type==='rect') {
      // seedFrom: 'up' → 5각, 'down' → 3각
      const sides = seedFrom==='up' ? 5 : 3;
      o.type='poly'; o.sides=sides;
    } else if (o.type==='poly') {
      o.sides = Math.max(3, Math.min(64, (o.sides||5) + delta));
    } else if (o.type==='star') {
      o.sides = Math.max(3, Math.min(64, (o.sides||5) + delta));
    } else if (o.type==='ellipse') {
      // 원/타원에서 시작: ↑/↓로 다각형 변환 (원: 6각 스타트가 자연스럽지만 요청엔 사각형 기준이라 기본 5/3 유지)
      if (delta>0) { o.type='poly'; o.sides=5; }
      else { o.type='poly'; o.sides=3; }
    }
    schedulePresent();
  };

  return {
    containerRef, canvasRef,
    onPointerEnter, onPointerLeave, onPointerDown, onPointerMove, onPointerUp,
    undo, clear, historyCount,
    toDataURL, cursor, loadFromDataURL,
    setAspectRatio,
    getSelectionInfo,
    polygonSidesDelta,
  };
}
