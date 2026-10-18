export interface ServerConfig {
  delayMs: number;
  fail: boolean;
  port: number;
  serveWeb: boolean;
}

function parseInteger(name: string, raw: string | undefined, fallback: number) {
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  }
  return Number(raw);
}

function parseFlag(name: string, raw: string | undefined) {
  if (raw === undefined || raw === '' || raw === 'false' || raw === '0') {
    return false;
  }
  if (raw === 'true' || raw === '1') return true;
  throw new Error(`${name} must be true, false, 1 or 0, got "${raw}"`);
}

export function readConfig(env: Record<string, string | undefined>) {
  return {
    delayMs: parseInteger('API_DELAY_MS', env.API_DELAY_MS, 0),
    fail: parseFlag('API_FAIL', env.API_FAIL),
    port: parseInteger('PORT', env.PORT, 3001),
    serveWeb: env.NODE_ENV === 'production',
  } satisfies ServerConfig;
}
