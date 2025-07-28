import type { ColumnDef, Row } from '@tanstack/react-table';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import {
  similarImagesAtom,
  similarImagesRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  DataTable,
  TableActions,
  TableRowSelectionCell,
  TableRowSelectionHeader,
} from '~/components/data-table';
import { Badge } from '~/components/shadcn/badge';
import { useT } from '~/hooks';
import type { ImagesEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import {
  SimilarityLevel,
  formatSimilarityDisplay,
  getSimilarityLevel,
  getSimilarityLevelColor,
  getSimilarityLevelText,
  matchesSimilarityFilter,
} from '~/utils/similarity-utils';
import { ClickableImagePreview } from './clickable-image-preview';
import { SimilarityFilter } from './similarity-filter';

export function SimilarImages() {
  const rawData = useAtomValue(similarImagesAtom);
  const [rowSelection, setRowSelection] = useAtom(
    similarImagesRowSelectionAtom,
  );
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  // 相似度筛选状态
  const [similarityFilter, setSimilarityFilter] = useState<{
    level: SimilarityLevel | null;
    operator: 'gte' | 'lte' | 'eq';
  }>({
    level: null,
    operator: 'gte',
  });

  // 获取哈希大小设置
  const hashSize = parseInt(settings.similarImagesSubHashSize, 10) || 16;

  // 应用相似度筛选
  const data = useMemo(() => {
    if (!similarityFilter.level) {
      return rawData;
    }

    return rawData.filter((item) =>
      matchesSimilarityFilter(
        item.similarity,
        hashSize,
        similarityFilter.level,
        similarityFilter.operator
      )
    );
  }, [rawData, similarityFilter, hashSize]);

  const handleSimilarityFilterChange = (
    level: SimilarityLevel | null,
    operator: 'gte' | 'lte' | 'eq'
  ) => {
    setSimilarityFilter({ level, operator });
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
      size: 160,
      minSize: 140,
      cell: ({ row }) => {
        const similarity = row.original.similarity;
        const similarityNum = parseInt(similarity, 10);
        if (isNaN(similarityNum)) {
          return <ClickableCell row={row} value={similarity} />;
        }

        const level = getSimilarityLevel(similarityNum, hashSize);
        const levelText = getSimilarityLevelText(level);
        const colorClass = getSimilarityLevelColor(level);
        const displayText = formatSimilarityDisplay(similarity, hashSize);

        return (
          <ClickableCell row={row} value={
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${colorClass}`} variant="secondary">
                {levelText}
              </Badge>
              <span className="text-sm">{similarity}</span>
            </div>
          } />
        );
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
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('Hash size')}: {hashSize}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('Total')}: {data.length}
          </span>
        </div>
        <SimilarityFilter
          onFilterChange={handleSimilarityFilterChange}
          currentFilter={similarityFilter}
          hashSize={hashSize}
        />
      </div>
      <DataTable
        className="flex-1 rounded-none border-none"
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

  const settings = useAtomValue(settingsAtom);

  if (hidden) {
    return null;
  }

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
  const settings = useAtomValue(settingsAtom);

  // 根据设置格式化路径显示
  const displayPath = formatPathDisplay(path, settings.reversePathDisplay);

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
function ClickableCell(props: { row: Row<ImagesEntry>; value: React.ReactNode }) {
  const { row, value } = props;
  const { path } = row.original;
  const settings = useAtomValue(settingsAtom);

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
