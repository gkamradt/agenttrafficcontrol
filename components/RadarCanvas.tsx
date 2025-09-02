"use client";

import React, { useEffect, useRef } from 'react';
import { RING_COUNT } from '@/lib/constants';
import { appStore } from '@/lib/store';
import { createRNG } from '@/lib/rng';

function clampDPR(dpr: number) { return Math.min(2, Math.max(1, dpr || 1)); }

export default function RadarCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let wCss = 0, hCss = 0, cx = 0, cy = 0, r = 0;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = clampDPR(window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      wCss = Math.max(200, rect.width);
      hCss = Math.max(200, rect.height);
      canvas.width = Math.floor(wCss * dpr);
      canvas.height = Math.floor(hCss * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawStatic(wCss, hCss);
      cx = wCss / 2; cy = hCss / 2; r = Math.min(wCss, hCss) * 0.45;
    }

    function drawStatic(w: number, h: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, w, h);
      // background (full black)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // center + radius
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.45;

      // rings
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= RING_COUNT; i++) {
        const rr = (r * i) / RING_COUNT;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // tick marks (simple cross)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // center checkbox glyph
      const box = Math.max(10, r * 0.06);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - box / 2, cy - box / 2, box, box);
    }

    resize();
    let obs: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      obs = new ResizeObserver(resize);
      obs.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    // Simple animation loop to draw in-progress agents
    let rafId: number | null = null;
    function angleForAgent(agentId: string) {
      const rng = createRNG(agentId);
      return rng.next() * Math.PI * 2;
    }
    // Per-agent fading trail dots emitted at the agent's position.
    type TrailDot = { x: number; y: number; created: number };
    const trails = new Map<string, { dots: TrailDot[]; lastEmit: number }>();
    const EMIT_INTERVAL_MS = 500; // drop a dot every ~120ms
    const MAX_DOTS = 10;           // keep up to 3 dots per agent
    const LIFESPAN_MS = 5900;      // each dot fades out over ~0.9s
    function drawAgents() {
      // Guard against missing context (TS + runtime safety)
      if (!canvas || !ctx) return;
      // Redraw static each frame (simple MVP approach)
      drawStatic(wCss, hCss);
      const state = appStore.getState();
      const now = Date.now();

      // Draw and update trails before drawing agents so agents sit on top
      for (const [agentId, trail] of trails) {
        // purge expired
        trail.dots = trail.dots.filter(d => now - d.created <= LIFESPAN_MS);
        for (const d of trail.dots) {
          const age = now - d.created;
          const t = Math.max(0, Math.min(1, age / LIFESPAN_MS));
          const alpha = (1 - t) * 0.9; // start opaque, fade to 0
          const radius = Math.max(1.5, 3 - t * 1.5);
          ctx.beginPath();
          ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(147,197,253,${alpha.toFixed(3)})`;
          ctx.fill();
        }
        if (trail.dots.length === 0) trails.delete(agentId);
      }
      for (const agent of Object.values(state.agents)) {
        const item = state.items[agent.work_item_id];
        if (!item || item.status !== 'in_progress') continue;
        const est = Math.max(1, item.estimate_ms || 0);
        let t = 0;
        if (typeof item.eta_ms === 'number' && isFinite(item.eta_ms)) {
          t = 1 - Math.max(0, Math.min(1, item.eta_ms / est));
        } else if (typeof item.started_at === 'number') {
          const elapsed = Date.now() - item.started_at;
          t = Math.max(0, Math.min(1, elapsed / est));
        }
        const theta = angleForAgent(agent.id);
        const rad = r * (1 - t);
        const x = cx + Math.cos(theta) * rad;
        const y = cy + Math.sin(theta) * rad;
        const dir = Math.atan2(cy - y, cx - x);
        const len = Math.max(8, Math.min(14, r * 0.05));
        const width = Math.max(5, Math.min(9, r * 0.03));

        // Emit a new dot at the agent's current position; dots stay static and fade
        let trail = trails.get(agent.id);
        if (!trail) { trail = { dots: [], lastEmit: 0 }; trails.set(agent.id, trail); }
        if (now - trail.lastEmit >= EMIT_INTERVAL_MS) {
          trail.dots.push({ x, y, created: now });
          trail.lastEmit = now;
          if (trail.dots.length > MAX_DOTS) trail.dots.splice(0, trail.dots.length - MAX_DOTS);
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(dir);
        ctx.fillStyle = 'rgba(147,197,253,0.9)';
        ctx.beginPath();
        ctx.moveTo(len, 0);
        ctx.lineTo(-len * 0.5, width * 0.6);
        ctx.lineTo(-len * 0.5, -width * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      rafId = window.requestAnimationFrame(drawAgents);
    }
    rafId = window.requestAnimationFrame(drawAgents);

    return () => {
      if (obs) obs.disconnect();
      else window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <h2 className="text-lg font-semibold mb-2 px-1">Radar</h2>
      <div className="flex-1 min-h-0 border border-gray-800 bg-black">
        <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
}
