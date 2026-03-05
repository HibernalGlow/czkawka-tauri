import { type RefObject, useCallback, useRef, useState } from 'react';
import type { Row, RowSelectionState, Table as TTable } from '@tanstack/react-table';
import {
  useSelectionContainer,
  boxesIntersect,
  type Box,
} from '@air/react-drag-to-select';

interface UseBoxSelectOptions<T> {
  containerRef: RefObject<HTMLDivElement | null>;
  rows: Row<T>[];
  rowHeight: number;
  table: TTable<T>;
}

/**
 * Hook that integrates @air/react-drag-to-select with our virtualized DataTable.
 * Returns a DragSelection component to render and handles row selection on drag.
 */
export function useBoxSelect<T>(options: UseBoxSelectOptions<T>) {
  const { containerRef, rows, rowHeight, table } = options;

  const ctrlHeld = useRef(false);
  const selectionSnapshot = useRef<RowSelectionState>({});

  const handleSelectionChange = useCallback(
    (box: Box) => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      // Adjust box coordinates to content-space (account for scroll)
      const adjustedBox: Box = {
        ...box,
        top: box.top + scrollTop,
      };

      const hitIds: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const orig = row.original as { isRef?: boolean; hidden?: boolean };
        if (orig.isRef || orig.hidden) continue;

        const rowBox: Box = {
          left: 0,
          top: i * rowHeight,
          width: container.scrollWidth,
          height: rowHeight,
        };

        if (boxesIntersect(adjustedBox, rowBox)) {
          hitIds.push(row.id);
        }
      }

      let newSelection: RowSelectionState;
      if (ctrlHeld.current) {
        // Ctrl+drag: toggle from snapshot
        newSelection = { ...selectionSnapshot.current };
        for (const id of hitIds) {
          if (selectionSnapshot.current[id]) {
            delete newSelection[id];
          } else {
            newSelection[id] = true;
          }
        }
      } else {
        // Normal drag: replace selection
        newSelection = {};
        for (const id of hitIds) {
          newSelection[id] = true;
        }
      }
      table.setRowSelection(newSelection);
    },
    [containerRef, rows, rowHeight, table],
  );

  const handleSelectionStart = useCallback(() => {
    selectionSnapshot.current = { ...table.getState().rowSelection };
  }, [table]);

  const shouldStartSelecting = useCallback((target: EventTarget | null) => {
    if (target instanceof HTMLElement) {
      // Don't start box select on interactive elements
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('a') ||
        target.closest('[role="checkbox"]') ||
        target.closest('[data-no-box-select]')
      ) {
        return false;
      }
    }
    return true;
  }, []);

  const { DragSelection } = useSelectionContainer({
    onSelectionChange: handleSelectionChange,
    onSelectionStart: handleSelectionStart,
    shouldStartSelecting,
    eventsElement: containerRef.current,
    selectionProps: {
      style: {
        border: '1px solid rgba(59, 130, 246, 0.5)',
        background: 'rgba(59, 130, 246, 0.15)',
        position: 'absolute' as const,
        zIndex: 50,
      },
    },
  });

  // Track Ctrl key state via a mousedown listener on the container
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    ctrlHeld.current = e.ctrlKey || e.metaKey;
  }, []);

  return {
    DragSelection,
    containerMouseDown: onMouseDown,
  };
}
