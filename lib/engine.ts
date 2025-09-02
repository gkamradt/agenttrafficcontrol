import type { WorkItem } from './types';
import type { PlanDefinition } from '@/plans/types';
import type { Agent, ProjectMetrics } from './types';
import { COST_PER_TOKEN_USD } from './constants';

export function buildItemsFromPlan(plan: PlanDefinition): Record<string, WorkItem> {
  const items: Record<string, WorkItem> = {};
  for (const p of plan.items) {
    const est_tokens = Math.round(((p.tps_min + p.tps_max) / 2) * (p.estimate_ms / 1000));
    items[p.id] = {
      id: p.id,
      group: p.group,
      sector: p.sector,
      depends_on: [...p.depends_on],
      desc: p.work_desc,
      estimate_ms: p.estimate_ms,
      started_at: undefined,
      eta_ms: p.estimate_ms,
      tps_min: p.tps_min,
      tps_max: p.tps_max,
      tps: p.tps_min,
      tokens_done: 0,
      est_tokens,
      status: 'queued',
      agent_id: undefined,
    };
  }
  return items;
}

// Detect cycles using DFS. Returns list of cycles (each as id array) or empty if none.
export function detectCycles(items: Record<string, WorkItem>): string[][] {
  const graph = new Map<string, string[]>(
    Object.values(items).map((i) => [i.id, i.depends_on])
  );
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];
  const onstack = new Set<string>();

  function dfs(u: string) {
    visited.add(u);
    onstack.add(u);
    stack.push(u);
    for (const v of graph.get(u) || []) {
      if (!visited.has(v)) dfs(v);
      else if (onstack.has(v)) {
        // found a cycle: slice from v to end
        const idx = stack.indexOf(v);
        if (idx >= 0) cycles.push(stack.slice(idx));
      }
    }
    stack.pop();
    onstack.delete(u);
  }

  for (const id of graph.keys()) if (!visited.has(id)) dfs(id);
  // Deduplicate identical cycles (simple heuristic)
  const unique: string[][] = [];
  const seen = new Set<string>();
  for (const c of cycles) {
    const key = c.slice().sort().join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  return unique;
}

// Returns true if all dependencies of item id are in status 'done'
export function depsSatisfied(items: Record<string, WorkItem>, id: string): boolean {
  const it = items[id];
  if (!it) return false;
  return it.depends_on.every((d) => items[d] && items[d].status === 'done');
}

// Promote items from queued -> assigned when dependencies are satisfied.
export function promoteQueuedToAssigned(items: Record<string, WorkItem>): string[] {
  const changed: string[] = [];
  for (const it of Object.values(items)) {
    if (it.status === 'queued' && depsSatisfied(items, it.id)) {
      it.status = 'assigned';
      changed.push(it.id);
    }
  }
  return changed;
}

export function countInProgress(items: Record<string, WorkItem>): number {
  let n = 0;
  for (const it of Object.values(items)) if (it.status === 'in_progress') n++;
  return n;
}

export function computeMetrics(items: Record<string, WorkItem>, agents: Record<string, Agent>): ProjectMetrics {
  let total_tokens = 0;
  let live_tps = 0;
  let done_count = 0;
  let eligible_count = 0;

  for (const it of Object.values(items)) {
    total_tokens += it.tokens_done || 0;
    if (it.status === 'in_progress') live_tps += it.tps || 0;
    if (it.status === 'done') done_count += 1;
    if (depsSatisfied(items, it.id)) eligible_count += 1;
  }

  const total_spend_usd = total_tokens * COST_PER_TOKEN_USD;
  const live_spend_per_s = live_tps * COST_PER_TOKEN_USD;
  const completion_rate = eligible_count > 0 ? done_count / eligible_count : 0;

  return {
    active_agents: Object.keys(agents).length,
    total_tokens,
    total_spend_usd,
    live_tps,
    live_spend_per_s,
    completion_rate,
  };
}
