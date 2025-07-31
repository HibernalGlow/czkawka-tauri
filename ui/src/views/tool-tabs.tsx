import { useAtom, useAtomValue } from 'jotai';
import {
  Copy,
  FileQuestion,
  FileX,
  FolderX,
  HardDrive,
  Images,
  Link,
  LoaderCircle,
  Menu,
  Music,
  Tag,
  Trash2,
  Video,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  currentToolAtom,
  progressAtom,
  toolTabsCollapsedAtom,
} from '~/atom/primitive';
import { Button, ScrollArea, TooltipButton } from '~/components';
import { Tools } from '~/consts';
import type { ToolsValues } from '~/types';
import { cn } from '~/utils/cn';

const toolSet = new Set<string>(Object.values(Tools));

function isValidTool(s: string): s is ToolsValues {
  return toolSet.has(s);
}

// 工具图标映射
const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  [Tools.DuplicateFiles]: Copy,
  [Tools.EmptyFolders]: FolderX,
  [Tools.BigFiles]: HardDrive,
  [Tools.EmptyFiles]: FileX,
  [Tools.TemporaryFiles]: Trash2,
  [Tools.SimilarImages]: Images,
  [Tools.SimilarVideos]: Video,
  [Tools.MusicDuplicates]: Music,
  [Tools.InvalidSymlinks]: Link,
  [Tools.BrokenFiles]: FileQuestion,
  [Tools.BadExtensions]: Tag,
};

export function ToolTabs() {
  const [currentTool, setCurrentTool] = useAtom(currentToolAtom);
  const [collapsed, setCollapsed] = useAtom(toolTabsCollapsedAtom);
  const progress = useAtomValue(progressAtom);
  const { t } = useTranslation();

  const handleClick = (name: string) => {
    if (!isValidTool(name)) {
      return;
    }
    setCurrentTool(name);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={cn(
        'h-full border-r flex flex-col transition-all duration-300',
        collapsed ? 'w-[60px]' : 'w-[200px]',
        PLATFORM === 'darwin' && 'pt-5',
      )}
    >
      {/* 汉堡按钮 */}
      <div
        className={cn(
          'flex items-center p-3',
          collapsed ? 'justify-center' : 'justify-start',
        )}
      >
        <TooltipButton
          tooltip={collapsed ? '展开工具栏' : '折叠工具栏'}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={toggleCollapse}
        >
          <Menu className="h-4 w-4" />
        </TooltipButton>
      </div>

      <ScrollArea className={cn('px-3 pb-1 flex-1', collapsed && 'px-2')}>
        {Object.values(Tools).map((name) => {
          const IconComponent = toolIcons[name] || FileQuestion;
          const isActive = currentTool === name;
          const isLoading = progress.tool === name;

          if (collapsed) {
            return (
              <TooltipButton
                key={name}
                tooltip={t(name)}
                className={cn('w-full h-10 justify-center mt-1 cursor-pointer')}
                tabIndex={-1}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => handleClick(name)}
              >
                <div className="relative">
                  <IconComponent className="h-5 w-5" />
                  {isLoading && (
                    <LoaderCircle className="absolute inset-0 h-5 w-5 animate-spin" />
                  )}
                </div>
              </TooltipButton>
            );
          }

          return (
            <Button
              key={name}
              className="w-full h-10 justify-between mt-1 cursor-pointer"
              tabIndex={-1}
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => handleClick(name)}
            >
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{t(name)}</span>
              </div>
              {isLoading && (
                <LoaderCircle className="h-4 w-4 animate-spin flex-shrink-0" />
              )}
            </Button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
