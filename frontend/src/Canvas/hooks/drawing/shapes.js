// src/Canvas/hooks/drawing/shapes.js
// ⚠️ 현재는 더미 구현. 추후 벡터 엔진 연결 시 교체.

export function getSelectionInfo() {
  // 선택된 도형 정보가 없으므로 null 반환
  return null;
}

/**
 * @param {number} delta  poly/star의 면수 증감 (±1)
 * @param {'up'|'down'} [mode] rect/ellipse를 poly로 변환할 때 힌트
 */
export function polygonSidesDelta(delta = 0, mode = null) {
  // no-op (추후 엔진 연결)
}
