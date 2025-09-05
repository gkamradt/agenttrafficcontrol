// Import concrete plans so we can build a registry
import { calmPlan } from './calm';
import { rushPlan } from './rush';
import { webPlan } from './web';
import { testPlan } from './test';
export { calmPlan, rushPlan, webPlan, testPlan };
export * from './types';

// Central registry to drive UI/worker off plan definitions
import type { PlanDefinition } from './types';

export const ALL_PLANS: readonly PlanDefinition[] = [
  rushPlan,
  calmPlan,
  webPlan,
  testPlan,
] as const;

export const PLAN_NAMES = ALL_PLANS.map(p => p.name) as readonly string[];

export const PLAN_REGISTRY: Record<string, PlanDefinition> = ALL_PLANS.reduce((acc, p) => {
  acc[p.name] = p;
  return acc;
}, {} as Record<string, PlanDefinition>);

export function getPlanByName(name: string): PlanDefinition | undefined {
  return PLAN_REGISTRY[name];
}

export const DEFAULT_PLAN_NAME: string = 'Rush';
