/**
 * GroupCountFilter - 组文件数量过滤器
 * 根据组内文件数量进行过滤
 */

import { useAtom } from 'jotai';
import { Settings } from 'lucide-react';
import { Checkbox } from '~/components/shadcn/checkbox';
import { Label } from '~/components/shadcn/label';
import { Button } from '~/components/shadcn/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/shadcn/popover';
import { Input } from '~/components/shadcn/input';
import { filterStateAtom } from '~/atom/filter-panel';
import { useT } from '~/hooks';
import { useState } from 'react';

export function GroupCountFilter() {
  const t = useT();
  const [filterState, setFilterState] = useAtom(filterStateAtom);
  const { groupCount } = filterState;
  const [tempMin, setTempMin] = useState(groupCount.min.toString());
  const [tempMax, setTempMax] = useState(groupCount.max.toString());
  const [open, setOpen] = useState(false);

  const handleEnabledChange = (checked: boolean) => {
    setFilterState((prev) => ({
      ...prev,
      groupCount: { ...prev.groupCount, enabled: checked },
    }));
  };

  const handleApply = () => {
    const min = Math.max(0, Number.parseInt(tempMin, 10) || 0);
    const max = Math.max(min, Number.parseInt(tempMax, 10) || 100);
    setFilterState((prev) => ({
      ...prev,
      groupCount: { ...prev.groupCount, min, max },
    }));
    setOpen(false);
  };

  const label = `${t('Group' as any) || 'Group'} - ${t('from' as any) || 'from'} ${groupCount.min} ${t('to' as any) || 'to'} ${groupCount.max} ${t('files' as any) || 'files'}`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="group-count-filter"
          checked={groupCount.enabled}
          onCheckedChange={(checked) => handleEnabledChange(checked === true)}
        />
        <Label htmlFor="group-count-filter" className="text-sm cursor-pointer">
          {label}
        </Label>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('Min files' as any) || 'Min files'}</Label>
              <Input
                type="number"
                value={tempMin}
                onChange={(e) => setTempMin(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('Max files' as any) || 'Max files'}</Label>
              <Input
                type="number"
                value={tempMax}
                onChange={(e) => setTempMax(e.target.value)}
                min={0}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                {t('Cancel' as any) || 'Cancel'}
              </Button>
              <Button size="sm" onClick={handleApply}>
                {t('Apply' as any) || 'Apply'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
