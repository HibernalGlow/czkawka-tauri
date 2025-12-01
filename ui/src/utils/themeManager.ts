/**
 * 主题管理工具
 * 用于从 tweakcn.com 导入和应用主题
 */

export interface TweakcnTheme {
  name: string;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
    theme?: Record<string, string>;
  };
}

export interface ThemeColors {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface CustomThemeConfig {
  name: string;
  description: string;
  colors: ThemeColors;
}

/**
 * 从 tweakcn JSON 解析主题配置
 */
export function parseTweakcnTheme(json: string): CustomThemeConfig | null {
  try {
    const parsed = JSON.parse(json) as TweakcnTheme;
    if (!parsed || !parsed.cssVars || !parsed.cssVars.light || !parsed.cssVars.dark) {
      console.error('JSON 格式不正确，缺少 cssVars.light / cssVars.dark');
      return null;
    }

    const base = parsed.cssVars.theme ?? {};
    const light = { ...base, ...parsed.cssVars.light };
    const dark = { ...base, ...parsed.cssVars.dark };

    return {
      name: parsed.name || 'Custom Theme',
      description: '来自 JSON 的主题',
      colors: { light, dark },
    };
  } catch (error) {
    console.error('从 JSON 导入主题失败', error);
    return null;
  }
}

/**
 * 从 URL 获取主题
 */
export async function fetchThemeFromURL(url: string): Promise<CustomThemeConfig | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const theme = (await response.json()) as TweakcnTheme;

    const base = theme.cssVars.theme ?? {};
    const light = { ...base, ...theme.cssVars.light };
    const dark = { ...base, ...theme.cssVars.dark };

    return {
      name: theme.name || 'Custom Theme',
      description: '来自 tweakcn 的主题',
      colors: { light, dark },
    };
  } catch (error) {
    console.error('获取主题失败:', error);
    return null;
  }
}

/**
 * 应用主题颜色到 document.documentElement
 */
export function applyThemeColors(colors: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string') {
      root.style.setProperty(`--${key}`, value);
    }
  }
}

/**
 * 清除自定义主题颜色
 */
export function clearThemeColors(keys: string[]) {
  const root = document.documentElement;
  for (const key of keys) {
    root.style.removeProperty(`--${key}`);
  }
}

/**
 * 预设主题列表
 */
export const PRESET_THEMES: CustomThemeConfig[] = [
  {
    name: 'Default',
    description: '默认主题',
    colors: {
      light: {
        background: '0 0% 100%',
        foreground: '222.2 84% 4.9%',
        card: '0 0% 100%',
        'card-foreground': '222.2 84% 4.9%',
        popover: '0 0% 100%',
        'popover-foreground': '222.2 84% 4.9%',
        primary: '221.2 83.2% 53.3%',
        'primary-foreground': '210 40% 98%',
        secondary: '210 40% 96.1%',
        'secondary-foreground': '222.2 47.4% 11.2%',
        muted: '210 40% 96.1%',
        'muted-foreground': '215.4 16.3% 46.9%',
        accent: '210 40% 96.1%',
        'accent-foreground': '222.2 47.4% 11.2%',
        destructive: '0 84.2% 60.2%',
        'destructive-foreground': '210 40% 98%',
        border: '214.3 31.8% 91.4%',
        input: '214.3 31.8% 91.4%',
        ring: '221.2 83.2% 53.3%',
      },
      dark: {
        background: '210 34.38% 12.55%',
        foreground: '210 40% 98%',
        card: '222.2 84% 4.9%',
        'card-foreground': '210 40% 98%',
        popover: '222.2 84% 4.9%',
        'popover-foreground': '210 40% 98%',
        primary: '217.2 91.2% 59.8%',
        'primary-foreground': '222.2 47.4% 11.2%',
        secondary: '217.2 32.6% 17.5%',
        'secondary-foreground': '210 40% 98%',
        muted: '217.2 32.6% 17.5%',
        'muted-foreground': '215 20.2% 65.1%',
        accent: '217.2 32.6% 17.5%',
        'accent-foreground': '210 40% 98%',
        destructive: '0 62.8% 30.6%',
        'destructive-foreground': '210 40% 98%',
        border: '217.2 32.6% 17.5%',
        input: '217.2 32.6% 17.5%',
        ring: '224.3 76.3% 48%',
      },
    },
  },
  {
    name: 'Amethyst Haze',
    description: '优雅的紫色调主题',
    colors: {
      light: {
        background: '300 30% 98%',
        foreground: '287 30% 20%',
        card: '300 25% 97%',
        'card-foreground': '287 30% 20%',
        popover: '300 25% 97%',
        'popover-foreground': '287 30% 20%',
        primary: '293 60% 45%',
        'primary-foreground': '0 0% 100%',
        secondary: '300 20% 92%',
        'secondary-foreground': '287 30% 20%',
        muted: '300 20% 92%',
        'muted-foreground': '287 15% 45%',
        accent: '300 20% 92%',
        'accent-foreground': '287 30% 20%',
        destructive: '0 84% 60%',
        'destructive-foreground': '0 0% 100%',
        border: '300 20% 88%',
        input: '300 20% 88%',
        ring: '293 60% 45%',
      },
      dark: {
        background: '293 25% 14%',
        foreground: '293 15% 90%',
        card: '293 25% 12%',
        'card-foreground': '293 15% 90%',
        popover: '293 25% 12%',
        'popover-foreground': '293 15% 90%',
        primary: '293 55% 60%',
        'primary-foreground': '293 25% 14%',
        secondary: '293 20% 22%',
        'secondary-foreground': '293 15% 90%',
        muted: '293 20% 22%',
        'muted-foreground': '293 15% 65%',
        accent: '293 20% 22%',
        'accent-foreground': '293 15% 90%',
        destructive: '0 63% 31%',
        'destructive-foreground': '0 0% 100%',
        border: '293 20% 22%',
        input: '293 20% 22%',
        ring: '293 55% 60%',
      },
    },
  },
  {
    name: 'Ocean Breeze',
    description: '清新的海洋蓝主题',
    colors: {
      light: {
        background: '200 30% 98%',
        foreground: '200 30% 15%',
        card: '200 25% 97%',
        'card-foreground': '200 30% 15%',
        popover: '200 25% 97%',
        'popover-foreground': '200 30% 15%',
        primary: '200 80% 45%',
        'primary-foreground': '0 0% 100%',
        secondary: '200 20% 92%',
        'secondary-foreground': '200 30% 15%',
        muted: '200 20% 92%',
        'muted-foreground': '200 15% 45%',
        accent: '200 20% 92%',
        'accent-foreground': '200 30% 15%',
        destructive: '0 84% 60%',
        'destructive-foreground': '0 0% 100%',
        border: '200 20% 88%',
        input: '200 20% 88%',
        ring: '200 80% 45%',
      },
      dark: {
        background: '200 25% 12%',
        foreground: '200 15% 92%',
        card: '200 25% 10%',
        'card-foreground': '200 15% 92%',
        popover: '200 25% 10%',
        'popover-foreground': '200 15% 92%',
        primary: '200 70% 55%',
        'primary-foreground': '200 25% 12%',
        secondary: '200 20% 20%',
        'secondary-foreground': '200 15% 92%',
        muted: '200 20% 20%',
        'muted-foreground': '200 15% 65%',
        accent: '200 20% 20%',
        'accent-foreground': '200 15% 92%',
        destructive: '0 63% 31%',
        'destructive-foreground': '0 0% 100%',
        border: '200 20% 20%',
        input: '200 20% 20%',
        ring: '200 70% 55%',
      },
    },
  },
  {
    name: 'Forest Mist',
    description: '自然的森林绿主题',
    colors: {
      light: {
        background: '140 25% 98%',
        foreground: '140 30% 15%',
        card: '140 20% 97%',
        'card-foreground': '140 30% 15%',
        popover: '140 20% 97%',
        'popover-foreground': '140 30% 15%',
        primary: '140 60% 40%',
        'primary-foreground': '0 0% 100%',
        secondary: '140 15% 92%',
        'secondary-foreground': '140 30% 15%',
        muted: '140 15% 92%',
        'muted-foreground': '140 15% 45%',
        accent: '140 15% 92%',
        'accent-foreground': '140 30% 15%',
        destructive: '0 84% 60%',
        'destructive-foreground': '0 0% 100%',
        border: '140 15% 88%',
        input: '140 15% 88%',
        ring: '140 60% 40%',
      },
      dark: {
        background: '140 25% 10%',
        foreground: '140 15% 92%',
        card: '140 25% 8%',
        'card-foreground': '140 15% 92%',
        popover: '140 25% 8%',
        'popover-foreground': '140 15% 92%',
        primary: '140 50% 50%',
        'primary-foreground': '140 25% 10%',
        secondary: '140 20% 18%',
        'secondary-foreground': '140 15% 92%',
        muted: '140 20% 18%',
        'muted-foreground': '140 15% 65%',
        accent: '140 20% 18%',
        'accent-foreground': '140 15% 92%',
        destructive: '0 63% 31%',
        'destructive-foreground': '0 0% 100%',
        border: '140 20% 18%',
        input: '140 20% 18%',
        ring: '140 50% 50%',
      },
    },
  },
  {
    name: 'Sunset Glow',
    description: '温暖的日落橙主题',
    colors: {
      light: {
        background: '30 30% 98%',
        foreground: '30 30% 15%',
        card: '30 25% 97%',
        'card-foreground': '30 30% 15%',
        popover: '30 25% 97%',
        'popover-foreground': '30 30% 15%',
        primary: '25 90% 55%',
        'primary-foreground': '0 0% 100%',
        secondary: '30 20% 92%',
        'secondary-foreground': '30 30% 15%',
        muted: '30 20% 92%',
        'muted-foreground': '30 15% 45%',
        accent: '30 20% 92%',
        'accent-foreground': '30 30% 15%',
        destructive: '0 84% 60%',
        'destructive-foreground': '0 0% 100%',
        border: '30 20% 88%',
        input: '30 20% 88%',
        ring: '25 90% 55%',
      },
      dark: {
        background: '25 25% 10%',
        foreground: '30 15% 92%',
        card: '25 25% 8%',
        'card-foreground': '30 15% 92%',
        popover: '25 25% 8%',
        'popover-foreground': '30 15% 92%',
        primary: '25 80% 55%',
        'primary-foreground': '25 25% 10%',
        secondary: '25 20% 18%',
        'secondary-foreground': '30 15% 92%',
        muted: '25 20% 18%',
        'muted-foreground': '30 15% 65%',
        accent: '25 20% 18%',
        'accent-foreground': '30 15% 92%',
        destructive: '0 63% 31%',
        'destructive-foreground': '0 0% 100%',
        border: '25 20% 18%',
        input: '25 20% 18%',
        ring: '25 80% 55%',
      },
    },
  },
];
