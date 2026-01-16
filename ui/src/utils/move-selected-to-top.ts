/**
 * 将选中项移到顶部的工具函数
 * 用于在表格中将已选择的行移动到顶部显示
 */

import type { RowSelectionState } from '@tanstack/react-table';

/**
 * 将选中的项移到数组顶部
 * @param data 原始数据数组
 * @param selection 选择状态
 * @param getKey 获取项的唯一键的函数
 * @param isGroupSeparator 判断是否为组分隔符的函数（可选）
 * @returns 重新排序后的数组
 */
export function moveSelectedToTop<T>(
  data: T[],
  selection: RowSelectionState,
  getKey: (item: T) => string,
  isGroupSeparator?: (item: T) => boolean,
): T[] {
  // 如果没有选中项，直接返回原数组
  const selectedKeys = Object.keys(selection).filter((k) => selection[k]);
  if (selectedKeys.length === 0) {
    return data;
  }

  const selectedSet = new Set(selectedKeys);

  // 如果有组分隔符，需要特殊处理
  if (isGroupSeparator) {
    // 分离选中项和未选中项，同时保持组结构
    const selectedItems: T[] = [];
    const unselectedItems: T[] = [];

    for (const item of data) {
      // 跳过组分隔符
      if (isGroupSeparator(item)) {
        // 分隔符跟随未选中项
        unselectedItems.push(item);
        continue;
      }

      const key = getKey(item);
      if (selectedSet.has(key)) {
        selectedItems.push(item);
      } else {
        unselectedItems.push(item);
      }
    }

    return [...selectedItems, ...unselectedItems];
  }

  // 简单情况：没有组分隔符
  const selectedItems: T[] = [];
  const unselectedItems: T[] = [];

  for (const item of data) {
    const key = getKey(item);
    if (selectedSet.has(key)) {
      selectedItems.push(item);
    } else {
      unselectedItems.push(item);
    }
  }

  return [...selectedItems, ...unselectedItems];
}
