// Engine worker: minimal handshake loop (snapshot + ticks)
// Exports tiny pure helpers for tests; only starts the loop when actually
// running in a WorkerGlobalScope (not during Vitest/jsdom imports).

import { DEFAULT_SEED, ENGINE_TICK_HZ, RUNNING_DEFAULT } from '../lib/config';
import { debugLog } from '../lib/debug';
import type { AppState, ProjectMetrics } from '../lib/types';

export const ENGINE_WORKER_MODULE_LOADED = true;

export type PlanName = 'Calm' | 'Rush' | 'Web';

export function zeroMetrics(): ProjectMetrics {
  return {
    active_agents: 0,
    total_tokens: 0,
    total_spend_usd: 0,
    live_tps: 0,
    live_spend_per_s: 0,
    completion_rate: 0,
  };
}

export function makeInitialState(seed: string = DEFAULT_SEED): AppState {
  return {
    items: {},
    agents: {},
    metrics: zeroMetrics(),
    seed,
    running: RUNNING_DEFAULT,
  };
}

export function hzToMs(hz: number): number {
  return hz > 0 ? Math.round(1000 / hz) : 1000 / 30;
}

interface Ctx {
  state: AppState;
  tickId: number;
  running: boolean;
  speed: number; // multiplier (1x default)
  plan: PlanName;
  timer: any;
  tickMs: number;
}

function postSnapshot(ctx: Ctx) {
  debugLog('worker', 'postSnapshot', { running: ctx.running, tickId: ctx.tickId, seed: ctx.state.seed, plan: ctx.plan });
  ;(self as any).postMessage({ type: 'snapshot', state: ctx.state });
}

function postTick(ctx: Ctx) {
  ctx.tickId += 1;
  debugLog('worker', 'postTick', { tickId: ctx.tickId });
  ;(self as any).postMessage({ type: 'tick', tick_id: ctx.tickId });
}

function startLoop(ctx: Ctx) {
  if (ctx.timer) return;
  debugLog('worker', 'startLoop', { tickMs: ctx.tickMs });
  ctx.timer = setInterval(() => {
    if (!ctx.running) return;
    postTick(ctx);
  }, ctx.tickMs);
}

function stopLoop(ctx: Ctx) {
  if (!ctx.timer) return;
  debugLog('worker', 'stopLoop');
  clearInterval(ctx.timer);
  ctx.timer = null;
}

function handleIntent(ctx: Ctx, intent: any) {
  switch (intent?.type) {
    case 'set_running': {
      ctx.running = !!intent.running;
      ctx.state.running = ctx.running; // keep snapshot state in sync
      debugLog('worker', 'intent:set_running', { running: ctx.running });
      if (ctx.running) startLoop(ctx); else stopLoop(ctx);
      // Echo state so UI reflects running flag
      postSnapshot(ctx);
      return;
    }
    case 'set_seed': {
      ctx.state.seed = String(intent.seed ?? DEFAULT_SEED);
      debugLog('worker', 'intent:set_seed', { seed: ctx.state.seed });
      postSnapshot(ctx);
      return;
    }
    case 'set_plan': {
      ctx.plan = (intent.plan as PlanName) ?? 'Calm';
      debugLog('worker', 'intent:set_plan', { plan: ctx.plan });
      // For MVP handshake, plan has no effect yet beyond acknowledging.
      postSnapshot(ctx);
      return;
    }
    case 'set_speed': {
      const s = Number(intent.speed);
      ctx.speed = Number.isFinite(s) && s > 0 ? s : 1;
      debugLog('worker', 'intent:set_speed', { speed: ctx.speed });
      return;
    }
    case 'request_snapshot': {
      debugLog('worker', 'intent:request_snapshot');
      postSnapshot(ctx);
      return;
    }
    default:
      return;
  }
}

function makeCtx(): Ctx {
  return {
    state: makeInitialState(DEFAULT_SEED),
    tickId: 0,
    running: RUNNING_DEFAULT,
    speed: 1,
    plan: 'Calm',
    timer: null,
    tickMs: hzToMs(ENGINE_TICK_HZ),
  };
}

// Detect dedicated worker context without relying on instanceof (not available across browsers)
const IS_DEDICATED_WORKER = typeof self !== 'undefined' && typeof (self as any).postMessage === 'function' && typeof (globalThis as any).window === 'undefined';
debugLog('worker', 'bootstrap', { isDedicatedWorker: IS_DEDICATED_WORKER, ENGINE_TICK_HZ });

if (IS_DEDICATED_WORKER) {
  const ctx = makeCtx();
  // Post initial snapshot immediately so UI can latch onto state
  postSnapshot(ctx);
  // Start ticking if running by default
  if (ctx.running) startLoop(ctx);

  self.addEventListener('message', (event: MessageEvent) => {
    debugLog('worker', 'message', { data: (event as any).data });
    handleIntent(ctx, (event as any).data);
  });
}
