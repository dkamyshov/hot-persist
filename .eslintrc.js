module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './tsconfig.eslint.json',
      './integration-tests/orchestrator/tsconfig.json',
      './integration-tests/repositories/webpack4/tsconfig.json',
      './integration-tests/repositories/webpack5/tsconfig.json',
      './integration-tests/repositories/webpack5-getter/tsconfig.json',
      './integration-tests/repositories/vite2/tsconfig.json',
      './integration-tests/repositories/vite3/tsconfig.json',
      './integration-tests/repositories/vite4/tsconfig.json',
      './integration-tests/repositories/parcel2/tsconfig.json',
    ],
    tsconfigRootDir: './',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  overrides: [
    {
      files: ['integration-tests/repositories/**/*'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },
  ],
};
