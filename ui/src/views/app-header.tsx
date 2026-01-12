import { openUrl } from '@tauri-apps/plugin-opener';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ImageIcon, Languages, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';
import { backgroundBlurAtom, backgroundImageAtom, backgroundOpacityAtom, maskOpacityAtom, searchInputValueAtom } from '~/atom/primitive';
import { setBackgroundBlurAtom, setBackgroundImageAtom, setBackgroundOpacityAtom, setMaskOpacityAtom } from '~/atom/theme';
import { currentToolFilterAtom } from '~/atom/tools';
import { SearchInput, Select, Slider, TooltipButton, toastError } from '~/components';
import { GitHub } from '~/components/icons'
import { SelectIconTrigger } from '~/components/one-select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/components/shadcn/dropdown-menu';
import { Button } from '~/components/shadcn/button';
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
          <BackgroundButton />
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

function BackgroundButton() {
  const t = useT();
  const backgroundImage = useAtomValue(backgroundImageAtom);
  const backgroundOpacity = useAtomValue(backgroundOpacityAtom);
  const backgroundBlur = useAtomValue(backgroundBlurAtom);
  const maskOpacity = useAtomValue(maskOpacityAtom);
  const setBackgroundImage = useSetAtom(setBackgroundImageAtom);
  const setBackgroundOpacity = useSetAtom(setBackgroundOpacityAtom);
  const setBackgroundBlur = useSetAtom(setBackgroundBlurAtom);
  const setMaskOpacity = useSetAtom(setMaskOpacityAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError(t('File too large'), t('Maximum file size is 5MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBackgroundImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
            backgroundImage ? 'text-primary' : 'text-muted-foreground'
          }`}
          title={t('Custom background')}
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-3" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuLabel className="px-0 py-0 mb-2">{t('Custom background')}</DropdownMenuLabel>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="flex gap-2 mb-3" onPointerDown={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('Upload image')}
          </Button>
          {backgroundImage && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {backgroundImage && (
          <div className="h-16 w-full overflow-hidden rounded border mb-3">
            <img
              src={backgroundImage}
              alt="Background"
              className="h-full w-full object-cover"
              style={{ 
                opacity: backgroundOpacity / 100,
                filter: backgroundBlur > 0 ? `blur(${backgroundBlur / 4}px)` : 'none'
              }}
            />
          </div>
        )}

        <DropdownMenuSeparator />

        <div className="space-y-2 pt-2" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between text-xs">
            <span>{t('Background opacity')}</span>
            <span className="text-muted-foreground">{backgroundOpacity}%</span>
          </div>
          <Slider
            value={[backgroundOpacity]}
            onValueChange={(values) => setBackgroundOpacity(values[0])}
            min={0}
            max={100}
            step={5}
          />
        </div>

        <div className="space-y-2 pt-4" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between text-xs">
            <span>{t('Background blur')}</span>
            <span className="text-muted-foreground">{backgroundBlur}px</span>
          </div>
          <Slider
            value={[backgroundBlur]}
            onValueChange={(values) => setBackgroundBlur(values[0])}
            min={0}
            max={20}
            step={1}
          />
        </div>

        <div className="space-y-2 pt-4" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between text-xs">
            <span>{t('Mask opacity')}</span>
            <span className="text-muted-foreground">{maskOpacity}%</span>
          </div>
          <Slider
            value={[maskOpacity]}
            onValueChange={(values) => setMaskOpacity(values[0])}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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


