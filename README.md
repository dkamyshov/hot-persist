# @dkamyshov/webpack-hot-persist

Dead simple persistence API for preserving data across hot reloads in webpack. Zero dependencies!

## Installation

```sh
$ yarn add -D @dkamyshov/webpack-hot-persist
```

## Usage

```js
import { persist } from '@dkamyshov/webpack-hot-persist';

const instance = persist(module)(() => {
  return {
    /* ... */
  };
}, 'instance');

if (module.hot) {
  module.hot.accept();
}
```

The `persist` function accepts the current module and then returns a new function that accepts 3 parameters:

1. The `factory` function that returns the instance.
2. The `options` parameter.

   1. `options.key` - the string key which is used to distinguish between multiple instances in a single module.
   2. `options.cleanup` - the optional callback which is invoked if the instance is updated. The old instance is passed to the callback.

   Instead of passing an object, you may pass a string here. The string will be treated as `options.key`.

3. The optional `dependencies` parameter, which is used to decide whether the instance should be recreated.

   This works pretty much like React hooks' `dependencies` (it requires referential equality) with a slight difference: if the `dependencies` are not specified, the instance is never updated (unlike in React, where it means "update on each run").

Note: in production (NODE_ENV === 'production') the `persist` function immediately calls `factory` and returns with the new result on each run. The same happens when HMR is not enabled.

## Examples

```js
import { persist } from '@dkamyshov/webpack-hot-persist';

// Example 1. This instance never updates.
const value = persist(module)(() => {
  return {
    value: 0,
  };
}, 'value');

// Example 2. Same as above.
const value = persist(module)(
  () => {
    return {
      value: 0,
    };
  },
  { key: 'value' }
);

// Example 3. Same as above.
const value = persist(module)(
  () => {
    return {
      value: 0,
    };
  },
  { key: 'value' },
  []
);

// Example 4. The connection will be recreated
// when the URL changes.

// constants.js
export const URL = 'ws://localhost:8080/chat';

// index.js
import { URL } from './constants';

const socket = persist(module)(
  () => new WebSocket(URL),
  {
    key: 'connection',
    cleanup: (socket) => {
      socket.close();
    },
  },
  [URL]
);

// Example 5. The dependencies may be cascaded.
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
}, 'a');

const b = persist(module)(
  () => {
    return { value: add(a.value, 1) };
  },
  'b',
  [add, a]
);

const c = persist(module)(
  () => {
    return { value: multiply(b.value, 2) };
  },
  'c',
  [multiply, b]
);
```
