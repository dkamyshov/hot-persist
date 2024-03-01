import { persist } from '@dkamyshov/hot-persist';

const value = { x: 'second' };

const persistedValue = persist(() => import.meta.webpackHot)(
  () => ({ ...value }),
  [],
);

// @ts-ignore
window.value = value;

// @ts-ignore
window.persistedValue = persistedValue;

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
