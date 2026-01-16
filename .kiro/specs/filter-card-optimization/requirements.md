# Requirements Document

## Introduction

过滤器卡片优化功能参考 Duplicate Cleaner Pro 的设计，将现有的过滤器面板改造为更强大、更直观的过滤系统。该系统支持多种过滤维度：标记状态过滤、组别过滤（按文件数量/大小范围）、文件大小过滤、内置预设、已选择项筛选等，并提供"在已过滤的组中显示所有文件"选项。

## Glossary

- **Filter_Panel**: 过滤器面板，负责管理和展示所有过滤选项
- **Mark_Status_Filter**: 标记状态过滤器，根据文件的标记状态进行过滤
- **Group_Filter**: 组别过滤器，根据组内文件数量或总大小进行过滤
- **File_Size_Filter**: 文件大小过滤器，根据单个文件大小进行过滤
- **Preset_Filter**: 内置预设过滤器，提供常用的预设过滤条件
- **Selection_Filter**: 已选择项过滤器，只显示已选择的文件
- **Filter_Condition**: 过滤条件，定义过滤的逻辑单元
- **Range_Filter**: 范围过滤器，支持最小值和最大值的范围过滤

## Requirements

### Requirement 1: 标记状态过滤

**User Story:** 作为用户，我希望能够根据文件的标记状态进行过滤，以便快速查看特定标记状态的文件。

#### Acceptance Criteria

1. THE Mark_Status_Filter SHALL provide checkbox options for: "已标记", "未标记"
2. THE Mark_Status_Filter SHALL provide checkbox options for group-level status: "存在部分标记项目的组别", "所有项目均无标记的组别", "存在部分但非全部标记的组别", "所有项目均被标记的组别", "已保护"
3. WHEN multiple mark status options are selected, THE Filter_Panel SHALL show files matching ANY of the selected statuses (OR logic)
4. WHEN no mark status option is selected, THE Filter_Panel SHALL show all files regardless of mark status
5. THE Mark_Status_Filter SHALL update the filtered results in real-time when options change

### Requirement 2: 组别过滤（按文件数量）

**User Story:** 作为用户，我希望能够根据组内文件数量进行过滤，以便关注特定规模的重复组。

#### Acceptance Criteria

1. THE Group_Filter SHALL support filtering by file count range with configurable min and max values
2. WHEN a user sets file count range, THE Group_Filter SHALL only show groups with file count within the range
3. THE Group_Filter SHALL provide a settings button (齿轮图标) to configure the range
4. THE Group_Filter SHALL display the current range in the checkbox label (e.g., "组别 - 从 3 至 100 文件")
5. WHEN the range is configured, THE Group_Filter SHALL persist the settings

### Requirement 3: 组别过滤（按大小）

**User Story:** 作为用户，我希望能够根据组内文件总大小进行过滤，以便关注占用空间较大的重复组。

#### Acceptance Criteria

1. THE Group_Filter SHALL support filtering by group total size range with configurable min and max values
2. WHEN a user sets size range, THE Group_Filter SHALL only show groups with total size within the range
3. THE Group_Filter SHALL support size units: B, KB, MB, GB, TB
4. THE Group_Filter SHALL display the current range in the checkbox label (e.g., "组别 - 从 10MB 至 100GB")
5. THE Group_Filter SHALL provide a settings button to configure the size range

### Requirement 4: 文件大小过滤

**User Story:** 作为用户，我希望能够根据单个文件大小进行过滤，以便关注特定大小的文件。

#### Acceptance Criteria

1. THE File_Size_Filter SHALL support filtering by individual file size range
2. THE File_Size_Filter SHALL support size units: B, KB, MB, GB, TB
3. THE File_Size_Filter SHALL display the current range in the checkbox label (e.g., "文件大小 - 从 100MB 至 100GB")
4. THE File_Size_Filter SHALL provide a settings button to configure the size range
5. WHEN a file's size is outside the range, THE Filter_Panel SHALL hide that file

### Requirement 5: 内置预设

**User Story:** 作为用户，我希望有一些内置的过滤预设，以便快速应用常用的过滤条件。

#### Acceptance Criteria

1. THE Preset_Filter SHALL provide a dropdown or expandable section for built-in presets
2. THE Preset_Filter SHALL include presets such as: "暂无" (none), "大文件优先", "小文件优先", "最近修改"
3. WHEN a preset is selected, THE Filter_Panel SHALL apply the corresponding filter conditions
4. THE Preset_Filter SHALL display the current preset name (e.g., "内置设定：暂无")

### Requirement 6: 已选择项筛选

**User Story:** 作为用户，我希望能够只显示已选择的文件，以便专注于即将操作的文件。

#### Acceptance Criteria

1. THE Selection_Filter SHALL provide a checkbox option "Filter to selected - X 已选择"
2. WHEN enabled, THE Filter_Panel SHALL only show files that are currently selected
3. THE Selection_Filter SHALL display the count of selected files in the label
4. WHEN no files are selected, THE Selection_Filter SHALL be disabled or show "0 已选择"

### Requirement 7: 在已过滤的组中显示所有文件

**User Story:** 作为用户，我希望在过滤后仍能看到组内的所有文件，以便了解完整的重复情况。

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide a checkbox option "在已过滤的组中显示所有文件"
2. WHEN enabled, THE Filter_Panel SHALL show all files in groups that have at least one matching file
3. WHEN disabled, THE Filter_Panel SHALL only show files that directly match the filter conditions
4. THE option SHALL be enabled by default

### Requirement 8: 清除过滤器

**User Story:** 作为用户，我希望能够一键清除所有过滤条件，以便重新开始筛选。

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide a "清除过滤器" button with a clear icon
2. WHEN clicked, THE Filter_Panel SHALL reset all filter conditions to their default state
3. THE Filter_Panel SHALL restore the original unfiltered data view
4. THE clear button SHALL be visually distinct and easily accessible

### Requirement 9: 过滤器配置弹窗

**User Story:** 作为用户，我希望能够通过弹窗配置过滤器的详细参数，以便精确设置过滤条件。

#### Acceptance Criteria

1. WHEN a user clicks the settings button (齿轮图标), THE Filter_Panel SHALL open a configuration popover
2. THE configuration popover SHALL provide input fields for min and max values
3. THE configuration popover SHALL provide unit selection for size-based filters
4. THE configuration popover SHALL have "应用" and "取消" buttons
5. WHEN "应用" is clicked, THE Filter_Panel SHALL update the filter with new settings

### Requirement 10: 过滤器状态持久化

**User Story:** 作为用户，我希望我的过滤器设置能够被保存，以便下次使用时不需要重新配置。

#### Acceptance Criteria

1. THE Filter_Panel SHALL persist filter configurations to local storage
2. WHEN the application restarts, THE Filter_Panel SHALL restore the last used configuration
3. THE Filter_Panel SHALL support resetting to default configuration

### Requirement 11: 刷新过滤器

**User Story:** 作为用户，我希望能够刷新过滤器以重新应用当前的过滤条件，以便在数据变化后更新视图。

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide a "刷新" button with a refresh icon
2. WHEN clicked, THE Filter_Panel SHALL re-apply all current filter conditions to the data
3. THE refresh button SHALL be placed near the clear button for easy access
4. WHEN data changes externally, THE Filter_Panel SHALL automatically refresh the filtered view

### Requirement 12: 过滤后操作作用域

**User Story:** 作为用户，我希望在过滤后执行的操作只对过滤后显示的条目生效，以便精确控制操作范围。

#### Acceptance Criteria

1. WHEN filters are active, THE Selection_Assistant SHALL only operate on filtered/visible items
2. WHEN a user performs "全选" operation, THE system SHALL only select visible filtered items
3. WHEN a user performs "反选" operation, THE system SHALL only invert selection on visible filtered items
4. WHEN a user performs "取消全选" operation, THE system SHALL only deselect visible filtered items
5. THE Filter_Panel SHALL display a visual indicator when filters are active
6. WHEN filters are active, THE system SHALL show the count of filtered items vs total items (e.g., "显示 50/200 项")
7. WHEN a user performs batch operations (delete, move, etc.), THE system SHALL only affect visible filtered items
8. THE system SHALL provide a warning or confirmation when performing operations with active filters


### Requirement 13: 扩展名/文件类型过滤

**User Story:** 作为用户，我希望能够根据文件扩展名或类型进行过滤，以便关注特定类型的文件。

#### Acceptance Criteria

1. THE Filter_Panel SHALL support filtering by file extension (e.g., .jpg, .png, .mp4)
2. THE Filter_Panel SHALL support multiple extension selection
3. THE Filter_Panel SHALL provide common extension presets (e.g., "图片", "视频", "文档")
4. WHEN extensions are selected, THE Filter_Panel SHALL only show files with matching extensions

### Requirement 14: 修改日期过滤

**User Story:** 作为用户，我希望能够根据文件修改日期进行过滤，以便关注特定时间段的文件。

#### Acceptance Criteria

1. THE Filter_Panel SHALL support filtering by modification date range
2. THE Filter_Panel SHALL provide quick date presets: "今天", "最近7天", "最近30天", "最近一年"
3. THE Filter_Panel SHALL support custom date range selection
4. THE Filter_Panel SHALL display the current date range in the filter label

### Requirement 15: 路径/目录过滤

**User Story:** 作为用户，我希望能够根据文件路径进行过滤，以便关注特定目录下的文件。

#### Acceptance Criteria

1. THE Filter_Panel SHALL support filtering by path contains/not contains
2. THE Filter_Panel SHALL support filtering by specific directory
3. THE Filter_Panel SHALL provide a directory picker for easy selection
4. WHEN path filter is active, THE Filter_Panel SHALL highlight matching path segments

### Requirement 16: 相似度过滤（针对相似图片/视频）

**User Story:** 作为用户，我希望能够根据相似度进行过滤，以便关注特定相似度范围的文件。

#### Acceptance Criteria

1. WHEN the current tool is Similar Images or Similar Videos, THE Filter_Panel SHALL show similarity filter
2. THE Filter_Panel SHALL support filtering by similarity percentage range
3. THE Filter_Panel SHALL provide quick presets: "高相似度 (>90%)", "中等相似度 (70-90%)", "低相似度 (<70%)"
4. THE Filter_Panel SHALL display a slider for fine-grained similarity adjustment

### Requirement 17: 分辨率过滤（针对图片/视频）

**User Story:** 作为用户，我希望能够根据图片/视频分辨率进行过滤，以便关注特定分辨率的文件。

#### Acceptance Criteria

1. WHEN the current tool is Similar Images or Similar Videos, THE Filter_Panel SHALL show resolution filter
2. THE Filter_Panel SHALL support filtering by minimum/maximum resolution
3. THE Filter_Panel SHALL provide quick presets: "4K+", "1080p+", "720p+", "低分辨率"
4. THE Filter_Panel SHALL support filtering by aspect ratio (16:9, 4:3, 1:1, etc.)

### Requirement 18: 过滤器组合逻辑

**User Story:** 作为用户，我希望能够控制多个过滤器之间的组合逻辑，以便实现复杂的过滤条件。

#### Acceptance Criteria

1. THE Filter_Panel SHALL support AND logic between different filter categories by default
2. THE Filter_Panel SHALL support OR logic within the same filter category (e.g., multiple mark statuses)
3. THE Filter_Panel SHALL display the current active filter count
4. THE Filter_Panel SHALL provide a summary of all active filters

### Requirement 19: 过滤器快捷键

**User Story:** 作为用户，我希望能够使用快捷键快速操作过滤器，以便提高效率。

#### Acceptance Criteria

1. THE Filter_Panel SHALL support Ctrl+F to focus on filter panel
2. THE Filter_Panel SHALL support Escape to clear all filters
3. THE Filter_Panel SHALL support Ctrl+R to refresh filters
4. THE Filter_Panel SHALL display keyboard shortcuts in tooltips

### Requirement 20: 过滤结果统计

**User Story:** 作为用户，我希望能够看到过滤结果的统计信息，以便了解过滤效果。

#### Acceptance Criteria

1. THE Filter_Panel SHALL display total items count before filtering
2. THE Filter_Panel SHALL display filtered items count after filtering
3. THE Filter_Panel SHALL display filtered groups count (for grouped data)
4. THE Filter_Panel SHALL display total size of filtered items
5. THE Filter_Panel SHALL update statistics in real-time as filters change
