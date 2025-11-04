import { useEffect, useRef, useState } from 'react';
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
  const PANEL_SIZE = 30;
  const [bottomPanelMinSize, setBottomPanelMinSize] = useState(8);
  const headerRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<ImperativePanelHandle>(null);

  const handleResetPanelSize = () => {
    if (bottomPanelRef.current) {
      bottomPanelRef.current.resize(PANEL_SIZE);
    }
  };

  // 根据底栏头部高度动态限制底部面板最小高度，确保始终可容纳工具条
  useEffect(() => {
    const calc = () => {
      if (!headerRef.current) return;
      const headerHeight = headerRef.current.offsetHeight;
      const paddingY = 0.25 * 16 * 2; // py-1 上下各 0.25rem
      const total = headerHeight + paddingY;
      const screen = window.innerHeight || document.documentElement.clientHeight;
      const pct = Math.min(20, Math.max(6, (total / screen) * 100));
      setBottomPanelMinSize(pct);
    };

    const ro = new ResizeObserver(calc);
    if (headerRef.current) ro.observe(headerRef.current);
    ro.observe(document.body);
    window.addEventListener('resize', calc);
    calc();
    return () => {
      window.removeEventListener('resize', calc);
      ro.disconnect();
    };
  }, []);

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
