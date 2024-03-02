import { expect, test } from '@playwright/test';
import { resolve } from 'path';
import { Ports } from './constants';
import { copyFile, pause, run, type RunningProcess } from './utils';

const repositoryRoot = resolve(__dirname, '../../repositories/vite4');

const targetMainFile = resolve(repositoryRoot, 'src/main.ts');
const sourceBaseMainFile = resolve(repositoryRoot, 'src/main.base.ts');
const sourceNextMainFile = resolve(repositoryRoot, 'src/main.next.ts');

const pageAddress = `http://localhost:${Ports.Vite4}`;

let handle: RunningProcess | null = null;

test.beforeAll(async () => {
  // restore the "original" file
  await copyFile(sourceBaseMainFile, targetMainFile);

  handle = run(repositoryRoot, 'node_modules/.bin/vite', [
    '--strictPort',
    '--port',
    Ports.Vite4,
  ]);

  // give vite some time to start
  await pause();
});

test.afterAll(() => {
  handle?.kill();
  handle = null;
});

test.beforeEach(async ({ page }) => {
  // restore the "original" file
  await copyFile(sourceBaseMainFile, targetMainFile);

  // open the page so Vite actually (re)builds the "app"
  // and give Vite some time
  await page.goto(pageAddress);
  await pause();
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

  await copyFile(sourceNextMainFile, targetMainFile); // simulate file edit
  await pause(); // allow some time for update to be applied

  const nextValue = await page.evaluate('window.value.x');
  const nextPersistedValue = await page.evaluate('window.persistedValue.x');

  expect(nextValue).toBe('second'); // "raw" value must be new
  expect(nextPersistedValue).toBe('modified'); // persisted value must remain old
});
