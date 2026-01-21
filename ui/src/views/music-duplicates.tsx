import type { ColumnDef } from '@tanstack/react-table';

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
  DataTable,
  FilterStateUpdater,
  TableActions,
  TableRowSelectionCell,
  TableRowSelectionHeader,
} from '~/components/data-table';
import { DynamicPreviewCell } from '~/components/dynamic-preview-cell';
import { useT } from '~/hooks';
import { useFormatFilteredData } from '~/hooks/useFormatFilteredData';
import type { MusicEntry } from '~/types';
import { isPreviewableFile } from '~/utils/file-type-utils';
import { formatPathDisplay } from '~/utils/path-utils';
import { ClickablePreview } from './clickable-preview';

export function MusicDuplicates() {
  const data = useAtomValue(currentToolDataAtom) as MusicEntry[];
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const setSidebarVideoPreview = useSetAtom(sidebarVideoPreviewAtom);
  const [thumbnailColumnWidth, setThumbnailColumnWidth] = useState(80);
  const t = useT();

  // 先应用格式过滤
  const formatFilteredData = useFormatFilteredData(data);

  const filteredData = useMemo(() => {
    if (!filter) return formatFilteredData;

    const lowercaseFilter = filter.toLowerCase();
    const filtered = formatFilteredData.filter((item) => {
      if (item.hidden) return true;
      return (
        item.fileName?.toLowerCase().includes(lowercaseFilter) ||
        item.path?.toLowerCase().includes(lowercaseFilter) ||
        item.trackTitle?.toLowerCase().includes(lowercaseFilter) ||
        item.trackArtist?.toLowerCase().includes(lowercaseFilter)
      );
    });

    // 清理空的组
    const cleaned: typeof filtered = [];
    let tempGroup: typeof filtered = [];
    for (const item of filtered) {
      if (item.hidden) {
        if (tempGroup.length > 0) {
          cleaned.push(...tempGroup, item);
        }
        tempGroup = [];
      } else {
        tempGroup.push(item);
      }
    }
    if (tempGroup.length > 0) cleaned.push(...tempGroup);
    return cleaned;
  }, [formatFilteredData, filter]);

  // 检查是否有可预览文件
  const hasPreviewableFiles = useMemo(() => {
    return data.some((entry) => isPreviewableFile(entry.path));
  }, [data]);

  // 动态行高
  const dynamicRowHeight = useMemo(() => {
    if (!hasPreviewableFiles || !settings.similarImagesEnableThumbnails) {
      return 36;
    }
    const thumbnailSize = Math.max(20, Math.min(thumbnailColumnWidth - 8, 200));
    return Math.max(36, thumbnailSize + 16);
  }, [hasPreviewableFiles, settings.similarImagesEnableThumbnails, thumbnailColumnWidth]);

  // 处理视频点击
  const handleVideoClick = (path: string) => {
    setSidebarVideoPreview((prev) => ({
      ...prev,
      isOpen: true,
      videoPath: path,
    }));
  };

  const columns: ColumnDef<MusicEntry>[] = [
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
        if (row.original.hidden) return null;
        if (row.original.isRef) {
          return null;
        }
        return <TableRowSelectionCell row={row} />;
      },
    },
    ...(hasPreviewableFiles && settings.similarImagesEnableThumbnails
      ? [
          {
            id: 'thumbnail',
            header: t('Thumbnail'),
            size: 80,
            minSize: 60,
            maxSize: 120,
            cell: ({ row }: { row: any }) => {
              if (row.original.hidden) return null;
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
      accessorKey: 'size',
      header: t('Size'),
      size: 110,
      minSize: 50,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return row.original.size;
      },
    },
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 180,
      minSize: 100,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return (
          <ClickablePreview path={row.original.path}>
            <div className="truncate">{row.original.fileName}</div>
          </ClickablePreview>
        );
      },
    },
    {
      accessorKey: 'trackTitle',
      header: t('Title'),
      size: 100,
      minSize: 60,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return row.original.trackTitle;
      },
    },
    {
      accessorKey: 'trackArtist',
      header: t('Artist'),
      size: 100,
      minSize: 60,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return row.original.trackArtist;
      },
    },
    {
      accessorKey: 'year',
      header: t('Year'),
      size: 100,
      minSize: 60,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return row.original.year;
      },
    },
    {
      accessorKey: 'bitrate',
      header: t('Bitrate'),
      size: 100,
      minSize: 70,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return row.original.bitrate;
      },
    },
    {
      accessorKey: 'length',
      header: t('Length'),
      size: 100,
      minSize: 70,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return row.original.length;
      },
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 220,
      minSize: 100,
      cell: ({ row }) => {
        if (row.original.hidden) {
          return null;
        }
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
      accessorKey: 'modifiedDate',
      header: t('Modified date'),
      size: 160,
      minSize: 120,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        return row.original.modifiedDate;
      },
    },
    {
      id: 'actions',
      size: 55,
      minSize: 55,
      cell: ({ cell }) => {
        if (cell.row.original.hidden) return null;
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
