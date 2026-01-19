import { ArrowDownIcon } from '@/assets/icons/common';
import { EditorLanguage, LANGUAGE_OPTIONS } from '@/constants/code-editor';
import React from 'react';
import Toggle from '@/components/common/toggle';

type CodeEditorToolbarProps = {
  isAutoCompleted: boolean;
  isPresenter: boolean;
  hasPresenter: boolean;
  onToggleAutoComplete: () => void;
  onBecomePresenter: () => void;
  onCancelPresenter: () => void;
  language: EditorLanguage;
  onLanguageChange: (lang: EditorLanguage) => void;
  isOnlyMycursor: boolean;
  onToggleOnlyMyCursor: () => void;
};

function CodeEditorToolbar({
  isAutoCompleted,
  isPresenter,
  hasPresenter,
  onToggleAutoComplete,
  onBecomePresenter,
  onCancelPresenter,
  language,
  onLanguageChange,
  isOnlyMycursor,
  onToggleOnlyMyCursor,
}: CodeEditorToolbarProps) {
  const disabledPresenter = hasPresenter && !isPresenter;

  return (
    <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-2">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white">
            자동완성
            <Toggle checked={isAutoCompleted} onChange={onToggleAutoComplete} />
          </label>

          <label className="flex items-center gap-2 text-sm text-white">
            내 커서만 보기
            <Toggle checked={isOnlyMycursor} onChange={onToggleOnlyMyCursor} />
          </label>

          {!isPresenter && (
            <button
              onClick={onBecomePresenter}
              disabled={disabledPresenter}
              className={`rounded px-3 py-1 text-sm ${disabledPresenter ? 'bg-neutral-100 text-neutral-400' : 'bg-blue-600 text-white'}`}
            >
              스포트라이트
            </button>
          )}

          {isPresenter && (
            <button
              onClick={onCancelPresenter}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white"
            >
              스포트라이트 해제
            </button>
          )}

          {hasPresenter && (
            <span className="text-sm text-neutral-400">
              {isPresenter ? '편집 가능 (발표자)' : '읽기 전용 (참가자)'}
            </span>
          )}
        </div>

        {/* 언어 설정 */}
        <div className="relative inline-block">
          <label htmlFor="lang" className="sr-only">
            Language
          </label>

          <select
            id="lang"
            value={language}
            disabled={disabledPresenter}
            onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
            className={`appearance-none rounded-md px-3 py-1 pr-9 text-sm focus:outline-none ${disabledPresenter ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-800 text-white'}`}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <ArrowDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>
    </div>
  );
}

export default React.memo(CodeEditorToolbar);
