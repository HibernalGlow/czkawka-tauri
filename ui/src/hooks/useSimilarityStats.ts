import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { currentToolDataAtom } from '~/atom/tools';
import { currentToolAtom } from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import { getSimilarityLevel, SimilarityLevel } from '~/utils/similarity-utils';
import { Tools } from '~/consts';

export interface SimilarityStat {
  level: SimilarityLevel;
  count: number;
  percent: number;
}

export function useSimilarityStats() {
  const data = useAtomValue(currentToolDataAtom);
  const settings = useAtomValue(settingsAtom);
  const currentTool = useAtomValue(currentToolAtom);

  return useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const statsMap = new Map<SimilarityLevel, number>();
    let total = 0;
    let hasSimilarity = false;

    const hashSize = currentTool === Tools.SimilarImages 
      ? Number.parseInt(settings.similarImagesSubHashSize || '16', 10)
      : 16;

    for (const item of data as any[]) {
      // Skip hidden rows (separators)
      if (item.hidden) continue;
      
      // Try to find similarity in various possible fields
      // 1. raw.similarity (preferred)
      // 2. item.similarity
      // 3. item.Similarity
      let rawSimValue: any = item.raw?.similarity ?? item.similarity ?? item.Similarity;

      if (rawSimValue === undefined || rawSimValue === null || rawSimValue === '') {
        continue;
      }

      let simValue: number;
      if (typeof rawSimValue === 'number') {
        simValue = rawSimValue;
      } else {
        // Parse string: "15 (Diff)" -> 15, "10" -> 10
        const match = rawSimValue.toString().match(/\d+/);
        simValue = match ? Number.parseInt(match[0], 10) : Number.NaN;
      }

      if (Number.isNaN(simValue)) {
        continue;
      }

      // Count the item
      hasSimilarity = true;
      const level = getSimilarityLevel(simValue, hashSize);
      statsMap.set(level, (statsMap.get(level) || 0) + 1);
      total++;
    }

    if (!hasSimilarity) {
      console.log('[SimilarityStats] No similarity data found in', data.length, 'items');
      return null;
    }

    const levels = [
      SimilarityLevel.Original,
      SimilarityLevel.VeryHigh,
      SimilarityLevel.High,
      SimilarityLevel.Medium,
      SimilarityLevel.Small,
      SimilarityLevel.VerySmall,
      SimilarityLevel.Minimal,
    ];

    const result = levels
      .map((level) => ({
        level,
        count: statsMap.get(level) || 0,
        percent: total > 0 ? ((statsMap.get(level) || 0) / total) * 100 : 0,
      }))
      .filter((stat) => stat.count > 0);

    return result;
  }, [data, settings.similarImagesSubHashSize, currentTool]);
}
