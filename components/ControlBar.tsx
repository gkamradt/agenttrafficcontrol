"use client";

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { appStore } from '@/lib/store';
import { ensureConnected, postIntent } from '@/lib/simClient';

const LS_PREFIX = 'ccr.';
const LS = {
  plan: LS_PREFIX + 'plan',
  seed: LS_PREFIX + 'seed',
  speed: LS_PREFIX + 'speed',
  running: LS_PREFIX + 'running',
};

const plans = ['Calm', 'Rush', 'Web'] as const;

export default function ControlBar() {
  const [plan, setPlan] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem(LS.plan) || 'Calm' : 'Calm'));
  const [seed, setSeed] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem(LS.seed) || 'auto' : 'auto'));
  const [speed, setSpeed] = useState<number>(() => (typeof window !== 'undefined' ? Number(localStorage.getItem(LS.speed) || 1) : 1));
  const running = useSyncExternalStore(
    appStore.subscribe,
    () => appStore.getState().running,
    () => appStore.getState().running,
  );

  useEffect(() => {
    ensureConnected();
    // On first mount, apply persisted plan/seed and URL ?seed=
    try {
      const url = new URL(window.location.href);
      const urlSeed = url.searchParams.get('seed');
      if (urlSeed) {
        postIntent({ type: 'set_seed', seed: urlSeed });
      } else if (seed) {
        postIntent({ type: 'set_seed', seed });
      }
      if (plan) {
        postIntent({ type: 'set_plan', plan: plan as 'Calm' | 'Rush' | 'Web' });
      }
      postIntent({ type: 'request_snapshot' });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(LS.plan, plan); }, [plan]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(LS.seed, seed); }, [seed]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(LS.speed, String(speed)); }, [speed]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(LS.running, String(running)); }, [running]);

  return (
    <div className="px-4 py-2 flex flex-wrap gap-2 items-center">
      <button
        onClick={() => {
          postIntent({ type: 'set_running', running: !running });
          postIntent({ type: 'request_snapshot' });
        }}
        className={`text-xs rounded px-3 py-1 border ${running ? 'bg-green-700/30 border-green-600 text-green-200' : 'bg-red-700/30 border-red-600 text-red-200'}`}
      >
        {running ? 'Pause' : 'Run'}
      </button>

      <label className="text-sm text-gray-300">Plan</label>
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100"
      >
        {plans.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button
        onClick={() => {
          postIntent({ type: 'set_plan', plan: plan as 'Calm' | 'Rush' | 'Web' });
          postIntent({ type: 'request_snapshot' });
        }}
        className="text-xs rounded px-2 py-1 border border-gray-600 text-gray-200"
      >Apply Plan</button>

      <label className="text-sm text-gray-300 ml-2">Seed</label>
      <input
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 w-28"
        placeholder="auto"
      />
      <button
        onClick={() => { postIntent({ type: 'set_seed', seed }); postIntent({ type: 'request_snapshot' }); }}
        className="text-xs rounded px-2 py-1 border border-gray-600 text-gray-200"
      >Apply Seed</button>

      <label className="text-sm text-gray-300 ml-2">Speed</label>
      <div className="inline-flex gap-1">
        {[1,2,3].map((x) => (
          <button key={x}
            onClick={() => { setSpeed(x); postIntent({ type: 'set_speed', speed: x }); }}
            className={`text-xs rounded px-2 py-1 border ${speed===x ? 'border-blue-500 text-blue-200' : 'border-gray-600 text-gray-200'}`}
          >×{x}</button>
        ))}
      </div>
    </div>
  );
}
