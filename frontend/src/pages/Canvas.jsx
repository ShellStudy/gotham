// src/pages/Canvas.jsx
import React from 'react';
import {
  Stage, ToolsSidebar, PromptDock, ResultPanel,
  LoadingIndicator, ModelPickerModal, AspectRatioModal
} from '@/components/Canvas';
import useCanvasPage from '@/Canvas/hooks/useCanvasPage.js';

export default function Canvas() {
  const {
    access, pageClass,
    stageProps, isGenerating,
    sidebarProps, promptProps,
    modelModalProps, aspectModalProps,
    resultProps,
  } = useCanvasPage();

  if (!access) return null;

  // ✅ key는 분리해서 직접 전달
  const { key: resultKey, ...resultPanelProps } = resultProps ?? {};

  return (
    <div className={pageClass} aria-label="캔버스 페이지">
      <Stage {...stageProps} />
      <LoadingIndicator visible={isGenerating} text="이미지 생성 중…" />
      <ToolsSidebar {...sidebarProps} />
      <PromptDock {...promptProps} />
      <ModelPickerModal {...modelModalProps} />
      <AspectRatioModal {...aspectModalProps} />
      <ResultPanel key={resultKey} {...resultPanelProps} />
    </div>
  );
}
