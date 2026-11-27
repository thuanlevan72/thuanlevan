import assert from 'node:assert/strict';
import test from 'node:test';
import { isViteClientModuleId, patchViteClientWithoutHmr } from './viteClientPatch.ts';

test('isViteClientModuleId matches Vite client module across platforms and queries', () => {
  assert.equal(isViteClientModuleId('/app/node_modules/vite/dist/client/client.mjs'), true);
  assert.equal(
    isViteClientModuleId('C:\\repo\\node_modules\\vite\\dist\\client\\client.mjs?v=123'),
    true
  );
  assert.equal(isViteClientModuleId('/app/src/main.tsx'), false);
});

test('patchViteClientWithoutHmr disables WebSocket connect while keeping CSS/HMR exports', () => {
  const sampleClient = `
console.debug("[vite] connecting...");
const transport = {
  async disconnect() {
    await wsTransport.disconnect();
  },
  send(data) {
    wsTransport.send(data);
  }
};
transport.connect(createHMRHandler(handleMessage));
export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };
`;

  const result = patchViteClientWithoutHmr(sampleClient);
  assert.equal(result.includes('transport.connect('), false);
  assert.equal(result.includes('wsTransport.send('), false);
  assert.equal(result.includes('wsTransport.disconnect('), false);
  assert.equal(result.includes('console.debug("[vite] connecting...")'), false);
  assert.match(result, /export \{ ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle \};/);
});
