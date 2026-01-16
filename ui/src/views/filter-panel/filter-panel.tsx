/**
 * FilterPanel - 过滤器主面板
 * 参考 Duplicate Cleaner Pro 设计的高级过滤系统
 */

import { useAtom, useAtomValue } from 'jotai';
import { ScrollArea } from '~/components/shadcn/scroll-area';
import { Separator } from '~/components/shadcn/separator';
import { filterStateAtom, filterStatsAtom, isFilterActiveAtom } from '~/atom/filter-panel';
import { useT } from '~/hooks';
import { MarkStatusFilter } from './mark-status-filter';
import { GroupCountFilter } from './group-count-filter';
import { GroupSizeFilter } from './group-size-filter';
import { FileSizeFilter } from './file-size-filter';
import { ExtensionFilter } from './extension-filter';
import { DateFilter } from './date-filter';
import { PathFilter } from './path-filter';
import { SimilarityFilter } from './similarity-filter';
import { ResolutionFilter } from './resolution-filter';
import { SelectionFilter } from './selection-filter';
import { PresetFilter } from './preset-filter';
import { ShowAllInGroupToggle } from './show-all-in-group';
import { FilterActionBar } from './filter-action-bar';
import { FilterStats } from './filter-stats';

export function FilterPanel() {
  const t = useT();
  const [filterState, setFilterState] = useAtom(filterStateAtom);
  const stats = useAtomValue(filterStatsAtom);
  const isActive = useAtomValue(isFilterActiveAtom);

  return (
    <div className="flex flex-col h-full">
      {/* 顶部操作栏和统计 */}
      <div className="border-b p-3 space-y-2">
        <FilterStats />
        <FilterActionBar />
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* 标记状态过滤 */}
          <MarkStatusFilter />
          
          <Separator />
          
          {/* 组别过滤 */}
          <div className="space-y-2">
            <GroupCountFilter />
            <GroupSizeFilter />
          </div>
          
          <Separator />
          
          {/* 文件过滤 */}
          <div className="space-y-2">
            <FileSizeFilter />
            <PresetFilter />
            <SelectionFilter />
          </div>
          
          <Separator />
          
          {/* 高级过滤（可选显示） */}
          <div className="space-y-2">
            <ExtensionFilter />
            <DateFilter />
            <PathFilter />
            <SimilarityFilter />
            <ResolutionFilter />
          </div>
          
          <Separator />
          
          {/* 显示选项 */}
          <ShowAllInGroupToggle />
        </div>
      </ScrollArea>
    </div>
  );
}
