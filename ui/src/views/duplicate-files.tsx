import type { ColumnDef, Row } from '@tanstack/react-table';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo, useState, useEffect } from 'react';
import {
  duplicateFilesAtom,
  duplicateFilesRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  DataTable,
  TableActions,
  TableRowSelectionCell,
  TableRowSelectionHeader,
} from '~/components/data-table';
import { ThumbnailCell } from '~/components/thumbnail-cell';
import { DynamicThumbnailCell } from '~/components/dynamic-thumbnail-cell';
import { useT } from '~/hooks';
import type { DuplicateEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import { ThumbnailPreloader } from '~/utils/thumbnail-preloader';
import { ClickableImagePreview } from './clickable-image-preview';

export function DuplicateFiles() {
  const [thumbnailColumnWidth, setThumbnailColumnWidth] = useState(80); // 追踪缩略图列宽
  const data = useAtomValue(duplicateFilesAtom);
  const [rowSelection, setRowSelection] = useAtom(
    duplicateFilesRowSelectionAtom,
  );
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  // 根据缩略图列宽动态计算行高
  const dynamicRowHeight = useMemo(() => {
    if (!settings.similarImagesEnableThumbnails) {
      return 36; // 没有缩略图时的默认行高
    }
    // 缩略图大小计算：Math.max(20, Math.min(thumbnailColumnWidth - 8, 200))
    const thumbnailSize = Math.max(20, Math.min(thumbnailColumnWidth - 8, 200));
    // 行高 = 缩略图高度 + 上下padding (16px)
    return Math.max(36, thumbnailSize + 16);
  }, [settings.similarImagesEnableThumbnails, thumbnailColumnWidth]);

  // 启动缩略图预加载
  useEffect(() => {
    if (settings.similarImagesEnableThumbnails && data.length > 0) {
      const allImagePaths = data.filter(entry => entry.isImage).map(entry => entry.path);
      const preloader = ThumbnailPreloader.getInstance();
      
      // 延迟启动预加载，避免影响初始渲染
      const timer = setTimeout(() => {
        preloader.startPreloading(allImagePaths);
      }, 1000);

      return () => {
        clearTimeout(timer);
        preloader.stop();
      };
    }
  }, [data, settings.similarImagesEnableThumbnails]);

  const columns: ColumnDef<DuplicateEntry>[] = [
    {
      id: 'select',
      meta: {
        span: 1,
      },
      size: 40,
      minSize: 40,
      header: ({ table }) => {
        return <TableRowSelectionHeader table={table} />;
      },
      cell: ({ row }) => {
        if (row.original.isRef) {
          return null;
        }
        return <TableRowSelectionCell row={row} />;
      },
    },
    ...(settings.similarImagesEnableThumbnails ? [{
      id: 'thumbnail',
      header: t('Thumbnail'),
      size: 80,
      minSize: 60,
      maxSize: 120,
      cell: ({ row }: { row: any }) => {
        if (row.original.isRef) {
          return null;
        }
        return <DynamicThumbnailCell 
          path={row.original.path} 
          enableLazyLoad={true}
          onSizeChange={setThumbnailColumnWidth}
        />;
      },
    }] : []),
    {
      accessorKey: 'size',
      header: t('Size'),
      size: 110,
      minSize: 50,
      cell: ({ row }) => {
        return <ClickableCell row={row} value={row.original.size} />;
      },
    },
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 180,
      minSize: 100,
      cell: ({ row }) => {
        return <FileName row={row} />;
      },
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 320,
      minSize: 100,
      cell: ({ row }) => {
        if (row.original.hidden) {
          return null;
        }
        return <ClickablePath row={row} />;
      },
    },
    {
      accessorKey: 'modifiedDate',
      header: t('Modified date'),
      size: 160,
      minSize: 120,
    },
    {
      id: 'actions',
      size: 55,
      minSize: 55,
      cell: ({ cell }) => {
        if (cell.row.original.isRef) {
          return null;
        }
        return <TableActions path={cell.row.original.path} />;
      },
    },
  ];

  return (
    <DataTable
      className="flex-1 rounded-none border-none grow"
      data={data}
      columns={columns}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      rowHeight={dynamicRowHeight}
    />
  );
}

function FileName(props: { row: Row<DuplicateEntry> }) {
  const { row } = props;
  const { hidden, path, fileName, isImage } = row.original;

  const settings = useAtomValue(settingsAtom);

  if (hidden) {
    return null;
  }

  if (settings.duplicateImagePreview && isImage) {
    return (
      <ClickableImagePreview path={path}>
        <div className="truncate cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
          {fileName}
        </div>
      </ClickableImagePreview>
    );
  }

  return fileName;
}

function ClickablePath(props: { row: Row<DuplicateEntry> }) {
  const { row } = props;
  const { path, isImage } = row.original;
  const settings = useAtomValue(settingsAtom);

  // 根据设置格式化路径显示
  const displayPath = formatPathDisplay(path, settings.reversePathDisplay);

  if (settings.duplicateImagePreview && isImage) {
    return (
      <ClickableImagePreview path={path}>
        <div className="truncate cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
          {displayPath}
        </div>
      </ClickableImagePreview>
    );
  }

  return <div className="truncate">{displayPath}</div>;
}

// 通用的可点击单元格组件
function ClickableCell(props: { row: Row<DuplicateEntry>; value: string }) {
  const { row, value } = props;
  const { path, isImage } = row.original;
  const settings = useAtomValue(settingsAtom);

  if (settings.duplicateImagePreview && isImage) {
    return (
      <ClickableImagePreview path={path}>
        <div className="cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
          {value}
        </div>
      </ClickableImagePreview>
    );
  }

  return <div>{value}</div>;
}
