# Calming Control Room — TODO (Table‑First MVP)

This checklist aligns with the PRD and prioritizes the table-first “red thread” to validate end‑to‑end data flow before investing in radar visuals. Each item includes a concrete unit test you can implement with Vitest (and React Testing Library for components).

## A) Scaffold & Tooling

- 1. Task: Initialize Next.js (TS), Tailwind, Zustand, Vitest + RTL, and Worker bundling.
  - Status: ✅ DONE
  - Output: Project boots with a single page; test runner executes.
  - Unit test: `renders-root`: render the root page and assert a sentinel text is present.

- 2. Task: Add base folders per PRD (`app/`, `components/`, `lib/`, `workers/`).
  - Status: ✅ DONE
  - Output: Empty stubs for `lib/types.ts`, `lib/constants.ts`, `lib/rng.ts`, `lib/simBridge.ts`, `workers/engine.worker.ts`.
  - Unit test: `imports-don't-throw`: import each stub and assert module loads.

## B) Types, Constants, RNG

- 1. Task: Define `WorkItem`, `Agent`, `ProjectMetrics`, `AppState`, `Status` in `lib/types.ts`.
  - Status: ✅ DONE
  - Output: Shared types across worker/UI.
  - Unit test: `type-helpers`: add a tiny pure helper (e.g., `deriveEstTokens(estimateMs, tps)`) and test numeric output for a known input.

- 2. Task: Add `lib/constants.ts` (costs, caps, speeds, sector colors).
  - Status: ✅ DONE
  - Output: Central tuning knobs per PRD.
  - Unit test: `constants-sanity`: assert `V_MIN < V_MAX`, `MAX_CONCURRENT > 0`, and cost is finite.

- 3. Task: Implement `lib/rng.ts` (mulberry32 or xorshift) and seed plumbing.
  - Status: ✅ DONE
  - Output: Deterministic PRNG instance factory.
  - Unit test: `rng-determinism`: same seed yields same first N numbers; different seeds diverge.

## C) simBridge (Transport Boundary)

- 1. Task: Implement `lib/simBridge.ts` to abstract Worker transport; expose `connect`, `postIntent`, and an `onMessage` subscription.
  - Status: ✅ DONE
  - Output: UI-side bridge that can be swapped for WebSocket later; message schema supports `snapshot`, `tick{tick_id}`, and intents.
  - Unit test: `bridge-drops-out-of-order`: feed messages with tick_ids [1,3,2,4]; assert subscriber receives 1,3,4 only.

## D) Store & Reducers (Projection)

- 1. Task: Create Zustand store with `{items, agents, metrics, running, seed, lastTickId}` and reducers to apply `snapshot` and `tick` diffs.
  - Status: ✅ DONE
  - Output: Single source of UI truth; UI writes intents only.
  - Unit test: `reducers-apply-snapshot-and-diff`: apply a snapshot then a tick diff updating one item and metrics; assert state matches and `lastTickId` advances.

- 2. Task: Implement throttled patch application (e.g., coalesce diffs to 100–200ms cadence).
  - Status: ✅ DONE
  - Output: Stable React render rate.
  - Unit test: `throttle-coalesces-updates`: push N rapid diffs; assert reducer applied ≤ ceil(duration/window) times.

## E) Worker Engine — Handshake & Red Thread

- 1. Task: Implement `workers/engine.worker.ts` skeleton: `init(plan, seed) → post snapshot`, loop with `tick_id++` posting `{type:'tick', tick_id}`; handle intents (`set_running`, `set_plan`, `set_seed`, `set_speed`, `request_snapshot`).
  - Status: ✅ DONE
  - Output: Live heartbeat confirming transport and ordering.
  - Unit test: `engine-handshake`: unit-test pure exported helpers used by the worker (e.g., `makeSnapshot(state)` returns normalized shapes; `nextTickId` monotonic).

- 2. Task: UI “Tick: N” indicator wired through `simBridge` → store.
  - Status: ✅ DONE
  - Output: Visible counter proving end‑to‑end flow.
  - Unit test: `tick-indicator-increments`: render component, simulate incoming ticks 1..3, assert text updates; pause via intent and assert no further increments.
 
- 3. Task: Tiny Run/Pause toggle in UI posting `set_running` intent; worker echoes snapshot to reflect `running`.
  - Status: ✅ DONE
  - Output: Button toggles engine ticking (N stops/starts incrementing), UI shows running state.
  - Unit test: can be covered by integration later; manual verify now.

## F) Items, Status Machine, Start Policy

- 1. Task: Implement item generation for a single plan stub (e.g., Calm) with deps and base estimates.
  - Status: ✅ DONE
  - Output: Items enter `queued`; resolver promotes to `assigned` when deps satisfied.
  - Unit test: `deps-resolver`: given a small DAG, assert eligible moves to `assigned`; a cycle triggers detection and safe handling (e.g., later edge ignored).

- 2. Task: Start cadence with soft concurrency cap (`MAX_CONCURRENT`), Poisson-ish staggering; one agent per item.
  - Status: ✅ DONE
  - Output: Items transition `assigned → in_progress`; agent created and bound.
  - Unit test: `start-policy-cap`: with 20 eligible items and cap=12, at most 12 start; repeated calls don’t exceed cap.

- 3. Task: In‑progress updates per tick: wobble `tps` within `[min,max]`, accumulate `tokens_done`, roll `eta_ms`.
  - Status: ✅ DONE
  - Output: Stable per-item progress and ETAs.
  - Unit test: `tps-wobble-bounds`: run wobble N times; assert min/max bounds and no NaN/Infinity.

- 4. Task: Completion: when ETA ≤ 0 (or position reaches center later), transition to `done`; clear agent.
  - Status: ✅ DONE
  - Output: Items leave the live set and contribute to totals.
  - Unit test: `complete-item`: simulate ticks to drive ETA to zero; assert status becomes `done` and agent removed.

## G) Metrics (Worker‑Owned)

- 1. Task: Compute metrics each tick: active agents, total tokens, total spend, live tps, spend/sec, completion rate (eligible denominator).
  - Status: ✅ DONE
  - Output: Accurate counters sent in tick diffs.
  - Unit test: `metrics-math`: construct a small state with known token deltas; assert totals, live rates, and completion rate match expected.

## H) Work Items Table (UI)

 - 1. Task: Implement `components/WorkTable.tsx` rendering columns: ID, Sector, Status, Tokens (done/est), TPS (cur/min–max), ETA, Deps, Agent; sort by status→ID.
  - Status: ✅ DONE
  - Output: Live table that reflects store projection.
  - Unit test: `table-sorts-and-formats`: render with a few items; assert order, status chips, and truncated deps (`+n more`).

## I) Metrics Bar (UI)

- 1. Task: Implement `components/MetricsBar.tsx` to display numeric counters; subscribe only to `metrics`.
  - Status: ✅ DONE
  - Output: Live counters independent from table renders.
  - Unit test: `metrics-bar-updates`: update store metrics; assert displayed numbers change without re-rendering table mock.

## J) Controls & Persistence

- 1. Task: Implement `ControlBar` with Run/Pause, Plan, Seed, Speed; dispatch intents; persist selections to `localStorage`.
  - Status: ✅ DONE
  - Output: User controls that survive refresh.
  - Unit test: `controls-persist-and-dispatch`: simulate changes; assert `localStorage` writes and `postIntent` calls with correct payloads.

## K) Plans & Seeds

- 1. Task: Implement Calm/Rush/Web topologies; seed handling via URL `?seed=` and control bar.
  - Status: ✅ DONE
  - Output: Deterministic run given plan+seed.
  - Unit test: `plan-determinism`: same plan+seed produces identical ordered sequence of `start_item`/`complete_item` ids from helper simulation.

## L) Radar (Basic, After Table)

- 1. Task: Minimal `RadarCanvas` drawing only `in_progress` items as moving arrows; simple path progression; optional completion flare.
  - Status: ✅ DONE (minimal static frame)
  - Output: Visual reinforcement once table pipeline is validated.
  - Unit test: `motion-mapping`: unit-test path math helpers (bezier progress, tps→speed mapping); assert continuity and bounds. (Canvas draw tested indirectly.)

## M) Performance & Resilience

- 1. Task: DPR clamp (≤2), offscreen static rings (later), and diff size minimization.
  - Status: pending
  - Output: Stable 55–60fps under cap.
  - Unit test: `dpr-clamp`: unit-test helper returns ≤2 for various devicePixelRatio inputs.

- 2. Task: Error handling: missing deps (treated as unmet), cycle detection, NaN/Infinity clamping, desync recovery via snapshot.
  - Status: pending
  - Output: Robust sim under edge conditions.
  - Unit test: `edge-cases`: construct bad inputs; assert safe behavior and no thrown errors.

## N) Integration Smoke (Optional but Recommended)

- 1. Task: Playwright spec: snapshot handshake shows Tick:N; table populates; statuses progress; metrics update; Run/Pause works.
  - Status: pending
  - Output: Confidence the red thread works end‑to‑end.
  - Integration test: `app-red-thread.spec`: assert tick increments, then table rows appear and change status over time.

---

Notes
- Keep worker as the single source of truth; UI only projects and sends intents.
- Prefer snapshot→diff protocol with `tick_id` for ordering and coalesced UI updates.
- Defer radar polish until after the table and metrics pipeline proves out.

## O) Config & Tuning Centralization

- 1. Task: Centralize runtime tuning params in `lib/config.ts` (bridge batch ms, store flush interval, engine tick Hz, defaults for seed/running) and wire into bridge/store.
  - Status: ✅ DONE
  - Output: Single config surface to tune app behavior; environment overrides via `NEXT_PUBLIC_*` supported.
  - Unit test: `config defaults`: assert positive defaults and non-empty default seed.
