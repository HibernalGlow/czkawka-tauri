import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { atom } from 'jotai';
import type { FilterStateUpdater, RowSelectionUpdater, SortingStateUpdater } from '~/components/data-table';
import type { BaseEntry, FolderStat } from '~/types';
import {
  currentToolAtom,
  filterAtom,
  progressAtom,
  rowSelectionAtom,
  searchInputValueAtom,
  sortingAtom,
  toolDataAtom,
} from './primitive';

// 相似图片文件夹统计数据
export const similarImagesFoldersAtom = atom<FolderStat[]>([]);

export const currentToolDataAtom = atom(
  (get) => {
    const currentTool = get(currentToolAtom);
    const toolData = get(toolDataAtom);
    return toolData[currentTool];
  },
  (get, set, data: any[] | any[][]) => {
    const currentTool = get(currentToolAtom);
    const toolData = get(toolDataAtom);
    set(toolDataAtom, {
      ...toolData,
      [currentTool]: data,
    });
  },
);

export const toolInProgressDataAtom = atom(
  (get) => {
    const progress = get(progressAtom);
    if (!progress.tool) {
      return null;
    }
    const toolData = get(toolDataAtom);
    return toolData[progress.tool];
  },
  (get, set, data: any[] | any[][]) => {
    const progress = get(progressAtom);
    if (!progress.tool) {
      return;
    }
    const toolData = get(toolDataAtom);
    set(toolDataAtom, {
      ...toolData,
      [progress.tool]: data,
    });
  },
);

export const currentToolRowSelectionAtom = atom(
  (get) => {
    const currentTool = get(currentToolAtom);
    const rowSelection = get(rowSelectionAtom);
    return rowSelection[currentTool];
  },
  (get, set, updater: RowSelectionUpdater) => {
    const currentTool = get(currentToolAtom);
    const rowSelection = get(rowSelectionAtom);
    set(rowSelectionAtom, {
      ...rowSelection,
      [currentTool]:
        typeof updater === 'function'
          ? updater(rowSelection[currentTool])
          : updater,
    });
  },
);

export const toolInProgressRowSelectionAtom = atom(
  (get) => {
    const progress = get(progressAtom);
    if (!progress.tool) {
      return null;
    }
    const rowSelection = get(rowSelectionAtom);
    return rowSelection[progress.tool];
  },
  (get, set, updater: RowSelectionUpdater) => {
    const progress = get(progressAtom);
    if (!progress.tool) {
      return;
    }
    const rowSelection = get(rowSelectionAtom);
    set(rowSelectionAtom, {
      ...rowSelection,
      [progress.tool]:
        typeof updater === 'function'
          ? updater(rowSelection[progress.tool])
          : updater,
    });
  },
);

export const clearToolInProgressRowSelectionAtom = atom(null, (get, set) => {
  const progress = get(progressAtom);
  if (!progress.tool) {
    return;
  }
  const rowSelection = get(rowSelectionAtom);
  set(rowSelectionAtom, {
    ...rowSelection,
    [progress.tool]: {},
  });
});

export const currentToolSortingAtom = atom(
  (get) => {
    const currentTool = get(currentToolAtom);
    const sorting = get(sortingAtom);
    return sorting[currentTool];
  },
  (get, set, updater: SortingStateUpdater) => {
    const currentTool = get(currentToolAtom);
    const sorting = get(sortingAtom);
    set(sortingAtom, {
      ...sorting,
      [currentTool]:
        typeof updater === 'function' ? updater(sorting[currentTool]) : updater,
    });
  },
);

export const currentToolFilterAtom = atom(
  (get) => {
    const currentTool = get(currentToolAtom);
    const filter = get(filterAtom);
    return filter[currentTool];
  },
  (get, set, updater: FilterStateUpdater) => {
    const currentTool = get(currentToolAtom);
    const filter = get(filterAtom);
    set(filterAtom, {
      ...filter,
      [currentTool]:
        typeof updater === 'function' ? updater(filter[currentTool]) : updater,
    });
  },
);

export const restoreFilterAtom = atom(null, (get, set) => {
  const filter = get(currentToolFilterAtom);
  set(searchInputValueAtom, filter);
});
