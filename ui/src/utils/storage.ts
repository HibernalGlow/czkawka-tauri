import { Theme } from '~/consts';
import type { CustomThemeConfig, RuntimeThemePayload } from '~/types';

const THEME_KEY = 'theme';
const LANG_KEY = 'language';
const THEME_NAME_KEY = 'theme-name';
const RUNTIME_THEME_KEY = 'runtime-theme';
const CUSTOM_THEMES_KEY = 'custom-themes';

export const storage = {
  getTheme(): string {
    const str = localStorage.getItem(THEME_KEY);
    if (!str || !Object.values<string>(Theme).includes(str)) {
      return Theme.System;
    }
    return str;
  },

  setTheme(theme: string) {
    localStorage.setItem(THEME_KEY, theme);
  },

  getLanguage(): string {
    return localStorage.getItem(LANG_KEY) || 'en';
  },

  setLanguage(v: string) {
    localStorage.setItem(LANG_KEY, v);
  },

  // 主题名称
  getThemeName(): string {
    return localStorage.getItem(THEME_NAME_KEY) || 'Default';
  },

  setThemeName(name: string) {
    localStorage.setItem(THEME_NAME_KEY, name);
  },

  // 运行时主题配置
  getRuntimeTheme(): RuntimeThemePayload | null {
    try {
      const stored = localStorage.getItem(RUNTIME_THEME_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as RuntimeThemePayload;
      if (!parsed || !parsed.themes || !parsed.themes.light || !parsed.themes.dark) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  setRuntimeTheme(payload: RuntimeThemePayload) {
    localStorage.setItem(RUNTIME_THEME_KEY, JSON.stringify(payload));
  },

  // 自定义主题列表
  getCustomThemes(): CustomThemeConfig[] {
    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed as CustomThemeConfig[];
    } catch {
      return [];
    }
  },

  setCustomThemes(themes: CustomThemeConfig[]) {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  },
};
