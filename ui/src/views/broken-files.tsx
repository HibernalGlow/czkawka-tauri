import { useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { settingsAtom } from '~/atom/settings';
import {
  currentToolDataAtom,
  currentToolFilterAtom,
  currentToolRowSelectionAtom,
} from '~/atom/tools';
import {
  createActionsColumn,
  createColumns,
  DataTable,
  FilterStateUpdater,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { BrokenEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import { filterItems } from '~/utils/table-helper';
import { ClickablePreview } from './clickable-preview';

export function BrokenFiles() {
  const data = useAtomValue(currentToolDataAtom) as BrokenEntry[];
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const filteredData = useMemo(() => {
    return filterItems(data, filter, ['fileName', 'path', 'errorString']);
  }, [data, filter]);

  const columns = createColumns<BrokenEntry>([
    {
      accessorKey: 'fileName',
      header: t('File name'),
      size: 180,
      minSize: 100,
      cell: ({ row }) => (
        <ClickablePreview path={row.original.path}>
          <div className="truncate">{row.original.fileName}</div>
        </ClickablePreview>
      ),
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
        return (
          <ClickablePreview path={row.original.path}>
            <div className="truncate">{displayPath}</div>
          </ClickablePreview>
        );
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
