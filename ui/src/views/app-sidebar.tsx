import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  Copy,
  FileQuestion,
  FileX,
  FolderX,
  HardDrive,
  Images,
  Link,
  LoaderCircle,
  Music,
  Tag,
  Trash2,
  Video,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { currentToolAtom, progressAtom } from '~/atom/primitive';
import { restoreFilterAtom } from '~/atom/tools';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from '~/components/shadcn/sidebar';
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

export function AppSidebar() {
  const [currentTool, setCurrentTool] = useAtom(currentToolAtom);
  const progress = useAtomValue(progressAtom);
  const { t } = useTranslation();
  const restoreFilter = useSetAtom(restoreFilterAtom);
  const { state } = useSidebar();

  const handleClick = (name: string) => {
    if (!isValidTool(name)) {
      return;
    }
    setCurrentTool(name);
    restoreFilter();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={cn(PLATFORM === 'darwin' && 'pt-5')}>
        <SidebarTrigger className="h-8 w-8" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.values(Tools).map((name) => {
                const IconComponent = toolIcons[name] || FileQuestion;
                const isActive = currentTool === name;
                const isLoading = progress.tool === name;

                return (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton
                      onClick={() => handleClick(name)}
                      isActive={isActive}
                      tooltip={t(name)}
                    >
                      <div className="relative">
                        <IconComponent className="h-4 w-4" />
                        {isLoading && (
                          <LoaderCircle className="absolute inset-0 h-4 w-4 animate-spin" />
                        )}
                      </div>
                      <span className="truncate">{t(name)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
