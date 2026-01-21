import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { sidebarVideoPreviewAtom } from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  currentToolDataAtom,
  currentToolFilterAtom,
  currentToolRowSelectionAtom,
} from '~/atom/tools';
import {
  createActionsColumn,
  createColumns,
  DataTable,
  FilterStateUpdater,
} from '~/components/data-table';
import { DynamicPreviewCell } from '~/components/dynamic-preview-cell';
import { useT } from '~/hooks';
import type { BrokenEntry } from '~/types';
import { isPreviewableFile } from '~/utils/file-type-utils';
import { formatPathDisplay } from '~/utils/path-utils';
import { filterItems } from '~/utils/table-helper';
import { ClickablePreview } from './clickable-preview';

export function BrokenFiles() {
  const data = useAtomValue(currentToolDataAtom) as BrokenEntry[];
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const setSidebarVideoPreview = useSetAtom(sidebarVideoPreviewAtom);
  const [thumbnailColumnWidth, setThumbnailColumnWidth] = useState(80);
  const t = useT();

  const filteredData = useMemo(() => {
    return filterItems(data, filter, ['fileName', 'path', 'errorString']);
  }, [data, filter]);

  // 检查是否有可预览文件
  const hasPreviewableFiles = useMemo(() => {
    return data.some((entry) => isPreviewableFile(entry.path));
  }, [data]);

  // 动态行高
  const dynamicRowHeight = useMemo(() => {
    if (!hasPreviewableFiles) {
      return 36;
    }
    const thumbnailSize = Math.max(20, Math.min(thumbnailColumnWidth - 8, 200));
    return Math.max(36, thumbnailSize + 16);
  }, [hasPreviewableFiles, thumbnailColumnWidth]);

  // 视频点击处理
  const handleVideoClick = (path: string) => {
    setSidebarVideoPreview((prev) => ({
      ...prev,
      isOpen: true,
      videoPath: path,
    }));
  };

  const columns = createColumns<BrokenEntry>([
    ...(hasPreviewableFiles
      ? [
          {
            id: 'thumbnail',
            header: t('Thumbnail'),
            size: 80,
            minSize: 60,
            maxSize: 120,
            cell: ({ row }: { row: any }) => {
              if (!isPreviewableFile(row.original.path)) {
                return null;
              }
              return (
                <DynamicPreviewCell
                  path={row.original.path}
                  enableLazyLoad={true}
                  onSizeChange={setThumbnailColumnWidth}
                  onVideoClick={() => handleVideoClick(row.original.path)}
                />
              );
            },
          },
        ]
      : []),
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 180,
      minSize: 100,
      cell: ({ row }) => (
        <ClickablePreview path={row.original.path}>
          <div className="truncate">{row.original.fileName}</div>
        </ClickablePreview>
      ),
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 200,
      minSize: 100,
      cell: ({ row }) => {
        const displayPath = formatPathDisplay(
          row.original.path,
          settings.reversePathDisplay,
        );
        return (
          <ClickablePreview path={row.original.path}>
            <div className="truncate">{displayPath}</div>
          </ClickablePreview>
        );
      },
    },
    {
      accessorKey: 'errorString',
      header: t('Type of error'),
      size: 150,
      minSize: 110,
    },
    {
      accessorKey: 'size',
      header: t('Size'),
      size: 110,
      minSize: 50,
    },
    {
      accessorKey: 'modifiedDate',
      header: t('Modified date'),
      size: 160,
      minSize: 120,
    },
    createActionsColumn(),
  ]);

  return (
    <DataTable
      className="flex-1 rounded-none border-none grow"
      data={filteredData}
      columns={columns}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      rowHeight={dynamicRowHeight}
      globalFilter={filter}
      onGlobalFilterChange={(updater: FilterStateUpdater) => {
        const newValue =
          typeof updater === 'function' ? updater(filter) : updater;
        setFilter(newValue);
      }}
    />
  );
}
