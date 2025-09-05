"use client";

import React, { useEffect, useState } from 'react';
import { ensureConnected, postIntent } from '@/lib/simClient';
import AudioPlayer from '@/components/AudioPlayer';
import { tracks, radio } from '@/lib/audio/tracks';
import { PLAN_NAMES, DEFAULT_PLAN_NAME } from '@/plans';

const LS_PREFIX = 'ccr.';
const LS = {
  plan: LS_PREFIX + 'plan',
  speed: LS_PREFIX + 'speed',
};

export default function ControlBar() {
  const [plan, setPlan] = useState<string>(DEFAULT_PLAN_NAME);
  // Speed controls temporarily removed for stability
  // No longer exposing running/pause in UI

  useEffect(() => {
    ensureConnected();
    // On first mount, set seed, apply plan, then start running
    try {
      const stored = localStorage.getItem(LS.plan) || DEFAULT_PLAN_NAME;
      setPlan(stored);
      const url = new URL(window.location.href);
      const urlSeed = url.searchParams.get('seed');
      const randomSeed = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      postIntent({ type: 'set_seed', seed: urlSeed || randomSeed });
      // Apply plan before starting engine to avoid pause from later set_plan
      postIntent({ type: 'set_plan', plan: stored });
      // Start the engine automatically
      postIntent({ type: 'set_running', running: true });
      // Snapshot to sync UI quickly
      postIntent({ type: 'request_snapshot' });
    } catch {}
  }, []);

  // Persist plan whenever it changes (engine is only updated via Execute or initial mount)
  useEffect(() => {
    try { localStorage.setItem(LS.plan, plan); } catch {}
  }, [plan]);
  // Speed persistence removed
  // running state persistence removed

  return (
    <div className="px-2 py-2 flex flex-wrap gap-2 items-center">
      <label className="text-sm text-gray-300">Project</label>
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        className="bg-black border border-gray-700 px-2 py-1 text-sm h-8 text-gray-100"
      >
        {PLAN_NAMES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button
        onClick={() => {
          // Apply plan and immediately start running
          postIntent({ type: 'set_plan', plan: plan });
          postIntent({ type: 'set_running', running: true });
          postIntent({ type: 'request_snapshot' });
        }}
        className="text-xs px-2 py-1 border border-gray-600 text-gray-200 h-8"
      >Execute</button>

      {/* Speed controls removed for now */}

      {/* Right-aligned players: Radio + Music */}
      <div className="ml-auto flex items-end gap-6">
        <AudioPlayer tracks={radio} showSourceLink className="text-right" />
        <AudioPlayer tracks={tracks} className="text-right" />
      </div>
    </div>
  );
}
