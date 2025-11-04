import { useRef, useState } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { Toaster } from '~/components/shadcn/sonner';
import { TooltipProvider } from '~/components/shadcn/tooltip';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/shadcn/resizable';
import { AppBody } from '~/views/app-body';
import { AppHeader } from '~/views/app-header';
import { BottomBar } from '~/views/bottom-bar';
import { FloatingFilterPanel } from '~/views/floating-filter-panel';
import { SidebarImagePreview } from '~/views/sidebar-image-preview';
import { SidebarVideoPreview } from '~/views/sidebar-video-preview';
import { ToolTabs } from '~/views/tool-tabs';

export default function App() {
  const PANEL_SIZE = 35;
  const [bottomPanelMinSize, setBottomPanelMinSize] = useState(PANEL_SIZE);
  const headerRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<ImperativePanelHandle>(null);

  const handleResetPanelSize = () => {
    if (bottomPanelRef.current) {
      bottomPanelRef.current.resize(PANEL_SIZE);
    }
  };

  // 根据头部高度动态限制底部面板最小高度
  // 注意：在本项目中，我们保持无副作用 hook 简洁性，计算交由 BottomBar 的 headerRef 实时更新
  // 若后续需要更精细的最小高度，可在此处添加 ResizeObserver

  return (
    <div className="h-screen w-screen flex flex-col relative">
      <TooltipProvider delayDuration={100} skipDelayDuration={90}>
        <ResizablePanelGroup direction="vertical" autoSaveId="app-layout">
          <ResizablePanel>
            <div className="flex h-full">
              <ToolTabs />
              <div className="flex flex-col flex-1 w-px">
                <AppHeader />
                <AppBody />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle onDoubleClick={handleResetPanelSize} />
          <ResizablePanel
            ref={bottomPanelRef}
            defaultSize={PANEL_SIZE}
            minSize={bottomPanelMinSize}
            maxSize={50}
          >
            <BottomBar headerRef={headerRef} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </TooltipProvider>
      <Toaster />
      <SidebarImagePreview />
      <SidebarVideoPreview />
      <FloatingFilterPanel />
    </div>
  );
}
