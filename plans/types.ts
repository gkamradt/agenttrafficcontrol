// Plan types for defining human-readable project plans
import type { Sector } from '@/lib/constants';

export interface PlanItemSpec {
  id: string;            // e.g., 'A1'
  group: string;         // e.g., 'A', 'B', ...
  sector: Sector;        // 'Planning' | 'Build' | 'Eval' | 'Deploy'
  depends_on: string[];  // upstream item ids
  estimate_ms: number;   // target duration in ms
  tps_min: number;       // lower bound tokens/sec
  tps_max: number;       // upper bound tokens/sec
}

export interface PlanDefinition {
  name: string;
  description?: string;
  items: PlanItemSpec[];
}

