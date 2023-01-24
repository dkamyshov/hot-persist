import { getCallCounter, resetCallCounter } from './callCounter';
import type { ModuleLike } from './interface';
import { shallowEqualArrays } from './shallowEqualArrays';

interface PersistedItem<T> {
  instance: T;
  dependencies?: unknown[];
}

interface ExtendedPersistOptions<T> {
  key?: string;
  cleanup?: (instance: T) => void;
}

type PersistOptions<T> = ExtendedPersistOptions<T> | string;

function getOrCreateInstance<T>(
  oldInstance: PersistedItem<T> | undefined,
  factory: () => T,
  options: PersistOptions<T> | undefined,
  dependencies: unknown[] | undefined
): PersistedItem<T> {
  if (typeof oldInstance !== 'undefined') {
    if (shallowEqualArrays(oldInstance.dependencies, dependencies)) {
      return oldInstance;
    }

    if (typeof options === 'object') {
      const { cleanup } = options;

      if (typeof cleanup === 'function') {
        cleanup(oldInstance.instance);
      }
    }
  }

  return {
    instance: factory(),
    dependencies,
  };
}

function getKey<T>(
  options: PersistOptions<T> | undefined,
  callIndex: number
): string {
  const userDefinedKey = typeof options === 'string' ? options : options?.key;

  return (
    userDefinedKey ??
    `__dkamyshov_hot_persist_${__KEY_TOKEN}_indexed[${callIndex}]`
  );
}

/**
 * Persist a value across hot reloads.
 *
 * ```
 * // `value === value` after the hot reload
 * const value = persist(module)(() => ({ property: 'hello, world' }));
 * ```
 *
 * Or:
 *
 * ```
 * const value = persist(import.meta)(() => ({ property: 'hello, world' }));
 * ```
 *
 * @param moduleLike module-like object with `hot` API exposed
 * @returns
 */
export function persist(moduleLike: ModuleLike) {
  /**
   * The persistor function.
   *
   * @param factory creates a value
   * @param dependencies the value updates when dependencies change (referrential equality)
   * @param options
   * @returns
   */
  const persistor = function <T>(
    factory: () => T,
    dependencies?: unknown[],
    options?: PersistOptions<T>
  ): T {
    const hot = moduleLike.webpackHot ?? moduleLike.hot;

    if (
      process.env.NODE_ENV === 'production' ||
      typeof hot === 'undefined' ||
      hot === null
    ) {
      return factory();
    }

    const callIndex = getCallCounter(hot);
    const key = getKey(options, callIndex);

    const oldInstance = hot.data?.[key] as unknown as
      | PersistedItem<T>
      | undefined;

    const result = getOrCreateInstance(
      oldInstance,
      factory,
      options,
      dependencies
    );

    hot.dispose((data) => {
      data[key] = result;

      resetCallCounter(hot);
    });

    return result.instance;
  };

  return persistor;
}
