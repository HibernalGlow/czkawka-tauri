import type { ColumnDef, Row } from '@tanstack/react-table';
import { useAtom, useAtomValue } from 'jotai';
import { FolderTree, List } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  similarImagesAtom,
  similarImagesRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import { similarImagesFoldersAtom } from '~/atom/tools';
import { Button } from '~/components';
import {
  DataTable,
  TableActions,
  TableRowSelectionCell,
  TableRowSelectionHeader,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { FolderStat, ImagesEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import { ClickableImagePreview } from './clickable-image-preview';

export function SimilarImages() {
  const [viewMode, setViewMode] = useState<'images' | 'folders'>('images');
  const imagesData = useAtomValue(similarImagesAtom);
  const foldersData = useAtomValue(similarImagesFoldersAtom);
  const settings = useAtomValue(settingsAtom);

  const [rowSelection, setRowSelection] = useAtom(
    similarImagesRowSelectionAtom,
  );
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

  const columns: ColumnDef<ImagesEntry>[] = [
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
    {
      accessorKey: 'similarity',
      header: t('Similarity'),
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        return <ClickableCell row={row} value={row.original.similarity} />;
      },
    },
    {
      accessorKey: 'size',
      header: t('Size'),
      size: 100,
      minSize: 50,
      cell: ({ row }) => {
        return <ClickableCell row={row} value={row.original.size} />;
      },
    },
    {
      accessorKey: 'dimensions',
      header: t('Dimensions'),
      size: 100,
      minSize: 100,
      cell: ({ row }) => {
        return <ClickableCell row={row} value={row.original.dimensions} />;
      },
    },
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 150,
      minSize: 100,
      cell: ({ row }) => {
        return <FileName row={row} />;
      },
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 160,
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
        data={data}
        columns={columns}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}

function FileName(props: { row: Row<ImagesEntry> }) {
  const { row } = props;
  const { hidden, path, fileName } = row.original;
  const imagesData = useAtomValue(similarImagesAtom);
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
  const imagesData = useAtomValue(similarImagesAtom);
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
  const imagesData = useAtomValue(similarImagesAtom);
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
