"use client";

import React, { useMemo, useSyncExternalStore } from 'react';
import type { UIState } from '@/lib/store';
import { appStore } from '@/lib/store';

function useAppSelector<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getState()),
    () => selector(appStore.getState())
  );
}

const statusOrder: Record<string, number> = {
  queued: 0,
  assigned: 1,
  in_progress: 2,
  blocked: 3,
  done: 4,
};

function fmtInt(n: number | undefined | null) {
  const v = typeof n === 'number' && isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
}

function fmtTPS(cur?: number, min?: number, max?: number) {
  const c = typeof cur === 'number' && isFinite(cur) ? cur : 0;
  const mi = typeof min === 'number' && isFinite(min) ? min : 0;
  const ma = typeof max === 'number' && isFinite(max) ? max : 0;
  return `${c.toFixed(1)} / ${fmtInt(mi)}–${fmtInt(ma)}`;
}

function fmtETA(ms?: number) {
  if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function WorkTable() {
  const items = useAppSelector((s) => s.items);

  const rows = useMemo(() => {
    const list = Object.values(items);
    list.sort((a, b) => {
      const ao = statusOrder[a.status] ?? 99;
      const bo = statusOrder[b.status] ?? 99;
      if (ao !== bo) return ao - bo;
      return a.id.localeCompare(b.id);
    });
    return list;
  }, [items]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <h2 className="text-lg font-semibold mb-2 px-1">Work Items</h2>
      <div className="flex-1 min-h-0 overflow-auto no-scrollbar rounded-md border border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-gray-200">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Sector</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Tokens</th>
              <th className="px-3 py-2 text-left">TPS</th>
              <th className="px-3 py-2 text-left">ETA</th>
              <th className="px-3 py-2 text-left">Deps</th>
              <th className="px-3 py-2 text-left">Agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it) => {
              const deps = it.depends_on;
              const shown = deps.slice(0, 3);
              const more = deps.length - shown.length;
              return (
                <tr key={it.id} className="odd:bg-gray-900 even:bg-gray-950">
                  <td className="px-3 py-2 font-mono">{it.id}</td>
                  <td className="px-3 py-2">{it.sector}</td>
                  <td className="px-3 py-2">
                    <span className="inline-block rounded px-2 py-0.5 text-xs bg-gray-800 text-gray-200">
                      {it.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-200">
                    {fmtInt(it.tokens_done)} / {fmtInt(it.est_tokens)}
                  </td>
                  <td className="px-3 py-2 text-gray-300">
                    {fmtTPS(it.tps, it.tps_min, it.tps_max)}
                  </td>
                  <td className="px-3 py-2 text-gray-200">
                    {fmtETA(it.eta_ms)}
                  </td>
                  <td className="px-3 py-2 text-gray-300">
                    {shown.join(', ')}{more > 0 ? ` +${more} more` : ''}
                  </td>
                  <td className="px-3 py-2 text-gray-300 font-mono">
                    {it.agent_id ?? '—'}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-3 text-gray-400">No items loaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
