import { filesize } from 'filesize';
import { motion } from 'framer-motion';
import { BarChart3, PieChart } from 'lucide-react';
import { useState } from 'react';
import { Button, TooltipButton } from '~/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/shadcn/dialog';
import { useFormatStats } from '~/hooks/useFormatStats';
import { useSimilarityStats } from '~/hooks/useSimilarityStats';
import { useT } from '~/hooks/use-t';
import { getSimilarityLevelText } from '~/utils/similarity-utils';

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
];

const SIMILARITY_COLORS: Record<string, string> = {
  Original: '#9333ea', // purple-600
  VeryHigh: '#dc2626', // red-600
  High: '#ea580c', // orange-600
  Medium: '#ca8a04', // yellow-600
  Small: '#2563eb', // blue-600
  VerySmall: '#16a34a', // green-600
  Minimal: '#4b5563', // gray-600
};

export function FormatAnalysisDialog() {
  const [open, setOpen] = useState(false);
  const stats = useFormatStats();
  const similarityStats = useSimilarityStats();
  const t = useT();

  const hasData = (stats && stats.length > 0) || (similarityStats && similarityStats.length > 0);
  if (!hasData) return null;

  return (
    <>
      <TooltipButton
        tooltip={t('Format analysis')}
        onClick={() => setOpen(true)}
        size="sm"
      >
        <PieChart className="h-4 w-4" />
      </TooltipButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('File format analysis')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                {/* Donut Chart */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-64 h-64">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {stats.slice(0, 10).map((stat, i) => {
                        const prevPercent = stats
                          .slice(0, i)
                          .reduce((sum, s) => sum + s.percent, 0);
                        
                        return (
                          <motion.circle
                            key={stat.format}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={COLORS[i % COLORS.length]}
                            strokeWidth="12"
                            strokeDasharray={`${stat.percent} ${100 - stat.percent}`}
                            strokeDashoffset={-prevPercent}
                            pathLength="100"
                            initial={{ opacity: 0, strokeDasharray: `0 100` }}
                            animate={{ opacity: 1, strokeDasharray: `${stat.percent} ${100 - stat.percent}` }}
                            transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                            strokeLinecap="butt"
                          />
                        );
                      })}
                      {/* Inner circle for donut hole */}
                      <circle cx="50" cy="50" r="30" fill="currentColor" className="text-background" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{stats.length}</span>
                      <span className="text-xs text-muted-foreground">{t('Formats')}</span>
                    </div>
                  </div>
                </div>

                {/* Legend and List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-medium text-sm text-muted-foreground border-b pb-2">
                    <span>{t('Format')}</span>
                    <div className="flex gap-8">
                      <span>{t('Count')}</span>
                      <span>{t('Size')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {stats.slice(0, 10).map((stat, i) => (
                      <motion.div
                        key={stat.format}
                        className="flex items-center justify-between text-sm group"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                          />
                          <span className="font-mono uppercase">{stat.format}</span>
                        </div>
                        <div className="flex gap-6 text-right">
                          <span className="w-12 text-muted-foreground">{stat.count}</span>
                          <span className="w-24 font-medium">{filesize(stat.size)}</span>
                        </div>
                      </motion.div>
                    ))}
                    {stats.length > 10 && (
                      <div className="text-center text-xs text-muted-foreground pt-2">
                        {t('and_others', { count: stats.length - 10 })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bar Charts for all formats */}
            {stats && stats.length > 0 && (
              <div className="mt-8 space-y-6">
                <h3 className="text-sm font-semibold flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  {t('Size distribution')}
                </h3>
                <div className="space-y-4">
                  {stats.slice(0, 15).map((stat, i) => (
                    <div key={stat.format} className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="uppercase font-medium">{stat.format}</span>
                        <span className="text-muted-foreground">
                          {filesize(stat.size)} ({stat.percent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.percent}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similarity Distribution Chart */}
            {similarityStats && similarityStats.length > 0 && (
              <div className="mt-8 space-y-6">
                <h3 className="text-sm font-semibold flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  {t('Similarity distribution')}
                </h3>
                <div className="space-y-4">
                  {similarityStats.map((stat, i) => (
                    <div key={stat.level} className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">
                          {t(getSimilarityLevelText(stat.level) as any)} ({stat.count})
                        </span>
                        <span className="text-muted-foreground">
                          {stat.percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full"
                          style={{ backgroundColor: SIMILARITY_COLORS[stat.level] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.percent}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
