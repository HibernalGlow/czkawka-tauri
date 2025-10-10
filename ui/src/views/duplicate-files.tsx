import type { ColumnDef, Row, SortingState } from '@tanstack/react-table';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
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
import { DynamicThumbnailCell } from '~/components/dynamic-thumbnail-cell';
import { Checkbox } from '~/components/shadcn/checkbox';
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
  const [sorting, setSorting] = useState<SortingState>([]);
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
      const allImagePaths = data
        .filter((entry) => entry.isImage)
        .map((entry) => entry.path);
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

  // 处理分组分隔和隐藏行
  const processedData = useMemo(() => {
    const threshold = settings.duplicateGroupSizeThreshold || 1;
    if (threshold <= 1) return processDataWithGroups(data);
    const filtered: typeof data = [];
    let group: typeof data = [];
    for (const item of data) {
      if (item.hidden) {
        // hidden row marks end of current group
        if (group.length) {
          const visibleCount = group.filter((e) => !e.hidden).length;
            if (visibleCount >= threshold) {
              filtered.push(...group, item); // keep group and its hidden separator
            }
        }
        group = [];
        continue;
      }
      group.push(item);
    }
    if (group.length) {
      const visibleCount = group.filter((e) => !e.hidden).length;
      if (visibleCount >= threshold) filtered.push(...group);
    }
    let result = processDataWithGroups(filtered);

    // 应用排序
    if (sorting.length > 0) {
      result = [...result].sort((a, b) => {
        for (const sort of sorting) {
          let aVal: any = a[sort.id as keyof typeof a];
          let bVal: any = b[sort.id as keyof typeof b];

          // 特殊处理某些字段
          if (sort.id === 'size') {
            // 解析文件大小字符串，如 "1.2 MB" -> 1.2 * 1024 * 1024
            const parseSize = (str: string) => {
              const match = str.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
              if (!match) return 0;
              const num = parseFloat(match[1]);
              const unit = match[2]?.toUpperCase();
              const multiplier = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3 }[unit || 'B'] || 1;
              return num * multiplier;
            };
            aVal = parseSize(aVal);
            bVal = parseSize(bVal);
          } else if (sort.id === 'modifiedDate') {
            // 解析日期字符串
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
          } else if (sort.id === 'groupSize') {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
          }

          let cmp = 0;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            cmp = aVal.localeCompare(bVal);
          } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            cmp = aVal - bVal;
          }

          if (cmp !== 0) {
            return sort.desc ? -cmp : cmp;
          }
        }
        return 0;
      });
    }

    return result;
  }, [data, settings.duplicateGroupSizeThreshold, sorting]);

  const columns: ColumnDef<DuplicateEntry & { _isGroupEnd?: boolean; groupSize?: number; groupId?: number }>[] = [
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
    ...(settings.similarImagesEnableThumbnails
      ? [
          {
            id: 'thumbnail',
            header: t('Thumbnail'),
            size: 80,
            minSize: 60,
            maxSize: 120,
            cell: ({ row }: { row: any }) => {
              if (row.original.hidden) return null;
              if (row.original.isRef) {
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
      accessorKey: 'size',
      header: t('Size'),
      size: 110,
      minSize: 50,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        const isGroupEnd = (row.original as any)._isGroupEnd;
        return (
          <div
            style={
              isGroupEnd ? { borderBottom: '2px solid #e5e7eb' } : undefined
            }
          >
            <ClickableCell row={row} value={row.original.size} />
          </div>
        );
      },
    },
    {
      accessorKey: 'groupSize',
      header: t('Group Size'),
      size: 60,
      minSize: 40,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        const isGroupEnd = (row.original as any)._isGroupEnd;
        return (
          <div
            style={
              isGroupEnd ? { borderBottom: '2px solid #e5e7eb' } : undefined
            }
          >
            {row.original.groupSize}
          </div>
        );
      },
    },
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 180,
      minSize: 100,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        const isGroupEnd = (row.original as any)._isGroupEnd;
        return (
          <div
            style={
              isGroupEnd ? { borderBottom: '2px solid #e5e7eb' } : undefined
            }
          >
            <FileName row={row} />
          </div>
        );
      },
    },
    {
      id: 'groupSelect',
      header: t('Group Select'),
      size: 60,
      minSize: 40,
      cell: ({ row, table }) => {
        if (row.original.hidden || !row.original._isGroupEnd) return null;
        const groupId = row.original.groupId;
        const allRows = table.getRowModel().rows;
        const groupRows = allRows.filter(r => r.original.groupId === groupId && !r.original.isRef && !r.original.hidden);
        const isAllSelected = groupRows.every(r => r.getIsSelected());
        const isSomeSelected = groupRows.some(r => r.getIsSelected());
        return (
          <div className="flex justify-center items-center">
            <Checkbox
              checked={isAllSelected || (isSomeSelected && 'indeterminate')}
              onCheckedChange={(value) => {
                const newSelection = { ...table.getState().rowSelection };
                groupRows.forEach(r => {
                  if (value) {
                    newSelection[r.id] = true;
                  } else {
                    delete newSelection[r.id];
                  }
                });
                table.setRowSelection(newSelection);
              }}
              aria-label="Select group"
              className="translate-y-[2px]"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 320,
      minSize: 100,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        const isGroupEnd = (row.original as any)._isGroupEnd;
        return (
          <div
            style={
              isGroupEnd ? { borderBottom: '2px solid #e5e7eb' } : undefined
            }
          >
            <ClickablePath row={row} />
          </div>
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
      data={processedData}
      columns={columns}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      rowHeight={dynamicRowHeight}
      enableSorting={true}
      sorting={sorting}
      onSortingChange={setSorting}
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

// 新增：处理分组逻辑
export function processDataWithGroups(imagesData: DuplicateEntry[]) {
  const result: (DuplicateEntry & { _isGroupEnd?: boolean; groupSize?: number; groupId?: number })[] = [];
  let currentGroup: typeof result = [];
  let groupId = 0;

  for (let i = 0; i < imagesData.length; i++) {
    const curr = imagesData[i];
    if (curr.hidden) {
      // 结束当前组，计算groupSize
      if (currentGroup.length > 0) {
        const refCount = currentGroup.filter(item => item.isRef).length;
        const groupSize = currentGroup.length - refCount;
        currentGroup.forEach(item => {
          item.groupSize = groupSize;
          item.groupId = groupId;
        });
        result.push(...currentGroup);
        currentGroup = [];
      }
      groupId++;
      continue;
    }
    const next = imagesData[i + 1];
    currentGroup.push({
      ...curr,
      _isGroupEnd: !!next?.hidden,
    });
  }
  // 处理最后一组
  if (currentGroup.length > 0) {
    const refCount = currentGroup.filter(item => item.isRef).length;
    const groupSize = currentGroup.length - refCount;
    currentGroup.forEach(item => {
      item.groupSize = groupSize;
      item.groupId = groupId;
    });
    result.push(...currentGroup);
  }
  return result;
}
