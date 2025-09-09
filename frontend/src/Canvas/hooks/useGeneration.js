// src/Canvas/hooks/useGeneration.js
import { useCallback, useState } from 'react';
import api from '@/services/network/api.js';
import { FastAPI } from '@/services/network/Network.js';

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

  const generate = useCallback(async ({ prompt, model, aspect, getUserNo }) => {
    // const init = getSaveDataURL?.() || '';
    // FastAPI("POST", "/gen", { prompt, init_image: init, model, aspect, "no": getUserNo() })
    // .then(res => console.log(res))
    if (!prompt?.trim() || isGenerating) return '';
    setError('');
    setResultUrl('');
    setIsGenerating(true);
    try {
      const init = getSaveDataURL?.() || '';
      const { data } = await api.post(
        '/gen',
        { prompt, init_image: init, model, aspect, "no": getUserNo() },
        { timeout: 1000 * 60 * 5 }
      );
      let url = pickImageUrl(data);
      if (url) {
        const host = import.meta.env.VITE_APP_FASTAPI_URL || "http://localhost:8000"
        url = `${host}/${url}`
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
