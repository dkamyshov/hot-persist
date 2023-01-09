const keyToken = process.env.KEY_TOKEN;

module.exports = (api) => {
  if (api.env('test') || api.env('cjs')) {
    return {
      presets: ['@babel/preset-typescript'],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        [
          'transform-define',
          {
            __KEY_TOKEN: keyToken,
          },
        ],
      ],
    };
  }

  return {
    presets: ['@babel/preset-typescript'],
    plugins: [
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      [
        'transform-define',
        {
          __KEY_TOKEN: keyToken,
        },
      ],
    ],
  };
};
