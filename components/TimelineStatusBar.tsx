"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { appStore } from '@/lib/store';
import type { UIState } from '@/lib/store';
import type { WorkItem } from '@/lib/types';

function useAppSelector<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getState()),
    () => selector(appStore.getState())
  );
}

function fmtHMS(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = m.toString();
  const ss = s.toString().padStart(2, '0');
  if (h > 0) return `${h}:${mm.padStart(2, '0')}:${ss}`;
  return `${mm}:${ss}`;
}

export default function TimelineStatusBar() {
  const items = useAppSelector((s) => s.items);

  // Compute earliest start timestamp and total expected ms (sum of estimates)
  const { earliestStart, totalEstimateMs } = useMemo(() => {
    let earliest: number | undefined = undefined;
    let total = 0;
    for (const it of Object.values(items) as WorkItem[]) {
      total += Math.max(0, it.estimate_ms || 0);
      if (it.started_at && (earliest === undefined || it.started_at < earliest)) {
        earliest = it.started_at;
      }
    }
    return { earliestStart: earliest, totalEstimateMs: total };
  }, [items]);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const isRunning = typeof earliestStart === 'number' && earliestStart > 0;
  const elapsedMs = isRunning ? Math.max(0, now - (earliestStart as number)) : 0;
  const denom = totalEstimateMs > 0 ? totalEstimateMs : 1;
  const progress = Math.max(0, Math.min(1, elapsedMs / denom));

  return (
    <div className="w-full bg-black">
      <div className="flex items-center gap-4 px-3 py-2">
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className={`text-sm font-semibold ${isRunning ? 'text-green-400' : 'text-yellow-300'}`}>
            {isRunning ? 'RUNNING' : 'INITIALIZING'}
          </span>
          {isRunning && (
            <span className="font-mono text-xs text-gray-300">{fmtHMS(elapsedMs)}</span>
          )}
        </div>
        <div className="flex-1">
          <ProgressBar pct={progress} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const pc = Math.max(0, Math.min(1, pct));
  const percent = pc * 100;
  return (
    <div className="relative h-4 w-full bg-[#0b0b0b] border border-[#1f2910]">
      {/* filled portion */}
      <div
        className="h-full bg-green-600"
        style={{ width: `${percent}%`, transition: 'width 0.3s linear' }}
      />
      {/* notch at current progress */}
      <div
        className="absolute top-0 h-full border-r-2 border-white/70"
        style={{ left: `calc(${percent}% - 1px)` }}
      />
    </div>
  );
}
