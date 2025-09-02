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
  in_progress: 0,
  queued: 1,
  assigned: 1,
  blocked: 1,
  done: 2,
};

function fmtInt(n: number | undefined | null) {
  const v = typeof n === 'number' && isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
}

function fmtTPS(cur?: number) {
  const c = typeof cur === 'number' && isFinite(cur) ? cur : 0;
  return `${c.toFixed(1)}`;
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
      <div className="flex-1 min-h-0 overflow-auto no-scrollbar border border-[#352b19ff] border-t-0">
        <table
              className="min-w-full text-sm"
              style={{
                tableLayout: 'fixed',
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '4px',
                backgroundColor: '#000',
              }}     
        >
          <colgroup>
            <col style={{ width: 50 }} />          {/* AGENT */}
            <col style={{ width: 40 }} />          {/* ID */}
            <col style={{ width: 70 }} />         {/* SECTOR */}
            <col style={{ width: 120 }} />      {/* WORK ORDER (flexes) */}
            <col style={{ width: 40 }} />         {/* TOKENS */}
            <col style={{ width: 40 }} />          {/* TPS */}
            <col style={{ width: 50 }} />         {/* ETA */}
          </colgroup>
          <thead className="text-[#d79326ff]">
            <tr>
              <th className="px-1 py-2 text-left border-b-1">ID</th>
              <th className="px-1 py-2 text-left border-b-1">AGENT</th>
              <th className="px-1 py-2 text-left border-b-1">SECTOR</th>
              <th className="px-1 py-2 text-left border-b-1">WORK ORDER</th>
              <th className="px-1 py-2 text-left border-b-1">TOK.</th>
              <th className="px-1 py-2 text-left border-b-1">TPS</th>
              <th className="px-1 py-2 text-left border-b-1">ETA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it) => {
              const rowCls =
                it.status === 'done' ? 'tr-status-done' :
                it.status === 'in_progress' ? 'tr-status-inprogress' :
                'tr-status-queued';
              return (
                <tr key={it.id} className={`${rowCls}`}>
                  <td className="px-2 py-1 font-mono" style={{ backgroundColor: 'inherit', borderLeft: '4px solid currentColor' }}>{it.id}</td>
                  <td
                    className="px-2 py-1 font-mono"
                  >
                    {it.agent_id ?? '—'}
                  </td>
                  <td className="px-2 py-1" style={{ backgroundColor: 'inherit' }}>{it.sector}</td>
                  <td className="px-2 py-1" style={{ backgroundColor: 'inherit', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.desc || ''}>
                    {it.desc || '—'}
                  </td>
                  <td className="px-2 py-1" style={{ backgroundColor: 'inherit' }}>
                    {fmtInt(it.tokens_done)}
                  </td>
                  <td className="px-2 py-1" style={{ backgroundColor: 'inherit' }}>
                    {fmtTPS(it.tps)}
                  </td>
                  <td className="px-2 py-1" style={{ backgroundColor: 'inherit' }}>
                    {fmtETA(it.eta_ms)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr className="pt-2">
                <td colSpan={7} className="px-3 py-3 text-gray-400">No items loaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
