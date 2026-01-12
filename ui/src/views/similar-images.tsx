import type { ColumnDef, Row } from '@tanstack/react-table';
import { useAtom, useAtomValue } from 'jotai';
import { FolderTree, List } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { settingsAtom } from '~/atom/settings';
import {
  currentToolDataAtom,
  currentToolFilterAtom,
  currentToolRowSelectionAtom,
  similarImagesFoldersAtom,
} from '~/atom/tools';
import { Button } from '~/components';
import {
  DataTable,
  FilterStateUpdater,
  TableActions,
  TableRowSelectionCell,
  TableRowSelectionHeader,
} from '~/components/data-table';
import { DynamicThumbnailCell } from '~/components/dynamic-thumbnail-cell';
import { useT } from '~/hooks';
import type { ImagesEntry as BaseImagesEntry, FolderStat } from '~/types';

// 扩展 ImagesEntry 类型，添加 _isGroupEnd 可选属性
type ImagesEntry = BaseImagesEntry & {
  _isGroupEnd?: boolean;
};

import { formatPathDisplay } from '~/utils/path-utils';
import { ThumbnailPreloader } from '~/utils/thumbnail-preloader';
import { ClickableImagePreview } from './clickable-image-preview';

export function SimilarImages() {
  const [viewMode, setViewMode] = useState<'images' | 'folders'>('images');
  const [thumbnailColumnWidth, setThumbnailColumnWidth] = useState(80);
  const imagesData = useAtomValue(currentToolDataAtom) as BaseImagesEntry[];
  const foldersData = useAtomValue(similarImagesFoldersAtom);
  const settings = useAtomValue(settingsAtom);
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const t = useT();

  // 根据阈值过滤文件夹数据
  const filteredFoldersData = useMemo(() => {
    return foldersData.filter(
      (folder) => folder.count >= settings.similarImagesFolderThreshold,
    );
  }, [foldersData, settings.similarImagesFolderThreshold]);

  // 将文件夹数据转换为表格行格式，复用现有的列结构
  const transformedFoldersData = useMemo(() => {
    return filteredFoldersData.map((folder: FolderStat, index: number) => ({
      id: `folder-${index}`,
      similarity: '',
      size: `${folder.count} 张图片`,
      dimensions: '',
      fileName: folder.path.split(/[/\\]/).pop() || '',
      path: folder.path,
      modifiedDate: '',
      isRef: false,
      hidden: false,
      raw: {} as any,
      // 为文件夹添加标识，用于区分是否为文件夹行
      isFolder: true,
    }));
  }, [filteredFoldersData]);

  // 根据视图模式选择数据源
  const data = viewMode === 'images' ? imagesData : transformedFoldersData;

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
    if (settings.similarImagesEnableThumbnails && imagesData.length > 0) {
      const allImagePaths = imagesData.map((entry) => entry.path);
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
  }, [imagesData, settings.similarImagesEnableThumbnails]);

  // 获取文件夹下的第一张图片路径
  const getFirstImageInFolder = (folderPath: string): string | null => {
    // 在相似图片数据中查找该文件夹下的第一张图片
    for (const imageEntry of imagesData) {
      if (imageEntry.path.startsWith(folderPath) && !imageEntry.isRef) {
        return imageEntry.path;
      }
    }
    return null;
  };

  // 1. 处理表格数据，生成分组分隔标记
  const processedData = useMemo(() => {
    // 筛选逻辑
    let filteredImagesData = imagesData;
    if (filter) {
      const lowercaseFilter = filter.toLowerCase();
      filteredImagesData = imagesData.filter((item) => {
        if (item.hidden) return true;
        return (
          item.fileName?.toLowerCase().includes(lowercaseFilter) ||
          item.path?.toLowerCase().includes(lowercaseFilter)
        );
      });

      // 清理掉空的组（即只有分隔符的组）
      const cleaned: typeof filteredImagesData = [];
      let tempGroup: typeof filteredImagesData = [];
      for (const item of filteredImagesData) {
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
      filteredImagesData = cleaned;
    }

    // 根据视图模式选择数据源并进行最后处理
    if (viewMode === 'folders') {
      // 文件夹模式也应用筛选
      if (!filter) return transformedFoldersData;
      const lowercaseFilter = filter.toLowerCase();
      return transformedFoldersData.filter(
        (item) =>
          item.fileName.toLowerCase().includes(lowercaseFilter) ||
          item.path.toLowerCase().includes(lowercaseFilter),
      );
    }

    const result: ImagesEntry[] = [];
    for (let i = 0; i < filteredImagesData.length; i++) {
      const curr = filteredImagesData[i];
      if (curr.hidden) continue; // 跳过 hidden 行
      // 判断下一行是否为 hidden
      const next = filteredImagesData[i + 1];
      result.push({
        ...curr,
        _isGroupEnd: !!next?.hidden, // 新增分组结束标记
      });
    }
    return result;
  }, [imagesData, viewMode, transformedFoldersData, filter]);

  const columns: ColumnDef<ImagesEntry>[] = [
    {
      id: 'select',
      meta: { span: 1 },
      size: 40,
      minSize: 40,
      header: ({ table }) => <TableRowSelectionHeader table={table} />,
      cell: ({ row }) => {
        if (row.original.isRef) return null;
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
              if (row.original.hidden) {
                return null;
              }
              const imagePath = row.original.isFolder
                ? getFirstImageInFolder(row.original.path)
                : row.original.path;
              return (
                <DynamicThumbnailCell
                  path={imagePath || row.original.path}
                  enableLazyLoad={true}
                  onSizeChange={setThumbnailColumnWidth}
                />
              );
            },
          },
        ]
      : []),
    {
      accessorKey: 'similarity',
      header: t('Similarity'),
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const isGroupEnd = (row.original as any)._isGroupEnd;
        return (
          <div
            style={
              isGroupEnd ? { borderBottom: '2px solid #e5e7eb' } : undefined
            }
          >
            <ClickableCell row={row} value={row.original.similarity} />
          </div>
        );
      },
    },
    {
      accessorKey: 'size',
      header: t('Size'),
      size: 100,
      minSize: 50,
      cell: ({ row }) => {
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
      accessorKey: 'dimensions',
      header: t('Dimensions'),
      size: 100,
      minSize: 100,
      cell: ({ row }) => {
        const isGroupEnd = (row.original as any)._isGroupEnd;
        return (
          <div
            style={
              isGroupEnd ? { borderBottom: '2px solid #e5e7eb' } : undefined
            }
          >
            <ClickableCell row={row} value={row.original.dimensions} />
          </div>
        );
      },
    },
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 150,
      minSize: 100,
      cell: ({ row }) => {
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
      accessorKey: 'path',
      header: t('Path'),
      size: 160,
      minSize: 100,
      cell: ({ row }) => {
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
        // 不加分隔线
        return row.original.modifiedDate;
      },
    },
    {
      id: 'actions',
      size: 55,
      minSize: 55,
      cell: ({ cell }) => {
        // 不加分隔线
        return <TableActions path={cell.row.original.path} />;
      },
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <Button
          variant={viewMode === 'images' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('images')}
        >
          <List className="h-4 w-4 mr-1" />
          相似图片列表
        </Button>
        <Button
          variant={viewMode === 'folders' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('folders')}
        >
          <FolderTree className="h-4 w-4 mr-1" />
          文件夹统计
        </Button>
        {viewMode === 'folders' && (
          <span className="text-sm text-muted-foreground ml-2">
            共 {filteredFoldersData.length} 个文件夹 (≥
            {settings.similarImagesFolderThreshold}张图片)
          </span>
        )}
      </div>
      <DataTable
        className="flex-1 rounded-none border-none grow"
        data={processedData}
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
    </div>
  );
}

function FileName(props: { row: Row<ImagesEntry> }) {
  const { row } = props;
  const { hidden, path, fileName } = row.original;
  const imagesData = useAtomValue(currentToolDataAtom) as BaseImagesEntry[];
  const settings = useAtomValue(settingsAtom);

  if (hidden) {
    return null;
  }

  // 如果是文件夹行，显示文件夹名称并支持点击预览第一张图片
  const isFolder = (row.original as any).isFolder;
  if (isFolder) {
    // 查找该文件夹下的第一张图片
    const firstImage = imagesData.find(
      (img) => img.path.startsWith(path) && !img.isRef,
    );

    if (settings.similarImagesShowImagePreview && firstImage) {
      return (
        <ClickableImagePreview path={firstImage.path}>
          <div className="truncate cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
            📁 {fileName}
          </div>
        </ClickableImagePreview>
      );
    }

    return <div>📁 {fileName}</div>;
  }

  // 原有的图片文件逻辑
  if (settings.similarImagesShowImagePreview) {
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

function ClickablePath(props: { row: Row<ImagesEntry> }) {
  const { row } = props;
  const { path } = row.original;
  const imagesData = useAtomValue(currentToolDataAtom) as BaseImagesEntry[];
  const settings = useAtomValue(settingsAtom);

  // 根据设置格式化路径显示
  const displayPath = formatPathDisplay(path, settings.reversePathDisplay);

  // 如果是文件夹行，支持点击预览第一张图片
  const isFolder = (row.original as any).isFolder;
  if (isFolder) {
    const firstImage = imagesData.find(
      (img) => img.path.startsWith(path) && !img.isRef,
    );

    if (settings.similarImagesShowImagePreview && firstImage) {
      return (
        <ClickableImagePreview path={firstImage.path}>
          <div className="truncate cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
            {displayPath}
          </div>
        </ClickableImagePreview>
      );
    }

    return <div className="truncate">{displayPath}</div>;
  }

  // 原有的图片文件逻辑
  if (settings.similarImagesShowImagePreview) {
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
function ClickableCell(props: { row: Row<ImagesEntry>; value: string }) {
  const { row, value } = props;
  const { path } = row.original;
  const imagesData = useAtomValue(currentToolDataAtom) as BaseImagesEntry[];
  const settings = useAtomValue(settingsAtom);

  // 如果是文件夹行，支持点击预览第一张图片
  const isFolder = (row.original as any).isFolder;
  if (isFolder) {
    const firstImage = imagesData.find(
      (img) => img.path.startsWith(path) && !img.isRef,
    );

    if (settings.similarImagesShowImagePreview && firstImage) {
      return (
        <ClickableImagePreview path={firstImage.path}>
          <div className="cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
            {value}
          </div>
        </ClickableImagePreview>
      );
    }

    return <div>{value}</div>;
  }

  // 原有的图片文件逻辑
  if (settings.similarImagesShowImagePreview) {
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
