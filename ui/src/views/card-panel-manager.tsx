/**
 * CardPanelManager - 卡片面板管理器
 * 提供表格形式的卡片管理界面，支持搜索、拖拽排序和面板分配
 */
import { useAtom, useSetAtom } from 'jotai';
import {
  LayoutGrid,
  RotateCcw,
  Search,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  GripVertical,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  cardConfigAtom,
  resetCardConfigAtom,
  setCardVisibleAtom,
  moveCardAtom,
  moveCardToPanelAtom,
} from '~/atom/card-config';
import { cardRegistry, getAllPanelIds } from '~/lib/cards/registry';
import type { PanelId, CardConfig } from '~/lib/cards/types';
import { Button } from '~/components/shadcn/button';
import { Input } from '~/components/shadcn/input';
import { Badge } from '~/components/shadcn/badge';
import { Tabs, TabsList, TabsTrigger } from '~/components/shadcn/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/shadcn/dropdown-menu';
import { ScrollArea } from '~/components/shadcn/scroll-area';
import { cn } from '~/utils/cn';
import { useT } from '~/hooks';

// 面板标题映射（用于国际化）
const PANEL_TITLE_KEYS: Record<PanelId, string> = {
  'bottom-bar': 'Bottom Bar',
  'image-preview': 'Image Preview',
  'video-preview': 'Video preview',
  'selection-assistant': 'Selection Assistant',
  'filter-panel': 'Filter panel',
  'analysis-panel': 'Analysis panel',
  settings: 'Settings',
};

// 卡片标题映射（用于国际化）
const CARD_TITLE_KEYS: Record<string, string> = {
  'tool-controls': 'Tool controls',
  'algorithm-settings': 'Algorithm settings',
  'included-dirs': 'Include Directories',
  logs: 'Logs',
  'image-preview': 'Image Preview',
  'image-info': 'Image info',
  'video-preview': 'Video preview',
  'video-info': 'Video info',
  'group-selection': 'Group Selection',
  'text-selection': 'Text Selection',
  'directory-selection': 'Directory Selection',
  'sort-criteria': 'Sort criteria',
  'file-filter': 'File filter',
  'similarity-filter': 'Similarity filter',
  'quick-filter': 'Quick filter',
  'format-donut-chart': 'Format distribution',
  'format-bar-chart': 'Format size chart',
  'similarity-distribution': 'Similarity distribution',
  'card-panel-manager': 'Card panels',
};

export function CardPanelManager() {
  const [cardConfig] = useAtom(cardConfigAtom);
  const resetConfig = useSetAtom(resetCardConfigAtom);
  const setCardVisible = useSetAtom(setCardVisibleAtom);
  const moveCard = useSetAtom(moveCardAtom);
  const moveCardToPanel = useSetAtom(moveCardToPanelAtom);
  const t = useT();

  const [searchQuery, setSearchQuery] = useState('');
  const [panelFilter, setPanelFilter] = useState<string>('all');

  const allPanelIds = getAllPanelIds();

  // 获取翻译后的面板标题
  const getPanelTitleLocalized = (panelId: PanelId): string => {
    const key = PANEL_TITLE_KEYS[panelId];
    return key ? t(key as any) : panelId;
  };

  // 获取翻译后的卡片标题
  const getCardTitleLocalized = (cardId: string): string => {
    const key = CARD_TITLE_KEYS[cardId];
    return key ? t(key as any) : cardId;
  };

  // 合并所有卡片数据
  const allCards = useMemo(() => {
    const result: (CardConfig & { panelTitle: string; localizedTitle: string })[] = [];
    for (const panelId of allPanelIds) {
      const cards = cardConfig.configs[panelId] || [];
      result.push(
        ...cards.map((c) => ({
          ...c,
          panelTitle: getPanelTitleLocalized(panelId),
          localizedTitle: getCardTitleLocalized(c.id),
        }))
      );
    }
    return result;
  }, [cardConfig, allPanelIds, t]);

  // 筛选后的卡片列表
  const filteredCards = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let cards = panelFilter === 'all'
      ? allCards
      : allCards.filter((c) => c.panelId === panelFilter);

    if (query) {
      cards = cards.filter(
        (c) =>
          c.localizedTitle.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
    }

    return cards;
  }, [allCards, panelFilter, searchQuery]);

  // 各面板卡片数量
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of allPanelIds) {
      counts[id] = (cardConfig.configs[id] || []).length;
    }
    return counts;
  }, [cardConfig, allPanelIds]);

  const handleReset = () => {
    resetConfig();
  };

  const handleToggleVisible = (card: CardConfig) => {
    setCardVisible({ panelId: card.panelId, cardId: card.id, visible: !card.visible });
  };

  const handleMoveUp = (card: CardConfig) => {
    const cards = cardConfig.configs[card.panelId] || [];
    const idx = cards.findIndex((c) => c.id === card.id);
    if (idx > 0) {
      moveCard({ panelId: card.panelId, cardId: card.id, newOrder: idx - 1 });
    }
  };

  const handleMoveDown = (card: CardConfig) => {
    const cards = cardConfig.configs[card.panelId] || [];
    const idx = cards.findIndex((c) => c.id === card.id);
    if (idx < cards.length - 1) {
      moveCard({ panelId: card.panelId, cardId: card.id, newOrder: idx + 1 });
    }
  };

  const handleAssignToPanel = (card: CardConfig, targetPanelId: PanelId) => {
    if (targetPanelId !== card.panelId) {
      moveCardToPanel({ cardId: card.id, targetPanelId });
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-2">
      {/* 标题 */}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{t('Card panel manager')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('Configure card visibility and order')}
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search cards')}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {t('Reset')}
        </Button>
      </div>

      {/* 面板标签页 */}
      <Tabs value={panelFilter} onValueChange={setPanelFilter}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="gap-1 px-3 py-1.5 text-xs">
            <LayoutGrid className="h-3.5 w-3.5" />
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {allCards.length}
            </Badge>
          </TabsTrigger>
          {allPanelIds.map((panelId) => (
            <TabsTrigger key={panelId} value={panelId} className="gap-1 px-3 py-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{getPanelTitleLocalized(panelId)}</span>
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {groupCounts[panelId] || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 卡片列表 */}
      <ScrollArea className="flex-1 border rounded-lg">
        <div className="divide-y">
          {filteredCards.map((card) => {
            const cardDef = cardRegistry[card.id];
            const Icon = cardDef?.icon;
            const panelCards = cardConfig.configs[card.panelId] || [];
            const cardIndex = panelCards.findIndex((c) => c.id === card.id);

            return (
              <div
                key={`${card.panelId}-${card.id}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 group',
                  !card.visible && 'opacity-50'
                )}
              >
                {/* 拖拽手柄 */}
                <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab" />

                {/* 图标 */}
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                  {Icon && <Icon className="h-4 w-4" />}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{card.localizedTitle}</div>
                  <div className="text-xs text-muted-foreground font-mono uppercase">
                    {card.id}
                  </div>
                </div>

                {/* 面板标签 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Badge variant={card.visible ? 'default' : 'outline'} className="text-[10px]">
                        {card.panelTitle}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">{t('Assign to panel')}</DropdownMenuLabel>
                    {allPanelIds.map((panelId) => (
                      <DropdownMenuItem
                        key={panelId}
                        onClick={() => handleAssignToPanel(card, panelId)}
                        className="gap-2"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {getPanelTitleLocalized(panelId)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 操作按钮 */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={cardIndex === 0}
                    onClick={() => handleMoveUp(card)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={cardIndex === panelCards.length - 1}
                    onClick={() => handleMoveDown(card)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleToggleVisible(card)}
                        disabled={!card.canHide}
                        className="gap-2"
                      >
                        {card.visible ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            {t('Hide')}
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            {t('Show')}
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {filteredCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <LayoutGrid className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm">{t('No cards found')}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
