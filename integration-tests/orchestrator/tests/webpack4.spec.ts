import { expect, test } from '@playwright/test';
import { resolve } from 'path';
import { Ports } from './constants';
import { copyFile, pause, run, type RunningProcess } from './utils';

const repositoryRoot = resolve(__dirname, '../../repositories/webpack4');

const targetIndexFile = resolve(repositoryRoot, 'src/index.ts');
const sourceBaseIndexFile = resolve(repositoryRoot, 'src/index.base.ts');
const sourceNextIndexFile = resolve(repositoryRoot, 'src/index.next.ts');

const pageAddress = `http://localhost:${Ports.Webpack4}`;

let handle: RunningProcess | null = null;

test.beforeAll(async () => {
  handle = run(repositoryRoot, 'node_modules/.bin/webpack', [
    'serve',
    '--hot',
    '--port',
    Ports.Webpack4,
  ]);

  // wait until the "successful" message
  await handle.waitForTextInStdout('successful');
});

test.afterAll(() => {
  handle?.kill();
  handle = null;
});

test.beforeEach(async () => {
  // restore the "original" file
  await copyFile(sourceBaseIndexFile, targetIndexFile);
});

test('persists modified value across hot reloads', async ({ page }) => {
  await page.goto(pageAddress);

  const value = await page.evaluate('window.value.x');
  const persistedValue = await page.evaluate('window.persistedValue.x');

  // values from "original" file
  expect(value).toBe('first');
  expect(persistedValue).toBe('first');

  // modify the value in the persisted object
  await page.evaluate('window.persistedValue.x = "modified";');

  await copyFile(sourceNextIndexFile, targetIndexFile); // simulate file edit
  await pause(); // allow some time for update to be applied

  const nextValue = await page.evaluate('window.value.x');
  const nextPersistedValue = await page.evaluate('window.persistedValue.x');

  expect(nextValue).toBe('second'); // "raw" value must be new
  expect(nextPersistedValue).toBe('modified'); // persisted value must remain old
});
