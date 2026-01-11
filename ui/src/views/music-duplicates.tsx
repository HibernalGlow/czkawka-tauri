import type { ColumnDef } from '@tanstack/react-table';

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
  TableActions,
  TableRowSelectionCell,
  TableRowSelectionHeader,
} from '~/components/data-table';
import { useT } from '~/hooks';
import type { MusicEntry } from '~/types';
import { formatPathDisplay } from '~/utils/path-utils';

export function MusicDuplicates() {
  const data = useAtomValue(currentToolDataAtom) as MusicEntry[];
  const [rowSelection, setRowSelection] = useAtom(currentToolRowSelectionAtom);
  const [filter, setFilter] = useAtom(currentToolFilterAtom);
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  const filteredData = useMemo(() => {
    if (!filter) return data;

    const lowercaseFilter = filter.toLowerCase();
    const filtered = data.filter((item) => {
      if (item.hidden) return true;
      return (
        item.fileName?.toLowerCase().includes(lowercaseFilter) ||
        item.path?.toLowerCase().includes(lowercaseFilter) ||
        item.trackTitle?.toLowerCase().includes(lowercaseFilter) ||
        item.trackArtist?.toLowerCase().includes(lowercaseFilter)
      );
    });

    // 清理空的组
    const cleaned: typeof filtered = [];
    let tempGroup: typeof filtered = [];
    for (const item of filtered) {
      if (item.hidden) {
        if (tempGroup.length > 0) {
          cleaned.push(...tempGroup, item);
        }
        tempGroup = [];
      } else {
        tempGroup.push(item);
      }
    }
    if (tempGroup.length > 0) cleaned.push(...tempGroup);
    return cleaned;
  }, [data, filter]);

  const columns: ColumnDef<MusicEntry>[] = [
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
    },
    {
      accessorKey: 'trackTitle',
      header: t('Title'),
      size: 100,
      minSize: 60,
    },
    {
      accessorKey: 'trackArtist',
      header: t('Artist'),
      size: 100,
      minSize: 60,
    },
    {
      accessorKey: 'year',
      header: t('Year'),
      size: 100,
      minSize: 60,
    },
    {
      accessorKey: 'bitrate',
      header: t('Bitrate'),
      size: 100,
      minSize: 70,
    },
    {
      accessorKey: 'length',
      header: t('Length'),
      size: 100,
      minSize: 70,
    },
    {
      accessorKey: 'path',
      header: t('Path'),
      size: 220,
      minSize: 100,
      cell: ({ row }) => {
        if (row.original.hidden) {
          return null;
        }
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
