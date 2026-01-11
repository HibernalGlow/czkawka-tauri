import { useAtom, useAtomValue } from 'jotai';
import {
  badExtensionsAtom,
  badExtensionsRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import { currentToolFilterAtom } from '~/atom/tools';
import {
  DataTable,
  FilterStateUpdater,
  createActionsColumn,
  createColumns,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { BadFileEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import { filterItems } from '~/utils/table-helper';

export function BadExtensions() {
  const data = useAtomValue(badExtensionsAtom);
  const [rowSelection, setRowSelection] = useAtom(
    badExtensionsRowSelectionAtom,
  );
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const filteredData = useMemo(() => {
    return filterItems(data, filter, [
      'fileName',
      'path',
      'currentExtension',
      'properExtension',
    ]);
  }, [data, filter]);

  const columns = createColumns<BadFileEntry>([
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
      cell: ({ row }) => {
        const displayPath = formatPathDisplay(
          row.original.path,
          settings.reversePathDisplay,
        );
        return <div className="truncate">{displayPath}</div>;
      },
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
      data={filteredData}
      columns={columns}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      globalFilter={filter}
      onGlobalFilterChange={(updater: FilterStateUpdater) => {
        const newValue =
          typeof updater === 'function' ? updater(filter) : updater;
        setFilter(newValue);
      }}
    />
  );
}
