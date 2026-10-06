const assert = require('node:assert/strict');
const fs = require('node:fs');
const { runtime } = require('./check-api.cjs');

// Headless hook/component harness: run the actual callbacks and effects, no extra dependency.
function componentRuntime(overrides = {}) {
  const slots = []; let index = 0; let effects = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) { const i = index++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = index++; return slots[i] ??= { current: initial }; },
    useCallback(callback, deps) { const i = index++; if (!same(slots[i]?.deps, deps)) slots[i] = { deps, value: callback }; return slots[i].value; },
    useMemo(callback, deps) { return react.useCallback(callback, deps)(); },
    useEffect(callback, deps) { const i = index++; if (!same(slots[i]?.deps, deps)) { const previous = slots[i]; slots[i] = { deps }; effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = callback(); }); } },
  };
  const jsx = (type, props) => ({ type, props });
  const hosts = new Proxy({}, { get: (_, name) => name });
  const r = runtime('web', new Map(), { react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' }, 'react-native': hosts, 'react-native-safe-area-context': hosts, 'lucide-react-native': hosts, 'expo-router': { router: { push() {}, replace() {}, back() {} }, useLocalSearchParams: () => ({}), useFocusEffect: callback => react.useEffect(callback, [callback]) }, ...(typeof overrides === 'function' ? overrides(react) : overrides) });
  return { ...r, render(fn, props) { index = 0; const tree = fn(props); const next = effects; effects = []; next.forEach(run => run()); return tree; }, unmount() { slots.forEach(s => s?.cleanup?.()); } };
}
function nodes(tree) { if (!tree || typeof tree !== 'object') return []; if (Array.isArray(tree)) return tree.flatMap(nodes); return [tree, ...nodes(tree.props?.children)]; }
function find(tree, predicate) { const node = nodes(tree).find(predicate); assert.ok(node, 'Expected element missing'); return node; }
function text(tree) { if (tree == null || typeof tree === 'boolean') return ''; if (Array.isArray(tree)) return tree.map(text).join(' '); return typeof tree === 'object' ? text(tree.props?.children) : String(tree); }
function field(tree, label) { return find(tree, node => node.props?.label === label).props; }
const tick = ms => new Promise(resolve => setTimeout(resolve, ms));
const page = (data, current = 1, last = 1) => ({ status: 200, body: { data, meta: { current_page: current, last_page: last, total: last * data.length }, links: { next: current < last ? 'https://ignored.test' : null } } });
const client = { id: 1, name: 'João da Silva', phone: '(94) 99999-9999', document: '12345678900', type: 'INDIVIDUAL' };

async function searchTests() {
  const r = componentRuntime(); const hook = r.load('src/hooks/use-client-search').useClientSearch;
  r.queue.push(page([client], 1, 2));
  r.render(hook); await tick(5); let state = r.render(hook);
  assert.equal(state.clients.length, 1);
  r.queue.push({ status: 503, body: { message: 'Page unavailable' } }); await state.loadMore(); state = r.render(hook);
  await state.loadMore(); assert.equal(r.requests.length, 2, 'Pagination retries automatically after failure');
  r.queue.push(page([{ ...client, id: 2 }], 2, 2)); await state.retry(); state = r.render(hook);
  assert.equal(state.clients.length, 2); assert.ok(r.requests[2].url.endsWith('page=2'));
  assert.equal(state.hasMore, false); await state.loadMore(); assert.equal(r.requests.length, 3);
  state.setSearch('J'); state = r.render(hook); state.setSearch('Jo'); state = r.render(hook);
  r.queue.push(page([client])); state.setSearch('João'); state = r.render(hook);
  await tick(100); assert.equal(r.requests.length, 3); await tick(220); state = r.render(hook);
  assert.equal(r.requests.length, 4); assert.ok(r.requests[3].url.includes('search=Jo%C3%A3o'));
  for (const term of ['(94) 99999-9999', '12345678900']) {
    r.queue.push(page([client])); state.setSearch(term); state = r.render(hook); await tick(320); state = r.render(hook);
    assert.ok(r.requests.at(-1).url.includes('search=' + encodeURIComponent(term)));
  }
  // Rapidly typing and clearing back to the current query must not leave loading stuck.
  state.setSearch('other'); state = r.render(hook); state.setSearch(''); r.queue.push(page([client])); r.render(hook); await tick(5); state = r.render(hook); assert.equal(state.loading, false);
  r.queue.push({ status: 500, body: { message: 'Falha de busca' } }); await state.refresh(); state = r.render(hook); assert.equal(state.error, 'Falha de busca');
  r.unmount();
}

async function contractAndInlineTests() {
  const r = componentRuntime(); const Form = r.load('src/components/contracts/ContractForm').ContractForm;
  r.queue.push(page([{ id: 3, name: 'Andaime', type: 'QUANTITY', active: true, default_price: '10.00' }]));
  r.render(Form, {}); await tick(0); let tree = r.render(Form, {});
  const draft = { 'Endereço da obra': 'Obra preenchida', 'Início (AAAA-MM-DD HH:mm)': '2026-10-05 08:30', 'Próxima cobrança (AAAA-MM-DD)': '2026-10-20', 'Intervalo entre cobranças (dias, opcional)': '15', 'Observações': 'Manter observação', 'Quantidade de fretes iniciais': '2', 'Valor unitário do frete': '15.00' };
  for (const [label, value] of Object.entries(draft)) field(tree, label).onChange(value);
  field(tree, 'Buscar produto para adicionar').onChange('Andaime'); tree = r.render(Form, {}); field(tree, 'Andaime').onPress(); tree = r.render(Form, {});
  field(tree, 'Quantidade inicial').onChange('8');
  field(tree, 'Selecionar cliente').onPress(); tree = r.render(Form, {});
  let pickerProps = find(tree, n => n.type?.name === 'ClientPicker').props;
  pickerProps.onSelect(client); tree = r.render(Form, {});
  assert.ok(text(tree).includes('João da Silva')); assert.equal(nodes(tree).some(n => n.type?.name === 'ClientPicker'), false);
  field(tree, 'Alterar').onPress(); tree = r.render(Form, {}); pickerProps = find(tree, n => n.type?.name === 'ClientPicker').props;
  const p = componentRuntime(); const Picker = p.load('src/components/clients/ClientPicker').ClientPicker;
  p.queue.push(page([client])); p.render(Picker, pickerProps); await tick(5); let picker = p.render(Picker, pickerProps);
  field(picker, '+ Novo cliente').onPress(); picker = p.render(Picker, pickerProps);
  const created = { ...client, id: 9, name: 'Novo cliente inline' };
  p.queue.push({ status: 201, body: { data: created } });
  await find(picker, n => n.type?.name === 'ClientForm').props.onSubmit({ type: 'INDIVIDUAL', name: created.name, phone: created.phone, document: created.document, residential_address: 'Rua nova', notes: 'Nota do cliente' });
  assert.ok(p.requests.at(-1).url.endsWith('/clients')); assert.equal(p.requests.at(-1).method, 'POST');
  tree = r.render(Form, {});
  assert.ok(text(tree).includes(created.name)); assert.equal(nodes(tree).some(n => n.type?.name === 'ClientPicker'), false);
  for (const [label, value] of Object.entries(draft)) assert.equal(field(tree, label).value, value, label + ' was reset');
  assert.equal(field(tree, 'Quantidade inicial').value, '8');
  field(tree, 'Revisar').onPress(); tree = r.render(Form, {}); assert.ok(text(tree).includes(created.name));
  r.queue.push({ status: 201, body: { data: { id: 99 } } }); await field(tree, 'Confirmar e salvar').onPress();
  const body = JSON.parse(r.requests.at(-1).body); assert.equal(body.client_id, 9); assert.equal(body.items[0].initial_quantity, 8); assert.equal(body.initial_freight.quantity, 2); assert.equal(body.notes, draft['Observações']);
  r.unmount(); p.unmount();
}

async function financeTests() {
  const r = componentRuntime();
  // Deliberately inconsistent values prove the UI displays the API balance without subtraction.
  const charge = { id: 7, contract_id: 7, client: 'Cliente', contract_status: 'ACTIVE', financial_status: 'PARTIAL', rental_total: '90.00', freight_total: '10.00', total_accrued: '100.00', total_paid: '90.00', balance: '5.55', next_charge_date: '2026-10-05', charge_interval_days: 15, due_today: true, days_overdue: 0, payments: [] };
  const Summary = r.load('src/components/ui/FinancialSummary').FinancialSummary;
  const rendered = text(r.render(Summary, { summary: charge })); assert.ok(rendered.includes('100,00')); assert.ok(rendered.includes('90,00')); assert.ok(rendered.includes('5,55'));
  const Card = r.load('src/components/charges/ChargeCard').ChargeCard;
  assert.ok(text(r.render(Card, { charge, onReceive() {}, onViewContract() {} })).includes('Pendente · parcial'));
  const api = runtime(); let refreshed = 0;
  api.load('src/services/financialUpdates').subscribeFinancialUpdates(c => { refreshed++; assert.equal(c.next_charge_date, '2026-10-20'); });
  const paid = { ...charge, financial_status: 'PAID', balance: '0.00', total_paid: '100.00', next_charge_date: '2026-10-20' };
  api.queue.push({ status: 200, body: { data: paid } }, { status: 200, body: { data: paid } }, { status: 200, body: { data: paid } });
  await api.load('src/services/payments').registerPayment(7, { amount: '5.55', method: 'PIX', paid_at: '2026-10-05T12:00:00Z', notes: null });
  const updated = await api.load('src/services/payments').refreshPaymentContext(7);
  assert.equal(updated.next_charge_date, '2026-10-20'); assert.equal(refreshed, 1);
  assert.ok(api.requests.some(q => q.url.endsWith('/charges/7'))); assert.ok(api.requests.some(q => q.url.endsWith('/contracts/7')));
  const listRuntime = componentRuntime(); const List = listRuntime.load('src/app/(tabs)/charges').default;
  listRuntime.queue.push(page([charge])); listRuntime.render(List); await tick(0); let listTree = listRuntime.render(List);
  assert.equal(find(listTree, n => n.type === 'FlatList').props.data.length, 1);
  listRuntime.queue.push(page([])); listRuntime.load('src/services/financialUpdates').notifyFinancialUpdate(paid);
  await tick(0); listTree = listRuntime.render(List);
  assert.equal(find(listTree, n => n.type === 'FlatList').props.data.length, 0, 'Paid contract remains in the pending list');
  assert.equal(listRuntime.requests.length, 2); listRuntime.unmount();
  api.queue.push(page([paid])); await api.load('src/services/charges').getCharges('all'); assert.ok(api.requests.at(-1).url.includes('filter=outstanding'));
  for (const file of ['src/app/(tabs)/charges.tsx', 'src/app/contracts/[id].tsx', 'src/services/charges.ts']) assert.ok(!/Gerar cobrança|createCharge|charges\/new/.test(fs.readFileSync(file, 'utf8')), 'Manual generation remains in ' + file);
  assert.ok(!fs.existsSync('src/app/charges/new.tsx'));
  assert.ok(fs.readFileSync('src/app/(tabs)/charges.tsx', 'utf8').includes('subscribeFinancialUpdates'));
}
module.exports = { componentRuntime, nodes, find, text, field, tick, page };
if (require.main === module) (async () => { await searchTests(); await contractAndInlineTests(); await financeTests(); console.log('PASS: debounced server search, pagination, inline selection and preserved contract draft, API balances, payment refresh and no manual charges.'); })().catch(error => { console.error(error); process.exitCode = 1; });
