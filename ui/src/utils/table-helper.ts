import type { BaseEntry } from '~/types';

export function filterGroups<T extends BaseEntry>(
  groups: T[][],
  filter: string,
  filterKeys: (keyof T)[],
): T[][] {
  if (!filter) {
    return groups;
  }

  const lowercaseFilter = filter.toLowerCase();

  const filtered = groups
    .map((group) => {
      return group.filter((item) => {
        for (const key of filterKeys) {
          const value = item[key];
          if (typeof value !== 'string') {
            continue;
          }
          if (value.toLowerCase().includes(lowercaseFilter)) {
            return true;
          }
        }
        return false;
      });
    })
    .filter((group) => group.length > 0);

  return filtered;
}

// For non-grouped data
export function filterItems<T extends BaseEntry>(
  items: T[],
  filter: string,
  filterKeys: (keyof T)[],
): T[] {
  if (!filter) {
    return items;
  }

  const lowercaseFilter = filter.toLowerCase();

  return items.filter((item) => {
    for (const key of filterKeys) {
      const value = item[key];
      if (typeof value !== 'string') {
        continue;
      }
      if (value.toLowerCase().includes(lowercaseFilter)) {
        return true;
      }
    }
    return false;
  });
}
