import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  getDefaultPlatformSettings,
  getDefaultPreset,
  getDefaultProgress,
  Tools,
} from '~/consts';
import type {
  BaseEntry,
  CustomThemeConfig,
  PlatformSettings,
  Preset,
  Progress,
  ThemeCfg,
  ToolsValues,
} from '~/types';

export const themeAtom = atom<ThemeCfg>({
  display: '',
  className: '',
});

// 选中的主题配置
export const selectedThemeAtom = atom<CustomThemeConfig | null>(null);

// 自定义主题列表
export const customThemesAtom = atom<CustomThemeConfig[]>([]);

// 自定义背景图片 (base64 or null)
export const backgroundImageAtom = atom<string | null>(null);

// 背景透明度 (0-100, 100 = 完全不透明)
export const backgroundOpacityAtom = atom<number>(100);

// 背景模糊度 (0-20px)
export const backgroundBlurAtom = atom<number>(8);

export const presetsAtom = atomWithStorage<Preset[]>(
  'setting-presets',
  [getDefaultPreset()],
  undefined,
  { getOnInit: true },
);

export const platformSettingsAtom = atom<PlatformSettings>(
  getDefaultPlatformSettings(),
);

export const currentToolAtom = atomWithStorage<ToolsValues>(
  'currentTool',
  Tools.DuplicateFiles,
  undefined,
  { getOnInit: true },
);

export const includedDirsRowSelectionAtom = atom<RowSelectionState>({});
export const excludedDirsRowSelectionAtom = atom<RowSelectionState>({});

export const logsAtom = atom<string>('');

export const progressAtom = atom<Progress>(getDefaultProgress());

// ====== Unified State (Upstream-aligned) ======

export const toolDataAtom = atom<
  Record<ToolsValues, BaseEntry[] | BaseEntry[][]>
>({
  [Tools.DuplicateFiles]: [],
  [Tools.EmptyFolders]: [],
  [Tools.BigFiles]: [],
  [Tools.EmptyFiles]: [],
  [Tools.TemporaryFiles]: [],
  [Tools.SimilarImages]: [],
  [Tools.SimilarVideos]: [],
  [Tools.MusicDuplicates]: [],
  [Tools.InvalidSymlinks]: [],
  [Tools.BrokenFiles]: [],
  [Tools.BadExtensions]: [],
});

export const rowSelectionAtom = atom<Record<ToolsValues, RowSelectionState>>({
  [Tools.DuplicateFiles]: {},
  [Tools.EmptyFolders]: {},
  [Tools.BigFiles]: {},
  [Tools.EmptyFiles]: {},
  [Tools.TemporaryFiles]: {},
  [Tools.SimilarImages]: {},
  [Tools.SimilarVideos]: {},
  [Tools.MusicDuplicates]: {},
  [Tools.InvalidSymlinks]: {},
  [Tools.BrokenFiles]: {},
  [Tools.BadExtensions]: {},
});

export const sortingAtom = atom<Record<ToolsValues, SortingState>>({
  [Tools.DuplicateFiles]: [],
  [Tools.EmptyFolders]: [],
  [Tools.BigFiles]: [],
  [Tools.EmptyFiles]: [],
  [Tools.TemporaryFiles]: [],
  [Tools.SimilarImages]: [],
  [Tools.SimilarVideos]: [],
  [Tools.MusicDuplicates]: [],
  [Tools.InvalidSymlinks]: [],
  [Tools.BrokenFiles]: [],
  [Tools.BadExtensions]: [],
});

export const filterAtom = atom<Record<ToolsValues, string>>({
  [Tools.DuplicateFiles]: '',
  [Tools.EmptyFolders]: '',
  [Tools.BigFiles]: '',
  [Tools.EmptyFiles]: '',
  [Tools.TemporaryFiles]: '',
  [Tools.SimilarImages]: '',
  [Tools.SimilarVideos]: '',
  [Tools.MusicDuplicates]: '',
  [Tools.InvalidSymlinks]: '',
  [Tools.BrokenFiles]: '',
  [Tools.BadExtensions]: '',
});

export const searchInputValueAtom = atom('');

export const scanResultAtom = atom<any>(null);

// 工具栏宽度
export const sidebarWidthAtom = atomWithStorage('sidebar-width', 260);

// Re-export local feature atoms for backward compatibility
export {
  filterPanelAtom,
  sidebarImagePreviewAtom,
  sidebarVideoPreviewAtom,
} from './local-features';
