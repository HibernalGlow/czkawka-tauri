import { openUrl } from '@tauri-apps/plugin-opener';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  Check,
  ChevronDown,
  Copy,
  Github,
  Moon,
  Palette,
  Sun,
  Trash2,
  TvMinimal,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  customThemesAtom,
  selectedThemeAtom,
  themeAtom,
} from '~/atom/primitive';
import {
  addCustomThemeAtom,
  addCustomThemesAtom,
  removeCustomThemeAtom,
  selectThemeAtom,
  setThemeModeAtom,
} from '~/atom/theme';
import {
  Button,
  Input,
  Label,
  ScrollArea,
  Slider,
  Textarea,
  toastError,
} from '~/components';
import { BoxReveal } from '~/components/box-reveal';
import { Theme } from '~/consts';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '~/components/shadcn/tabs';
import { useT } from '~/hooks';
import type { CustomThemeConfig } from '~/types';
import {
  fetchThemeFromURL,
  PRESET_THEMES,
  parseTweakcnTheme,
  parseTweakcnThemes,
} from '~/utils/themeManager';

export function ThemePanel() {
  const t = useT();
  const theme = useAtomValue(themeAtom);
  const selectedTheme = useAtomValue(selectedThemeAtom);
  const customThemes = useAtomValue(customThemesAtom);
  const setThemeMode = useSetAtom(setThemeModeAtom);
  const selectTheme = useSetAtom(selectThemeAtom);
  const addCustomTheme = useSetAtom(addCustomThemeAtom);
  const addCustomThemes = useSetAtom(addCustomThemesAtom);
  const removeCustomTheme = useSetAtom(removeCustomThemeAtom);

  const [themeUrl, setThemeUrl] = useState('');
  const [themeJson, setThemeJson] = useState('');
  const [customThemeName, setCustomThemeName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isCustomThemesExpanded, setIsCustomThemesExpanded] = useState(false);

  const placeholderText =
    'JSON Format (Single or Array):\n[{"name":"My Theme","cssVars":{...}}, ...]';

  const handleImportFromUrl = async () => {
    if (!themeUrl.trim()) return;
    setIsImporting(true);
    try {
      const themeConfig = await fetchThemeFromURL(themeUrl.trim());
      if (themeConfig) {
        addCustomTheme(themeConfig);
        selectTheme(themeConfig);
        setThemeUrl('');
      } else {
        toastError(t('Import theme failed'), 'Invalid theme URL');
      }
    } catch (error) {
      toastError(t('Import theme failed'), error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromJson = () => {
    const raw = themeJson.trim();
    if (!raw) return;
    try {
      const themeConfigs = parseTweakcnThemes(raw);
      if (themeConfigs.length > 0) {
        addCustomThemes(themeConfigs);
        if (themeConfigs.length === 1) {
          selectTheme(themeConfigs[0]);
        }
        setThemeJson('');
      } else {
        toastError(t('Import theme failed'), 'Invalid JSON format');
      }
    } catch (error) {
      toastError(t('Import theme failed'), error);
    }
  };

  const handleSaveCustomTheme = () => {
    if (!selectedTheme) return;
    const name = (
      customThemeName ||
      selectedTheme.name ||
      'Custom Theme'
    ).trim();
    const themeConfig: CustomThemeConfig = {
      name,
      description: 'Custom theme',
      colors: {
        light: { ...selectedTheme.colors.light },
        dark: { ...selectedTheme.colors.dark },
      },
    };
    addCustomTheme(themeConfig);
    selectTheme(themeConfig);
    setCustomThemeName('');
  };

  const handleDeleteCustomTheme = (themeName: string) => {
    removeCustomTheme(themeName);
    // 如果删除的是当前选中的主题，切换到默认主题
    if (selectedTheme?.name === themeName) {
      selectTheme(PRESET_THEMES[0]);
    }
  };

  const exportTheme = (theme: CustomThemeConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    const exportData = {
      name: theme.name,
      description: theme.description,
      cssVars: { light: theme.colors.light, dark: theme.colors.dark },
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
  };

  const exportAllThemes = () => {
    const exportData = customThemes.map((theme) => ({
      name: theme.name,
      description: theme.description,
      cssVars: { light: theme.colors.light, dark: theme.colors.dark },
    }));
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
  };

  const importAllThemes = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const themeConfigs = parseTweakcnThemes(text);
      if (themeConfigs.length > 0) {
        addCustomThemes(themeConfigs);
      }
    } catch (e) {
      toastError(t('Import theme failed'), e);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4 pt-2 pb-4">
        {/* 主题模式选择 */}
        <div className="flex items-center justify-between gap-4 px-3 py-3 border-b hover:bg-muted/20 transition-colors group">
          <div className="flex flex-col gap-1 flex-1">
            <Label className="text-sm font-semibold">{t('Theme mode')}</Label>
          </div>
          <Tabs
            value={theme.display}
            onValueChange={(v: string) => setThemeMode(v as any)}
          >
            <TabsList className="h-9 p-1 bg-muted/50 border">
              <TabsTrigger value={Theme.Light} className="h-7 px-3 gap-2 text-xs">
                <Sun className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('Light')}</span>
              </TabsTrigger>
              <TabsTrigger value={Theme.Dark} className="h-7 px-3 gap-2 text-xs">
                <Moon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('Dark')}</span>
              </TabsTrigger>
              <TabsTrigger value={Theme.System} className="h-7 px-3 gap-2 text-xs">
                <TvMinimal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('System')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 预设主题 */}
        <div className="space-y-0 border rounded-lg overflow-hidden divide-y bg-muted/5">
          <div className="bg-muted/30 px-3 py-1.5 border-b border-border/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              {t('Color scheme')}
            </h3>
          </div>
          {PRESET_THEMES.map((presetTheme) => (
            <div
              key={presetTheme.name}
              className={`flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/30 cursor-pointer group ${
                selectedTheme?.name === presetTheme.name ? 'bg-primary/5' : ''
              }`}
              onClick={() => selectTheme(presetTheme)}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border overflow-hidden relative">
                <div
                  className="absolute bottom-0 left-0 right-1/2 top-0"
                  style={{ background: presetTheme.colors.light.primary }}
                />
                <div
                  className="absolute bottom-0 left-1/2 right-0 top-0"
                  style={{ background: presetTheme.colors.dark.primary }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">
                    {presetTheme.name}
                  </span>
                  {selectedTheme?.name === presetTheme.name && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {presetTheme.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {customThemes.length > 0 && (
          <div className="space-y-0 border rounded-lg overflow-hidden divide-y bg-muted/5">
            <div
              className="flex w-full items-center justify-between cursor-pointer hover:bg-muted/30 px-3 py-1.5 border-b border-border/50 transition-colors"
              onClick={() => setIsCustomThemesExpanded(!isCustomThemesExpanded)}
            >
              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground/70 ${isCustomThemesExpanded ? '' : '-rotate-90'}`}
                />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {t('Custom themes')} ({customThemes.length})
                </h3>
              </div>
              {isCustomThemesExpanded && (
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[9px] uppercase tracking-tighter"
                    onClick={importAllThemes}
                  >
                    {t('Import all')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[9px] uppercase tracking-tighter"
                    onClick={exportAllThemes}
                  >
                    {t('Export all')}
                  </Button>
                </div>
              )}
            </div>
 
            {isCustomThemesExpanded && (
              <div className="divide-y animate-in fade-in slide-in-from-top-1 duration-200">
                {customThemes.map((customTheme) => (
                  <div
                    key={customTheme.name}
                    className={`flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/30 cursor-pointer group relative ${
                      selectedTheme?.name === customTheme.name ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => selectTheme(customTheme)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border overflow-hidden relative">
                       <div
                        className="absolute bottom-0 left-0 right-1/2 top-0"
                        style={{ background: customTheme.colors.light.primary || 'hsl(0 0% 50%)' }}
                      />
                      <div
                        className="absolute bottom-0 left-1/2 right-0 top-0"
                        style={{ background: customTheme.colors.dark.primary || 'hsl(0 0% 50%)' }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {customTheme.name}
                        </span>
                        {selectedTheme?.name === customTheme.name && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate pr-16">
                        {customTheme.description}
                      </div>
                    </div>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => exportTheme(customTheme, e)}
                        title={t('Export theme')}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomTheme(customTheme.name);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 保存/导入设置 */}
        <div className="space-y-0 border rounded-lg overflow-hidden divide-y bg-muted/5">
          <div className="bg-muted/30 px-3 py-1.5 border-b border-border/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              {t('Theme settings')}
            </h3>
          </div>
          
          <div className="flex items-center justify-between gap-4 px-3 py-3 hover:bg-muted/20 transition-colors group">
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-sm font-semibold">{t('Save current theme')}</Label>
              <div className="text-[11px] text-muted-foreground">
                {t('Export or save local copy')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('Custom theme name')}
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                className="w-40 h-8 text-xs font-mono"
              />
              <Button size="sm" onClick={handleSaveCustomTheme} className="h-8">
                {t('Save')}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 px-3 py-3 hover:bg-muted/20 transition-colors group">
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-sm font-semibold">{t('Import from URL')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="https://tweakcn.com/..."
                value={themeUrl}
                onChange={(e) => setThemeUrl(e.target.value)}
                className="w-40 h-8 text-xs font-mono"
              />
              <Button
                size="sm"
                onClick={handleImportFromUrl}
                disabled={isImporting}
                className="h-8"
              >
                {isImporting ? '...' : t('Import')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 px-3 py-3 hover:bg-muted/20 transition-colors group">
            <Label className="text-sm font-semibold">{t('Import from JSON')}</Label>
            <Textarea
              className="min-h-[80px] resize-y font-mono text-[10px] bg-muted/20"
              value={themeJson}
              onChange={(e) => setThemeJson(e.target.value)}
              placeholder={placeholderText}
              rows={3}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleImportFromJson} className="h-8">
                {t('Import JSON')}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-0 border rounded-lg overflow-hidden divide-y bg-muted/5">
          <div className="bg-muted/30 px-3 py-1.5 border-b border-border/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              {t('Color preview')}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-primary text-primary-foreground p-3 flex items-center justify-center">
              <p className="text-[10px] font-bold uppercase">Primary</p>
            </div>
            <div className="bg-secondary text-secondary-foreground p-3 flex items-center justify-center">
              <p className="text-[10px] font-bold uppercase">Secondary</p>
            </div>
            <div className="bg-accent text-accent-foreground p-3 flex items-center justify-center">
              <p className="text-[10px] font-bold uppercase">Accent</p>
            </div>
            <div className="bg-muted text-muted-foreground p-3 flex items-center justify-center">
              <p className="text-[10px] font-bold uppercase">Muted</p>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
          <p className="text-sm">
            <strong>💡 {t('Tip')}:</strong> {t('Theme settings are auto-saved')}
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
