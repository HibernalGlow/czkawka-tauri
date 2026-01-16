/**
 * FloatingPanel - 悬浮面板容器组件
 * 使用 GlassCard 作为容器，支持拖拽移动和调整大小
 */
import { useCallback, useEffect, useRef, useState, type ReactNode, type ComponentType } from 'react';
import { Pin, PinOff, X } from 'lucide-react';
import { cn } from '~/utils/cn';
import { GlassCard } from './glass-card';
import { Button } from '~/components/shadcn/button';

export interface FloatingPanelProps {
  // 面板标识
  panelId: string;
  title: string;
  icon?: ComponentType<{ className?: string }>;

  // 内容
  children: ReactNode;

  // 状态控制
  isOpen: boolean;
  onClose: () => void;

  // 模式
  mode: 'fixed' | 'floating';
  onModeChange?: (mode: 'fixed' | 'floating') => void;

  // 位置和大小
  position?: { x: number; y: number } | null;
  size?: { width: number; height: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;

  // 约束
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  // 固定模式位置
  fixedPosition?: { right?: number; top?: number; left?: number; bottom?: number };

  // 样式
  className?: string;
}

export function FloatingPanel({
  panelId,
  title,
  icon: Icon,
  children,
  isOpen,
  onClose,
  mode,
  onModeChange,
  position,
  size = { width: 400, height: 500 },
  onPositionChange,
  onSizeChange,
  minWidth = 200,
  minHeight = 150,
  maxWidth = 800,
  maxHeight = 800,
  fixedPosition = { right: 20, top: 80 },
  className,
}: FloatingPanelProps) {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });

  const isFloating = mode === 'floating';

  const toggleMode = () => {
    const newMode = mode === 'fixed' ? 'floating' : 'fixed';
    onModeChange?.(newMode);
    
    if (newMode === 'floating' && !position) {
      // 切换到浮动模式时设置初始位置
      onPositionChange?.({
        x: Math.max(0, Math.min(window.innerWidth / 2 - size.width / 2, window.innerWidth - size.width - 20)),
        y: 100,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFloating || isResizing) return;
    
    setIsDragging(true);
    if (position) {
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && isFloating && position) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - size.height));
        onPositionChange?.({ x: newX, y: newY });
      }

      if (isResizing && isFloating && position && resizeDirection) {
        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        let newWidth = resizeStartSize.width;
        let newHeight = resizeStartSize.height;
        let newX = position.x;
        let newY = position.y;

        // 处理不同方向的调整
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartSize.width + deltaX));
        }
        if (resizeDirection.includes('w')) {
          const widthChange = Math.min(resizeStartSize.width - minWidth, deltaX);
          newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartSize.width - deltaX));
          newX = resizeStartPos.x + widthChange;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStartSize.height + deltaY));
        }
        if (resizeDirection.includes('n')) {
          const heightChange = Math.min(resizeStartSize.height - minHeight, deltaY);
          newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStartSize.height - deltaY));
          newY = resizeStartPos.y + heightChange;
        }

        // 确保面板在视口内
        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));

        onPositionChange?.({ x: newX, y: newY });
        onSizeChange?.({ width: newWidth, height: newHeight });
      }
    },
    [isDragging, isResizing, isFloating, position, dragOffset, size, resizeDirection, resizeStartPos, resizeStartSize, minWidth, minHeight, maxWidth, maxHeight, onPositionChange, onSizeChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  const startResize = (e: React.MouseEvent, direction: string) => {
    if (!isFloating) return;

    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ width: size.width, height: size.height });
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

  // 计算样式
  const panelStyle = isFloating && position
    ? {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }
    : {
        ...fixedPosition,
        width: size.width,
        height: size.height,
      };

  // 头部操作按钮
  const headerActions = (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMode}
        className="h-6 w-6 p-0"
        title={isFloating ? 'Pin panel' : 'Unpin panel'}
      >
        {isFloating ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-6 w-6 p-0"
        title="Close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      <div
        ref={dragRef}
        className={cn(
          'pointer-events-auto fixed',
          isDragging && 'cursor-grabbing',
          isResizing && 'select-none',
          className
        )}
        style={panelStyle}
      >
        <GlassCard
          title={title}
          icon={Icon}
          className={cn('h-full', isFloating && 'cursor-grab')}
          headerActions={headerActions}
          blurIntensity="lg"
          opacity={0.9}
        >
          {/* 拖拽区域 */}
          {isFloating && (
            <div
              className="absolute top-0 left-0 right-12 h-10 cursor-grab z-20"
              onMouseDown={handleMouseDown}
            />
          )}

          {/* 内容 */}
          <div className="h-full overflow-auto p-3">
            {children}
          </div>
        </GlassCard>

        {/* 调整大小手柄 - 仅浮动模式 */}
        {isFloating && (
          <>
            {/* 角落手柄 */}
            <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-30" onMouseDown={(e) => startResize(e, 'nw')} />
            <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-30" onMouseDown={(e) => startResize(e, 'ne')} />
            <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-30" onMouseDown={(e) => startResize(e, 'sw')} />
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30" onMouseDown={(e) => startResize(e, 'se')} />
            {/* 边缘手柄 */}
            <div className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-30" onMouseDown={(e) => startResize(e, 'n')} />
            <div className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-30" onMouseDown={(e) => startResize(e, 's')} />
            <div className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-30" onMouseDown={(e) => startResize(e, 'w')} />
            <div className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-30" onMouseDown={(e) => startResize(e, 'e')} />
          </>
        )}
      </div>
    </div>
  );
}
