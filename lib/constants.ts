// Core constants for Calming Control Room (tunable via PRD)

// Cost model (USD per token). Example: $0.002 per 1K tokens => 0.000002 per token
export const COST_PER_TOKEN_USD = 0.000002;

// Concurrency and motion tuning
export const MAX_CONCURRENT = 12;
export const V_MIN = 0.002; // world units/frame
export const V_MAX = 0.010; // world units/frame
export const TRAIL_DECAY = 0.08; // alpha per frame on motion buffer

// Radar visuals
export const RING_COUNT = 5;

// Sectors and colors
export const SECTORS = ['Planning', 'Build', 'Eval', 'Deploy'] as const;
export type Sector = typeof SECTORS[number];
export const SECTOR_COLORS: Record<Sector, string> = {
  Planning: '#6EE7B7',
  Build: '#93C5FD',
  Eval: '#FCA5A5',
  Deploy: '#FDE68A',
};

// Keep stub flag to satisfy existing import smoke test
export const CONSTANTS_MODULE_LOADED = true;
