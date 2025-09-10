// src/services/mockdb.js
// 모의 DB(LocalStorage) – 캔버스 저장/로드 전용
const KEY = 'orange:mockdb:v1';

function _read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function _write(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500))); // 상한 500개
}
function _id() {
  return 'm_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

// name: 사용자 입력 이름(프로젝트/파일명), imageDataURL: 캔버스 이미지 데이터, meta: 각종 상태
export function save({ name = '', imageDataURL, meta = {} }) {
  const rec = {
    id: _id(),
    name: (name || '').trim(),
    imageDataURL,
    createdAt: Date.now(),
    meta
  };
  const list = _read();
  list.unshift(rec);
  _write(list);
  return rec;
}

export function list() {
  // v1에 name이 없는 예전 레코드 대비 - name 없으면 '(무제)'
  return _read().map(r => ({ ...r, name: r.name || '(무제)' }));
}

export function get(id) {
  return _read().find(x => x.id === id) || null;
}

export function remove(id) {
  const list = _read().filter(x => x.id !== id);
  _write(list);
}
