import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCacheBustReloadUrl,
  consumeJustUpdatedFlag,
  formatBuildTimestamp,
  formatShortBuildId,
  isBuildUpdateAvailable,
  parseVersionPayload,
  performHardWebUpdate,
  stripCacheBustParam,
} from './appUpdater.ts';

test('parseVersionPayload validates build version responses safely', () => {
  assert.deepEqual(
    parseVersionPayload({
      buildId: ' build-abc123 ',
      builtAt: '2026-11-27T04:00:00.000Z',
      mode: 'production',
    }),
    {
      buildId: 'build-abc123',
      builtAt: '2026-11-27T04:00:00.000Z',
      mode: 'production',
    }
  );
  assert.equal(parseVersionPayload(null), null);
  assert.equal(parseVersionPayload({}), null);
  assert.equal(parseVersionPayload({ buildId: '   ' }), null);
});

test('isBuildUpdateAvailable detects mismatched build IDs accurately', () => {
  assert.equal(
    isBuildUpdateAvailable('build-1', { buildId: 'build-2', builtAt: '2026-11-27T04:00:00Z' }),
    true
  );
  assert.equal(
    isBuildUpdateAvailable('build-1', { buildId: 'build-1', builtAt: '2026-11-27T04:00:00Z' }),
    false
  );
  assert.equal(
    isBuildUpdateAvailable('local-build', { buildId: 'build-2', builtAt: '2026-11-27T04:00:00Z' }),
    false
  );
  assert.equal(isBuildUpdateAvailable('build-1', null), false);
});

test('buildCacheBustReloadUrl and stripCacheBustParam preserve route, query, and hash', () => {
  const busted = buildCacheBustReloadUrl('https://example.com/trien-lam?tab=portrait#top', 999);
  assert.equal(
    busted,
    'https://example.com/trien-lam?tab=portrait&_sw_refresh=999#top'
  );
  assert.equal(
    stripCacheBustParam(busted),
    'https://example.com/trien-lam?tab=portrait#top'
  );
  assert.equal(stripCacheBustParam('https://example.com/trien-lam'), null);
  assert.equal(consumeJustUpdatedFlag(), false);
});

test('formatShortBuildId and formatBuildTimestamp produce clean readable labels', () => {
  assert.equal(formatShortBuildId('build-1234'), 'build-1234');
  assert.equal(formatShortBuildId('build-very-long-identifier-987654'), 'build-ve…987654');
  assert.notEqual(formatBuildTimestamp('2026-11-27T04:00:00.000Z'), 'Không rõ thời gian');
  assert.equal(formatBuildTimestamp(''), 'Không rõ thời gian');
});

test('performHardWebUpdate skips waiting SW, unregisters SWs, clears Cache Storage, and reloads with cache-buster', async () => {
  const actions: string[] = [];
  let reloadedUrl = '';

  const nextUrl = await performHardWebUpdate({
    currentHref: 'https://example.com/chronos?view=kanban',
    now: 1764200000000,
    applyWaitingSw: async () => {
      actions.push('apply-waiting-sw');
    },
    serviceWorkerContainer: {
      getRegistrations: async () => [
        {
          waiting: {
            postMessage: (msg) => {
              actions.push(`post:${JSON.stringify(msg)}`);
            },
          },
          unregister: async () => {
            actions.push('sw-unregister');
            return true;
          },
        },
      ],
    },
    cacheStorage: {
      keys: async () => ['workbox-precache-v2', 'google-fonts-cache'],
      delete: async (key) => {
        actions.push(`cache-delete:${key}`);
        return true;
      },
    },
    reloadWithUrl: (url) => {
      reloadedUrl = url;
      actions.push(`reload:${url}`);
    },
  });

  assert.equal(
    nextUrl,
    'https://example.com/chronos?view=kanban&_sw_refresh=1764200000000'
  );
  assert.equal(reloadedUrl, nextUrl);
  assert.deepEqual(actions, [
    'apply-waiting-sw',
    'post:{"type":"SKIP_WAITING"}',
    'sw-unregister',
    'cache-delete:workbox-precache-v2',
    'cache-delete:google-fonts-cache',
    'reload:https://example.com/chronos?view=kanban&_sw_refresh=1764200000000',
  ]);
});
