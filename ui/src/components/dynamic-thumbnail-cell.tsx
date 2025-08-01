import { useCallback, useEffect, useRef, useState } from 'react';
import { ThumbnailCell } from './thumbnail-cell';

interface DynamicThumbnailCellProps {
  path: string;
  enableLazyLoad?: boolean;
  className?: string;
  onSizeChange?: (width: number) => void; // 新增：尺寸变化回调
}

export function DynamicThumbnailCell({
  path,
  enableLazyLoad = true,
  className = '',
  onSizeChange,
}: DynamicThumbnailCellProps) {
  const [columnWidth, setColumnWidth] = useState(80);
  const cellRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>();

  // 防抖的获取列宽函数
  const updateColumnWidth = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (cellRef.current) {
        const width = cellRef.current.offsetWidth;
        // 允许更大的列宽范围，不限制最大值
        if (width > 0) {
          setColumnWidth(width);
          // 通知父组件列宽变化
          onSizeChange?.(width);
        }
      }
    }, 16); // 使用 requestAnimationFrame 频率
  }, []);

  // 监听窗口大小变化和元素大小变化
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

    // 监听窗口大小变化
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
      <ThumbnailCell
        path={path}
        size="dynamic"
        dynamicSize={columnWidth}
        enableLazyLoad={enableLazyLoad}
        className={className}
      />
    </div>
  );
}
