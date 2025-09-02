"use client";

import React, { useEffect, useState } from 'react';
import { ensureConnected, postIntent } from '@/lib/simClient';

const LS_PREFIX = 'ccr.';
const LS = {
  plan: LS_PREFIX + 'plan',
  seed: LS_PREFIX + 'seed',
  speed: LS_PREFIX + 'speed',
};

const plans = ['Calm', 'Rush', 'Web'] as const;

export default function ControlBar() {
  const [plan, setPlan] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem(LS.plan) || 'Calm' : 'Calm'));
  const [seed, setSeed] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem(LS.seed) || 'auto' : 'auto'));
  const [speed, setSpeed] = useState<number>(() => (typeof window !== 'undefined' ? Number(localStorage.getItem(LS.speed) || 1) : 1));
  // No longer exposing running/pause in UI

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
      // Start the engine automatically now that we removed Run/Pause
      postIntent({ type: 'set_running', running: true });
      // Snapshot to sync UI quickly
      postIntent({ type: 'request_snapshot' });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(LS.plan, plan); }, [plan]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(LS.seed, seed); }, [seed]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(LS.speed, String(speed)); }, [speed]);
  // running state persistence removed

  return (
    <div className="px-2 py-2 flex flex-wrap gap-2 items-center">
      <label className="text-sm text-gray-300">Plan</label>
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        className="bg-black border border-gray-700 px-2 py-1 text-sm text-gray-100"
      >
        {plans.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button
        onClick={() => {
          // Apply plan and immediately start running
          postIntent({ type: 'set_plan', plan: plan as 'Calm' | 'Rush' | 'Web' });
          postIntent({ type: 'set_running', running: true });
          postIntent({ type: 'request_snapshot' });
        }}
        className="text-xs px-2 py-1 border border-gray-600 text-gray-200"
      >Apply Plan</button>

      <label className="text-sm text-gray-300 ml-2">Seed</label>
      <input
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        className="bg-black border border-gray-700 px-2 py-1 text-sm text-gray-100 w-28"
        placeholder="auto"
      />
      <button
        onClick={() => { postIntent({ type: 'set_seed', seed }); postIntent({ type: 'request_snapshot' }); }}
        className="text-xs px-2 py-1 border border-gray-600 text-gray-200"
      >Apply Seed</button>

      <label className="text-sm text-gray-300 ml-2">Speed</label>
      <div className="inline-flex gap-1">
        {[1,2,3].map((x) => (
          <button key={x}
            onClick={() => { setSpeed(x); postIntent({ type: 'set_speed', speed: x }); }}
            className={`text-xs px-2 py-1 border ${speed===x ? 'border-blue-500 text-blue-200' : 'border-gray-600 text-gray-200'}`}
          >×{x}</button>
        ))}
      </div>
    </div>
  );
}
