import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

/** The origin of the mocked API: jsdom's fetch cannot resolve relative URLs. */
export const BASE_URL = 'http://api.test';
export const CLIENTS_URL = `${BASE_URL}/api/clients`;

/** Width of the chart's plot at 1440px: the 1408px card less its padding. */
const CHART_WIDTH = 1376;

/**
 * jsdom has no layout engine: the chart reads its width from a
 * ResizeObserver, and the table scrolls focused cells into view.
 */
export function stubBrowserApis(width = CHART_WIDTH) {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe(target: Element) {
          this.callback(
            [{ target, contentRect: { width } } as ResizeObserverEntry],
            this,
          );
        }
        unobserve() {
          // Nothing to release: the stub never fires again.
        }
        disconnect() {
          // Nothing to release: the stub never fires again.
        }
      },
    );
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: () => undefined,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  });
}

/** An MSW server that lives as long as the test file. */
export function setupApiServer() {
  const server = setupServer();
  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });
  return server;
}
