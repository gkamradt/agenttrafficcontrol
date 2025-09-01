import type { PlanDefinition } from './types';

// Rush plan: more items, more parallelism, higher tps variance
export const rushPlan: PlanDefinition = {
  name: 'Rush',
  description: 'Fast cadence, 4 sectors, more parallel branches (~20 items).',
  items: [
    // Planning
    { id: 'PA1', group: 'P', sector: 'Planning', depends_on: [], estimate_ms: 20000, tps_min: 12, tps_max: 24 },
    { id: 'PA2', group: 'P', sector: 'Planning', depends_on: ['PA1'], estimate_ms: 18000, tps_min: 12, tps_max: 22 },
    { id: 'PB1', group: 'P', sector: 'Planning', depends_on: [], estimate_ms: 16000, tps_min: 10, tps_max: 20 },

    // Build branches
    { id: 'BA1', group: 'B', sector: 'Build', depends_on: ['PA1'], estimate_ms: 22000, tps_min: 14, tps_max: 26 },
    { id: 'BA2', group: 'B', sector: 'Build', depends_on: ['BA1'], estimate_ms: 20000, tps_min: 14, tps_max: 24 },
    { id: 'BB1', group: 'B', sector: 'Build', depends_on: ['PB1'], estimate_ms: 21000, tps_min: 12, tps_max: 22 },
    { id: 'BB2', group: 'B', sector: 'Build', depends_on: ['BB1'], estimate_ms: 19000, tps_min: 12, tps_max: 22 },
    { id: 'BC1', group: 'B', sector: 'Build', depends_on: ['PA2'], estimate_ms: 17000, tps_min: 12, tps_max: 20 },

    // Eval fan-in
    { id: 'EA1', group: 'E', sector: 'Eval', depends_on: ['BA2', 'BB2'], estimate_ms: 15000, tps_min: 8, tps_max: 18 },
    { id: 'EA2', group: 'E', sector: 'Eval', depends_on: ['BC1'], estimate_ms: 14000, tps_min: 8, tps_max: 16 },
    { id: 'EB1', group: 'E', sector: 'Eval', depends_on: ['EA1'], estimate_ms: 12000, tps_min: 8, tps_max: 16 },

    // Deploy
    { id: 'DA1', group: 'D', sector: 'Deploy', depends_on: ['EA1'], estimate_ms: 12000, tps_min: 8, tps_max: 14 },
    { id: 'DA2', group: 'D', sector: 'Deploy', depends_on: ['EA2'], estimate_ms: 11000, tps_min: 8, tps_max: 14 },
    { id: 'DB1', group: 'D', sector: 'Deploy', depends_on: ['EB1'], estimate_ms: 10000, tps_min: 8, tps_max: 14 },

    // More parallel leaves
    { id: 'BA3', group: 'B', sector: 'Build', depends_on: ['PA2'], estimate_ms: 16000, tps_min: 14, tps_max: 24 },
    { id: 'EA3', group: 'E', sector: 'Eval', depends_on: ['BA3'], estimate_ms: 12000, tps_min: 8, tps_max: 18 },
    { id: 'DA3', group: 'D', sector: 'Deploy', depends_on: ['EA3'], estimate_ms: 9000, tps_min: 8, tps_max: 14 },
  ],
};

export default rushPlan;

