import type { PlanDefinition } from './types';

// Calm plan: 12 items across Planning, Build, Eval, Deploy
// A and B have shallow chains; C joins, D deploys; plus parallel A/B branches to reach 12.

export const calmPlan: PlanDefinition = {
  name: 'Calm',
  description: '12 items, shallow deps. Good for first demo.',
  items: [
    // Planning chain A
    { id: 'A1', group: 'A', sector: 'PLANNING', depends_on: [], estimate_ms: 4000, tps_min: 8, tps_max: 16 },
    { id: 'A2', group: 'A', sector: 'PLANNING', depends_on: ['A1'], estimate_ms: 10000, tps_min: 500, tps_max: 1400 },
    { id: 'A3', group: 'A', sector: 'PLANNING', depends_on: [], estimate_ms: 3000, tps_min: 7, tps_max: 13 },
    { id: 'A4', group: 'A', sector: 'PLANNING', depends_on: ['A3'], estimate_ms: 2500, tps_min: 7, tps_max: 12 },

    // Build chain B
    { id: 'B1', group: 'B', sector: 'BUILD', depends_on: [], estimate_ms: 5000, tps_min: 10, tps_max: 18 },
    { id: 'B2', group: 'B', sector: 'BUILD', depends_on: ['B1'], estimate_ms: 4500, tps_min: 10, tps_max: 16 },
    { id: 'B3', group: 'B', sector: 'BUILD', depends_on: [], estimate_ms: 3000, tps_min: 9, tps_max: 15 },
    { id: 'B4', group: 'B', sector: 'BUILD', depends_on: ['B3'], estimate_ms: 2500, tps_min: 9, tps_max: 14 },

    // Eval joins Planning+Build paths
    { id: 'C1', group: 'C', sector: 'EVAL', depends_on: ['A2', 'B2'], estimate_ms: 3000, tps_min: 6, tps_max: 12 },
    { id: 'C2', group: 'C', sector: 'EVAL', depends_on: ['A4', 'B4'], estimate_ms: 2800, tps_min: 6, tps_max: 11 },

    // Deploy after Eval
    { id: 'D1', group: 'D', sector: 'DEPLOY', depends_on: ['C1'], estimate_ms: 2500, tps_min: 6, tps_max: 10 },
    { id: 'D2', group: 'D', sector: 'DEPLOY', depends_on: ['C2'], estimate_ms: 2200, tps_min: 6, tps_max: 10 },
  ],
};

export default calmPlan;

