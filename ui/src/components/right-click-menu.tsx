import type { Row, Table as TTable } from '@tanstack/react-table';
import { ContextMenuItem, ContextMenuSeparator } from './shadcn/context-menu';
import type { DuplicateEntry } from '~/types';
import { ipc } from '~/ipc';

interface RightClickMenuProps<T> {
  row: Row<T>;
  table: TTable<T>;
}

export function DuplicateFilesRightClickMenu({ row, table }: RightClickMenuProps<DuplicateEntry & { _isGroupEnd?: boolean; groupSize?: number; groupId?: number }>) {
  const handleSelectGroup = () => {
    const groupId = row.original.groupId;
    const allRows = table.getRowModel().rows;
    const groupRows = allRows.filter(
      (r) =>
        r.original.groupId === groupId &&
        !r.original.isRef &&
        !r.original.hidden
    );
    const newSelection = { ...table.getState().rowSelection };
    groupRows.forEach((r) => {
      newSelection[r.id] = true;
    });
    table.setRowSelection(newSelection);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(row.original.path);
  };

  const handleCopyFileToClipboard = async () => {
    try {
      console.log('Copying file to clipboard:', row.original.path);
      await ipc.copyFileToClipboard(row.original.path);
      console.log('File copied to clipboard successfully');
    } catch (error) {
      console.error('Failed to copy file to clipboard:', error);
      // 回退到复制路径
      await navigator.clipboard.writeText(row.original.path);
    }
  };

  const handleCopyFileName = () => {
    navigator.clipboard.writeText(row.original.fileName);
  };

  return (
    <>
      <ContextMenuItem onClick={handleSelectGroup}>
        选择该组
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={handleCopyPath}>
        复制文件路径
      </ContextMenuItem>
      <ContextMenuItem onClick={handleCopyFileToClipboard}>
        复制文件到剪贴板
      </ContextMenuItem>
    </>
  );
}