"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { appStore } from '@/lib/store';

function useMetrics() {
  return useSyncExternalStore(
    appStore.subscribe,
    () => appStore.getState().metrics,
    () => appStore.getState().metrics,
  );
}

function fmtInt(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
}
function fmtUSD(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
}
function fmtFloat(n?: number, f = 1) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return v.toFixed(f);
}

export default function TopOverview() {
  const m = useMetrics();

  // Completion over time graph state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [points, setPoints] = useState<Array<{ t: number; v: number }>>([]);
  const startRef = useRef<number>(Date.now());

  // Collect points over time; start at 0%
  useEffect(() => {
    const base = startRef.current;
    // ensure first point at t=0 is 0
    setPoints([{ t: 0, v: 0 }]);
    const id = window.setInterval(() => {
      const t = (Date.now() - base) / 1000;
      const vRaw = appStore.getState().metrics.completion_rate || 0;
      const v = Math.max(0, Math.min(1, vRaw));
      setPoints((prev) => {
        const next = prev.concat({ t, v });
        // keep last ~600 points to cap memory
        return next.length > 600 ? next.slice(next.length - 600) : next;
      });
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
      }}
    >
      {/* Main Metrics card */}
      <div style={{ background: '#000' }}>
        <div className="text-lg text-[#d79326ff] pl-2 pr-2 bg-[#130f04ff]">MAIN METRICS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, color: '#cfcfcf', padding: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="text-md" style={{ color: '#a0a0a0'}}>ACTIVE AGENTS</div>
            <div className="text-xl" style={{ marginTop: 4 }}>{fmtInt(m.active_agents)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="text-md" style={{ color: '#a0a0a0'}}>TOTAL TOKENS</div>
            <div className="text-xl" style={{ marginTop: 4 }}>{fmtInt(m.total_tokens)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="text-md" style={{ color: '#a0a0a0'}}>TOTAL SPEND</div>
            <div className="text-xl" style={{ marginTop: 4 }}>{fmtUSD(m.total_spend_usd)}</div>
          </div>
        </div>
      </div>

      {/* Live Throughput card */}
      <div style={{ background: '#000' }}>
        <div className="text-lg text-[#d79326ff] pl-2 pr-2 bg-[#130f04ff]">LIVE THROUGHPUT</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, color: '#cfcfcf', padding: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="text-md" style={{ color: '#a0a0a0'}}>TOKENS / SEC</div>
            <div className="text-xl" style={{ marginTop: 4 }}>{fmtFloat(m.live_tps, 2)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="text-md" style={{ color: '#a0a0a0'}}>SPEND / SEC</div>
            <div className="text-xl" style={{ marginTop: 4 }}>{fmtUSD(m.live_spend_per_s)}</div>
          </div>
        </div>
      </div>

      {/* Project Completion Rate card */}
      <div style={{ background: '#000', display: 'flex', flexDirection: 'column' }}>
        <div className="text-lg text-[#d79326ff] pl-2 pr-2 bg-[#130f04ff]">PROJECT COMPLETION RATE</div>
        <div style={{ padding: '8px' }}>
          <Chart points={points} containerRef={containerRef} />
        </div>
      </div>
    </div>
  );
}

function Chart({ points, containerRef }: { points: Array<{ t: number; v: number }>; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [size, setSize] = useState({ w: 300, h: 120 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    r.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => r.disconnect();
  }, [containerRef]);
  const pad = 8;
  const w = Math.max(10, size.w);
  const h = Math.max(10, size.h);
  const span = Math.max(5, points.length ? points[points.length - 1].t : 5);
  const d = React.useMemo(() => {
    if (!points.length) return '';
    const coords = points.map(({ t, v }) => {
      const x = pad + (t / span) * Math.max(1, w - pad * 2);
      const y = pad + (1 - v) * Math.max(1, h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${coords.join(' L ')}`;
  }, [points, w, h, span]);
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: 140 }}>
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        {/* Axes */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth={1} />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#555" strokeWidth={1} />
        {/* X ticks and moving time label */}
        {(() => {
          const ticks: React.ReactElement[] = [];
          // Choose a friendly tick interval
          const tick = span <= 10 ? 1 : span <= 30 ? 5 : span <= 120 ? 10 : 30;
          for (let t = 0; t <= span + 0.001; t += tick) {
            const x = pad + (t / span) * Math.max(1, w - pad * 2);
            ticks.push(
              <g key={`xt-${t.toFixed(2)}`}>
                <line x1={x} y1={h - pad} x2={x} y2={h - pad + 4} stroke="#555" strokeWidth={1} />
                <text x={x} y={h - pad + 14} fill="#777" fontSize={9} textAnchor="middle">{Math.round(t)}s</text>
              </g>
            );
          }
          // Moving time label at right end
          const xr = w - pad;
          return (
            <g key="time-label">
              {ticks}
              <text x={xr} y={h - pad - 6} fill="#aaa" fontSize={10} textAnchor="end">{Math.round(span)}s</text>
            </g>
          );
        })()}
        {/* Axis labels */}
        <text x={w / 2} y={h - 2} textAnchor="middle" fill="#888" fontSize={10}>Duration</text>
        {/* <text x={pad - 4} y={h / 2} fill="#888" fontSize={10} transform={`rotate(-90 ${pad - 4},${h / 2})`} textAnchor="middle">Progress</text> */}
        {/* 0% and 100% markers */}
        <text x={pad + 2} y={h - pad - 2} fill="#666" fontSize={9}>0%</text>
        <text x={pad + 2} y={pad + 9} fill="#666" fontSize={9}>100%</text>
        {/* Path */}
        <path d={d} fill="none" stroke="#7dd3fc" strokeWidth={2} />
      </svg>
    </div>
  );
}
