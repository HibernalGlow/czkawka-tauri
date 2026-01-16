/**
 * FileSizeFilter - 文件大小过滤器
 * 根据单个文件大小进行过滤
 */

import { useAtom } from 'jotai';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '~/components/shadcn/checkbox';
import { Label } from '~/components/shadcn/label';
import { Button } from '~/components/shadcn/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/shadcn/popover';
import { Input } from '~/components/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/shadcn/select';
import { filterStateAtom } from '~/atom/filter-panel';
import { useT } from '~/hooks';
import { formatBytes, convertSize } from '~/lib/filter-panel/utils';
import type { SizeUnit } from '~/lib/filter-panel/types';

const SIZE_UNITS: SizeUnit[] = ['B', 'KB', 'MB', 'GB', 'TB'];

export function FileSizeFilter() {
  const t = useT();
  const [filterState, setFilterState] = useAtom(filterStateAtom);
  const { fileSize } = filterState;
  const [tempMin, setTempMin] = useState('100');
  const [tempMax, setTempMax] = useState('100');
  const [tempMinUnit, setTempMinUnit] = useState<SizeUnit>('MB');
  const [tempMaxUnit, setTempMaxUnit] = useState<SizeUnit>('GB');
  const [open, setOpen] = useState(false);

  const handleEnabledChange = (checked: boolean) => {
    setFilterState((prev) => ({
      ...prev,
      fileSize: { ...prev.fileSize, enabled: checked },
    }));
  };

  const handleApply = () => {
    const minValue = Number.parseFloat(tempMin) || 0;
    const maxValue = Number.parseFloat(tempMax) || 100;
    const minBytes = convertSize(minValue, tempMinUnit, 'B');
    const maxBytes = convertSize(maxValue, tempMaxUnit, 'B');
    
    setFilterState((prev) => ({
      ...prev,
      fileSize: {
        ...prev.fileSize,
        min: Math.min(minBytes, maxBytes),
        max: Math.max(minBytes, maxBytes),
        unit: tempMaxUnit,
      },
    }));
    setOpen(false);
  };

  const minFormatted = formatBytes(fileSize.min);
  const maxFormatted = formatBytes(fileSize.max);
  const label = `${t('File size' as any) || 'File size'} - ${t('from' as any) || 'from'} ${minFormatted} ${t('to' as any) || 'to'} ${maxFormatted}`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="file-size-filter"
          checked={fileSize.enabled}
          onCheckedChange={(checked) => handleEnabledChange(checked === true)}
        />
        <Label htmlFor="file-size-filter" className="text-sm cursor-pointer">
          {label}
        </Label>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('Min size' as any) || 'Min size'}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  min={0}
                  className="flex-1"
                />
                <Select value={tempMinUnit} onValueChange={(v) => setTempMinUnit(v as SizeUnit)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('Max size' as any) || 'Max size'}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  min={0}
                  className="flex-1"
                />
                <Select value={tempMaxUnit} onValueChange={(v) => setTempMaxUnit(v as SizeUnit)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
