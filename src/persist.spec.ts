import type { HotApi, ModuleLike } from './interface';
import { persist } from './persist';

type HMRData = Record<string, unknown>;
type DisposeCallback = (data: HMRData) => void;

interface ModuleContext {
  mod: ModuleLike;
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
      const mod = {} as unknown as ModuleLike;

      return {
        mod,
        disposeCallbacks,
        setCurrentData,
      };
    }

    const hotApi: HotApi = {
      dispose: (callback: DisposeCallback) => {
        disposeCallbacks.push(callback);
      },
      get data() {
        return currentData;
      },
    };

    const mod: ModuleLike = {
      hot: hotApi,
      webpackHot: hotApi,
    };

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

  const performTest = (isUserDefinedKey: boolean, isHostedHotApi: boolean) => {
    it('must return new instance if hot host is null', () => {
      const ctx = createModuleContext(false);
      const hotApiHost = isHostedHotApi ? null : () => null;
      const a = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).not.toBe(b);
    });

    it('must return new instance if hot host is undefined', () => {
      const ctx = createModuleContext(false);
      const hotApiHost = isHostedHotApi ? undefined : () => undefined;
      const a = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).not.toBe(b);
    });

    it('recognizes hot host with "dispose" method', () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod.hot : () => ctx.mod.hot;
      const a = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).toBe(b);
    });

    if (isHostedHotApi) {
      it('recognizes webpack-style hot host', () => {
        const ctx = createModuleContext(true);
        const hotApiHost = { webpackHot: ctx.mod.webpackHot };
        const a = persist(hotApiHost)(
          factory,
          void 0,
          isUserDefinedKey ? 'a' : void 0,
        );
        reloadModule(ctx);
        const b = persist(hotApiHost)(
          factory,
          void 0,
          isUserDefinedKey ? 'a' : void 0,
        );
        expect(a).toBe(b);
      });
    }

    it('must return old instance in development mode (with no deps specified)', () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const a = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).toBe(b);
    });

    it("must return old instance if deps didn't change", () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const dep = {};
      const a = persist(hotApiHost)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).toBe(b);
    });

    it('must return new instance if deps changed', () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const a = persist(hotApiHost)(
        factory,
        [{}],
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        [{}],
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).not.toBe(b);
    });

    it('must return new instance if NODE_ENV is production', () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      process.env.NODE_ENV = 'production';
      const a = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).not.toBe(b);
    });

    it('must return new instance if hot mode is unavailable', () => {
      const ctx = createModuleContext(false);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const a = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      reloadModule(ctx);
      const b = persist(hotApiHost)(
        factory,
        void 0,
        isUserDefinedKey ? 'a' : void 0,
      );
      expect(a).not.toBe(b);
    });

    it('must return new instances if the deps change in a cascade', () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const dep = {};
      const a = persist(hotApiHost)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0,
      );
      const b = persist(hotApiHost)(
        factory,
        [a, {}],
        isUserDefinedKey ? 'b' : void 0,
      );
      const c = persist(hotApiHost)(
        factory,
        [b],
        isUserDefinedKey ? 'c' : void 0,
      );
      reloadModule(ctx);
      const d = persist(hotApiHost)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0,
      );
      const e = persist(hotApiHost)(
        factory,
        [d, {}],
        isUserDefinedKey ? 'b' : void 0,
      );
      const f = persist(hotApiHost)(
        factory,
        [e],
        isUserDefinedKey ? 'c' : void 0,
      );
      expect(a).toBe(d);
      expect(b).not.toBe(e);
      expect(c).not.toBe(f);
    });

    it("must return old instances if the deps don't change in a cascade", () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const dep = {};
      const a = persist(hotApiHost)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0,
      );
      const b = persist(hotApiHost)(
        factory,
        [a],
        isUserDefinedKey ? 'b' : void 0,
      );
      const c = persist(hotApiHost)(
        factory,
        [b],
        isUserDefinedKey ? 'c' : void 0,
      );
      reloadModule(ctx);
      const d = persist(hotApiHost)(
        factory,
        [dep],
        isUserDefinedKey ? 'a' : void 0,
      );
      const e = persist(hotApiHost)(
        factory,
        [d],
        isUserDefinedKey ? 'b' : void 0,
      );
      const f = persist(hotApiHost)(
        factory,
        [e],
        isUserDefinedKey ? 'c' : void 0,
      );
      expect(a).toBe(d);
      expect(b).toBe(e);
      expect(c).toBe(f);
    });

    it('extracts key from options object', () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const a = persist(hotApiHost)(factory, void 0, {
        key: isUserDefinedKey ? 'a' : void 0,
      });
      reloadModule(ctx);
      const b = persist(hotApiHost)(factory, void 0, {
        key: isUserDefinedKey ? 'a' : void 0,
      });
      expect(a).toBe(b);
    });

    it('runs cleanup function when the instance updates', () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const cleanup = jest.fn();
      const a = persist(hotApiHost)(factory, [{}], {
        key: isUserDefinedKey ? 'a' : void 0,
        cleanup,
      });
      reloadModule(ctx);
      persist(hotApiHost)(factory, [{}], {
        key: isUserDefinedKey ? 'a' : void 0,
        cleanup,
      });
      expect(cleanup).toHaveBeenCalledWith(a);
    });

    it("doesn't run cleanup if it is not specified", () => {
      const ctx = createModuleContext(true);
      const hotApiHost = isHostedHotApi ? ctx.mod : () => ctx.mod.hot;
      const cleanup = jest.fn();
      persist(hotApiHost)(factory, [{}], {
        key: isUserDefinedKey ? 'a' : void 0,
      });
      reloadModule(ctx);
      persist(hotApiHost)(factory, [{}], {
        key: isUserDefinedKey ? 'a' : void 0,
      });
      expect(cleanup).not.toHaveBeenCalled();
    });
  };

  describe('indexed, hosted hot api', () => {
    performTest(false, true);
  });

  describe('indexed, hot api via getter', () => {
    performTest(false, false);
  });

  describe('keyed, hosted hot api', () => {
    performTest(true, true);
  });

  describe('keyed, hot api via getter', () => {
    performTest(true, false);
  });
});
