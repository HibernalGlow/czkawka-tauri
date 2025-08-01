import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import {
  badExtensionsAtom,
  badExtensionsRowSelectionAtom,
  bigFilesAtom,
  bigFilesRowSelectionAtom,
  brokenFilesAtom,
  brokenFilesRowSelectionAtom,
  currentToolAtom,
  duplicateFilesAtom,
  duplicateFilesRowSelectionAtom,
  emptyFilesAtom,
  emptyFilesRowSelectionAtom,
  emptyFoldersAtom,
  emptyFoldersRowSelectionAtom,
  invalidSymlinksAtom,
  invalidSymlinksRowSelectionAtom,
  musicDuplicatesAtom,
  musicDuplicatesRowSelectionAtom,
  similarImagesAtom,
  similarImagesRowSelectionAtom,
  similarVideosAtom,
  similarVideosRowSelectionAtom,
  temporaryFilesAtom,
  temporaryFilesRowSelectionAtom,
} from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import { Tools } from '~/consts';
import type { BaseEntry } from '~/types';

export interface SelectionStats {
  count: number;
  totalSize: number;
  formats: string[];
  deleteMode: 'trash' | 'permanent';
}

// 工具到数据和选中项的映射
const toolDataMap = {
  [Tools.DuplicateFiles]: {
    dataAtom: duplicateFilesAtom,
    selectionAtom: duplicateFilesRowSelectionAtom,
  },
  [Tools.EmptyFolders]: {
    dataAtom: emptyFoldersAtom,
    selectionAtom: emptyFoldersRowSelectionAtom,
  },
  [Tools.BigFiles]: {
    dataAtom: bigFilesAtom,
    selectionAtom: bigFilesRowSelectionAtom,
  },
  [Tools.EmptyFiles]: {
    dataAtom: emptyFilesAtom,
    selectionAtom: emptyFilesRowSelectionAtom,
  },
  [Tools.TemporaryFiles]: {
    dataAtom: temporaryFilesAtom,
    selectionAtom: temporaryFilesRowSelectionAtom,
  },
  [Tools.SimilarImages]: {
    dataAtom: similarImagesAtom,
    selectionAtom: similarImagesRowSelectionAtom,
  },
  [Tools.SimilarVideos]: {
    dataAtom: similarVideosAtom,
    selectionAtom: similarVideosRowSelectionAtom,
  },
  [Tools.MusicDuplicates]: {
    dataAtom: musicDuplicatesAtom,
    selectionAtom: musicDuplicatesRowSelectionAtom,
  },
  [Tools.InvalidSymlinks]: {
    dataAtom: invalidSymlinksAtom,
    selectionAtom: invalidSymlinksRowSelectionAtom,
  },
  [Tools.BrokenFiles]: {
    dataAtom: brokenFilesAtom,
    selectionAtom: brokenFilesRowSelectionAtom,
  },
  [Tools.BadExtensions]: {
    dataAtom: badExtensionsAtom,
    selectionAtom: badExtensionsRowSelectionAtom,
  },
} as const;

/**
 * 获取当前工具的文件选中统计信息
 */
export function useTableSelectionStats(): SelectionStats | null {
  const currentTool = useAtomValue(currentToolAtom);
  const settings = useAtomValue(settingsAtom);

  // 获取当前工具对应的数据和选中项
  const toolConfig = toolDataMap[currentTool];
  const data = useAtomValue(
    toolConfig?.dataAtom || duplicateFilesAtom,
  ) as BaseEntry[];
  const rowSelection = useAtomValue(
    toolConfig?.selectionAtom || duplicateFilesRowSelectionAtom,
  );

  const stats = useMemo(() => {
    if (!data?.length || !Object.keys(rowSelection).length) {
      return null;
    }

    // 获取选中的文件
    const selectedItems = data.filter(
      (item, index) => rowSelection[item.path] || rowSelection[index],
    );

    if (!selectedItems.length) {
      return null;
    }

    // 计算总大小
    const totalSize = selectedItems.reduce((sum, item) => {
      // 尝试从不同的属性中获取文件大小
      const size =
        ('size' in item ? item.size : 0) ||
        ('fileSize' in item ? item.fileSize : 0) ||
        0;

      // 处理字符串格式的大小（如 "1.5 MB"）
      if (typeof size === 'string') {
        const sizeStr = size.toLowerCase();
        const numMatch = sizeStr.match(/[\d.]+/);
        if (!numMatch) return sum;

        const num = Number.parseFloat(numMatch[0]);
        if (sizeStr.includes('gb')) return sum + num * 1024 * 1024 * 1024;
        if (sizeStr.includes('mb')) return sum + num * 1024 * 1024;
        if (sizeStr.includes('kb')) return sum + num * 1024;
        return sum + num;
      }

      return sum + (typeof size === 'number' ? size : 0);
    }, 0);

    // 提取文件格式（不限制数量）
    const formats = Array.from(
      new Set(
        selectedItems
          .map((item) => {
            // 从文件名或路径中提取扩展名
            const fileName =
              ('fileName' in item ? String(item.fileName) : '') ||
              ('name' in item ? String(item.name) : '') ||
              String(item.path);
            const match = fileName.match(/\.([^.]+)$/);
            return match ? match[1].toLowerCase() : '';
          })
          .filter(Boolean),
      ),
    ); // 移除数量限制

    return {
      count: selectedItems.length,
      totalSize,
      formats,
      deleteMode: settings.moveDeletedFilesToTrash
        ? ('trash' as const)
        : ('permanent' as const),
    };
  }, [data, rowSelection, settings.moveDeletedFilesToTrash]);

  return stats;
}
