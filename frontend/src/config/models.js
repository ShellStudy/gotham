// src/config/models.js
export const MODEL_OPTIONS = [
  { value: 'img2img_real',  label: '포토리얼',  desc: '사진 같은 결과' },
  { value: 'img2img_anime', label: '애니메',    desc: '만화/일러스트 톤' },
//   { value: 'inpaint',       label: '인페인트',  desc: '영역 선택 수정' },
//   { value: 'outpaint',      label: '아웃페인트',desc: '캔버스 밖 확장' },
//   { value: 'sdxl',          label: 'SDXL',      desc: '고해상도 범용' },
//   { value: 'upscale',       label: '업스케일',  desc: '해상도 향상' },
];

export const getModelLabel = (value) =>
  MODEL_OPTIONS.find(o => o.value === value)?.label || value;
