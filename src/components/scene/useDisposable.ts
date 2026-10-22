import { useEffect, useMemo, type DependencyList } from 'react';

interface Disposable {
  dispose: () => void;
}

const isDisposable = (value: unknown): value is Disposable =>
  typeof value === 'object' && value !== null && typeof (value as Partial<Disposable>).dispose === 'function';

/**
 * `useMemo` for GPU resources: every disposable value in the returned record
 * (geometries, materials) is released when the deps change or on unmount.
 */
export function useDisposable<T extends Record<string, unknown>>(factory: () => T, deps: DependencyList): T {
  const resources = useMemo(factory, deps);

  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => {
        if (isDisposable(value)) value.dispose();
      });
    },
    [resources],
  );

  return resources;
}
