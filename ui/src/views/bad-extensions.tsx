import { useAtom, useAtomValue } from 'jotai';
import {
  badExtensionsAtom,
  badExtensionsRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  DataTable,
  createActionsColumn,
  createColumns,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { BadFileEntry } from '~/types';
import { getPathNumber, getPathNumberDisplay } from '~/utils/path-utils';

export function BadExtensions() {
  const data = useAtomValue(badExtensionsAtom);
  const [rowSelection, setRowSelection] = useAtom(
    badExtensionsRowSelectionAtom,
  );
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const columns = createColumns<BadFileEntry>([
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
      accessorKey: 'fileName',
      header: t('File name'),
      size: 170,
      minSize: 100,
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 200,
      minSize: 100,
    },
    {
      accessorKey: 'currentExtension',
      header: t('Current extension'),
      size: 140,
      minSize: 140,
    },
    {
      accessorKey: 'properExtensionsGroup',
      header: t('Proper extension'),
      size: 140,
      minSize: 140,
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
