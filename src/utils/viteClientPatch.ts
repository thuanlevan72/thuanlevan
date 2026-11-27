export function isViteClientModuleId(id: string): boolean {
  const normalized = id.replace(/\\/g, '/').split('?')[0];
  return normalized.endsWith('/vite/dist/client/client.mjs');
}

/**
 * Vite 8 still injects `/@vite/client` and immediately invokes `transport.connect(...)`
 * even when `server.hmr = false` and `server.ws = false` in middlewareMode.
 * Behind HTTPS reverse proxies without an open WebSocket port 24678, that triggers
 * `[vite] failed to connect to websocket` and an unhandled Promise rejection.
 *
 * This helper disables the WebSocket connection call in `/@vite/client` while
 * preserving `updateStyle`, `removeStyle`, `createHotContext`, `injectQuery`, and `ErrorOverlay`.
 */
export function patchViteClientWithoutHmr(code: string): string {
  let patched = code;

  patched = patched.replace(
    'console.debug("[vite] connecting...");',
    '/* [vite] hmr disabled */'
  );

  patched = patched.replace(
    'transport.connect(createHMRHandler(handleMessage));',
    '/* [vite] transport.connect disabled when HMR/WS is disabled */'
  );

  patched = patched.replace(
    'wsTransport.send(data);',
    'return;'
  );

  patched = patched.replace(
    'await wsTransport.disconnect();',
    'return;'
  );

  return patched;
}
