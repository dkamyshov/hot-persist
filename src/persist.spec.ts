import { persist } from './persist';

type HMRData = Record<string, unknown>;
type DisposeCallback = (data: HMRData) => void;

interface ModuleContext {
  mod: NodeModule;
  disposeCallbacks: DisposeCallback[];
  setCurrentData: (nextData: HMRData) => void;
}

describe('persist', () => {
  const factory = () => ({});

  const createModuleContext = (hot: boolean): ModuleContext => {
    const disposeCallbacks: DisposeCallback[] = [];
    let currentData: HMRData = {};

    const setCurrentData = (nextData: HMRData) => {
      currentData = nextData;
    };

    if (!hot) {
      const mod = ({} as unknown) as NodeModule;

      return {
        mod,
        disposeCallbacks,
        setCurrentData,
      };
    }

    const mod = ({
      hot: {
        dispose: (callback: DisposeCallback) => {
          disposeCallbacks.push(callback);
        },
        get data() {
          return currentData;
        },
      },
    } as unknown) as NodeModule;

    return {
      mod,
      disposeCallbacks,
      setCurrentData,
    };
  };

  const reloadModule = (ctx: ModuleContext) => {
    const nextData: HMRData = {};
    ctx.disposeCallbacks.forEach((disposeCallback) => {
      disposeCallback(nextData);
    });
    ctx.setCurrentData(nextData);
  };

  let env: string | undefined = void 0;

  beforeEach(() => {
    env = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  it('must return old instance in development mode (with no deps specified)', () => {
    const ctx = createModuleContext(true);
    const a = persist(ctx.mod)(factory, 'a');
    reloadModule(ctx);
    const b = persist(ctx.mod)(factory, 'a');
    expect(a).toBe(b);
  });

  it("must return old instance if deps didn't change", () => {
    const ctx = createModuleContext(true);
    const dep = {};
    const a = persist(ctx.mod)(factory, 'a', [dep]);
    reloadModule(ctx);
    const b = persist(ctx.mod)(factory, 'a', [dep]);
    expect(a).toBe(b);
  });

  it('must return new instance if deps changed', () => {
    const ctx = createModuleContext(true);
    const a = persist(ctx.mod)(factory, 'a', [{}]);
    reloadModule(ctx);
    const b = persist(ctx.mod)(factory, 'a', [{}]);
    expect(a).not.toBe(b);
  });

  it('must return new instance if NODE_ENV is production', () => {
    const ctx = createModuleContext(true);
    process.env.NODE_ENV = 'production';
    const a = persist(ctx.mod)(factory, 'a');
    reloadModule(ctx);
    const b = persist(ctx.mod)(factory, 'a');
    expect(a).not.toBe(b);
  });

  it('must return new instance if hot mode is unavailable', () => {
    const ctx = createModuleContext(false);
    const a = persist(ctx.mod)(factory, 'a');
    reloadModule(ctx);
    const b = persist(ctx.mod)(factory, 'a');
    expect(a).not.toBe(b);
  });

  it('must return new instances if the deps change in a cascade', () => {
    const ctx = createModuleContext(true);
    const dep = {};
    const a = persist(ctx.mod)(factory, 'a', [dep]);
    const b = persist(ctx.mod)(factory, 'b', [a, {}]);
    const c = persist(ctx.mod)(factory, 'c', [b]);
    reloadModule(ctx);
    const d = persist(ctx.mod)(factory, 'a', [dep]);
    const e = persist(ctx.mod)(factory, 'b', [d, {}]);
    const f = persist(ctx.mod)(factory, 'c', [e]);
    expect(a).toBe(d);
    expect(b).not.toBe(e);
    expect(c).not.toBe(f);
  });

  it("must return old instances if the deps don't change in a cascade", () => {
    const ctx = createModuleContext(true);
    const dep = {};
    const a = persist(ctx.mod)(factory, 'a', [dep]);
    const b = persist(ctx.mod)(factory, 'b', [a]);
    const c = persist(ctx.mod)(factory, 'c', [b]);
    reloadModule(ctx);
    const d = persist(ctx.mod)(factory, 'a', [dep]);
    const e = persist(ctx.mod)(factory, 'b', [d]);
    const f = persist(ctx.mod)(factory, 'c', [e]);
    expect(a).toBe(d);
    expect(b).toBe(e);
    expect(c).toBe(f);
  });

  it('extracts key from options object', () => {
    const ctx = createModuleContext(true);
    const a = persist(ctx.mod)(factory, { key: 'a' });
    reloadModule(ctx);
    const b = persist(ctx.mod)(factory, { key: 'a' });
    expect(a).toBe(b);
  });

  it('runs cleanup function when the instance updates', () => {
    const ctx = createModuleContext(true);
    const cleanup = jest.fn();
    const a = persist(ctx.mod)(factory, { key: 'a', cleanup }, [{}]);
    reloadModule(ctx);
    persist(ctx.mod)(factory, { key: 'a', cleanup }, [{}]);
    expect(cleanup).toHaveBeenCalledWith(a);
  });

  it("doesn't run cleanup if it is not specified", () => {
    const ctx = createModuleContext(true);
    const cleanup = jest.fn();
    persist(ctx.mod)(factory, { key: 'a' }, [{}]);
    reloadModule(ctx);
    persist(ctx.mod)(factory, { key: 'a' }, [{}]);
    expect(cleanup).not.toHaveBeenCalled();
  });
});
