# @dkamyshov/hot-persist

Dead simple persistence API for preserving data across hot reloads (supports webpack 4/5, vite 2/3/4, parcel 2). Zero dependencies!

## Installation

```sh
$ npm i --save-dev @dkamyshov/hot-persist
# or
$ yarn add -D @dkamyshov/hot-persist
```

- Using TypeScript with `webpack`?

  You should also install `@types/webpack-env` and `@types/node`.

- Using TypeScript with `parcel`?

  You should also install `@types/parcel-env`.

Regardless of what bundler you use, if you use TypeScript, you should consider disabling type checking of declaration files: https://www.typescriptlang.org/tsconfig#skipLibCheck.

## Usage

The HMR API is not standardised, so there are several ways to use this package. Examples (see below) use the "legacy" API for brevity.

```js
import { persist } from '@dkamyshov/hot-persist';

// webpack 4/5 (legacy way)
const instance = persist(module)(() => {
  return {
    /* ... */
  };
});

if (module.hot) {
  module.hot.accept();
}

// webpack 5 (modern way)
const instance = persist(() => import.meta.webpackHot)(() => {
  return {
    /* ... */
  };
});

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

// vite 2/3/4
const instance = persist(() => import.meta.hot)(() => {
  return {
    /* ... */
  };
});

if (import.meta.hot) {
  import.meta.hot.accept();
}
```

The `persist` function accepts the object with `hot` API exposed (or a getter function) and then returns a new function which accepts 3 parameters:

1. The `factory` function that returns the instance.
2. The optional `dependencies` parameter, which is used to decide whether the instance should be recreated.

   This works pretty much like React hooks' `dependencies` (it requires referential equality) with a slight difference: if the `dependencies` are not specified, the instance is never updated (unlike in React, where it means "update on each run").

3. The optional `options` parameter.

   1. `options.key` - the optional string key which is used to distinguish between multiple instances in a single module.
   2. `options.cleanup` - the optional callback which is invoked if the instance is updated. The old instance is passed to the callback.

   Instead of passing an object, you may pass a string here. The string will be treated as `options.key`.

   If the `key` is not specified, the `persist` function automatically infers it based on the order of calls (much like hooks in React):

   ```js
   const a = persist(module)(() => ({})); // `key` is `0`
   const b = persist(module)(() => ({})); // `key` is `1`
   const c = persist(module)(() => ({})); // `key` is `2`
   ```

Note: in production (NODE_ENV === 'production') the `persist` function immediately calls `factory` and returns with the new result on each run. The same happens when HMR is not enabled.

## Examples

```js
import { persist } from '@dkamyshov/hot-persist';

// Example 1. This instance never updates.
const value = persist(module)(() => {
  return {
    value: 0,
  };
});

// Example 2. Same as above.
const value = persist(module)(() => {
  return {
    value: 0,
  };
}, []);

// Example 3. The connection will be recreated
// when the URL changes.

// constants.js
export const URL = 'ws://localhost:8080/chat';

// index.js
import { URL } from './constants';

const socket = persist(module)(() => new WebSocket(URL), [URL], {
  cleanup: (socket) => {
    socket.close();
  },
});

// Example 4. The dependencies may be cascaded.
// If `add.js` is updated, both `b` and `c` are
// recreated. If `multiply.js` is updated, only `c`
// is recreated.

// add.js
export const add = (a, b) => a + b;

// multiply.js
export const multiply = (a, b) => a * b;

// index.js
import { add } from './add';
import { multiply } from './multiply';

const a = persist(module)(() => {
  return { value: 0 };
});

const b = persist(module)(() => {
  return { value: add(a.value, 1) };
}, [add, a]);

const c = persist(module)(() => {
  return { value: multiply(b.value, 2) };
}, [multiply, b]);
```
