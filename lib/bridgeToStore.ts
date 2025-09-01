import type { SimMsg } from './simBridge';
import type { UIState } from './store';
import { STORE_FLUSH_INTERVAL_MS } from './config';
import { debugLog } from './debug';

export interface Subscribable<M> {
  subscribe: (handler: (msg: M) => void) => () => void;
}

export interface AttachOptions {
  intervalMs?: number; // default 100ms
}

// Attaches a SimMsg stream to the Zustand store, coalescing diffs
// to reduce render churn. Snapshot applies immediately; ticks merge
// within the interval window and apply as a single reducer call.
export function attachBridgeToStore(
  bridge: Subscribable<SimMsg>,
  store: { getState: () => UIState },
  opts: AttachOptions = {}
) {
  const interval = opts.intervalMs ?? STORE_FLUSH_INTERVAL_MS;
  let unsub: (() => void) | null = null;
  let timer: any = null;

  // Aggregation state
  let latestTick = 0;
  const itemMap = new Map<string, any>();
  const agentMap = new Map<string, any>();
  let metricsPatch: any | null = null;

  const clearAgg = () => {
    latestTick = 0;
    itemMap.clear();
    agentMap.clear();
    metricsPatch = null;
  };

  const scheduleFlush = () => {
    if (timer != null) return;
    timer = setTimeout(() => {
      timer = null;
      if (latestTick === 0) return; // nothing to apply
      const items = itemMap.size ? Array.from(itemMap.values()) : undefined;
      const agents = agentMap.size ? Array.from(agentMap.values()) : undefined;
      const metrics = metricsPatch ?? undefined;
      debugLog('bridgeToStore', 'applyTick', { tick_id: latestTick, items: items?.length ?? 0, agents: agents?.length ?? 0, metrics: !!metrics });
      store.getState().applyTick({ tick_id: latestTick, items, agents, metrics });
      clearAgg();
    }, Math.max(0, interval));
  };

  const onMsg = (msg: SimMsg) => {
    if (msg.type === 'snapshot') {
      // Apply immediately; reset any pending agg
      clearAgg();
      debugLog('bridgeToStore', 'applySnapshot');
      store.getState().applySnapshot(msg.state);
      return;
    }
    if (msg.type === 'tick') {
      if (msg.tick_id <= latestTick) {
        // already aggregated something newer in this window
        return;
      }
      latestTick = msg.tick_id;
      if (msg.items) {
        for (const patch of msg.items) {
          if (patch.id) itemMap.set(patch.id, { ...(itemMap.get(patch.id) ?? {}), ...patch });
        }
      }
      if (msg.agents) {
        for (const patch of msg.agents) {
          if (patch.id) agentMap.set(patch.id, { ...(agentMap.get(patch.id) ?? {}), ...patch });
        }
      }
      if (msg.metrics) metricsPatch = { ...(metricsPatch ?? {}), ...msg.metrics };
      scheduleFlush();
      return;
    }
    // Other event types can be handled later if needed; ignored for throttling
  };

  unsub = bridge.subscribe(onMsg);

  return {
    destroy() {
      if (unsub) unsub();
      unsub = null;
      if (timer) clearTimeout(timer);
      timer = null;
      clearAgg();
    },
  };
}
