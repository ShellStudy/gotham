// src/config/aspects.js
export const ASPECT_OPTIONS = [
  { value: '1:1',   label: '1:1' },
  { value: '4:3',   label: '4:3' },
  { value: '3:4',   label: '3:4' },
  { value: '16:9',  label: '16:9' },
  { value: '9:16',  label: '9:16' },
];

export const getAspectLabel = (v) =>
  ASPECT_OPTIONS.find(o => o.value === v)?.label || '원본';
