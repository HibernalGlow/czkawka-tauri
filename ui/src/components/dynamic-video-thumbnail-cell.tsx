import { useCallback, useEffect, useRef, useState } from 'react';
import { VideoThumbnailCell } from './video-thumbnail-cell';

interface DynamicVideoThumbnailCellProps {
  path: string;
  enableLazyLoad?: boolean;
  className?: string;
  onSizeChange?: (width: number) => void;
  onClick?: () => void;
}

export function DynamicVideoThumbnailCell({
  path,
  enableLazyLoad = true,
  className = '',
  onSizeChange,
  onClick,
}: DynamicVideoThumbnailCellProps) {
  const [columnWidth, setColumnWidth] = useState(80);
  const cellRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>();

  const updateColumnWidth = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (cellRef.current) {
        const width = cellRef.current.offsetWidth;
        if (width > 0) {
          setColumnWidth(width);
          onSizeChange?.(width);
        }
      }
    }, 16);
  }, [onSizeChange]);

  useEffect(() => {
    updateColumnWidth();

    let resizeObserver: ResizeObserver | null = null;

    if (cellRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === cellRef.current) {
            updateColumnWidth();
            break;
          }
        }
      });
      resizeObserver.observe(cellRef.current);
    }

    window.addEventListener('resize', updateColumnWidth);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateColumnWidth);
    };
  }, [updateColumnWidth]);

  return (
    <div
      ref={cellRef}
      className="flex items-center justify-center w-full h-full overflow-hidden"
    >
      <VideoThumbnailCell
        path={path}
        size="dynamic"
        dynamicSize={columnWidth}
        enableLazyLoad={enableLazyLoad}
        className={className}
        onClick={onClick}
      />
    </div>
  );
}
