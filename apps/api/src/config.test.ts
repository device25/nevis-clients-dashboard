import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

describe('readConfig', () => {
  it('defaults to no delay, no failure and port 3001', () => {
    expect(readConfig({})).toEqual({
      delayMs: 0,
      fail: false,
      port: 3001,
      serveWeb: false,
    });
  });

  it('reads the switches', () => {
    expect(
      readConfig({
        API_DELAY_MS: '800',
        API_FAIL: 'true',
        NODE_ENV: 'production',
      }),
    ).toMatchObject({ delayMs: 800, fail: true, serveWeb: true });
  });

  it('rejects a delay that is not a non-negative integer', () => {
    expect(() => readConfig({ API_DELAY_MS: '-5' })).toThrow('API_DELAY_MS');
    expect(() => readConfig({ API_DELAY_MS: 'soon' })).toThrow('API_DELAY_MS');
  });

  it('rejects an unknown failure flag', () => {
    expect(() => readConfig({ API_FAIL: 'maybe' })).toThrow('API_FAIL');
  });
});
