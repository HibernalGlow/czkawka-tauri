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
  createColumns,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { SymlinksFileEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';
import { filterItems } from '~/utils/table-helper';

export function InvalidSymlinks() {
  const data = useAtomValue(currentToolDataAtom) as SymlinksFileEntry[];
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const filteredData = useMemo(() => {
    return filterItems(data, filter, [
      'symlinkName',
      'path',
      'destinationPath',
      'typeOfError',
    ]);
  }, [data, filter]);

  const columns = createColumns<SymlinksFileEntry>([
    {
      accessorKey: 'symlinkName',
      header: t('Symlink name'),
      size: 180,
      minSize: 110,
    },
    {
      accessorKey: 'path',
      header: t('Symlink path'),
      size: 220,
      minSize: 110,
      cell: ({ row }) => {
        const displayPath = formatPathDisplay(
          row.original.path,
          settings.reversePathDisplay,
        );
        return <div className="truncate">{displayPath}</div>;
      },
    },
    {
      accessorKey: 'destinationPath',
      header: t('Destination path'),
      size: 220,
      minSize: 130,
      cell: ({ row }) => {
        const displayPath = formatPathDisplay(
          row.original.destinationPath,
          settings.reversePathDisplay,
        );
        return <div className="truncate">{displayPath}</div>;
      },
    },
    {
      accessorKey: 'typeOfError',
      header: t('Type of error'),
      size: 140,
      minSize: 110,
    },
    {
      accessorKey: 'modifiedDate',
      header: t('Modified date'),
      size: 160,
      minSize: 120,
    },
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
