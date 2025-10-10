import { invoke } from '@tauri-apps/api/core';
import { useAtom } from 'jotai';
import { Pin, PinOff, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sidebarVideoPreviewAtom } from '~/atom/primitive';
import { Button } from '~/components/shadcn/button';
import { useT } from '~/hooks';
import { cn } from '~/utils/cn';

export function SidebarVideoPreview() {
  const [sidebarState, setSidebarState] = useAtom(sidebarVideoPreviewAtom);
  const { isOpen, videoPath, mode, position, size } = sidebarState;
  const t = useT();
  const dragRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({
    width: 0,
    height: 0,
  });

  const closeSidebar = () => {
    // Pause video on close
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setSidebarState((prev) => ({ ...prev, isOpen: false, videoPath: null }));
  };

  const toggleMode = () => {
    const newMode = mode === 'fixed' ? 'floating' : 'fixed';
    setSidebarState((prev) => ({
      ...prev,
      mode: newMode,
      position:
        newMode === 'floating'
          ? {
              x: Math.max(
                0,
                Math.min(
                  window.innerWidth / 2 - size.width / 2,
                  window.innerWidth - size.width - 20,
                ),
              ),
              y: 100,
            }
          : null,
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'floating' || !dragRef.current) return;

    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && !isResizing && position) {
        const newX = Math.max(
          0,
          Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width),
        );
        const newY = Math.max(
          0,
          Math.min(e.clientY - dragOffset.y, window.innerHeight - 40),
        );

        setSidebarState((prev) => ({
          ...prev,
          position: { x: newX, y: newY },
        }));
      } else if (isResizing && resizeDirection && position) {
        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        let newWidth = resizeStartSize.width;
        let newHeight = resizeStartSize.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('e'))
          newWidth = Math.max(320, resizeStartSize.width + deltaX);
        if (resizeDirection.includes('w')) {
          const widthChange = Math.min(resizeStartSize.width - 320, deltaX);
          newWidth = Math.max(320, resizeStartSize.width - deltaX);
          newX = resizeStartPos.x + widthChange;
        }
        if (resizeDirection.includes('s'))
          newHeight = Math.max(180, resizeStartSize.height + deltaY);
        if (resizeDirection.includes('n')) {
          const heightChange = Math.min(resizeStartSize.height - 180, deltaY);
          newHeight = Math.max(180, resizeStartSize.height - deltaY);
          newY = resizeStartPos.y + heightChange;
        }

        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));

        setSidebarState((prev) => ({
          ...prev,
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
        }));
      }
    },
    [
      isDragging,
      isResizing,
      position,
      dragOffset,
      size,
      resizeDirection,
      resizeStartPos,
      resizeStartSize,
      setSidebarState,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    // autoplay when open
    if (isOpen && videoRef.current) {
      // try play, ignore error
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, videoPath]);

  if (!isOpen || !videoPath) return null;

  const previewStyle =
    mode === 'fixed'
      ? {
          right: 20,
          top: 80,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }
      : {
          left: position?.x ?? 0,
          top: position?.y ?? 0,
          width: `${size.width}px`,
          height: `${size.height}px`,
        };

  // 现状：convertFileSrc -> asset.localhost 无法访问磁盘视频 (ERR_CONNECTION_REFUSED)
  // 临时策略：直接尝试 file:// 访问；如果失败，提示需要启用自定义协议（后端实现后再切换）。
  // 使用自定义协议 videofs://local/<percent-encoded-absolute-path>
  // Windows WebView2 不接受自定义 scheme (ERR_UNKNOWN_URL_SCHEME) 需后续在打包层做 scheme 权限放行，这里先回退 convertFileSrc 以保证可用
  const [httpPort, setHttpPort] = useState<number | null>(null);
  useEffect(() => {
    if (isOpen && httpPort == null) {
      invoke<number>('get_video_server_port')
        .then(setHttpPort)
        .catch(() => {});
    }
  }, [isOpen, httpPort]);

  const src = httpPort
    ? `http://127.0.0.1:${httpPort}/video?path=${encodeURIComponent(videoPath)}`
    : undefined;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <div
        className={cn(
          'pointer-events-auto fixed bg-background border border-border shadow-lg rounded-md overflow-hidden',
          isDragging && 'cursor-grabbing',
          isResizing && 'select-none',
        )}
        style={previewStyle}
      >
        {mode === 'floating' && (
          <>
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10"
              onMouseDown={(e) => startResize(e, 'nw')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-10"
              onMouseDown={(e) => startResize(e, 'ne')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-10"
              onMouseDown={(e) => startResize(e, 'sw')}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
              onMouseDown={(e) => startResize(e, 'se')}
            />
            <div
              className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-10"
              onMouseDown={(e) => startResize(e, 'n')}
            />
            <div
              className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-10"
              onMouseDown={(e) => startResize(e, 's')}
            />
            <div
              className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-10"
              onMouseDown={(e) => startResize(e, 'w')}
            />
            <div
              className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-10"
              onMouseDown={(e) => startResize(e, 'e')}
            />
          </>
        )}

        <div className="flex flex-col h-full">
          <div
            ref={dragRef}
            className={cn(
              'flex items-center justify-between p-2 border-b border-border bg-muted/30',
              mode === 'floating' && 'cursor-grab',
            )}
            onMouseDown={handleMouseDown}
          >
            <h3 className="font-semibold text-sm truncate" title={videoPath}>
              {t('Video preview')}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className="h-6 w-6 p-0"
                title={
                  mode === 'fixed'
                    ? t('Switch to floating mode')
                    : t('Switch to fixed mode')
                }
              >
                {mode === 'fixed' ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
            <div className="break-all">{videoPath}</div>
          </div>

          <div className="flex-1 p-2 overflow-hidden">
            <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-md">
              {src ? (
                <video
                  ref={videoRef}
                  src={src}
                  className="max-w-full max-h-full"
                  controls
                  autoPlay
                  onError={() => {
                    // eslint-disable-next-line no-console
                    console.warn('[video] failed to load src', src);
                  }}
                />
              ) : (
                <div className="text-xs text-muted-foreground">
                  Loading video server...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function startResize(e: React.MouseEvent, direction: string) {
    if (mode !== 'floating') return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ width: size.width, height: size.height });
  }
}
