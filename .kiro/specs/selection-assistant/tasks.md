# Implementation Plan: Selection Assistant

## Overview

将现有的简单选择菜单改造为参考 Duplicate Cleaner Pro 的高级选择助手系统。采用 jotai-history、ts-pattern、zod、@dnd-kit 等成熟库实现规则引擎、撤销/重做、配置验证和拖拽排序功能。

## Tasks

- [x] 1. 项目设置和依赖安装
  - 安装 jotai-history、ts-pattern、zod、@dnd-kit/core、@dnd-kit/sortable、@dnd-kit/utilities
  - 验证依赖安装成功
  - _Requirements: 1.1, 5.1_

- [x] 2. 核心类型和 Schema 定义
  - [x] 2.1 创建类型定义文件 `ui/src/lib/selection-assistant/types.ts`
    - 定义 SelectionAction、RuleContext、RuleResult、ValidationResult 等核心类型
    - 定义 GroupRuleConfig、TextRuleConfig、DirectoryRuleConfig 配置类型
    - 定义 SortCriterion、SortField、SortDirection 等排序相关类型
    - _Requirements: 1.1, 1.5, 2.1-2.4, 3.1-3.2, 4.1_

  - [x] 2.2 创建 zod Schema 文件 `ui/src/lib/selection-assistant/schemas.ts`
    - 实现 sortCriterionSchema、groupRuleConfigSchema
    - 实现 textRuleConfigSchema、directoryRuleConfigSchema
    - 实现 importConfigSchema 用于配置导入验证
    - _Requirements: 8.5_

- [x] 3. 规则匹配器实现
  - [x] 3.1 创建匹配器文件 `ui/src/lib/selection-assistant/matchers.ts`
    - 使用 ts-pattern 实现 matchText 函数（支持 contains/notContains/equals/startsWith/endsWith）
    - 实现 getColumnValue 函数（支持 fullPath/fileName/folderPath）
    - 实现正则表达式匹配支持
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 3.2 编写匹配器属性测试
    - **Property 7: 文本匹配条件正确性**
    - **Property 8: 正则表达式匹配一致性**
    - **Property 9: 大小写敏感性**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 4. 组选择规则实现
  - [x] 4.1 创建组选择规则 `ui/src/lib/selection-assistant/rules/group-rule.ts`
    - 实现 GroupSelectionRule 类
    - 实现 selectAllExceptOne/selectOne/selectAll 三种模式
    - 实现多排序条件优先级排序
    - 实现 preferEmpty 空值优先选项
    - 实现 keepExistingSelection 选项
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 4.2 编写组选择规则属性测试
    - **Property 2: 组选择模式正确性**
    - **Property 3: 多排序条件优先级**
    - **Property 4: 排序方向互逆性**
    - **Property 5: 空值优先选项**
    - **Property 6: 保持已选择不变**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8**

- [x] 5. 文本选择规则实现
  - [x] 5.1 创建文本选择规则 `ui/src/lib/selection-assistant/rules/text-rule.ts`
    - 实现 TextSelectionRule 类
    - 集成 matchers.ts 中的匹配函数
    - 实现 mark/unmark 动作
    - 实现 keepExistingSelection 选项
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 5.2 编写文本选择规则属性测试
    - **Property 10: Mark/Unmark 动作正确性**
    - **Validates: Requirements 3.5**

- [x] 6. 目录选择规则实现
  - [x] 6.1 创建目录选择规则 `ui/src/lib/selection-assistant/rules/directory-rule.ts`
    - 实现 DirectorySelectionRule 类
    - 实现 keepOnePerDirectory/selectAllInDirectory/excludeDirectory 三种模式
    - 支持多目录配置
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 编写目录选择规则属性测试
    - **Property 11: 目录选择规则正确性**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 7. 规则管道实现
  - [x] 7.1 创建规则管道 `ui/src/lib/selection-assistant/pipeline.ts`
    - 实现 RulePipeline 类
    - 实现 addRule/removeRule/reorderRules/enableRule 方法
    - 实现顺序执行逻辑
    - 实现无效规则跳过逻辑
    - 实现 toJSON/fromJSON 序列化方法
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x] 7.2 编写规则管道属性测试
    - **Property 1: 管道顺序执行一致性**
    - **Property 15: 禁用规则不影响执行**
    - **Property 16: 管道配置序列化往返**
    - **Property 17: 无效规则跳过**
    - **Validates: Requirements 1.3, 1.4, 6.2, 6.3, 6.5, 6.6**

- [x] 8. Checkpoint - 核心逻辑验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 9. Jotai Atoms 和历史管理
  - [x] 9.1 创建 atoms 文件 `ui/src/atom/selection-assistant.ts`
    - 使用 atomWithStorage 创建配置持久化 atoms
    - 使用 jotai-history 的 withHistory 包装选择状态
    - 创建 expandedPanelAtom 管理 UI 状态
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1, 8.2_

  - [x] 9.2 编写历史管理属性测试
    - **Property 12: 撤销/重做往返一致性**
    - **Property 13: 历史大小限制**
    - **Property 14: Undo 后新操作清空 Redo 栈**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6**

- [x] 10. 配置导入/导出功能
  - [x] 10.1 创建配置工具 `ui/src/lib/selection-assistant/config-utils.ts`
    - 实现 exportConfig 函数
    - 实现 importConfig 函数（使用 zod 验证）
    - 实现错误处理和用户友好的错误消息
    - _Requirements: 8.3, 8.4, 8.5_

  - [x] 10.2 编写配置导入/导出属性测试
    - **Property 19: 配置持久化往返**
    - **Property 20: 配置导入/导出往返**
    - **Property 21: 无效配置导入拒绝**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 11. Checkpoint - 逻辑层完成验证（55 个测试全部通过）
  - 确保所有测试通过，如有问题请询问用户

- [x] 12. UI 组件 - 主面板
  - [x] 12.1 创建主面板组件 `ui/src/views/selection-assistant/selection-assistant-panel.tsx`
    - 实现三个可折叠区域（Accordion 风格）
    - 集成撤销/重做按钮
    - 集成取消所有标记/反选按钮
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13. UI 组件 - 组选择区域
  - [x] 13.1 创建组选择区域 `ui/src/views/selection-assistant/group-selection-section.tsx`
    - 实现模式选择下拉框
    - 实现排序条件列表（使用 @dnd-kit 拖拽排序）
    - 实现 keepExistingSelection 复选框
    - 实现标记/取消标记按钮
    - _Requirements: 2.1, 2.2, 2.7, 6.4, 7.3_

  - [x] 13.2 创建排序条件列表组件 `ui/src/views/selection-assistant/sort-criteria-list.tsx`
    - 使用 @dnd-kit/sortable 实现拖拽排序
    - 实现条件启用/禁用切换
    - 实现条件删除和添加
    - _Requirements: 2.2, 2.3, 6.4_

- [x] 14. UI 组件 - 文本选择区域
  - [x] 14.1 创建文本选择区域 `ui/src/views/selection-assistant/text-selection-section.tsx`
    - 实现列选择下拉框
    - 实现匹配条件下拉框
    - 实现文本输入框
    - 实现正则表达式和大小写敏感复选框
    - 实现标记/取消标记按钮
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.3_

- [x] 15. UI 组件 - 目录选择区域
  - [x] 15.1 创建目录选择区域 `ui/src/views/selection-assistant/directory-selection-section.tsx`
    - 实现模式选择下拉框
    - 实现目录列表管理
    - 实现标记/取消标记按钮
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.3_

- [x] 16. UI 组件 - 操作按钮和预览
  - [x] 16.1 创建操作按钮组件 `ui/src/views/selection-assistant/action-buttons.tsx`
    - 实现撤销上次选择按钮
    - 实现取消所有标记按钮
    - 实现反选所有标记按钮
    - 显示实时预览（受影响文件数）
    - _Requirements: 7.4, 7.5, 7.6_

  - [ ] 16.2 编写预览一致性属性测试
    - **Property 18: 预览与执行一致性**
    - **Validates: Requirements 7.6**

- [x] 17. 集成和替换现有组件
  - [x] 17.1 创建入口文件 `ui/src/views/selection-assistant/index.tsx`
    - 导出所有组件
    - _Requirements: 7.1_

  - [x] 17.2 替换现有的 RowSelectionMenu
    - 在 operations.tsx 或相关位置集成新的 SelectionAssistantPanel
    - 保留原有的快捷选择功能作为备选
    - _Requirements: 7.1_

- [x] 18. 国际化支持
  - [x] 18.1 添加中英文翻译
    - 更新 `ui/src/i18n/en.ts` 添加英文翻译
    - 更新 `ui/src/i18n/zh.ts` 添加中文翻译
    - _Requirements: 7.1_

- [x] 19. 键盘快捷键
  - [x] 19.1 实现撤销/重做快捷键
    - 实现 Ctrl+Z 撤销
    - 实现 Ctrl+Y 重做
    - _Requirements: 5.7_

- [x] 20. Final Checkpoint - 完整功能验证
  - [x] TypeScript 检查通过
  - [x] 55 个测试全部通过
  - 如有问题请询问用户

## Notes

- 所有任务均为必需，包括属性测试任务
- 每个任务都引用了具体的需求条款以确保可追溯性
- Checkpoint 任务用于阶段性验证
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
