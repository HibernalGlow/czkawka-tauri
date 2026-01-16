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
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Only process for tools that have similarity data
    if (currentTool !== Tools.SimilarImages && currentTool !== Tools.SimilarVideos) {
      return null;
    }

    const statsMap = new Map<SimilarityLevel, number>();
    let total = 0;
    let hasSimilarity = false;

    // Determine hash size for similarity levels
    // For videos, the default or fixed hash size should be consistent with how getSimilarityLevel expects it.
    // Based on similarity-utils.ts, the default is 16.
    const hashSize = currentTool === Tools.SimilarImages 
      ? Number.parseInt(settings.similarImagesSubHashSize || '16', 10)
      : 16; // Similar Videos doesn't seem to have a configurable hash size in UI settings yet

    for (const item of data as any[]) {
      // Skip hidden rows and reference rows
      if (item.hidden || item.isRef) continue;
      
      let simValue: number | null = null;
      
      // Try to get similarity from raw data first (more reliable)
      if (item.raw && item.raw.similarity !== undefined && item.raw.similarity !== null) {
        simValue = typeof item.raw.similarity === 'number' 
          ? item.raw.similarity 
          : Number.parseInt(item.raw.similarity.toString().split(' ')[0], 10);
      } else if (item.similarity !== undefined && item.similarity !== null && item.similarity !== '') {
        // Fallback to the display similarity string
        simValue = Number.parseInt(item.similarity.toString().split(' ')[0], 10);
      }

      if (simValue === null || Number.isNaN(simValue)) continue;

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
  }, [data, settings.similarImagesSubHashSize, currentTool]);
}
