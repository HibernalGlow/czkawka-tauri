import { useAtom } from 'jotai';
import { Filter, Pin, PinOff, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { filterPanelAtom } from '~/atom/primitive';
import { Button } from '~/components/shadcn/button';
import { useT } from '~/hooks';
import { cn } from '~/utils/cn';
import { FileFilterContent } from './file-filter-content';

export function FloatingFilterPanel() {
  const [panelState, setPanelState] = useAtom(filterPanelAtom);
  const { isOpen, mode, position, size } = panelState;
  const t = useT();
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({
    width: 0,
    height: 0,
  });

  const closePanel = () => {
    setPanelState((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleMode = () => {
    const newMode = mode === 'fixed' ? 'floating' : 'fixed';
    setPanelState((prev) => ({
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
    if (mode !== 'floating' || isResizing) return;

    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect && position) {
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && mode === 'floating') {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Ensure the panel stays within viewport bounds
        const boundedX = Math.max(
          0,
          Math.min(newX, window.innerWidth - size.width),
        );
        const boundedY = Math.max(
          0,
          Math.min(newY, window.innerHeight - size.height),
        );

        setPanelState((prev) => ({
          ...prev,
          position: { x: boundedX, y: boundedY },
        }));
      }

      if (isResizing && mode === 'floating' && position) {
        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        let newWidth = resizeStartSize.width;
        let newHeight = resizeStartSize.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection?.includes('right')) {
          newWidth = Math.max(300, resizeStartSize.width + deltaX);
        }
        if (resizeDirection?.includes('bottom')) {
          newHeight = Math.max(200, resizeStartSize.height + deltaY);
        }
        if (resizeDirection?.includes('left')) {
          const widthChange = deltaX;
          newWidth = Math.max(300, resizeStartSize.width - widthChange);
          newX = resizeStartPos.x + widthChange;
        }
        if (resizeDirection?.includes('top')) {
          const heightChange = deltaY;
          newHeight = Math.max(200, resizeStartSize.height - heightChange);
          newY = resizeStartPos.y + heightChange;
        }

        // Ensure the panel stays within viewport bounds
        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));

        setPanelState((prev) => ({
          ...prev,
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
        }));
      }
    },
    [
      isDragging,
      mode,
      dragOffset,
      isResizing,
      position,
      resizeDirection,
      resizeStartPos,
      resizeStartSize,
      size,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  const startResize = (e: React.MouseEvent, direction: string) => {
    if (mode !== 'floating') return;

    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ width: size.width, height: size.height });

    if (position) {
      setResizeStartPos({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

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

  if (!isOpen) return null;

  const isFloating = mode === 'floating';

  return (
    <div
      className={cn(
        'bg-background border border-border shadow-lg rounded-lg overflow-hidden',
        isFloating ? 'fixed z-50' : 'fixed right-4 top-16 z-50',
      )}
      style={
        isFloating && position
          ? {
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
            }
          : isFloating
            ? { width: size.width, height: size.height }
            : { width: 400, height: 500 }
      }
      ref={dragRef}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-3 border-b bg-muted/50',
          isFloating && 'cursor-move',
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">{t('Filter')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleMode}
            title={isFloating ? 'Pin panel' : 'Unpin panel'}
          >
            {isFloating ? (
              <Pin className="h-4 w-4" />
            ) : (
              <PinOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={closePanel}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <FileFilterContent />
      </div>

      {/* Resize handles for floating mode */}
      {isFloating && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'top-left')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'top-right')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'bottom-left')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'bottom-right')}
          />

          {/* Edge handles */}
          <div
            className="absolute top-0 left-3 right-3 h-1 cursor-n-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'top')}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'bottom')}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'left')}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize opacity-0 hover:opacity-100"
            onMouseDown={(e) => startResize(e, 'right')}
          />
        </>
      )}
    </div>
  );
}
