# Implementation Plan: Filter Card Optimization

## Overview

将现有的过滤器面板改造为参考 Duplicate Cleaner Pro 的高级过滤系统。采用模块化架构，支持多种过滤维度的组合，并与现有的选择助手系统集成。

## Tasks

- [x] 1. 核心类型和 Schema 定义
  - [x] 1.1 创建类型定义文件 `ui/src/lib/filter-panel/types.ts`
    - 定义 FilterCategory、MarkStatusOption、RangeFilterConfig 等核心类型
    - 定义 FilterState、FilterStats 完整状态类型
    - 定义 SizeUnit、DatePreset 等辅助类型
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

  - [x] 1.2 创建 zod Schema 文件 `ui/src/lib/filter-panel/schemas.ts`
    - 实现 rangeFilterConfigSchema、markStatusOptionSchema
    - 实现 filterStateSchema 完整验证
    - _Requirements: 10.1_

- [x] 2. 工具函数实现
  - [x] 2.1 创建工具函数文件 `ui/src/lib/filter-panel/utils.ts`
    - 实现 parseSizeToBytes、formatBytes、convertSize 大小转换函数
    - 实现 getFileExtension 扩展名提取函数
    - 实现 matchPath 路径匹配函数
    - 实现 getGroupFileCount、getGroupTotalSize 组统计函数
    - 实现 getGroupMarkStatus 组标记状态检查函数
    - _Requirements: 3.3, 4.2, 13.1, 15.1_

  - [x] 2.2 编写工具函数属性测试
    - Property 4: 大小单位转换一致性
    - Validates: Requirements 3.3, 4.2

- [x] 3. 过滤器引擎实现
  - [x] 3.1 创建过滤器引擎 `ui/src/lib/filter-panel/filter-engine.ts`
    - 实现 applyMarkStatusFilter 标记状态过滤
    - 实现 applyGroupCountFilter 组文件数量过滤
    - 实现 applyGroupSizeFilter 组大小过滤
    - 实现 applyFileSizeFilter 文件大小过滤
    - 实现 applyExtensionFilter 扩展名过滤
    - 实现 applyDateFilter 日期过滤
    - 实现 applyPathFilter 路径过滤
    - 实现 applySimilarityFilter 相似度过滤
    - 实现 applyResolutionFilter 分辨率过滤
    - 实现 applySelectionFilter 已选择项过滤
    - 实现 applyFilters 组合过滤主函数
    - 实现 calculateStats 统计计算函数
    - _Requirements: 1.3, 2.1, 3.1, 4.1, 6.2, 7.2, 13.1, 14.1, 15.1, 16.2, 17.2, 18.1_

  - [x] 3.2 编写过滤器引擎属性测试
    - Property 1: 标记状态过滤 OR 逻辑
    - Property 2: 组文件数量范围过滤
    - Property 3: 组大小范围过滤
    - Property 5: 文件大小范围过滤
    - Property 7: 已选择项过滤
    - Property 8: 组内显示所有文件选项
    - Property 13: 扩展名过滤
    - Property 14: 修改日期范围过滤
    - Property 15: 路径模式匹配
    - Property 16: 相似度范围过滤
    - Property 17: 分辨率范围过滤
    - Property 18: 宽高比过滤
    - Property 19: 多过滤器 AND 组合
    - Property 20: 过滤统计计算正确性
    - Validates: Requirements 1.3, 2.1, 3.1, 4.1, 6.2, 7.2, 13.1, 14.1, 15.1, 16.2, 17.2, 17.4, 18.1, 20.1-20.4

- [x] 4. 预设定义
  - [x] 4.1 创建预设文件 `ui/src/lib/filter-panel/presets.ts`
    - 定义 largeFilesFirst、smallFilesFirst、recentlyModified、oldFiles 预设
    - 实现 applyPreset 预设应用函数
    - _Requirements: 5.2, 5.3_

  - [x] 4.2 编写预设属性测试
    - Property 6: 预设应用正确性
    - Validates: Requirements 5.3

- [x] 5. Checkpoint - 核心逻辑验证
  - 确保所有测试通过，如有问题请询问用户

- [-] 6. Jotai Atoms 定义
  - [x] 6.1 创建 atoms 文件 `ui/src/atom/filter-panel.ts`
    - 使用 atomWithStorage 创建 filterStateAtom（持久化）
    - 创建 filterStatsAtom 统计 atom
    - 创建 isFilterActiveAtom 派生 atom
    - 创建 activeFilterCountAtom 派生 atom
    - 创建 filteredDataAtom 派生 atom
    - _Requirements: 10.1, 10.2, 18.3_

  - [x] 6.2 编写 atoms 属性测试
    - Property 10: 过滤器配置持久化往返
    - Property 21: 活动过滤器计数
    - Validates: Requirements 10.1, 10.2, 18.3

- [x] 7. 清除和刷新功能
  - [x] 7.1 实现清除和刷新逻辑
    - 在 filter-engine.ts 中添加 resetToDefault 函数
    - 在 filter-engine.ts 中添加 refreshFilters 函数
    - _Requirements: 8.2, 11.2_

  - [x] 7.2 编写清除和刷新属性测试
    - Property 9: 清除过滤器恢复默认状态
    - Property 11: 刷新过滤器幂等性
    - Validates: Requirements 8.2, 11.2

- [x] 8. 过滤后操作作用域
  - [x] 8.1 创建过滤作用域 hook `ui/src/lib/filter-panel/use-filtered-scope.ts`
    - 实现 useFilteredScope hook
    - 实现 selectAllFiltered、invertSelectionFiltered、deselectAllFiltered 函数
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7_

  - [x] 8.2 编写过滤作用域属性测试
    - Property 12: 过滤后操作作用域
    - Validates: Requirements 12.2, 12.3, 12.4, 12.7

- [x] 9. Checkpoint - 逻辑层完成验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 10. UI 组件 - 主面板
  - [x] 10.1 创建主面板组件 `ui/src/views/filter-panel/filter-panel.tsx`
    - 实现整体布局
    - 集成所有过滤器组件
    - _Requirements: 7.1_

- [x] 11. UI 组件 - 标记状态过滤器
  - [x] 11.1 创建标记状态过滤器 `ui/src/views/filter-panel/mark-status-filter.tsx`
    - 实现复选框列表（已标记、未标记、组级状态）
    - 实现实时过滤更新
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 12. UI 组件 - 组别过滤器
  - [x] 12.1 创建组文件数量过滤器 `ui/src/views/filter-panel/group-count-filter.tsx`
    - 实现复选框和设置按钮
    - 显示当前范围
    - _Requirements: 2.3, 2.4_

  - [x] 12.2 创建组大小过滤器 `ui/src/views/filter-panel/group-size-filter.tsx`
    - 实现复选框和设置按钮
    - 显示当前范围和单位
    - _Requirements: 3.4, 3.5_

- [x] 13. UI 组件 - 文件大小过滤器
  - [x] 13.1 创建文件大小过滤器 `ui/src/views/filter-panel/file-size-filter.tsx`
    - 实现复选框和设置按钮
    - 显示当前范围和单位
    - _Requirements: 4.3, 4.4_

- [x] 14. UI 组件 - 范围配置弹窗
  - [x] 14.1 创建范围配置弹窗 `ui/src/components/shadcn/popover.tsx`
    - 实现最小值/最大值输入
    - 实现单位选择（针对大小过滤器）
    - 实现应用/取消按钮
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 15. UI 组件 - 扩展名过滤器
  - [x] 15.1 创建扩展名过滤器 `ui/src/views/filter-panel/extension-filter.tsx`
    - 实现扩展名多选
    - 实现常用扩展名预设
    - _Requirements: 13.2, 13.3_

- [x] 16. UI 组件 - 日期过滤器
  - [x] 16.1 创建日期过滤器 `ui/src/views/filter-panel/date-filter.tsx`
    - 实现日期预设选择
    - 实现自定义日期范围
    - _Requirements: 14.2, 14.4_

- [x] 17. UI 组件 - 路径过滤器
  - [x] 17.1 创建路径过滤器 `ui/src/views/filter-panel/path-filter.tsx`
    - 实现路径模式输入
    - 实现匹配模式选择
    - _Requirements: 15.3_

- [x] 18. UI 组件 - 相似度和分辨率过滤器
  - [x] 18.1 创建相似度过滤器 `ui/src/views/filter-panel/similarity-filter.tsx`
    - 实现相似度范围滑块
    - 实现快捷预设
    - _Requirements: 16.3, 16.4_

  - [x] 18.2 创建分辨率过滤器 `ui/src/views/filter-panel/resolution-filter.tsx`
    - 实现分辨率范围配置
    - 实现宽高比选择
    - _Requirements: 17.3_

- [x] 19. UI 组件 - 其他过滤器
  - [x] 19.1 创建已选择项过滤器 `ui/src/views/filter-panel/selection-filter.tsx`
    - 实现复选框和选择计数显示
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 19.2 创建预设过滤器 `ui/src/views/filter-panel/preset-filter.tsx`
    - 实现预设下拉选择
    - 显示当前预设名称
    - _Requirements: 5.1, 5.4_

  - [x] 19.3 创建组内显示选项 `ui/src/views/filter-panel/show-all-in-group.tsx`
    - 实现复选框
    - _Requirements: 7.1, 7.4_

- [x] 20. UI 组件 - 操作栏和统计
  - [x] 20.1 创建操作栏 `ui/src/views/filter-panel/filter-action-bar.tsx`
    - 实现刷新按钮
    - 实现清除过滤器按钮
    - _Requirements: 8.1, 11.1_

  - [x] 20.2 创建统计信息组件 `ui/src/views/filter-panel/filter-stats.tsx`
    - 显示过滤前后项目数量
    - 显示活动过滤器数量
    - _Requirements: 12.5, 12.6_

- [x] 21. 快捷键支持
  - [x] 21.1 创建快捷键 hook `ui/src/views/filter-panel/use-filter-shortcuts.ts`
    - 实现 Ctrl+F 聚焦过滤面板
    - 实现 Escape 清除所有过滤器
    - 实现 Ctrl+R 刷新过滤器
    - _Requirements: 19.1, 19.2, 19.3_

- [x] 22. 国际化支持
  - [x] 22.1 添加中英文翻译
    - 更新 `ui/src/i18n/en.ts` 添加英文翻译
    - 更新 `ui/src/i18n/zh.ts` 添加中文翻译
    - _Requirements: 1.1, 2.4, 3.4, 4.3, 5.4, 6.1, 7.1, 8.1_

- [x] 23. 集成和替换
  - [x] 23.1 创建入口文件 `ui/src/views/filter-panel/index.tsx`
    - 导出所有组件
    - _Requirements: 7.1_

  - [x] 23.2 替换现有的 FloatingFilterPanel
    - 在 floating-filter-panel.tsx 中集成新的 FilterPanel
    - 保留浮动面板功能
    - _Requirements: 7.1_

  - [x] 23.3 集成到选择助手
    - 更新选择助手使用过滤后的数据
    - 添加过滤器激活时的警告提示
    - _Requirements: 12.1, 12.8_

- [x] 24. Final Checkpoint - 完整功能验证
  - TypeScript 检查通过
  - 所有测试通过
  - 如有问题请询问用户

## Notes

- 带 `*` 标记的任务为可选的属性测试任务
- 每个任务都引用了具体的需求条款以确保可追溯性
- Checkpoint 任务用于阶段性验证
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
