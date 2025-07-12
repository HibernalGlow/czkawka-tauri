import { useAtom, useAtomValue } from 'jotai';
import {
  emptyFoldersAtom,
  emptyFoldersRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  DataTable,
  createActionsColumn,
  createColumns,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { FolderEntry } from '~/types';
import { getPathNumber, getPathNumberDisplay } from '~/utils/path-utils';

export function EmptyFolders() {
  const data = useAtomValue(emptyFoldersAtom);
  const [rowSelection, setRowSelection] = useAtom(emptyFoldersRowSelectionAtom);
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const columns = createColumns<FolderEntry>([
    {
      accessorKey: 'pathNumber',
      header: t('No.'),
      size: 60,
      minSize: 60,
      cell: ({ row }) => {
        const pathNumber = getPathNumber(row.original.path, settings);
        return (
          <span className="text-blue-600 font-medium">
            {getPathNumberDisplay(pathNumber)}
          </span>
        );
      },
    },
    {
      accessorKey: 'folderName',
      header: t('Folder name'),
      size: 180,
      minSize: 100,
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 430,
      minSize: 100,
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
