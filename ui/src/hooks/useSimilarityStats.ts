import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { currentToolDataAtom } from '~/atom/tools';
import { settingsAtom } from '~/atom/settings';
import { getSimilarityLevel, SimilarityLevel } from '~/utils/similarity-utils';

export interface SimilarityStat {
  level: SimilarityLevel;
  count: number;
  percent: number;
}

export function useSimilarityStats() {
  const data = useAtomValue(currentToolDataAtom);
  const settings = useAtomValue(settingsAtom);

  return useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const statsMap = new Map<SimilarityLevel, number>();
    let total = 0;
    let hasSimilarity = false;

    // Determine hash size for similarity levels
    const hashSize = Number.parseInt(settings.similarImagesSubHashSize || '16', 10);

    for (const item of data as any[]) {
      // Skip hidden rows and reference rows (reference rows usually don't have relative similarity)
      // Actually, reference rows in Czkawka results don't have a similarity value to display.
      if (item.hidden || item.isRef || item.similarity === undefined || item.similarity === null || item.similarity === '') continue;

      const simValue = Number.parseInt(item.similarity.toString().split(' ')[0], 10);
      if (Number.isNaN(simValue)) continue;

      hasSimilarity = true;
      const level = getSimilarityLevel(simValue, hashSize);
      statsMap.set(level, (statsMap.get(level) || 0) + 1);
      total++;
    }

    if (!hasSimilarity) return null;

    const levels = [
      SimilarityLevel.Original,
      SimilarityLevel.VeryHigh,
      SimilarityLevel.High,
      SimilarityLevel.Medium,
      SimilarityLevel.Small,
      SimilarityLevel.VerySmall,
      SimilarityLevel.Minimal,
    ];

    return levels
      .map((level) => ({
        level,
        count: statsMap.get(level) || 0,
        percent: total > 0 ? ((statsMap.get(level) || 0) / total) * 100 : 0,
      }))
      .filter((stat) => stat.count > 0);
  }, [data, settings.similarImagesSubHashSize]);
}
