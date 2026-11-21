'use client';
import { useSyncExternalStore } from 'react';
import { DATA_CHANGED_EVENT } from '@/lib/storage';

/*
 * localStorage is an external store, so components read it through useSyncExternalStore:
 * the static HTML renders the `initial` value, the browser swaps in real data right after
 * hydration, and every screen re-reads when this tab or another tab changes the data.
 */

let version = 0;
const listeners = new Set<() => void>();
const cache = new Map<string, { version: number; value: unknown }>();

function onChange() {
  version += 1;
  listeners.forEach((listener) => listener());
}

// Listen for the whole lifetime of the page (not only while something is subscribed),
// so the cache can never hand out data from before a write.
if (typeof window !== 'undefined') {
  window.addEventListener(DATA_CHANGED_EVENT, onChange);
  window.addEventListener('storage', onChange);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function cachedRead<T>(key: string, read: () => T): T {
  const hit = cache.get(key);
  if (hit && hit.version === version) return hit.value as T;
  const value = read();
  cache.set(key, { version, value });
  return value;
}

/**
 * @param key   unique name for this read; include any parameters (e.g. `product:${id}`)
 * @param read  pure function that reads from `storage`
 * @param initial value used for the static HTML, before the browser has loaded data
 */
export function useStoredData<T>(key: string, read: () => T, initial: T): T {
  return useSyncExternalStore(
    subscribe,
    () => cachedRead(key, read),
    () => initial,
  );
}

const noopSubscribe = () => () => {};

/** False in the static HTML and during hydration, true once running in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Reads a `?name=` query value. Pages use query strings instead of [id] segments so the
 * whole app can be exported as static files (IDs only exist in the visitor's browser).
 */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}
