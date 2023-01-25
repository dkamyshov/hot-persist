// this is the "edited" file content.
// this file will be copied to `src/main.ts` during the test
// to simulate an edit.

import { persist } from '@dkamyshov/hot-persist';

const value = { x: 'second' };

const persistedValue = persist(() => import.meta.hot)(() => ({ ...value }), []);

// @ts-ignore
window.value = value;

// @ts-ignore
window.persistedValue = persistedValue;

if (import.meta.hot) {
  import.meta.hot.accept();
}
