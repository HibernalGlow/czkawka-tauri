import { useAtom, useSetAtom } from 'jotai';
import { Languages } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';
import { searchInputValueAtom } from '~/atom/primitive';
import { currentToolFilterAtom } from '~/atom/tools';
import { SearchInput, Select, TooltipButton } from '~/components';
import { GitHub } from '~/components/icons';
import { SelectIconTrigger } from '~/components/one-select';
import { useT, useTableSelectionStats } from '~/hooks';
import { storage } from '~/utils/storage';

import { SettingsButton } from './settings';
import { ThemeToggle } from './theme-toggle';

// 新增 selectionStats props，便于顶栏显示统计信息
export function AppHeader() {
  const selectionStats = useTableSelectionStats();
  const setFilter = useSetAtom(currentToolFilterAtom);
  const [inputValue, setInputValue] = useAtom(searchInputValueAtom);
  const debouncedSetFilter = useDebouncedCallback(setFilter, 300);
  const t = useT();

  const handleInputChange = (v: string) => {
    setInputValue(v);
    debouncedSetFilter(v.trim());
  };

  return (
    <div
      className="w-full h-11 flex justify-between items-center px-4 py-1 border-b border-border/50 dark:border-border"
      data-tauri-drag-region={PLATFORM === 'darwin' ? true : undefined}
    >
      {/* 左侧应用图标和版本号 */}
      <div className="flex items-center gap-2">
        <img
          className="size-8 flex-shrink-0"
          src="/icon.ico"
          alt="czkawka icon"
        />
        <div className="flex items-center gap-1">
          <span className="font-serif">{PKG_NAME}</span>
          <span className="font-extralight text-[10px] pb-[1px] opacity-60">
            v{PKG_VERSION}
          </span>
        </div>
      </div>

      {/* 中间搜索框 */}
      <div className="flex-1 max-w-sm px-4">
        <SearchInput
          placeholder={`${t('search')}...`}
          value={inputValue}
          onChange={handleInputChange}
          className="h-8"
        />
      </div>
      {/* 右侧统计信息和操作按钮 */}
      <div className="flex items-center gap-4">
        {selectionStats && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded px-2 py-0.5">
            <span>已选 {selectionStats.count} 项</span>
            <span>|</span>
            <span>总大小 {formatSize(selectionStats.totalSize)}</span>
            <span>|</span>
            <span>格式 {selectionStats.formats.join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <ChangeLanguageButton />
          <SettingsButton />
          <ThemeToggle />
          <ViewGitHubButton />
        </div>
      </div>
    </div>
  );
}

// 文件大小格式化
function formatSize(size: number): string {
  if (size >= 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${size} B`;
}

function ViewGitHubButton() {
  const t = useT();

  return (
    <TooltipButton
      tooltip={t('View source code')}
      onClick={() => openUrl(REPOSITORY_URL)}
    >
      <GitHub />
    </TooltipButton>
  );
}

function ChangeLanguageButton() {
  const { i18n } = useTranslation();
  const [value, setValue] = useState(i18n.language);

  const handleLanguageChange = (v: string) => {
    setValue(v);
    i18n.changeLanguage(v);
    storage.setLanguage(v);
    document.documentElement.lang = v;
  };

  return (
    <Select
      trigger={
        <SelectIconTrigger>
          <Languages />
        </SelectIconTrigger>
      }
      value={value}
      onChange={handleLanguageChange}
      options={[
        { label: 'English', value: 'en' },
        { label: '简体中文', value: 'zh' },
      ]}
    />
  );
}
