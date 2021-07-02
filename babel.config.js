module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
};
