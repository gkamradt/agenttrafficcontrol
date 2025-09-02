import type { PlanDefinition } from './types';

export const webPlan: PlanDefinition = {
  name: 'Web',
  items: [
    { id: 'W1', group: 'Frontend', sector: 'PLANNING', depends_on: [], estimate_ms: 8000, tps_min: 1.5, tps_max: 3 },
    { id: 'W2', group: 'Frontend', sector: 'BUILD', depends_on: ['W1'], estimate_ms: 12000, tps_min: 2, tps_max: 4 },
    { id: 'W3', group: 'Backend', sector: 'PLANNING', depends_on: [], estimate_ms: 10000, tps_min: 1.8, tps_max: 3.5 },
    { id: 'W4', group: 'Backend', sector: 'BUILD', depends_on: ['W3'], estimate_ms: 15000, tps_min: 2.2, tps_max: 4.5 },
    { id: 'W5', group: 'Testing', sector: 'EVAL', depends_on: ['W2', 'W4'], estimate_ms: 6000, tps_min: 1, tps_max: 2 },
    { id: 'W6', group: 'Deploy', sector: 'DEPLOY', depends_on: ['W5'], estimate_ms: 4000, tps_min: 0.8, tps_max: 1.5 },
  ],
};

export default webPlan;