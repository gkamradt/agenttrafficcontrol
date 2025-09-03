"use client";

import React, { useEffect, useRef } from 'react';
import { RING_COUNT } from '@/lib/constants';
import { appStore } from '@/lib/store';
import { createRNG } from '@/lib/rng';

function clampDPR(dpr: number) { return Math.min(2, Math.max(1, dpr || 1)); }

type RadarCanvasProps = { message?: string };

export default function RadarCanvas({ message }: RadarCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const messageRef = useRef<string | undefined>(message);

  // keep message live without restarting effect
  if (messageRef.current !== message) messageRef.current = message;

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
      // Background outside the radar circle: off-black green
      const OUT_BG = '#050c0aff';
      ctx.fillStyle = OUT_BG;
      ctx.fillRect(0, 0, w, h);

      // center + radius
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.45;

      // Subtle background grid (outside circle): draw across, then cover inside with circle fill
      // Tweak these constants to change dotted appearance
      const GRID_COLOR = 'rgba(60, 120, 90, 0.25)';
      const GRID_STROKE_WIDTH = 1.25; // thickness of the dot/stroke
      const GRID_DOT_LEN = 3;         // length of the drawn segment (dot)
      const GRID_GAP_LEN = 4;         // length of the gap between dots
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = GRID_STROKE_WIDTH;
      ctx.lineCap = 'round';
      ctx.setLineDash([GRID_DOT_LEN, GRID_GAP_LEN]);
      // Horizontal lines: 4 evenly spaced (skip edges)
      for (let i = 1; i <= 4; i++) {
        const yy = (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(w, yy);
        ctx.stroke();
      }
      // Vertical lines: 2 evenly spaced (thirds)
      for (let i = 1; i <= 2; i++) {
        const xx = (w * i) / 3;
        ctx.beginPath();
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, h);
        ctx.stroke();
      }

      // Reset dashes so rings and crosshair are solid
      ctx.setLineDash([]);
      ctx.lineCap = 'butt';

      // Fill inside the radar circle with pure black to mask grid within
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Border ticks around the radar (like minute indicators)
      // Controls for width, spacing (count), and height (length)
      const BORDER_TICK_STROKE_WIDTH = 1.5; // line width
      const BORDER_TICK_COUNT = 500;          // spacing: number of ticks around circle
      const BORDER_TICK_LENGTH = Math.max(2.5, r * 0.025); // line height/length
      const BORDER_TICK_OFFSET = 2;          // small outward offset from circle edge
      ctx.strokeStyle = 'rgba(60, 120, 90, 0.25)'; // same as GRID_COLOR
      ctx.lineWidth = BORDER_TICK_STROKE_WIDTH;
      ctx.lineCap = 'butt';
      for (let i = 0; i < BORDER_TICK_COUNT; i++) {
        const a = (i / BORDER_TICK_COUNT) * Math.PI * 2;
        const x0 = cx + Math.cos(a) * (r + BORDER_TICK_OFFSET);
        const y0 = cy + Math.sin(a) * (r + BORDER_TICK_OFFSET);
        const x1 = cx + Math.cos(a) * (r + BORDER_TICK_OFFSET + BORDER_TICK_LENGTH);
        const y1 = cy + Math.sin(a) * (r + BORDER_TICK_OFFSET + BORDER_TICK_LENGTH);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

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

      // Lower-right message box
      const text = (messageRef.current && messageRef.current.trim().length > 0) ? messageRef.current : '—';
      const padX = 8, padY = 6;
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
      const metrics = ctx.measureText(text);
      const tw = Math.min(Math.max(metrics.width, 60), Math.max(60, w * 0.5));
      const th = 18;
      const boxW = tw + padX * 2;
      const boxH = th + padY * 2;
      const margin = 10;
      const bx = w - boxW - margin;
      const by = h - boxH - margin;
      // box background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(bx, by, boxW, boxH);
      // border
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, boxW, boxH);
      // text
      ctx.fillStyle = 'rgba(220,220,220,0.9)';
      ctx.fillText(text, bx + padX, by + padY + th - 6);
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
    // Per-agent trailing stroke segments emitted at the agent's position.
    type TrailSeg = { x: number; y: number; dir: number; created: number };
    const trails = new Map<string, { segs: TrailSeg[]; lastEmit: number; lastX: number; lastY: number }>();
    // Tuning knobs for the trailing stroke style
    const TRAIL_STROKE_LEN = 3;   // pixels: length of each stroke
    const TRAIL_STROKE_WIDTH = 2;  // pixels: width of each stroke
    const TRAIL_GAP_PX = 8;        // pixels: minimum distance moved before emitting next stroke
    
    const MAX_SEGS = 60;           // cap per-agent segments
    const LIFESPAN_MS = 2000;      // ms before a stroke fades out fully
    function drawAgents() {
      // Guard against missing context (TS + runtime safety)
      if (!canvas || !ctx) return;
      // Redraw static each frame (simple MVP approach)
      drawStatic(wCss, hCss);
      const state = appStore.getState();
      const now = Date.now();
      const c = ctx as CanvasRenderingContext2D;

      // Arrow styling knobs
      const ARROW_CORNER_RADIUS = 1;    // rounded corners on arrow polygon
      const ARROW_SIZE = 1.25;           // overall arrow scale (length & width)
      const ARROW_NOTCH_RATIO = -0.25;   // how deep the rear notch is, relative to length
      // Pull arrow color from global CSS variable --green-bright (fallback to #57ff7a)
      function cssVar(name: string, fallback: string): string {
        try {
          const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
          return v || fallback;
        } catch {
          return fallback;
        }
      }
      const ARROW_COLOR_HEX = cssVar('--green-bright', '#57ff7a');
      // Label styling knobs
      const LABEL_OFFSET_Y = 25;        // pixels below arrow in screen space
      const LABEL_PAD_X = 4;
      const LABEL_PAD_Y = 2;
      const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, monospace';

      function fillRoundedPolygon(p: Array<{x:number;y:number}>, r: number) {
        if (p.length === 0) return;
        c.beginPath();
        c.moveTo(p[0].x, p[0].y);
        for (let i = 0; i < p.length; i++) {
          const p1 = p[(i + 1) % p.length];
          const p2 = p[(i + 2) % p.length];
          c.arcTo(p1.x, p1.y, p2.x, p2.y, r);
        }
        c.closePath();
        c.fill();
      }

      function fmtElapsed(ms: number) {
        const total = Math.max(0, Math.round(ms / 1000));
        const m = Math.floor(total / 60);
        const s = total % 60;
        const mm = m.toString().padStart(2, '0');
        const ss = s.toString().padStart(2, '0');
        return `${mm}:${ss}`;
      }

      function drawLabel(x: number, y: number, idLine: string, timeLine: string, colorTop: string) {
        const rx = x; // anchor right edge at the arrow x
        const ty = y + LABEL_OFFSET_Y;
        c.font = LABEL_FONT;
        const m1 = c.measureText(idLine);
        const m2 = c.measureText(timeLine);
        const tw = Math.ceil(Math.max(m1.width, m2.width));
        const th = 12; // approx line height for 10px font
        const lineGap = 2;
        const totalH = th * 2 + lineGap;
        const bw = tw + LABEL_PAD_X * 2;
        const bh = totalH + LABEL_PAD_Y * 2;
        const bx = rx - bw; // align right edge to rx
        const by = ty - bh / 2;
        // background (no border)
        c.fillStyle = 'rgba(0,0,0,0.6)';
        c.fillRect(bx, by, bw, bh);
        // text lines (right-justified)
        c.textAlign = 'right';
        c.fillStyle = colorTop; // top line (agent id)
        c.fillText(idLine, bx + bw - LABEL_PAD_X, by + LABEL_PAD_Y + th - 3);
        c.fillStyle = 'rgba(220,220,220,0.95)'; // bottom line (duration)
        c.fillText(timeLine, bx + bw - LABEL_PAD_X, by + LABEL_PAD_Y + th - 3 + th + lineGap);
        c.textAlign = 'start';
      }

      // Draw and update trailing strokes before drawing arrows so arrows sit on top
      for (const [agentId, trail] of trails) {
        // purge expired
        trail.segs = trail.segs.filter(s => now - s.created <= LIFESPAN_MS);
        c.save();
        c.lineCap = 'round';
        c.lineWidth = TRAIL_STROKE_WIDTH;
        for (const s of trail.segs) {
          const age = now - s.created;
          const t = Math.max(0, Math.min(1, age / LIFESPAN_MS));
          const alpha = (1 - t) * 1.0; // start fully opaque, fade to 0
          const dx = Math.cos(s.dir) * TRAIL_STROKE_LEN;
          const dy = Math.sin(s.dir) * TRAIL_STROKE_LEN;
          c.beginPath();
          // draw segment behind the movement direction
          c.moveTo(s.x - dx, s.y - dy);
          c.lineTo(s.x, s.y);
          c.strokeStyle = ARROW_COLOR_HEX;
          c.globalAlpha = alpha;
          c.stroke();
        }
        if (trail.segs.length === 0) trails.delete(agentId);
        c.restore();
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
        const len = ARROW_SIZE * Math.max(8, Math.min(14, r * 0.05));
        const width = ARROW_SIZE * 1.25 * Math.max(5, Math.min(9, r * 0.03));

        // Emit a trailing stroke segment at the current position with agent heading
        let trail = trails.get(agent.id);
        if (!trail) { trail = { segs: [], lastEmit: 0, lastX: x, lastY: y }; trails.set(agent.id, trail); }
        // Ensure a first segment exists to make trails immediately visible
        if (trail.segs.length === 0) {
          trail.segs.push({ x, y, dir, created: now });
          trail.lastEmit = now;
          trail.lastX = x; trail.lastY = y;
        }
        const movedDx = x - trail.lastX; const movedDy = y - trail.lastY;
        const moved = Math.hypot(movedDx, movedDy);
        if (moved >= TRAIL_GAP_PX) {
          // Emit as many evenly spaced segments as needed to cover the distance
          const ux = movedDx / moved;
          const uy = movedDy / moved;
          const count = Math.min(20, Math.floor(moved / TRAIL_GAP_PX));
          for (let i = 1; i <= count; i++) {
            const sx = trail.lastX + ux * TRAIL_GAP_PX * i;
            const sy = trail.lastY + uy * TRAIL_GAP_PX * i;
            trail.segs.push({ x: sx, y: sy, dir, created: now });
          }
          // Advance last anchor by the distance we filled
          const adv = TRAIL_GAP_PX * count;
          trail.lastX = trail.lastX + ux * adv;
          trail.lastY = trail.lastY + uy * adv;
          trail.lastEmit = now;
          if (trail.segs.length > MAX_SEGS) trail.segs.splice(0, trail.segs.length - MAX_SEGS);
        }
        c.save();
        c.translate(x, y);
        c.rotate(dir);
        c.fillStyle = ARROW_COLOR_HEX;
        c.globalAlpha = 0.9;
        // Arrow polygon with rear notch to suggest wings
        const notch = len * ARROW_NOTCH_RATIO;
        const wing = width * 0.6;
        const pts = [
          { x: len, y: 0 },                // nose
          { x: -len * 0.45, y: wing },     // lower wing
          { x: -(len * 0.45 + notch), y: 0 }, // rear notch inward
          { x: -len * 0.45, y: -wing },    // upper wing
        ];
        fillRoundedPolygon(pts, ARROW_CORNER_RADIUS);
        c.restore();

        // Label with agent id and elapsed time below arrow (screen space)
        const elapsedMs = Math.round(t * est);
        drawLabel(x, y, agent.id, fmtElapsed(elapsedMs), ARROW_COLOR_HEX);
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
      <div className="flex-1 min-h-0 border border-gray-800 bg-black">
        <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
}
