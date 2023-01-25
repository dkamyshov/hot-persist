import { persist } from '@dkamyshov/hot-persist';

const value = { x: 'second' };

const persistedValue = persist(module)(() => ({ ...value }), []);

// @ts-ignore
window.value = value;

// @ts-ignore
window.persistedValue = persistedValue;

if (module.hot) {
  module.hot.accept();
}
