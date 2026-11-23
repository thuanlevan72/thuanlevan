import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAttemptChunkReload,
  isDynamicImportError,
  retryDynamicImport,
} from './lazyWithRetry.ts';

test('isDynamicImportError detects Vite/browser dynamic import fetch failures cleanly', () => {
  assert.equal(
    isDynamicImportError(
      new TypeError('Failed to fetch dynamically imported module: https://example.com/src/components/PrismTdGameSection.tsx')
    ),
    true
  );
  assert.equal(
    isDynamicImportError(new Error('Importing a module script failed.')),
    true
  );
  assert.equal(isDynamicImportError(new Error('Regular runtime error')), false);
  assert.equal(isDynamicImportError('non-error'), false);
});

test('retryDynamicImport succeeds after transient network failures and throws after max retries', async () => {
  let attempts = 0;
  const result = await retryDynamicImport(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new TypeError('Failed to fetch dynamically imported module');
      }
      return 'loaded-ok';
    },
    2,
    1
  );
  assert.equal(result, 'loaded-ok');
  assert.equal(attempts, 3);

  let failAttempts = 0;
  await assert.rejects(
    retryDynamicImport(
      async () => {
        failAttempts += 1;
        throw new TypeError('Failed to fetch dynamically imported module');
      },
      1,
      1
    ),
    /Failed to fetch dynamically imported module/
  );
  assert.equal(failAttempts, 2);
});

test('canAttemptChunkReload enforces 15s cooldown to prevent reload loops', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  assert.equal(canAttemptChunkReload(mockStorage, 100_000), true);
  assert.equal(canAttemptChunkReload(mockStorage, 105_000), false);
  assert.equal(canAttemptChunkReload(mockStorage, 116_000), true);
});
