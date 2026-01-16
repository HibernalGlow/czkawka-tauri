# Requirements Document

## Introduction

选择助手（Selection Assistant）是一个参考 Duplicate Cleaner Pro 设计的高级文件选择系统。该系统将现有的简单选择菜单改造为一个高度可扩展的规则组合系统，支持三大类选择规则（按组别选择、按文本模式选择、按目录位置选择），并提供完整的撤销/重做功能。

## Glossary

- **Selection_Assistant**: 选择助手主系统，负责协调规则执行和状态管理
- **Rule_Engine**: 规则引擎，负责解析和执行选择规则
- **Rule_Pipeline**: 规则管道，按顺序执行多个规则的组合
- **Selection_Rule**: 选择规则，定义如何选择或取消选择文件的逻辑单元
- **Group_Selection_Rule**: 按组别选择规则，在重复文件组内按条件选择
- **Text_Selection_Rule**: 按文本模式选择规则，基于文件路径/名称的文本匹配
- **Directory_Selection_Rule**: 按目录位置选择规则，基于文件所在目录进行选择
- **Selection_State**: 选择状态，记录当前哪些文件被选中
- **History_Manager**: 历史管理器，负责撤销/重做功能
- **Rule_Condition**: 规则条件，定义规则的匹配逻辑（包含、不包含、正则等）
- **Sort_Criterion**: 排序标准，用于组内选择时的排序依据

## Requirements

### Requirement 1: 规则引擎核心架构

**User Story:** 作为开发者，我希望有一个可扩展的规则引擎架构，以便能够轻松添加新的选择规则类型。

#### Acceptance Criteria

1. THE Rule_Engine SHALL provide a unified interface for all selection rules
2. WHEN a new rule type is added, THE Rule_Engine SHALL support it without modifying existing code
3. THE Rule_Engine SHALL support rule composition through pipelines
4. WHEN executing a rule pipeline, THE Rule_Engine SHALL apply rules in the specified order
5. THE Selection_Rule SHALL define a standard interface with execute, validate, and describe methods

### Requirement 2: 按组别选择规则

**User Story:** 作为用户，我希望能够在每个重复文件组内按照多种条件选择文件，以便快速标记要删除的重复项。

#### Acceptance Criteria

1. WHEN a user configures group selection mode, THE Group_Selection_Rule SHALL support modes: "select all except one", "select one", "select all"
2. THE Group_Selection_Rule SHALL support multiple sort criteria with priority ordering
3. WHEN multiple sort criteria are configured, THE Group_Selection_Rule SHALL apply them in priority order
4. THE Sort_Criterion SHALL support these fields: folder path, file name, file size, creation date, modification date, resolution (for images)
5. THE Sort_Criterion SHALL support both ascending and descending order
6. WHEN a sort criterion has "prefer empty" option, THE Sort_Criterion SHALL prioritize empty/null values
7. THE Group_Selection_Rule SHALL support "keep existing selection unchanged" option
8. WHEN "keep existing selection unchanged" is enabled, THE Group_Selection_Rule SHALL not modify already selected items

### Requirement 3: 按文本模式选择规则

**User Story:** 作为用户，我希望能够通过文本匹配来选择文件，以便根据文件名或路径模式批量选择。

#### Acceptance Criteria

1. THE Text_Selection_Rule SHALL support selecting by column: folder path, file name, full path
2. THE Text_Selection_Rule SHALL support match conditions: contains, not contains, equals, starts with, ends with
3. WHEN regex mode is enabled, THE Text_Selection_Rule SHALL interpret the pattern as a regular expression
4. THE Text_Selection_Rule SHALL support case-sensitive and case-insensitive matching
5. WHEN a user applies text selection, THE Text_Selection_Rule SHALL support both "mark" and "unmark" actions
6. THE Text_Selection_Rule SHALL support "keep existing selection unchanged" option

### Requirement 4: 按目录位置选择规则

**User Story:** 作为用户，我希望能够根据文件所在目录来选择文件，以便保留特定目录中的文件。

#### Acceptance Criteria

1. THE Directory_Selection_Rule SHALL support selecting files by directory path
2. THE Directory_Selection_Rule SHALL support "keep one per directory" mode within each group
3. THE Directory_Selection_Rule SHALL support "select all in directory" mode
4. THE Directory_Selection_Rule SHALL support "exclude directory" mode to unselect files in specific directories
5. WHEN multiple directories are specified, THE Directory_Selection_Rule SHALL apply the rule to all of them

### Requirement 5: 撤销/重做功能

**User Story:** 作为用户，我希望能够撤销和重做选择操作，以便在误操作时能够恢复。

#### Acceptance Criteria

1. WHEN a selection operation is performed, THE History_Manager SHALL record the previous state
2. WHEN a user triggers undo, THE History_Manager SHALL restore the previous selection state
3. WHEN a user triggers redo, THE History_Manager SHALL restore the next selection state
4. THE History_Manager SHALL maintain a configurable maximum history size (default 50)
5. WHEN history size exceeds the limit, THE History_Manager SHALL remove the oldest entries
6. THE History_Manager SHALL clear redo history when a new operation is performed after undo
7. THE Selection_Assistant SHALL provide keyboard shortcuts for undo (Ctrl+Z) and redo (Ctrl+Y)

### Requirement 6: 规则管道系统

**User Story:** 作为用户，我希望能够组合多个规则形成管道，以便实现复杂的选择逻辑。

#### Acceptance Criteria

1. THE Rule_Pipeline SHALL support adding multiple rules in sequence
2. WHEN executing a pipeline, THE Rule_Pipeline SHALL pass the output of each rule as input to the next
3. THE Rule_Pipeline SHALL support enabling/disabling individual rules without removing them
4. THE Rule_Pipeline SHALL support reordering rules via drag-and-drop
5. THE Rule_Pipeline SHALL support saving and loading pipeline configurations as presets
6. WHEN a rule in the pipeline fails validation, THE Rule_Pipeline SHALL skip that rule and continue

### Requirement 7: 用户界面

**User Story:** 作为用户，我希望有一个直观的界面来配置和执行选择规则，以便高效地管理文件选择。

#### Acceptance Criteria

1. THE Selection_Assistant SHALL display three collapsible sections for the three rule categories
2. WHEN a section is expanded, THE Selection_Assistant SHALL show the rule configuration UI
3. THE Selection_Assistant SHALL provide "Mark" and "Unmark" buttons for each rule category
4. THE Selection_Assistant SHALL display an "Undo last selection" button
5. THE Selection_Assistant SHALL provide "Unmark all" and "Invert all marks" utility buttons
6. THE Selection_Assistant SHALL show real-time preview of how many files will be affected
7. WHEN a rule is invalid, THE Selection_Assistant SHALL display validation errors inline

### Requirement 8: 状态持久化

**User Story:** 作为用户，我希望我的规则配置能够被保存，以便下次使用时不需要重新配置。

#### Acceptance Criteria

1. THE Selection_Assistant SHALL persist rule configurations to local storage
2. WHEN the application restarts, THE Selection_Assistant SHALL restore the last used configuration
3. THE Selection_Assistant SHALL support exporting configurations as JSON
4. THE Selection_Assistant SHALL support importing configurations from JSON
5. IF an imported configuration is invalid, THEN THE Selection_Assistant SHALL display an error and reject the import
