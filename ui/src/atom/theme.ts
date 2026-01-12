import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { atom } from 'jotai';
import { Theme } from '~/consts';
import type { CustomThemeConfig } from '~/types';
import { storage } from '~/utils/storage';
import { isSystemDark } from '~/utils/theme';
import { applyThemeColors, PRESET_THEMES } from '~/utils/themeManager';
import {
  backgroundImageAtom,
  backgroundOpacityAtom,
  customThemesAtom,
  selectedThemeAtom,
  themeAtom,
} from './primitive';

function setTheme(theme: string) {
  if (!isTauri()) {
    return;
  }
  const ww = getCurrentWebviewWindow();
  if (theme === Theme.Light || theme === Theme.Dark) {
    ww.setTheme(theme);
  } else {
    ww.setTheme(null);
  }
}

function applyTheme(theme: string) {
  let finalTheme = theme;
  if (theme === Theme.System) {
    finalTheme = isSystemDark() ? Theme.Dark : Theme.Light;
  }
  const root = window.document.documentElement;
  root.classList.remove(Theme.Light, Theme.Dark);
  root.classList.add(finalTheme);
  return finalTheme;
}

/**
 * 应用主题颜色配置
 */
function applyThemeWithColors(
  mode: string,
  themeConfig: CustomThemeConfig | null,
) {
  const finalMode = applyTheme(mode);

  if (themeConfig) {
    const isDark = finalMode === Theme.Dark;
    const colors = isDark ? themeConfig.colors.dark : themeConfig.colors.light;
    applyThemeColors(colors);

    // 保存运行时主题配置
    storage.setRuntimeTheme({
      mode: mode as 'light' | 'dark' | 'system',
      themeName: themeConfig.name,
      themes: themeConfig.colors,
    });
  }

  return finalMode;
}

/**
 * 应用背景图片和透明度到 DOM
 * 注意：实际的背景图片渲染现在由 React (app.tsx) 处理，
 * 这个函数保留用于未来可能需要的 CSS 变量设置
 */
function applyBackgroundImage(_image: string | null, _opacity: number) {
  // 背景图片现在由 React 组件直接渲染，无需设置 CSS 变量
}

export const initThemeAtom = atom(null, (_, set) => {
  const theme = storage.getTheme();
  const themeName = storage.getThemeName();
  const customThemes = storage.getCustomThemes();

  // 查找主题配置
  let themeConfig = PRESET_THEMES.find((t) => t.name === themeName) || null;
  if (!themeConfig) {
    themeConfig = customThemes.find((t) => t.name === themeName) || null;
  }
  if (!themeConfig) {
    themeConfig = PRESET_THEMES[0]; // 默认主题
  }

  const className = applyThemeWithColors(theme, themeConfig);
  set(themeAtom, { display: theme, className });
  set(selectedThemeAtom, themeConfig);
  set(customThemesAtom, customThemes);
  setTheme(theme);

  // 初始化背景图片和透明度
  const bgImage = storage.getBackgroundImage();
  const bgOpacity = storage.getBackgroundOpacity();
  set(backgroundImageAtom, bgImage);
  set(backgroundOpacityAtom, bgOpacity);
  applyBackgroundImage(bgImage, bgOpacity);
});

export const toggleThemeAtom = atom(null, (get, set) => {
  const display = get(themeAtom).display;
  const selectedTheme = get(selectedThemeAtom);
  const displayList: string[] = [Theme.Light, Theme.Dark, Theme.System];
  let idx = displayList.indexOf(display);
  if (idx < 0) {
    idx = 0;
  }
  idx += 1;
  if (idx >= displayList.length) {
    idx = 0;
  }
  const newDisplay = displayList[idx];
  const newClassName = applyThemeWithColors(newDisplay, selectedTheme);
  set(themeAtom, { display: newDisplay, className: newClassName });
  storage.setTheme(newDisplay);
  setTheme(newDisplay);
});

export const applyMatchMediaAtom = atom(null, (get, set, matches: boolean) => {
  const display = get(themeAtom).display;
  const selectedTheme = get(selectedThemeAtom);
  if (display !== Theme.System) {
    return;
  }
  const theme = matches ? Theme.Dark : Theme.Light;
  const newClassName = applyThemeWithColors(theme, selectedTheme);
  set(themeAtom, { display, className: newClassName });
  setTheme(display);
});

/**
 * 设置主题模式
 */
export const setThemeModeAtom = atom(null, (get, set, mode: string) => {
  const selectedTheme = get(selectedThemeAtom);
  const newClassName = applyThemeWithColors(mode, selectedTheme);
  set(themeAtom, { display: mode, className: newClassName });
  storage.setTheme(mode);
  setTheme(mode);
});

/**
 * 选择主题配色
 */
export const selectThemeAtom = atom(
  null,
  (get, set, themeConfig: CustomThemeConfig) => {
    const mode = get(themeAtom).display;
    const newClassName = applyThemeWithColors(mode, themeConfig);
    set(themeAtom, { display: mode, className: newClassName });
    set(selectedThemeAtom, themeConfig);
    storage.setThemeName(themeConfig.name);
  },
);

/**
 * 添加自定义主题
 */
export const addCustomThemeAtom = atom(
  null,
  (get, set, themeConfig: CustomThemeConfig) => {
    const customThemes = get(customThemesAtom);
    const index = customThemes.findIndex((t) => t.name === themeConfig.name);

    let newCustomThemes: CustomThemeConfig[];
    if (index >= 0) {
      newCustomThemes = [
        ...customThemes.slice(0, index),
        themeConfig,
        ...customThemes.slice(index + 1),
      ];
    } else {
      newCustomThemes = [...customThemes, themeConfig];
    }

    set(customThemesAtom, newCustomThemes);
    storage.setCustomThemes(newCustomThemes);
  },
);

/**
 * 批量添加自定义主题
 */
export const addCustomThemesAtom = atom(
  null,
  (get, set, themeConfigs: CustomThemeConfig[]) => {
    const customThemes = get(customThemesAtom);
    let newCustomThemes = [...customThemes];

    for (const themeConfig of themeConfigs) {
      const index = newCustomThemes.findIndex((t) => t.name === themeConfig.name);
      if (index >= 0) {
        newCustomThemes[index] = themeConfig;
      } else {
        newCustomThemes.push(themeConfig);
      }
    }

    set(customThemesAtom, newCustomThemes);
    storage.setCustomThemes(newCustomThemes);
  },
);

/**
 * 删除自定义主题
 */
export const removeCustomThemeAtom = atom(
  null,
  (get, set, themeName: string) => {
    const customThemes = get(customThemesAtom);
    const newCustomThemes = customThemes.filter((t) => t.name !== themeName);
    set(customThemesAtom, newCustomThemes);
    storage.setCustomThemes(newCustomThemes);
  },
);

/**
 * 设置背景图片
 */
export const setBackgroundImageAtom = atom(
  null,
  (get, set, image: string | null) => {
    const opacity = get(backgroundOpacityAtom);
    set(backgroundImageAtom, image);
    storage.setBackgroundImage(image);
    applyBackgroundImage(image, opacity);
  },
);

/**
 * 设置背景透明度
 */
export const setBackgroundOpacityAtom = atom(
  null,
  (get, set, opacity: number) => {
    const image = get(backgroundImageAtom);
    set(backgroundOpacityAtom, opacity);
    storage.setBackgroundOpacity(opacity);
    applyBackgroundImage(image, opacity);
  },
);
