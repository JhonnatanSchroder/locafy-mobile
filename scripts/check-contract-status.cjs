const assert = require('node:assert/strict');
const { runtime } = require('./check-api.cjs');
const { componentRuntime, nodes, field, tick, text, page, find } = require('./check-client-finance.cjs');

const contract = (status, balance, extra = {}) => ({ id: 7, number: 7, status, financial_balance: balance, balance: '999.99', client: { id: 1, name: 'Cliente', phone: '' }, started_at: '2026-10-05T08:00:00Z', ended_at: status === 'ACTIVE' ? null : '2026-10-05T12:00:00Z', items: [], freights: [], ...extra });
const reply = data => ({ status: 200, body: { data } });

async function check() {
  const api = runtime(); const present = api.load('src/utils/contractStatus').contractPresentation;
  assert.equal(present(contract('ACTIVE', '20.00')).label, 'Ativo');
  assert.equal(present(contract('RETURNED', '20.00')).label, 'Pendente de pagamento');
  assert.equal(present(contract('RETURNED', '0.00')).label, 'Pronto para finalizar');
  assert.equal(present(contract('RETURNED', '0.00', { can_finalize: false })).ready, false);
  assert.equal(present(contract('RETURNED', null, { balance: null })).ready, false);
  for (const status of ['FINALIZED', 'CANCELLED']) assert.equal(present(contract(status, '0.00')).closed, true);
  let changed = 0; api.load('src/services/financialUpdates').subscribeFinancialUpdates(() => changed++);
  api.queue.push(reply(contract('FINALIZED', '0.00')), reply(contract('FINALIZED', '0.00')));
  assert.equal((await api.load('src/services/contracts').finalizeContract(7)).status, 'FINALIZED');
  assert.equal(api.requests[0].method, 'POST'); assert.ok(api.requests[0].url.endsWith('/contracts/7/finalize'));
  assert.equal(api.requests[1].method ?? 'GET', 'GET'); assert.equal(changed, 1);
  api.queue.push({ status: 422, body: { message: 'Ainda existem peças.' } });
  await assert.rejects(api.load('src/services/contracts').finalizeContract(7), /Ainda existem peças/);
  assert.equal(changed, 1);

  let confirmation;
  const r = componentRuntime(react => ({ 'expo-router': { router: { back() {}, push() {} }, useLocalSearchParams: () => ({ id: '7' }), useFocusEffect: callback => react.useEffect(callback, [callback]) }, 'react-native': new Proxy({ Alert: { alert: (...args) => { confirmation = args; } } }, { get: (o, key) => o[key] ?? key }) }));
  const Detail = r.load('src/app/contracts/[id]').default;
  r.queue.push(reply(contract('RETURNED', '0.00', { can_finalize: true })));
  r.render(Detail); await tick(0); let tree = r.render(Detail);
  field(tree, 'Finalizar contrato').onPress(); assert.equal(confirmation[0], 'Finalizar este contrato?');
  assert.equal(confirmation[2][0].style, 'cancel');
  r.queue.push(reply(contract('FINALIZED', '0.00')), reply(contract('FINALIZED', '0.00', { can_finalize: false })));
  confirmation[2][1].onPress(); await tick(0); tree = r.render(Detail);
  assert.ok(text(tree).includes('Contrato finalizado com sucesso.'));
  assert.equal(nodes(tree).some(n => n.props?.label === 'Finalizar contrato'), false);
  for (const label of ['Retirada', 'Devolução', 'Frete', 'Pagamento', 'Editar contrato']) assert.ok(!text(tree).includes(label), label + ' remains available after finalization');
  r.unmount();

  let backs = 0;
  const operation = componentRuntime(react => ({ 'expo-router': { router: { back() { backs++; } }, useLocalSearchParams: () => ({ id: '7', type: 'RETURN' }), useFocusEffect: callback => react.useEffect(callback, [callback]) } }));
  const Movement = operation.load('src/app/contracts/[id]/movement').default;
  const active = contract('ACTIVE', '20.00', { items: [{ id: 3, product: { name: 'Andaime' }, current_quantity: 1 }] });
  operation.queue.push(reply(active)); operation.render(Movement); await tick(0); tree = operation.render(Movement);
  find(tree, n => n.props?.label?.startsWith('Andaime')).props.onChange('1'); tree = operation.render(Movement);
  let notified;
  operation.load('src/services/financialUpdates').subscribeFinancialUpdates(c => { notified = c; });
  operation.queue.push({ status: 201, body: { data: {} } }, { status: 503, body: { message: 'Falha no refresh' } });
  await find(tree, n => n.props?.label?.startsWith('Registrar')).props.onPress(); tree = operation.render(Movement);
  assert.equal(backs, 0); assert.equal(notified, undefined);
  operation.queue.push(reply(contract('RETURNED', '20.00')));
  await field(tree, 'Movimento salvo - Atualizar contrato').onPress();
  assert.equal(operation.requests.filter(q => q.method === 'POST').length, 1, 'Refresh failure must not duplicate the return');
  assert.equal(notified.status, 'RETURNED'); assert.equal(backs, 1); operation.unmount();

  const closed = componentRuntime({ 'expo-router': { useLocalSearchParams: () => ({ id: '7' }), router: { back() {} } } });
  const ClosedMovement = closed.load('src/app/contracts/[id]/movement').default;
  closed.queue.push(reply(contract('FINALIZED', '0.00'))); closed.render(ClosedMovement); await tick(0); tree = closed.render(ClosedMovement);
  assert.equal(nodes(tree).some(n => n.props?.label?.startsWith('Registrar')), false);
  assert.ok(nodes(tree).some(n => n.props?.message === 'Contrato encerrado.')); closed.unmount();

  // The real list subscribes to the same updates used by final return and finalization.
  const list = componentRuntime(); const Charges = list.load('src/app/(tabs)/charges').default;
  list.queue.push(page([{ id: 7, ...contract('RETURNED', '20.00'), client: 'Cliente', contract_status: 'RETURNED' }]));
  list.render(Charges); await tick(0); assert.equal(find(list.render(Charges), n => n.type === 'FlatList').props.data.length, 1);
  list.queue.push(page([])); list.load('src/services/financialUpdates').notifyFinancialUpdate(contract('FINALIZED', '0.00'));
  await tick(0); assert.equal(find(list.render(Charges), n => n.type === 'FlatList').props.data.length, 0);
  list.unmount();
  console.log('PASS: backend balances/status, confirmed finalization, closed actions, final-return refresh/retry without duplicates, and pending list refresh.');
}
check().catch(e => { console.error(e); process.exitCode = 1; });
