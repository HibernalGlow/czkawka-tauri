import type { ColumnDef } from '@tanstack/react-table';
import { useAtom, useAtomValue } from 'jotai';
import {
  similarVideosAtom,
  similarVideosRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  DataTable,
  TableActions,
  TableRowSelectionCell,
  TableRowSelectionHeader,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { VideosEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import { ClickableVideoPreview } from './clickable-video-preview';

export function SimilarVideos() {
  const data = useAtomValue(similarVideosAtom);
  const [rowSelection, setRowSelection] = useAtom(
    similarVideosRowSelectionAtom,
  );
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const columns: ColumnDef<VideosEntry>[] = [
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
      accessorKey: 'size',
      header: t('Size'),
      size: 110,
      minSize: 50,
    },
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 180,
      minSize: 100,
      cell: ({ row }) => {
        if (row.original.hidden) return null;
        const { path, fileName } = row.original;
        return (
          <ClickableVideoPreview path={path}>
            <div className="truncate cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
              {fileName}
            </div>
          </ClickableVideoPreview>
        );
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
        const displayPath = formatPathDisplay(
          row.original.path,
          settings.reversePathDisplay,
        );
        return (
          <ClickableVideoPreview path={row.original.path}>
            <div className="truncate cursor-pointer hover:bg-accent/20 rounded px-1 py-0.5 transition-colors">
              {displayPath}
            </div>
          </ClickableVideoPreview>
        );
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
    />
  );
}
