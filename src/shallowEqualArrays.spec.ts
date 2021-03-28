import { shallowEqualArrays } from './shallowEqualArrays';

describe('shallowEqualArrays', () => {
  const arr: unknown[] = [];
  const obj1 = { game: 'chess' };
  const obj2 = { company: 'facebook' };
  const obj3 = { technology: 'react' };

  const variants: [
    string,
    unknown[] | undefined,
    unknown[] | undefined,
    boolean
  ][] = [
    ['false if A is falsy', void 0, [], false],
    ['false if B is falsy', [], void 0, false],
    ['true if A === B', arr, arr, true],
    ['true if both arrays are empty', [], [], true],
    [
      'false if arrays contain different amounts of elements',
      [1, 2],
      [1, 2, 3],
      false,
    ],
    [
      'true if arrays are shallowly equal (primitives)',
      [1, 2, 3],
      [1, 2, 3],
      true,
    ],
    [
      'true if arrays are shallowly equal (objects)',
      [obj1, obj2, obj3],
      [obj1, obj2, obj3],
      true,
    ],
    [
      'false if arrays are not shallowly equal (objects)',
      [obj1, obj2, obj3],
      [obj1, obj2, { technology: 'react' }],
      false,
    ],
  ];

  variants.forEach((variant) => {
    const [name, a, b, reference] = variant;

    it(`must return ${name}`, () => {
      expect(shallowEqualArrays(a, b)).toBe(reference);
    });
  });
});
