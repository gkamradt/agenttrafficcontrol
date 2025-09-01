import { DEBUG_LOGS } from './config';

export function debugLog(tag: string, ...args: any[]) {
  if (!DEBUG_LOGS) return;
  // eslint-disable-next-line no-console
  console.log(`[${tag}]`, ...args);
}

