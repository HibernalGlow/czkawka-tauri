/**
 * MarkStatusFilter - 标记状态过滤器
 * 根据文件的标记状态进行过滤
 */

import { useAtom } from 'jotai';
import { filterStateAtom } from '~/atom/filter-panel';
import { Checkbox } from '~/components/shadcn/checkbox';
import { Label } from '~/components/shadcn/label';
import { useT } from '~/hooks';
import type { MarkStatusOption } from '~/lib/filter-panel/types';

const MARK_STATUS_OPTIONS: { value: MarkStatusOption; labelKey: string }[] = [
  { value: 'marked', labelKey: 'Marked' },
  { value: 'unmarked', labelKey: 'Unmarked' },
  { value: 'groupHasSomeMarked', labelKey: 'Group Has Some Marked' },
  { value: 'groupAllUnmarked', labelKey: 'Group All Unmarked' },
  { value: 'groupSomeNotAll', labelKey: 'Group Some Not All' },
  { value: 'groupAllMarked', labelKey: 'Group All Marked' },
  { value: 'protected', labelKey: 'Protected' },
];

export function MarkStatusFilter() {
  const t = useT();
  const [filterState, setFilterState] = useAtom(filterStateAtom);
  const { markStatus } = filterState;

  const handleOptionChange = (option: MarkStatusOption, checked: boolean) => {
    setFilterState((prev) => {
      const newOptions = checked
        ? [...prev.markStatus.options, option]
        : prev.markStatus.options.filter((o) => o !== option);

      return {
        ...prev,
        markStatus: {
          enabled: newOptions.length > 0,
          options: newOptions,
        },
      };
    });
  };

  return (
    <div className="space-y-2">
      {MARK_STATUS_OPTIONS.map(({ value, labelKey }) => (
        <div key={value} className="flex items-center space-x-2">
          <Checkbox
            id={`mark-status-${value}`}
            checked={markStatus.options.includes(value)}
            onCheckedChange={(checked) =>
              handleOptionChange(value, checked === true)
            }
          />
          <Label
            htmlFor={`mark-status-${value}`}
            className="text-sm cursor-pointer"
          >
            {t(labelKey as any) || labelKey}
          </Label>
        </div>
      ))}
    </div>
  );
}
