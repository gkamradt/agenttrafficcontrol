# Calming Control Room — Developer-Ready Spec (MVP v1)

**Goal:** A desktop, fullscreen “calming control room” that renders a radar with moving agent arrows delivering work items to a center checkbox, a minimal metrics panel, and a simple work-items table. These are mock agents completing work items. Think of it as an overview of a project being done by AI Agents. Proc‑gen drives everything. Lean stack, fast first pixel, no Docker, iterate locally.

---

## 0) Non‑Negotiables for v1

* **Platform:** Desktop web, fullscreen.
* **Core UI:**

  1. **Radar** (Canvas 2D) with moving **agents** (arrows) representing an agent working on a **work item**; agents spawn on the rim and curve toward the center checkbox; completion triggers a subtle flare.
  2. **Metrics strip:** live counts (Active agents), cumulatives (Total tokens, Total spend), live throughput (Tokens/sec, Spend/sec), and **Project completion rate**.
  3. **Work Items table:** minimal columns showing ID, sector, status, tokens, ETA, deps, assigned agent.
* **Statuses:** `queued → assigned → in_progress → blocked → done` (no failures in v1).
* **Radar visibility rule:** show **only** items in `in_progress` (blocked/queued/assigned are not visualized on the radar).
* **Lean:** One page app; proc‑gen in a Web Worker; no backend; deploy-ready later.

---

## 1) Tech Choices (lean & fast)

* **Framework:** Next.js (App Router) + **TypeScript** (Node 20 LTS). No server routes needed for v1.
* **Styling:** Tailwind CSS + small shadcn/ui subset (Card, Badge, Table, Button, Toggle, Progress).
* **State:** Zustand (single store) + `postMessage` from Worker.
* **Transport:** `simBridge` abstracts message transport; talks to a Web Worker now and can swap to WebSocket later without changing UI reducers (same event schema).
* **Rendering:** Canvas 2D (single `<canvas>`). Keep WebGL/Three.js as v2.
* **Audio (v1+1, optional):** Howler.js or plain `<audio>` with 2–3 CC tracks.
* **Build/Run:** Local `next dev`. No Docker. Later: Railway or Vercel.

---

## 2) Directory Layout

```
app/
  page.tsx                // main screen
  globals.css             // Tailwind
components/
  RadarCanvas.tsx         // canvas + draw loop
  MetricsBar.tsx          // counters/sparklines (text-only in v1)
  WorkTable.tsx           // simple table
  ControlBar.tsx          // play/pause, seed select, speed
lib/
  types.ts                // TypeScript types
  constants.ts            // colors, sizing, cost config
  rng.ts                  // seeded PRNG
  simBridge.ts            // transport bridge (Worker now, WebSocket later)
public/
  audio/                  // (optional) lo-fi tracks later
workers/
  engine.worker.ts        // proc-gen, state machine, tick loop
```

---

## 3) Data Model (TypeScript)

```ts
// lib/types.ts
export type Status = 'queued' | 'assigned' | 'in_progress' | 'blocked' | 'done';

export interface WorkItem {
  id: string;            // e.g., "A1", "B3"
  group: string;         // 'A', 'B', ... (for grouping/legend)
  sector: string;        // e.g., 'Planning', 'Build', 'Eval', 'Deploy'
  depends_on: string[];  // list of WorkItem ids

  estimate_ms: number;   // target duration for this item (ms)
  started_at?: number;   // epoch ms when entered in_progress
  eta_ms?: number;       // rolling ETA in ms (recomputed)

  tps_min: number;       // tokens/sec lower bound for this item
  tps_max: number;       // tokens/sec upper bound
  tps: number;           // current tokens/sec (dynamic within [min,max])
  tokens_done: number;   // cumulative tokens produced for this item
  est_tokens: number;    // derived from estimate + nominal tps

  status: Status;
  agent_id?: string;     // set when in_progress
}

export interface Agent {
  id: string;            // e.g., 'P1','D2','E3','Q7','X584'
  work_item_id: string;  // current assignment
  // Radar motion state (normalized world coords in [-1,1])
  x: number; y: number;  // current position
  v: number;             // scalar speed (units/frame) mapped from tps
  curve_phase: number;   // 0..1 for bezier curvature evolution
}

export interface ProjectMetrics {
  active_agents: number;
  total_tokens: number;   // cumulative across all time
  total_spend_usd: number;// cumulative spend
  live_tps: number;       // sum of in_progress tps
  live_spend_per_s: number;
  completion_rate: number;// done / eligible (0..1)
}

export interface AppState {
  items: Record<string, WorkItem>;
  agents: Record<string, Agent>;
  metrics: ProjectMetrics;
  seed: string;
  running: boolean;
}
```

**Cost model (configurable):** `COST_PER_TOKEN_USD = 0.000002` (=\$0.002 / 1K). Spending is simulated.

---

## 4) State Machine & Events

**Statuses:**

* `queued`: created but not ready (deps unmet).
* `assigned`: ready (deps met) and selected to start soon.
* `in_progress`: actively being worked on by exactly one agent.
* `blocked`: deps unmet while earlier planned for start (appears only if an item becomes temporarily gated again; optional in v1 — can be skipped by keeping `queued` until ready).
* `done`: completed, contributes to totals.

**Transitions (engine emits):**

* `spawn_item` → item enters `queued`.
* `deps_cleared` → `queued` → `assigned`.
* `start_item` → `assigned` → `in_progress` (agent allocated + spawned at rim).
* `tick_item` → update `tps`, `tokens_done`, `eta_ms`.
* `complete_item` → `in_progress` → `done` (agent removed after center flare).

**Eligibility (for completion rate denominator):** any item whose dependencies are all satisfied (i.e., in `assigned | in_progress | done`).

**Protocol & Sync:**

* **Single source of truth:** Worker owns simulation state and metrics; UI never mutates items/agents directly.
* **UI → Worker (intents only):** `{type:'set_running'|'set_plan'|'set_seed'|'set_speed'}` plus `{type:'request_snapshot'}`.
* **Init/Recovery:** Worker can proactively send a `{type:'snapshot', state}` on init; UI may request with `request_snapshot` when desync is detected.
* **Diffs with ordering:** Regular updates are diffs via `{type:'tick', tick_id, items?: Partial<WorkItem>[], agents?: Partial<Agent>[], metrics?}`. `tick_id` is a monotonic counter; UI drops out‑of‑order ticks.
* **Batching:** UI coalesces/apply diffs to the store at ~5–10 Hz to minimize React renders; the Canvas radar runs its own `requestAnimationFrame` loop reading a shallow snapshot.
* **Future backend:** Replace Worker with WebSocket using the same message schema via `simBridge`; UI reducers remain unchanged.

---

## 5) Proc‑Gen (Seeds & Plans)

**Seeded PRNG:** use xorshift or mulberry32; take a URL/search param `?seed=` with default `auto`.

**Plans (preset topologies):**

* **Calm:** 12 items, 2 sectors (Planning, Build), shallow deps (A1→A2, B1→B2...).
* **Rush:** 28 items, 4 sectors, parallel branches, shorter estimates, higher tps variance.
* **Web:** 20 items, 3 sectors, diamond-shaped dependency graph (fan-out → join).

Each plan emits a `spawn_item` list at t=0. Items auto-move to `assigned` as soon as deps are cleared. Start cadence: Poisson(λ) to stagger `start_item`.

**Dynamic TPS:** each in-progress item’s `tps` performs a bounded wobble: `tps = clamp(min, max, tps + noise)` per tick (e.g., Perlin-lite or AR(1)). Map agent speed `v` linearly from `tps` into `[V_MIN, V_MAX]`.

---

## 6) Radar Rendering (Canvas 2D)

* **World:** normalized unit circle; center (0,0) has a subtle checkbox glyph.
* **Spawn:** new agent appears at random angle on rim `(cosθ, sinθ)`.
* **Path:** not straight; use a cubic Bézier with two control points perturbed tangentially; progress param advances each frame; small lateral noise gives life.
* **Speed:** proportional to current item `tps` → `v = lerp(V_MIN, V_MAX, (tps - min)/(max - min))`.
* **Agent glyph:** rotated triangle with short, fading trail; small text label `agent_id / work_item_id` (fade with distance to center to avoid clutter).
* **Completion:** when reaching center, draw a 200–400ms **flare** (expanding ring with easing), briefly tick the center checkbox, then remove agent.
* **Legend:** color **by sector** (fixed palette). Status isn’t encoded on radar because only `in_progress` is shown.
* **Performance:**

  * Draw static rings/grid to an offscreen canvas; blit each frame.
  * Use `globalAlpha` decay layer for trails: fill a translucent black over motion buffer each frame (e.g., alpha 0.08).
  * Clamp devicePixelRatio to ≤ 2.
  * Apply state diffs to the store at a throttled cadence (100–200ms); radar reads current agent/item snapshot each frame without forcing React re-render.

---

## 7) Metrics & Calculations

* **Active Agents:** count of agents in store (== #items in `in_progress`).
* **Total Tokens:** sum over all items’ `tokens_done`.
* **Total Spend:** integrate `tokens_done * COST_PER_TOKEN_USD`.
* **Live TPS:** sum of `tps` for items in `in_progress`.
* **Spend/sec:** `live_tps * COST_PER_TOKEN_USD`.
* **Project Completion Rate:** `done_count / eligible_count` where eligible are items with deps satisfied.

Display as large text counters (no charts in v1).

---

## 8) Work Items Table (minimal)

Columns: `ID | Sector | Status | Tokens (done/est) | TPS (cur / min–max) | ETA | Deps | Agent`

* Sort by status then ID.
* Status color chips; sector badges; truncate long deps list (`+n more`).

---

## 9) Controls (top-right)

* **Run / Pause** toggle.
* **Plan**: dropdown: Calm / Rush / Web.
* **Seed**: text input (apply + restart).
* **Speed**: ×1 / ×2 / ×3 (global time multiplier affecting tick rate & motion).
* (v1+1) **Audio**: tiny lo‑fi play/pause, next.

Persist selections in `localStorage`.

---

## 10) Engine (Worker) Algorithm

**Tick cadence:** `~60fps` visual; engine can tick at 20–30Hz to reduce churn. Each engine loop increments a `tick_id` included with update messages.

Pseudocode (simplified):

```ts
state = { items: Map, agents: Map, metrics, now }
init(plan, seed):
  items = generateItems(plan, seed)
  metrics = initMetrics()
  agents = {}
  // initial full snapshot for UI projection
  postMessage({type:'snapshot', state:{ items, agents, metrics, seed:seed, running:true }})

loop():
  if (!running) return schedule(loop)
  now = performance.now()

  // Resolve deps → assigned
  for each item in items where status==='queued' and deps satisfied:
    item.status='assigned'; postMessage({type:'deps_cleared', id:item.id})

  // Start items stochastically if capacity allows
  maybeStartSome()

  // Update in-progress items
  for each item in items where status==='in_progress':
    item.tps = wobble(item.tps, item.tps_min, item.tps_max)
    item.tokens_done += item.tps * dt_sec
    item.eta_ms = max(0, item.estimate_ms - (now - item.started_at))
    moveAgentTowardCenter(item.agent_id, dt, item.tps)
    if (reachedCenter(item.agent_id)) complete(item)

  // Update metrics
  recalcMetrics()
  tick_id++
  postMessage({type:'tick', tick_id, diff})

  schedule(loop)
```

**Start policy:** single agent per item; limit concurrent `in_progress` by soft cap (e.g., 12) to prevent clutter.

**Completion:** emit `{type:'complete_item', id}` then delete agent; item→`done`.

---

## 11) Error Handling & Edge Cases

* **Cycle in deps:** detect via DFS at spawn; if found, log and break by ignoring later edge(s) (dev console warn), keep app running.
* **Missing dep IDs:** ignore missing by treating as unmet; item stays `queued`.
* **NaN/Infinity TPS:** clamp to `[tps_min, tps_max]`; if still invalid, set to `tps_min`.
* **Overdraw/Perf drops (<45fps):** auto-reduce trail length and max concurrent agents.
* **Resize:** debounce canvas resize; redraw static layer.
* **State desync:** worker is source of truth; on malformed message, drop it and request a full snapshot.

---

## 12) Testing Plan (v1)

**Unit (Vitest):**

* Status transitions given deps and starts.
* TPS wobble boundedness and mapping to speed.
* Metrics math (tokens, spend, completion rate).
* Dependency resolver (topo sort + eligible count).

**Integration (Playwright):**

* App boots, receives `snapshot`, and shows a visible tick indicator incrementing; Run/Pause intent toggles ticking.
* Starting a plan spawns items; table populates; statuses progress; `in_progress` count and counters update.
* Completing an item increases `done` and updates metrics. (Radar flare detection when Radar step is implemented.)
* Snapshot handshake works: UI receives `{type:'snapshot'}` and applies.
* Out-of-order `{type:'tick'}` messages are ignored based on `tick_id`.

**Performance:**

* With 12 concurrent agents, maintain ≥ 55fps on a typical laptop (devicePixelRatio ≤ 2).

**Determinism:**

* Given a fixed seed and plan, ordering of starts & completions is reproducible within stochastic rules (use PRNG, avoid `Math.random`).
* Metrics computed in worker match UI display; UI never recomputes.

---

## 13) Implementation Roadmap (table‑first MVP)

**Step 0 — Scaffold (30–45 min)**

* `pnpm create next-app` (TS, Tailwind). Add Zustand. Add Worker setup and `simBridge`.

**Step 1 — Red Thread First Pixel (30–60 min)**

* Worker boots with seed and plan stub, emits `{type:'snapshot'}` then periodic `{type:'tick', tick_id}`.
* UI shows minimal layout (can be a single card) with a visible `Tick: N` indicator wired through `simBridge` → store. Add Run/Pause intent.
* Validate transport, ordering (`tick_id`), and batching (throttle store updates). **Stop here to ensure the loop works end‑to‑end.**

**Step 2 — Real Items & Table (MVP core)**

* Implement items with deps and statuses: `queued → assigned → in_progress → done` (blocked optional). Add start cadence and soft concurrency cap.
* Compute metrics in worker (active agents, total tokens/spend, live tps/spend, completion rate).
* Render the Work Items table with live updates: columns, sorting, formatting (chips/badges minimal). Counters show metrics.

**Step 3 — Plans & Seeds**

* Add Calm/Rush/Web topologies, URL `?seed=`, and speed multiplier. Ensure determinism with fixed seed.

**Step 4 — Radar Basics**

* Minimal Canvas: draw agents for `in_progress` only as moving arrows along a simple path; optional short completion flare. Keep perf simple.

**Step 5 — Polish**

* Trails, label fades, sector colors, perf clamps, legend. (Optional) add lo‑fi player.

---

## 14) Visual & UX Details

* **Theme:** dark, low-contrast hues with bright sector colors for agents.
* **Canvas rings:** 4–5 concentric rings, faint tick marks.
* **Checkbox at center:** subtle outlined square; morphs to a brief filled check on completion.
* **Motion feel:** ease-in on spawn, slightly noisy path; arrival overshoot ≤ 6px with elastic settle.
* **Text:** show `P3 / A1` near arrow; hide labels when crowding (measure via simple grid occupancy).

---

## 15) Constants (tune in constants.ts)

```ts
export const COST_PER_TOKEN_USD = 0.000002;
export const MAX_CONCURRENT = 12;
export const V_MIN = 0.002;   // world units/frame
export const V_MAX = 0.010;
export const TRAIL_DECAY = 0.08; // alpha per frame on motion buffer
export const RING_COUNT = 5;
export const SECTORS = ['Planning','Build','Eval','Deploy'];
export const SECTOR_COLORS = {
  Planning: '#6EE7B7', Build: '#93C5FD', Eval: '#FCA5A5', Deploy: '#FDE68A'
};
```

---

## 16) Example Plan (Calm)

```ts
A1 (Planning): depends []       estimate 40s  tps 8–16
A2 (Planning): depends [A1]     estimate 35s  tps 8–14
B1 (Build):    depends []       estimate 50s  tps 10–18
B2 (Build):    depends [B1]     estimate 45s  tps 10–16
C1 (Eval):     depends [A2,B2]  estimate 30s  tps 6–12
D1 (Deploy):   depends [C1]     estimate 25s  tps 6–10
// duplicate a few independent A/B items to reach 12 total
```

---

## 17) Dev Notes

* Keep Worker isolated: no DOM imports. Use structured clone–friendly shapes.
* Prefer differential patches in `tick` messages (changed fields only) to reduce postMessage size.
* Store is normalized (by id) for O(1) updates.
* Avoid re-rendering React components each frame; Radar draws directly on Canvas with its own `requestAnimationFrame`; Zustand state is updated by batching worker diffs at ~100–200ms and read via shallow snapshots.
* UI dispatches intents only (`set_running`, `set_plan`, `set_seed`, `set_speed`); all business logic lives in the worker.
* `simBridge` provides a swappable transport boundary (Worker now, WebSocket later) using the same message schema.

---

## 18) Acceptance Criteria (v1)

1. Red thread: On launch the UI receives a snapshot and a visible tick indicator increments; Run/Pause intent reliably toggles ticking.
2. Table-first: Starting a plan populates the Work Items table; statuses progress over time; metrics update smoothly (Active agents, Total tokens/spend, Live tps/spend, Completion rate) and stay in sync with table state.
3. Radar (when implemented): In-progress items appear on the radar moving toward center; labels visible; completion flare plays; only `in_progress` is visualized.
4. Stability: No runtime errors in console for 10 minutes under plan Rush.

---

## 19) Local Setup Instructions

1. **Prereqs:** Node 20 LTS, pnpm or npm.
2. **Scaffold:** `pnpm create next-app calming-control-room --ts --eslint --tailwind`.
3. **Install:** `pnpm add zustand` and `pnpm add -D @types/offscreencanvas` (optional); later `pnpm add howler` for audio.
4. **Worker:** put `workers/engine.worker.ts`; use `new Worker(new URL('../workers/engine.worker.ts', import.meta.url), { type: 'module' })`.
5. **Run:** `pnpm dev`; open fullscreen.

---

## 20) Minimal Code Stubs

**Worker event types**

```ts
// workers/engine.worker.ts
postMessage({ type: 'snapshot', state });
postMessage({ type: 'deps_cleared', id });
postMessage({ type: 'start_item', id, agent });
postMessage({ type: 'tick', tick_id, items: [{id, tps, tokens_done, eta_ms}], agents: [{id, x, y}], metrics });
postMessage({ type: 'complete_item', id });
```

**Bridge**

```ts
// lib/simBridge.ts
export type SimMsg =
 | {type:'snapshot', state: AppState}
 | {type:'deps_cleared', id:string}
 | {type:'start_item', id:string, agent: Agent}
 | {type:'tick', tick_id:number, items?: Partial<WorkItem>[], agents?: Partial<Agent>[], metrics?: Partial<ProjectMetrics>}
 | {type:'complete_item', id:string};

export type SimIntent =
 | {type:'set_running', running:boolean}
 | {type:'set_plan', plan:'Calm'|'Rush'|'Web'}
 | {type:'set_seed', seed:string}
 | {type:'set_speed', speed:number}
 | {type:'request_snapshot'};
```

**Zustand store**

```ts
// create store with {items, agents, metrics, running, seed} and reducers
```

**Radar draw loop**

```ts
// components/RadarCanvas.tsx
// useRef canvas; onFrame: draw static rings (offscreen), then motion buffer, then agents
```

---

## 21) V1+1 Ideas (nice-to-haves)

* Tiny lo‑fi player with crossfade.
* Screenshot/record button (WebM capture of canvas).
* Sector filter chips to hide subsets.
* Sparklines for live TPS.
* Export current plan state to JSON.

---
