const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual services without installing a test renderer or writing real records.
function runtime(platform = 'web', store = new Map(), mocks = {}) {
  const cache = new Map();
  const requests = [];
  const queue = [];
  const nativeStore = {
    getItemAsync: async key => store.get(key) ?? null,
    setItemAsync: async (key, value) => { store.set(key, value); },
    deleteItemAsync: async key => { store.delete(key); },
  };
  function load(name) {
    const filename = path.resolve(name + (name.endsWith('tokenStorage') && platform === 'web' ? '.web.ts' : fs.existsSync(name + '.ts') ? '.ts' : '.tsx'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(output, {
      module, exports: module.exports,
      process: { env: { EXPO_PUBLIC_API_URL: 'http://test/api/v1/' } },
      window: { localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) } },
      setTimeout, clearTimeout, AbortController, Error,
      fetch: async (url, options) => {
        requests.push({ url, ...options });
        const reply = queue.shift(); assert.ok(reply, `Unexpected request: ${url}`);
        return { ok: reply.status < 400, status: reply.status, json: async () => reply.body };
      },
      require: name => mocks[name] ?? (name === 'expo-secure-store' ? nativeStore : load(name.startsWith('@/') ? 'src/' + name.slice(2) : path.resolve(path.dirname(filename), name))),
    }, { filename });
    return module.exports;
  }
  return { load, requests, queue, store };
}

async function checkApi() {
  for (const platform of ['web', 'native']) {
    const r = runtime(platform);
    const auth = r.load('src/services/auth');
    assert.equal(await r.load('src/services/tokenStorage').getToken(), null);
    r.queue.push({ status: 200, body: { token: 'test-token', token_type: 'Bearer' } }, { status: 200, body: { data: { id: 1, name: 'Demo', email: 'demo@example.test' } } });
    await auth.login('demo@example.test', 'test');
    assert.equal((await auth.me()).id, 1);
    assert.equal(r.requests[0].url, 'http://test/api/v1/auth/login');
    assert.equal(r.requests[0].headers.Authorization, undefined);
    assert.equal(r.requests[1].headers.Authorization, 'Bearer test-token');
    const reopened = runtime(platform, r.store);
    assert.equal(await reopened.load('src/services/tokenStorage').getToken(), 'test-token');
    reopened.queue.push({ status: 200, body: { data: { id: 1, name: 'Demo' } } });
    assert.equal((await reopened.load('src/services/auth').me()).id, 1);
    r.queue.push({ status: 503, body: { message: 'Unavailable' } });
    await assert.rejects(auth.logout());
    assert.equal(await r.load('src/services/tokenStorage').getToken(), null);
    r.queue.push({ status: 422, body: { message: 'Invalid', errors: { email: ['Dados inválidos'] } } });
    await assert.rejects(auth.login('invalid', 'test'), e => e.status === 422);
    assert.equal(await r.load('src/services/tokenStorage').getToken(), null);
  }
  const r = runtime();
  r.queue.push({ status: 200, body: { data: [{ id: 1 }], meta: { last_page: 2 }, links: { next: 'https://untrusted.test/page=2' } } }, { status: 200, body: { data: [{ id: 2 }], meta: { last_page: 2 }, links: { next: null } } });
  const first = await r.load('src/services/clients').getClients({ search: 'João' });
  assert.equal(first.data.length, 1); assert.equal(r.requests.length, 1);
  await r.load('src/services/clients').getClients({ search: 'João', page: 2 });
  assert.equal(r.requests[1].url, 'http://test/api/v1/clients?search=Jo%C3%A3o&page=2');
  r.queue.push({ status: 201, body: { data: {} } }, { status: 201, body: { data: {} } }, { status: 200, body: { data: { financial_status: 'PARTIAL', balance: '15.00', total_accrued: '20.00', total_paid: '5.00' } } });
  await r.load('src/services/movements').createMovement({ contract_id: 7, type: 'RETURN', items: [{ contract_item_id: 2, quantity: 1 }] });
  await r.load('src/services/freights').createFreight(7, { quantity: 2, unit_amount: '15.00' });
  const paid = await r.load('src/services/payments').registerPayment(9, { amount: '5.00', method: 'PIX' });
  assert.equal(r.requests[2].url, 'http://test/api/v1/contracts/7/movements');
  assert.equal(r.requests[3].url, 'http://test/api/v1/contracts/7/freights');
  assert.equal(r.requests[4].url, 'http://test/api/v1/contracts/9/payments');
  assert.equal(paid.financial_status, 'PARTIAL'); assert.equal(paid.balance, '15.00');
  console.log('PASS: web/native auth, token restore, logout failure cleanup, validation, pagination, operational routes and backend balances.');
}
module.exports = { runtime };
if (require.main === module) checkApi().catch(error => { console.error(error); process.exitCode = 1; });
