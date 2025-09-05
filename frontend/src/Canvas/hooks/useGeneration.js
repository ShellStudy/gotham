// src/Canvas/hooks/useGeneration.js
import { useCallback, useState } from 'react';
import api from '@/services/network/api.js';

// 응답에서 URL 추출
const pickImageUrl = (data) => {
  if (!data) return '';
  return (
    data.imageUrl ||
    data.url ||
    (Array.isArray(data.images) && data.images[0]?.url) ||
    (Array.isArray(data.output) && typeof data.output[0] === 'string' && data.output[0]) ||
    ''
  );
};

export default function useGeneration({ getSaveDataURL }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  const generate = useCallback(async ({ prompt, model, aspect }) => {
    if (!prompt?.trim() || isGenerating) return '';
    setError('');
    setResultUrl('');
    setIsGenerating(true);
    try {
      const init = getSaveDataURL?.() || '';
      const { data } = await api.post(
        '/ai/generate',
        { prompt, init_image: init, model, mode: 'img2img', aspect },
        { timeout: 1000 * 60 * 5 }
      );
      const url = pickImageUrl(data);
      if (url) {
        setResultUrl(url);
        return url;           // ✅ 호출자에게도 즉시 반환
      }
      setError('이미지 응답을 찾지 못했습니다.');
      return '';
    } catch (e) {
      console.error(e);
      setError('이미지 생성 중 오류가 발생했습니다.');
      return '';
    } finally {
      setIsGenerating(false);
    }
  }, [getSaveDataURL, isGenerating]);

  return { isGenerating, error, setError, resultUrl, setResultUrl, generate };
}
