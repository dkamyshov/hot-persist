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

  const performTest = (isUserDefinedKey: boolean) => {
    it('must return old instance in development mode (with no deps specified)', () => {
      const ctx = createModuleContext(true);
      const a = persist(ctx.mod)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0
      );
      reloadModule(ctx);
      const b = persist(ctx.mod)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0
      );
      expect(a).toBe(b);
    });

    it("must return old instance if deps didn't change", () => {
      const ctx = createModuleContext(true);
      const dep = {};
      const a = persist(ctx.mod)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0
      );
      reloadModule(ctx);
      const b = persist(ctx.mod)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0
      );
      expect(a).toBe(b);
    });

    it('must return new instance if deps changed', () => {
      const ctx = createModuleContext(true);
      const a = persist(ctx.mod)(
        factory,
        [{}],
        isUserDefinedKey ? 'a' : void 0
      );
      reloadModule(ctx);
      const b = persist(ctx.mod)(
        factory,
        [{}],
        isUserDefinedKey ? 'a' : void 0
      );
      expect(a).not.toBe(b);
    });

    it('must return new instance if NODE_ENV is production', () => {
      const ctx = createModuleContext(true);
      process.env.NODE_ENV = 'production';
      const a = persist(ctx.mod)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0
      );
      reloadModule(ctx);
      const b = persist(ctx.mod)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0
      );
      expect(a).not.toBe(b);
    });

    it('must return new instance if hot mode is unavailable', () => {
      const ctx = createModuleContext(false);
      const a = persist(ctx.mod)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0
      );
      reloadModule(ctx);
      const b = persist(ctx.mod)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0
      );
      expect(a).not.toBe(b);
    });

    it('must return new instances if the deps change in a cascade', () => {
      const ctx = createModuleContext(true);
      const dep = {};
      const a = persist(ctx.mod)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0
      );
      const b = persist(ctx.mod)(
        factory,
        [a, {}],
        isUserDefinedKey ? 'b' : void 0
      );
      const c = persist(ctx.mod)(factory, [b], isUserDefinedKey ? 'c' : void 0);
      reloadModule(ctx);
      const d = persist(ctx.mod)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0
      );
      const e = persist(ctx.mod)(
        factory,
        [d, {}],
        isUserDefinedKey ? 'b' : void 0
      );
      const f = persist(ctx.mod)(factory, [e], isUserDefinedKey ? 'c' : void 0);
      expect(a).toBe(d);
      expect(b).not.toBe(e);
      expect(c).not.toBe(f);
    });

    it("must return old instances if the deps don't change in a cascade", () => {
      const ctx = createModuleContext(true);
      const dep = {};
      const a = persist(ctx.mod)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0
      );
      const b = persist(ctx.mod)(factory, [a], isUserDefinedKey ? 'b' : void 0);
      const c = persist(ctx.mod)(factory, [b], isUserDefinedKey ? 'c' : void 0);
      reloadModule(ctx);
      const d = persist(ctx.mod)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0
      );
      const e = persist(ctx.mod)(factory, [d], isUserDefinedKey ? 'b' : void 0);
      const f = persist(ctx.mod)(factory, [e], isUserDefinedKey ? 'c' : void 0);
      expect(a).toBe(d);
      expect(b).toBe(e);
      expect(c).toBe(f);
    });

    it('extracts key from options object', () => {
      const ctx = createModuleContext(true);
      const a = persist(ctx.mod)(factory, void 0, {
        key: isUserDefinedKey ? 'a' : void 0,
      });
      reloadModule(ctx);
      const b = persist(ctx.mod)(factory, void 0, {
        key: isUserDefinedKey ? 'a' : void 0,
      });
      expect(a).toBe(b);
    });

    it('runs cleanup function when the instance updates', () => {
      const ctx = createModuleContext(true);
      const cleanup = jest.fn();
      const a = persist(ctx.mod)(factory, [{}], {
        key: isUserDefinedKey ? 'a' : void 0,
        cleanup,
      });
      reloadModule(ctx);
      persist(ctx.mod)(factory, [{}], {
        key: isUserDefinedKey ? 'a' : void 0,
        cleanup,
      });
      expect(cleanup).toHaveBeenCalledWith(a);
    });

    it("doesn't run cleanup if it is not specified", () => {
      const ctx = createModuleContext(true);
      const cleanup = jest.fn();
      persist(ctx.mod)(factory, [{}], { key: isUserDefinedKey ? 'a' : void 0 });
      reloadModule(ctx);
      persist(ctx.mod)(factory, [{}], { key: isUserDefinedKey ? 'a' : void 0 });
      expect(cleanup).not.toHaveBeenCalled();
    });
  };

  describe('indexed', () => {
    performTest(false);
  });

  describe('keyed', () => {
    performTest(true);
  });
});
