// this is the original file content.
// this file will be copied to `src/main.ts` before the test.

import { persist } from '@dkamyshov/hot-persist';

const value = { x: 'first' };

const persistedValue = persist(() => import.meta.hot)(() => ({ ...value }), []);

// @ts-ignore
window.value = value;

// @ts-ignore
window.persistedValue = persistedValue;

if (import.meta.hot) {
  import.meta.hot.accept();
}
