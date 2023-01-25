import { getCallCounter, resetCallCounter } from './callCounter';
import type { HotApiProvider } from './interface';
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
 * // vite 2/3/4
 * const value = persist(() => import.meta.hot)(() => ({ property: 'hello, world' }));
 *
 * // webpack 4/5, parcel 2
 * const value = persist(module)(() => ({ property: 'hello, world' }));
 *
 * // webpack 5
 * const value = persist(() => import.meta.webpackHot)(() => ({ property: 'hello, world' }));
 * ```
 *
 * @param hotApiProvider module-like object with `hot` API exposed or `hot` API getter
 * @returns
 */
export function persist(hotApiProvider: HotApiProvider) {
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
    const hot =
      typeof hotApiProvider === 'function'
        ? hotApiProvider()
        : hotApiProvider.webpackHot ?? hotApiProvider.hot;

    // uncomment the following to make sure
    // integration tests could fail
    // if (Math.random() > -1) {
    //   return factory();
    // }

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
