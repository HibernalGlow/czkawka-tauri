import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { settingsAtom } from '~/atom/settings';
import {
  currentToolDataAtom,
  currentToolFilterAtom,
  currentToolRowSelectionAtom,
} from '~/atom/tools';
import {
  DataTable,
  FilterStateUpdater,
  createActionsColumn,
  createColumns,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { FileEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import { filterItems } from '~/utils/table-helper';

export function BigFiles() {
  const data = useAtomValue(currentToolDataAtom) as FileEntry[];
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const filteredData = useMemo(() => {
    return filterItems(data, filter, ['fileName', 'path']);
  }, [data, filter]);

  const columns = createColumns<FileEntry>([
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
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 320,
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
