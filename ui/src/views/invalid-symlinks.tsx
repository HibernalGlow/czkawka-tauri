import { useAtom, useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { settingsAtom } from '~/atom/settings';
import {
  currentToolDataAtom,
  currentToolFilterAtom,
  currentToolRowSelectionAtom,
} from '~/atom/tools';
import {
  createColumns,
  DataTable,
  FilterStateUpdater,
} from '~/components/data-table';
import { DynamicThumbnailCell } from '~/components/dynamic-thumbnail-cell';
import { useT } from '~/hooks';
import type { SymlinksFileEntry } from '~/types';
import { isPreviewableFile } from '~/utils/file-type-utils';
import { formatPathDisplay } from '~/utils/path-utils';
import { filterItems } from '~/utils/table-helper';
import { ClickablePreview } from './clickable-preview';

export function InvalidSymlinks() {
  const data = useAtomValue(currentToolDataAtom) as SymlinksFileEntry[];
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const [thumbnailColumnWidth, setThumbnailColumnWidth] = useState(80);
  const t = useT();

  const filteredData = useMemo(() => {
    return filterItems(data, filter, [
      'symlinkName',
      'path',
      'destinationPath',
      'typeOfError',
    ]);
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

  const columns = createColumns<SymlinksFileEntry>([
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
                <DynamicThumbnailCell
                  path={row.original.path}
                  enableLazyLoad={true}
                  onSizeChange={setThumbnailColumnWidth}
                />
              );
            },
          },
        ]
      : []),
    {
      accessorKey: 'symlinkName',
      header: t('Symlink name'),
      size: 180,
      minSize: 110,
      cell: ({ row }) => (
        <ClickablePreview path={row.original.path}>
          <div className="truncate">{row.original.symlinkName}</div>
        </ClickablePreview>
      ),
    },
    {
      accessorKey: 'path',
      header: t('Symlink path'),
      size: 220,
      minSize: 110,
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
      accessorKey: 'destinationPath',
      header: t('Destination path'),
      size: 220,
      minSize: 130,
      cell: ({ row }) => {
        const displayPath = formatPathDisplay(
          row.original.destinationPath,
          settings.reversePathDisplay,
        );
        return <div className="truncate">{displayPath}</div>;
      },
    },
    {
      accessorKey: 'typeOfError',
      header: t('Type of error'),
      size: 140,
      minSize: 110,
    },
    {
      accessorKey: 'modifiedDate',
      header: t('Modified date'),
      size: 160,
      minSize: 120,
    },
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
