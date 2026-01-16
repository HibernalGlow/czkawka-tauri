/**
 * PresetFilter - 预设过滤器
 * 快速应用预定义的过滤配置
 */

import { useAtom } from 'jotai';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/shadcn/select';
import { Label } from '~/components/shadcn/label';
import { filterStateAtom } from '~/atom/filter-panel';
import { applyPreset, presetConfigs } from '~/lib/filter-panel/presets';
import { useT } from '~/hooks';
import type { FilterPreset } from '~/lib/filter-panel/types';

export function PresetFilter() {
  const t = useT();
  const [filterState, setFilterState] = useAtom(filterStateAtom);
  const { preset } = filterState;

  const handlePresetChange = (value: FilterPreset) => {
    if (value === 'none') {
      setFilterState((prev) => ({ ...prev, preset: 'none' }));
    } else {
      const newState = applyPreset(filterState, value);
      setFilterState(newState);
    }
  };

  // 预设选项
  const presetOptions: { value: FilterPreset; label: string }[] = [
    { value: 'none', label: t('NoPreset' as any) || 'No Preset' },
    { value: 'largeFilesFirst', label: t('LargeFilesFirst' as any) || 'Large Files First' },
    { value: 'smallFilesFirst', label: t('SmallFilesFirst' as any) || 'Small Files First' },
    { value: 'recentlyModified', label: t('RecentlyModified' as any) || 'Recently Modified' },
    { value: 'oldFiles', label: t('OldFiles' as any) || 'Old Files' },
  ];

  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{t('Preset' as any) || 'Preset'}</Label>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-40 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
