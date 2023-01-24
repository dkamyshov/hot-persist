import { getCallCounter, resetCallCounter } from './callCounter';
import type { HotApi } from './interface';

describe('callCounter', () => {
  const createModuleHotReference = () => {
    return {} as unknown as HotApi;
  };

  it('sets and resets call counter', () => {
    const hot = createModuleHotReference();
    resetCallCounter(hot);
    const a = getCallCounter(hot);
    const b = getCallCounter(hot);
    resetCallCounter(hot);
    const c = getCallCounter(hot);
    const d = getCallCounter(hot);
    expect(a).toBe(0);
    expect(b).toBe(1);
    expect(c).toBe(0);
    expect(d).toBe(1);
  });

  it('sets and resets call counter for multiple modules independently', () => {
    const hot1 = createModuleHotReference();
    const hot2 = createModuleHotReference();

    resetCallCounter(hot1);
    resetCallCounter(hot2);

    expect(getCallCounter(hot1)).toBe(0);
    expect(getCallCounter(hot2)).toBe(0);
    expect(getCallCounter(hot1)).toBe(1);
    expect(getCallCounter(hot2)).toBe(1);

    resetCallCounter(hot1);

    expect(getCallCounter(hot1)).toBe(0);
    expect(getCallCounter(hot2)).toBe(2);
  });
});
