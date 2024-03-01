export function shallowEqualArrays(
  a: unknown[] | undefined,
  b: unknown[] | undefined,
): boolean {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const len = a.length;

  if (b.length !== len) {
    return false;
  }

  for (let i = 0; i < len; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
