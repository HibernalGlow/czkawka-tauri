import { Toaster } from '~/components/shadcn/sonner';
import { TooltipProvider } from '~/components/shadcn/tooltip';
import { AppBody } from '~/views/app-body';
import { AppHeader } from '~/views/app-header';
import { BottomBar } from '~/views/bottom-bar';
import { FloatingFilterPanel } from '~/views/floating-filter-panel';
import { SidebarImagePreview } from '~/views/sidebar-image-preview';
import { SidebarVideoPreview } from '~/views/sidebar-video-preview';
import { ToolTabs } from '~/views/tool-tabs';

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col relative">
      <TooltipProvider delayDuration={100} skipDelayDuration={90}>
        <div className="flex-1 flex h-px">
          <ToolTabs />
          <div className="flex flex-col flex-1 w-px">
            <AppHeader />
            <AppBody />
          </div>
        </div>
        <BottomBar />
      </TooltipProvider>
      <Toaster />
      <SidebarImagePreview />
      <SidebarVideoPreview />
      <FloatingFilterPanel />
    </div>
  );
}
