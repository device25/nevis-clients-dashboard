import { createRoot } from 'react-dom/client';
import { reportError } from './reportError';

/** A React root whose every error, caught or not, goes through `reportError`. */
export function createAppRoot(container: HTMLElement) {
  return createRoot(container, {
    onCaughtError: reportError,
    onUncaughtError: reportError,
    onRecoverableError: reportError,
  });
}
