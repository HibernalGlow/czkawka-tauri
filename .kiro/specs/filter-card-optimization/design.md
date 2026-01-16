# Design Document: Filter Card Optimization

## Overview

过滤器卡片优化功能参考 Duplicate Cleaner Pro 的设计，将现有的过滤器面板改造为更强大、更直观的过滤系统。系统采用模块化的过滤器架构，支持多种过滤维度的组合，并与现有的选择助手系统集成。

### 技术选型

- **状态管理**: Jotai（与现有项目一致）
- **配置验证**: `zod` - 用于过滤器配置验证
- **UI组件**: 复用现有 shadcn/ui 组件
- **持久化**: `atomWithStorage` - 用于过滤器配置持久化

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Filter Panel                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Filter Engine  │  │  Filter State   │  │  Filter Stats   │  │
│  │                 │◄─┤  (Jotai Atoms)  │◄─┤                 │  │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘  │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Filter Categories                         ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   ││
│  │  │Mark Status│ │  Group    │ │ File Size │ │ Extension │   ││
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   ││
│  │  │   Date    │ │   Path    │ │Similarity │ │Resolution │   ││
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Action Bar                                ││
│  │  [刷新] [清除过滤器]  显示 50/200 项 | 3 个过滤器激活        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 过滤器类型定义

```typescript
// ui/src/lib/filter-panel/types.ts

/** 过滤器类别 */
export type FilterCategory = 
  | 'markStatus'      // 标记状态
  | 'groupCount'      // 组别文件数量
  | 'groupSize'       // 组别大小
  | 'fileSize'        // 文件大小
  | 'extension'       // 扩展名
  | 'modifiedDate'    // 修改日期
  | 'path'            // 路径
  | 'similarity'      // 相似度
  | 'resolution'      // 分辨率
  | 'selection'       // 已选择
  | 'preset';         // 预设

/** 标记状态选项 */
export type MarkStatusOption = 
  | 'marked'              // 已标记
  | 'unmarked'            // 未标记
  | 'groupHasSomeMarked'  // 存在部分标记项目的组别
  | 'groupAllUnmarked'    // 所有项目均无标记的组别
  | 'groupSomeNotAll'     // 存在部分但非全部标记的组别
  | 'groupAllMarked'      // 所有项目均被标记的组别
  | 'protected';          // 已保护

/** 范围过滤器配置 */
export interface RangeFilterConfig {
  enabled: boolean;
  min: number;
  max: number;
  unit?: SizeUnit;
}

/** 大小单位 */
export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB';

/** 日期范围预设 */
export type DatePreset = 'today' | 'last7days' | 'last30days' | 'lastYear' | 'custom';

/** 日期过滤器配置 */
export interface DateFilterConfig {
  enabled: boolean;
  preset: DatePreset;
  startDate?: number;  // timestamp
  endDate?: number;    // timestamp
}

/** 路径过滤器配置 */
export interface PathFilterConfig {
  enabled: boolean;
  mode: 'contains' | 'notContains' | 'startsWith' | 'endsWith';
  pattern: string;
  caseSensitive: boolean;
}

/** 相似度过滤器配置 */
export interface SimilarityFilterConfig {
  enabled: boolean;
  min: number;  // 0-100
  max: number;  // 0-100
}

/** 分辨率过滤器配置 */
export interface ResolutionFilterConfig {
  enabled: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'any';
}

/** 扩展名过滤器配置 */
export interface ExtensionFilterConfig {
  enabled: boolean;
  extensions: string[];
  mode: 'include' | 'exclude';
}

/** 预设类型 */
export type FilterPreset = 
  | 'none'
  | 'largeFilesFirst'
  | 'smallFilesFirst'
  | 'recentlyModified'
  | 'oldFiles';

/** 完整过滤器状态 */
export interface FilterState {
  // 标记状态过滤
  markStatus: {
    enabled: boolean;
    options: MarkStatusOption[];
  };
  // 组别过滤（文件数量）
  groupCount: RangeFilterConfig;
  // 组别过滤（大小）
  groupSize: RangeFilterConfig;
  // 文件大小过滤
  fileSize: RangeFilterConfig;
  // 扩展名过滤
  extension: ExtensionFilterConfig;
  // 修改日期过滤
  modifiedDate: DateFilterConfig;
  // 路径过滤
  path: PathFilterConfig;
  // 相似度过滤（仅相似图片/视频）
  similarity: SimilarityFilterConfig;
  // 分辨率过滤（仅图片/视频）
  resolution: ResolutionFilterConfig;
  // 已选择项过滤
  selectionOnly: boolean;
  // 在已过滤的组中显示所有文件
  showAllInFilteredGroups: boolean;
  // 当前预设
  preset: FilterPreset;
}

/** 过滤结果统计 */
export interface FilterStats {
  totalItems: number;
  filteredItems: number;
  totalGroups: number;
  filteredGroups: number;
  totalSize: number;
  filteredSize: number;
  activeFilterCount: number;
}
```

### 2. 过滤器引擎

```typescript
// ui/src/lib/filter-panel/filter-engine.ts

import type { BaseEntry, RefEntry } from '~/types';
import type { FilterState, FilterStats } from './types';

/** 过滤器上下文 */
export interface FilterContext<T extends BaseEntry & Partial<RefEntry>> {
  data: T[];
  selection: Set<string>;
  filterState: FilterState;
}

/** 过滤器结果 */
export interface FilterResult<T> {
  filteredData: T[];
  stats: FilterStats;
}

/** 过滤器引擎类 */
export class FilterEngine {
  /**
   * 应用所有过滤器
   */
  static applyFilters<T extends BaseEntry & Partial<RefEntry>>(
    ctx: FilterContext<T>
  ): FilterResult<T>;

  /**
   * 应用标记状态过滤
   */
  static applyMarkStatusFilter<T extends BaseEntry & Partial<RefEntry>>(
    data: T[],
    options: MarkStatusOption[],
    selection: Set<string>
  ): T[];

  /**
   * 应用组别过滤（文件数量）
   */
  static applyGroupCountFilter<T extends BaseEntry & Partial<RefEntry>>(
    data: T[],
    config: RangeFilterConfig
  ): T[];

  /**
   * 应用组别过滤（大小）
   */
  static applyGroupSizeFilter<T extends BaseEntry & Partial<RefEntry>>(
    data: T[],
    config: RangeFilterConfig
  ): T[];

  /**
   * 应用文件大小过滤
   */
  static applyFileSizeFilter<T extends BaseEntry & Partial<RefEntry>>(
    data: T[],
    config: RangeFilterConfig
  ): T[];

  /**
   * 计算过滤统计
   */
  static calculateStats<T extends BaseEntry & Partial<RefEntry>>(
    originalData: T[],
    filteredData: T[],
    filterState: FilterState
  ): FilterStats;
}
```

### 3. 过滤器工具函数

```typescript
// ui/src/lib/filter-panel/utils.ts

/** 解析文件大小字符串为字节数 */
export function parseSizeToBytes(sizeStr: string): number;

/** 格式化字节数为可读字符串 */
export function formatBytes(bytes: number, unit?: SizeUnit): string;

/** 转换大小单位 */
export function convertSize(value: number, fromUnit: SizeUnit, toUnit: SizeUnit): number;

/** 获取文件扩展名 */
export function getFileExtension(path: string): string;

/** 检查路径是否匹配模式 */
export function matchPath(
  path: string, 
  pattern: string, 
  mode: 'contains' | 'notContains' | 'startsWith' | 'endsWith',
  caseSensitive: boolean
): boolean;

/** 获取组内文件数量 */
export function getGroupFileCount<T extends BaseEntry & Partial<RefEntry>>(
  data: T[],
  groupId: number
): number;

/** 获取组内文件总大小 */
export function getGroupTotalSize<T extends BaseEntry & Partial<RefEntry>>(
  data: T[],
  groupId: number
): number;

/** 检查组的标记状态 */
export function getGroupMarkStatus<T extends BaseEntry & Partial<RefEntry>>(
  data: T[],
  groupId: number,
  selection: Set<string>
): 'allMarked' | 'allUnmarked' | 'someMarked' | 'someNotAll';
```

## Data Models

### Jotai Atoms

```typescript
// ui/src/atom/filter-panel.ts

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { FilterState, FilterStats } from '~/lib/filter-panel/types';

/** 默认过滤器状态 */
export const defaultFilterState: FilterState = {
  markStatus: {
    enabled: false,
    options: [],
  },
  groupCount: {
    enabled: false,
    min: 2,
    max: 100,
  },
  groupSize: {
    enabled: false,
    min: 0,
    max: 100 * 1024 * 1024 * 1024, // 100GB
    unit: 'MB',
  },
  fileSize: {
    enabled: false,
    min: 0,
    max: 100 * 1024 * 1024 * 1024, // 100GB
    unit: 'MB',
  },
  extension: {
    enabled: false,
    extensions: [],
    mode: 'include',
  },
  modifiedDate: {
    enabled: false,
    preset: 'custom',
  },
  path: {
    enabled: false,
    mode: 'contains',
    pattern: '',
    caseSensitive: false,
  },
  similarity: {
    enabled: false,
    min: 0,
    max: 100,
  },
  resolution: {
    enabled: false,
    aspectRatio: 'any',
  },
  selectionOnly: false,
  showAllInFilteredGroups: true,
  preset: 'none',
};

/** 过滤器状态 atom（持久化） */
export const filterStateAtom = atomWithStorage<FilterState>(
  'filter-panel-state',
  defaultFilterState
);

/** 过滤器统计 atom */
export const filterStatsAtom = atom<FilterStats>({
  totalItems: 0,
  filteredItems: 0,
  totalGroups: 0,
  filteredGroups: 0,
  totalSize: 0,
  filteredSize: 0,
  activeFilterCount: 0,
});

/** 过滤器是否激活 atom */
export const isFilterActiveAtom = atom((get) => {
  const state = get(filterStateAtom);
  return (
    state.markStatus.enabled ||
    state.groupCount.enabled ||
    state.groupSize.enabled ||
    state.fileSize.enabled ||
    state.extension.enabled ||
    state.modifiedDate.enabled ||
    state.path.enabled ||
    state.similarity.enabled ||
    state.resolution.enabled ||
    state.selectionOnly
  );
});

/** 活动过滤器数量 atom */
export const activeFilterCountAtom = atom((get) => {
  const state = get(filterStateAtom);
  let count = 0;
  if (state.markStatus.enabled && state.markStatus.options.length > 0) count++;
  if (state.groupCount.enabled) count++;
  if (state.groupSize.enabled) count++;
  if (state.fileSize.enabled) count++;
  if (state.extension.enabled && state.extension.extensions.length > 0) count++;
  if (state.modifiedDate.enabled) count++;
  if (state.path.enabled && state.path.pattern) count++;
  if (state.similarity.enabled) count++;
  if (state.resolution.enabled) count++;
  if (state.selectionOnly) count++;
  return count;
});

/** 过滤后的数据 atom（派生） */
export const filteredDataAtom = atom((get) => {
  // 这个 atom 会在实际使用时根据当前工具的数据进行计算
  // 具体实现在组件中
  return null;
});
```

### Schema 验证

```typescript
// ui/src/lib/filter-panel/schemas.ts

import { z } from 'zod';

export const sizeUnitSchema = z.enum(['B', 'KB', 'MB', 'GB', 'TB']);

export const rangeFilterConfigSchema = z.object({
  enabled: z.boolean(),
  min: z.number().min(0),
  max: z.number().min(0),
  unit: sizeUnitSchema.optional(),
});

export const markStatusOptionSchema = z.enum([
  'marked',
  'unmarked',
  'groupHasSomeMarked',
  'groupAllUnmarked',
  'groupSomeNotAll',
  'groupAllMarked',
  'protected',
]);

export const datePresetSchema = z.enum([
  'today',
  'last7days',
  'last30days',
  'lastYear',
  'custom',
]);

export const filterStateSchema = z.object({
  markStatus: z.object({
    enabled: z.boolean(),
    options: z.array(markStatusOptionSchema),
  }),
  groupCount: rangeFilterConfigSchema,
  groupSize: rangeFilterConfigSchema,
  fileSize: rangeFilterConfigSchema,
  extension: z.object({
    enabled: z.boolean(),
    extensions: z.array(z.string()),
    mode: z.enum(['include', 'exclude']),
  }),
  modifiedDate: z.object({
    enabled: z.boolean(),
    preset: datePresetSchema,
    startDate: z.number().optional(),
    endDate: z.number().optional(),
  }),
  path: z.object({
    enabled: z.boolean(),
    mode: z.enum(['contains', 'notContains', 'startsWith', 'endsWith']),
    pattern: z.string(),
    caseSensitive: z.boolean(),
  }),
  similarity: z.object({
    enabled: z.boolean(),
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  resolution: z.object({
    enabled: z.boolean(),
    minWidth: z.number().optional(),
    minHeight: z.number().optional(),
    maxWidth: z.number().optional(),
    maxHeight: z.number().optional(),
    aspectRatio: z.enum(['16:9', '4:3', '1:1', 'any']).optional(),
  }),
  selectionOnly: z.boolean(),
  showAllInFilteredGroups: z.boolean(),
  preset: z.enum(['none', 'largeFilesFirst', 'smallFilesFirst', 'recentlyModified', 'oldFiles']),
});
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 标记状态过滤 OR 逻辑

*For any* 数据集 D 和标记状态选项集合 S，过滤后的结果应该只包含标记状态匹配 S 中任意一个选项的文件（OR 逻辑）。

**Validates: Requirements 1.3, 18.2**

### Property 2: 组文件数量范围过滤

*For any* 分组数据和文件数量范围 [min, max]，过滤后的结果应该只包含文件数量在 [min, max] 范围内的组。

**Validates: Requirements 2.1, 2.2**

### Property 3: 组大小范围过滤

*For any* 分组数据和大小范围 [min, max]，过滤后的结果应该只包含总大小在 [min, max] 范围内的组。

**Validates: Requirements 3.1, 3.2**

### Property 4: 大小单位转换一致性

*For any* 大小值 V 和单位 U1、U2，convertSize(convertSize(V, U1, U2), U2, U1) 应该等于 V（考虑浮点精度）。

**Validates: Requirements 3.3, 4.2**

### Property 5: 文件大小范围过滤

*For any* 文件数据和大小范围 [min, max]，过滤后的结果应该只包含大小在 [min, max] 范围内的文件。

**Validates: Requirements 4.1, 4.5**

### Property 6: 预设应用正确性

*For any* 预设 P，应用预设后的过滤状态应该与预设定义的配置一致。

**Validates: Requirements 5.3**

### Property 7: 已选择项过滤

*For any* 数据集 D 和选择集合 S，启用已选择项过滤后，结果应该只包含 S 中的文件。

**Validates: Requirements 6.2**

### Property 8: 组内显示所有文件选项

*For any* 分组数据和过滤条件，当 showAllInFilteredGroups=true 时，如果组内有任意文件匹配过滤条件，则该组的所有文件都应该显示；当 showAllInFilteredGroups=false 时，只显示直接匹配的文件。

**Validates: Requirements 7.2, 7.3**

### Property 9: 清除过滤器恢复默认状态

*For any* 过滤状态 S，执行清除操作后，状态应该等于默认过滤状态。

**Validates: Requirements 8.2, 8.3**

### Property 10: 过滤器配置持久化往返

*For any* 有效的过滤器配置 C，保存到 localStorage 后读取应该得到等价的配置。

**Validates: Requirements 10.1, 10.2**

### Property 11: 刷新过滤器幂等性

*For any* 数据集 D 和过滤状态 S，刷新操作的结果应该与重新应用过滤器的结果一致。

**Validates: Requirements 11.2**

### Property 12: 过滤后操作作用域

*For any* 数据集 D、过滤状态 S 和选择操作 O（全选/反选/取消全选），操作应该只影响过滤后可见的项目。

**Validates: Requirements 12.2, 12.3, 12.4, 12.7**

### Property 13: 扩展名过滤

*For any* 文件数据和扩展名集合 E，过滤后的结果应该只包含扩展名在 E 中的文件（include 模式）或不在 E 中的文件（exclude 模式）。

**Validates: Requirements 13.1, 13.2, 13.4**

### Property 14: 修改日期范围过滤

*For any* 文件数据和日期范围 [start, end]，过滤后的结果应该只包含修改日期在 [start, end] 范围内的文件。

**Validates: Requirements 14.1, 14.3**

### Property 15: 路径模式匹配

*For any* 文件数据、路径模式 P 和匹配模式 M（contains/notContains/startsWith/endsWith），过滤后的结果应该只包含路径匹配模式的文件。

**Validates: Requirements 15.1, 15.2**

### Property 16: 相似度范围过滤

*For any* 相似度数据和范围 [min, max]，过滤后的结果应该只包含相似度在 [min, max] 范围内的文件。

**Validates: Requirements 16.2**

### Property 17: 分辨率范围过滤

*For any* 图片/视频数据和分辨率范围，过滤后的结果应该只包含分辨率在范围内的文件。

**Validates: Requirements 17.2**

### Property 18: 宽高比过滤

*For any* 图片/视频数据和宽高比 R，过滤后的结果应该只包含宽高比匹配 R 的文件。

**Validates: Requirements 17.4**

### Property 19: 多过滤器 AND 组合

*For any* 数据集 D 和多个不同类别的过滤条件，过滤后的结果应该满足所有过滤条件（AND 逻辑）。

**Validates: Requirements 18.1**

### Property 20: 过滤统计计算正确性

*For any* 数据集 D 和过滤状态 S，统计信息（总数、过滤后数量、组数、总大小）应该与实际过滤结果一致。

**Validates: Requirements 20.1, 20.2, 20.3, 20.4**

### Property 21: 活动过滤器计数

*For any* 过滤状态 S，活动过滤器数量应该等于启用且有效配置的过滤器数量。

**Validates: Requirements 18.3**

## Error Handling

### 无效范围处理

```typescript
// 当 min > max 时，自动交换
if (config.min > config.max) {
  [config.min, config.max] = [config.max, config.min];
}
```

### 无效正则表达式处理

```typescript
// 路径过滤中的正则表达式错误处理
try {
  const regex = new RegExp(pattern, caseSensitive ? '' : 'i');
  return regex.test(path);
} catch {
  // 回退到普通字符串匹配
  return path.includes(pattern);
}
```

### 数据类型不匹配处理

- 当过滤器需要的字段不存在时，跳过该过滤器
- 当数据格式不正确时，记录警告并继续处理

## Testing Strategy

### 单元测试

使用 Vitest 进行单元测试，覆盖：
- 各过滤器类型的过滤逻辑
- 大小单位转换函数
- 路径匹配函数
- 统计计算函数

### 属性测试

使用 **fast-check** 库进行属性测试，每个属性测试运行至少 100 次迭代。

测试文件结构：
```
ui/src/lib/filter-panel/__tests__/
├── filter-engine.test.ts
├── utils.test.ts
├── filter-engine.property.test.ts
└── utils.property.test.ts
```

### 生成器设计

```typescript
// 生成随机文件条目
const fileEntryArb = fc.record({
  path: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz/._-0123456789'), { minLength: 5, maxLength: 100 }),
  size: fc.integer({ min: 0, max: 1000000000 }),
  modifiedDate: fc.integer({ min: 0, max: Date.now() }),
  groupId: fc.option(fc.integer({ min: 1, max: 100 })),
  isRef: fc.boolean(),
});

// 生成随机范围配置
const rangeConfigArb = fc.record({
  enabled: fc.boolean(),
  min: fc.integer({ min: 0, max: 1000000 }),
  max: fc.integer({ min: 0, max: 1000000 }),
}).map(({ enabled, min, max }) => ({
  enabled,
  min: Math.min(min, max),
  max: Math.max(min, max),
}));

// 生成随机标记状态选项
const markStatusOptionsArb = fc.subarray([
  'marked', 'unmarked', 'groupHasSomeMarked', 
  'groupAllUnmarked', 'groupSomeNotAll', 'groupAllMarked', 'protected'
] as const);
```

## UI Components

### 组件结构

```
ui/src/views/filter-panel/
├── index.tsx                      # 主入口
├── filter-panel.tsx               # 主面板
├── mark-status-filter.tsx         # 标记状态过滤器
├── group-count-filter.tsx         # 组文件数量过滤器
├── group-size-filter.tsx          # 组大小过滤器
├── file-size-filter.tsx           # 文件大小过滤器
├── extension-filter.tsx           # 扩展名过滤器
├── date-filter.tsx                # 日期过滤器
├── path-filter.tsx                # 路径过滤器
├── similarity-filter.tsx          # 相似度过滤器
├── resolution-filter.tsx          # 分辨率过滤器
├── selection-filter.tsx           # 已选择项过滤器
├── preset-filter.tsx              # 预设过滤器
├── filter-action-bar.tsx          # 操作栏（刷新、清除）
├── filter-stats.tsx               # 统计信息
├── range-config-popover.tsx       # 范围配置弹窗
└── use-filter-shortcuts.ts        # 快捷键 hook
```

### UI 布局参考

```
┌─────────────────────────────────────────┐
│ 过滤器                              [X] │
├─────────────────────────────────────────┤
│ ☐ 已标记                                │
│ ☐ 未标记                                │
│ ☐ 存在部分标记项目的组别                │
│ ☐ 所有项目均无标记的组别                │
│ ☐ 存在部分但非全部标记的组别            │
│ ☐ 所有项目均被标记的组别                │
│ ☐ 已保护                                │
├─────────────────────────────────────────┤
│ ☐ 组别 - 从 3 至 100 文件          [⚙]  │
│ ☐ 组别 - 从 10MB 至 100GB          [⚙]  │
├─────────────────────────────────────────┤
│ ☐ 文件大小 - 从 100MB 至 100GB     [⚙]  │
│ ☐ 内置设定：暂无                    [▼] │
│ ☐ Filter to selected - 0 已选择         │
├─────────────────────────────────────────┤
│ ☑ 在已过滤的组中显示所有文件            │
├─────────────────────────────────────────┤
│ [🔄] [🗑 清除过滤器]                     │
│ 显示 50/200 项 | 3 个过滤器激活         │
└─────────────────────────────────────────┘
```

## File Structure

```
ui/src/
├── lib/
│   └── filter-panel/
│       ├── types.ts              # 类型定义
│       ├── schemas.ts            # zod 验证 schemas
│       ├── filter-engine.ts      # 过滤器引擎
│       ├── utils.ts              # 工具函数
│       ├── presets.ts            # 预设定义
│       └── __tests__/            # 测试文件
├── atom/
│   └── filter-panel.ts           # Jotai atoms
└── views/
    └── filter-panel/             # UI 组件
```

## Integration with Selection Assistant

过滤器系统需要与现有的选择助手系统集成：

```typescript
// 在选择助手中使用过滤后的数据
import { useAtomValue } from 'jotai';
import { filteredDataAtom, isFilterActiveAtom } from '~/atom/filter-panel';

function useFilteredSelection() {
  const isFilterActive = useAtomValue(isFilterActiveAtom);
  const filteredData = useAtomValue(filteredDataAtom);
  
  // 当过滤器激活时，选择操作只影响过滤后的数据
  const selectAll = () => {
    const targetData = isFilterActive ? filteredData : allData;
    // 执行选择操作
  };
  
  return { selectAll, isFilterActive };
}
```

## Dependencies

无需安装新依赖，复用现有的：
- `jotai` - 状态管理
- `zod` - 配置验证（已安装）
- `shadcn/ui` - UI 组件
