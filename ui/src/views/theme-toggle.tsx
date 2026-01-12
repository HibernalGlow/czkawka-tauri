import { useAtomValue, useSetAtom } from 'jotai';
import { Moon, Sun, TvMinimal } from 'lucide-react';
import { useEffect } from 'react';
import { themeAtom } from '~/atom/primitive';
import {
  applyMatchMediaAtom,
  initThemeAtom,
  toggleThemeAtom,
} from '~/atom/theme';
import { TooltipButton } from '~/components';
import { DARK_MODE_MEDIA, Theme } from '~/consts';
import { useT } from '~/hooks';

import { ButtonProps } from '~/components/shadcn/button';

export function ThemeToggle(props: ButtonProps) {
  const theme = useAtomValue(themeAtom);
  const initTheme = useSetAtom(initThemeAtom);
  const toggleTheme = useSetAtom(toggleThemeAtom);
  const applyMatchMedia = useSetAtom(applyMatchMediaAtom);
  const t = useT();

  useEffect(() => {
    initTheme();
    const mql = window.matchMedia(DARK_MODE_MEDIA);
    applyMatchMedia(mql.matches);
    const listener = (e: MediaQueryListEvent) => {
      applyMatchMedia(e.matches);
    };
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  return (
    <TooltipButton tooltip={t('Toggle theme')} onClick={toggleTheme} {...props}>
      {theme.display === Theme.Light && <Sun className="h-4 w-4" />}
      {theme.display === Theme.Dark && <Moon className="h-4 w-4" />}
      {theme.display === Theme.System && <TvMinimal className="h-4 w-4" />}
    </TooltipButton>
  );
}
