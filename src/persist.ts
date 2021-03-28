import { shallowEqualArrays } from './shallowEqualArrays';

interface PersistedItem<T> {
  instance: T;
  dependencies?: unknown[];
}

interface ExtendedPersistOptions<T> {
  key: string;
  cleanup?: (instance: T) => void;
}

type PersistOptions<T> = ExtendedPersistOptions<T> | string;

function getOrCreateInstance<T>(
  oldInstance: PersistedItem<T> | undefined,
  factory: () => T,
  options: PersistOptions<T>,
  dependencies?: unknown[]
): PersistedItem<T> {
  if (typeof oldInstance !== 'undefined') {
    if (shallowEqualArrays(oldInstance.dependencies, dependencies)) {
      return oldInstance;
    }

    if (typeof options !== 'string') {
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

export function persist(mod: NodeModule) {
  return function <T>(
    factory: () => T,
    options: PersistOptions<T>,
    dependencies?: unknown[]
  ): T {
    if (
      process.env.NODE_ENV === 'production' ||
      typeof mod.hot === 'undefined'
    ) {
      return factory();
    }

    const key = typeof options === 'string' ? options : options.key;

    const oldInstance = (mod.hot.data?.[key] as unknown) as
      | PersistedItem<T>
      | undefined;

    const result = getOrCreateInstance(
      oldInstance,
      factory,
      options,
      dependencies
    );

    mod.hot.dispose((data) => {
      data[key] = result;
    });

    return result.instance;
  };
}
