import { useAtom, useAtomValue } from 'jotai';
import { brokenFilesAtom, brokenFilesRowSelectionAtom } from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  DataTable,
  createActionsColumn,
  createColumns,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { BrokenEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';

export function BrokenFiles() {
  const data = useAtomValue(brokenFilesAtom);
  const [rowSelection, setRowSelection] = useAtom(brokenFilesRowSelectionAtom);
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const columns = createColumns<BrokenEntry>([
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 180,
      minSize: 100,
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 200,
      minSize: 100,
      cell: ({ row }) => {
        const displayPath = formatPathDisplay(row.original.path, settings.reversePathDisplay);
        return <div className="truncate">{displayPath}</div>;
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
      data={data}
      columns={columns}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
    />
  );
}
