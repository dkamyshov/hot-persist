module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.eslint.json'],
    tsconfigRootDir: './',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
};
