// Centralized runtime configuration and tuning knobs

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Bridge batching cadence (ms). Coalesces raw transport messages.
export const BRIDGE_BATCH_MS = toInt(process.env.NEXT_PUBLIC_BRIDGE_BATCH_MS, 100);

// Store flush cadence (ms). Applies coalesced diffs to Zustand.
export const STORE_FLUSH_INTERVAL_MS = toInt(process.env.NEXT_PUBLIC_STORE_FLUSH_INTERVAL_MS, 100);

// Engine tick rate (Hz). Worker internal loop, not a UI render rate.
export const ENGINE_TICK_HZ = toInt(process.env.NEXT_PUBLIC_ENGINE_TICK_HZ, 30);

// App defaults
export const DEFAULT_SEED = (process.env.NEXT_PUBLIC_DEFAULT_SEED as string) || 'auto';
export const RUNNING_DEFAULT = ((process.env.NEXT_PUBLIC_RUNNING_DEFAULT as string) ?? 'true') === 'true';

// Debug logging toggle
export const DEBUG_LOGS = ((process.env.NEXT_PUBLIC_DEBUG_LOGS as string) ?? 'true') === 'true';
