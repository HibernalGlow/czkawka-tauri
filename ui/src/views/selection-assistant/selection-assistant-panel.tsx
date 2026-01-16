/**
 * 选择助手主面板
 * 包含三个可折叠区域：组选择、文本选择、目录选择
 */

import { useAtom, useAtomValue } from 'jotai';
import { ChevronDown, ChevronRight, Redo2, Undo2 } from 'lucide-react';
import { useCallback } from 'react';
import {
  canRedoAtom,
  canUndoAtom,
  expandedPanelAtom,
  redoSelectionAtom,
  undoSelectionAtom,
  type ExpandedPanel,
} from '~/atom/selection-assistant';
import { Button } from '~/components/shadcn/button';
import { cn } from '~/utils/cn';
import { useT } from '~/hooks';
import { ActionButtons } from './action-buttons';
import { DirectorySelectionSection } from './directory-selection-section';
import { GroupSelectionSection } from './group-selection-section';
import { TextSelectionSection } from './text-selection-section';

interface AccordionItemProps {
  id: ExpandedPanel;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** 可折叠区域组件 */
function AccordionItem({ title, expanded, onToggle, children }: AccordionItemProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <span>{title}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-3 pb-3">{children}</div>
      </div>
    </div>
  );
}

export function SelectionAssistantPanel() {
  const t = useT();
  const [expandedPanel, setExpandedPanel] = useAtom(expandedPanelAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const [, undo] = useAtom(undoSelectionAtom);
  const [, redo] = useAtom(redoSelectionAtom);

  const handleToggle = useCallback(
    (panel: ExpandedPanel) => {
      setExpandedPanel((prev) => (prev === panel ? null : panel));
    },
    [setExpandedPanel],
  );

  return (
    <div className="flex flex-col h-full">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium">{t('Selection Assistant')}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canUndo}
            onClick={() => undo()}
            title={t('Undo') + ' (Ctrl+Z)'}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canRedo}
            onClick={() => redo()}
            title={t('Redo') + ' (Ctrl+Y)'}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 可折叠区域 */}
      <div className="flex-1 overflow-y-auto">
        <AccordionItem
          id="group"
          title={t('Group Selection')}
          expanded={expandedPanel === 'group'}
          onToggle={() => handleToggle('group')}
        >
          <GroupSelectionSection />
        </AccordionItem>

        <AccordionItem
          id="text"
          title={t('Text Selection')}
          expanded={expandedPanel === 'text'}
          onToggle={() => handleToggle('text')}
        >
          <TextSelectionSection />
        </AccordionItem>

        <AccordionItem
          id="directory"
          title={t('Directory Selection')}
          expanded={expandedPanel === 'directory'}
          onToggle={() => handleToggle('directory')}
        >
          <DirectorySelectionSection />
        </AccordionItem>
      </div>

      {/* 底部操作按钮 */}
      <div className="border-t border-border p-3">
        <ActionButtons />
      </div>
    </div>
  );
}
