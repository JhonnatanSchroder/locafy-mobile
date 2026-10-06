import { useEffect, useState } from 'react';
import { router, type Href } from 'expo-router';
import { ActivityIndicator, Alert, Switch, Text, View } from 'react-native';
import { Button, Choice, ErrorText, Field, FormScreen } from '@/components/ui/OperationalForm';
import { getClient } from '@/services/clients';
import { ClientPicker } from '@/components/clients/ClientPicker';
import { getProducts } from '@/services/products';
import { createContract, getContract, updateContract } from '@/services/contracts';
import { uploadContractAttachment, type LocalContractPhoto } from '@/services/contractAttachments';
import { errorMessage } from '@/services/resources';
import { contractPresentation } from '@/utils/contractStatus';
import { ContractPhotoPicker } from '@/components/contracts/ContractPhotoPicker';
import type { Client } from '@/types/client';
import type { Contract } from '@/types/contract';
import type { Product } from '@/types/product';
import type { ContractInput, ContractItemInput, BillingPeriod } from '@/types/operations';
import { dateTimeInput, decimalInput, integerInput, localDateTime } from '@/utils/formValues';

type Row = { id?: number; product_id: number; billing_period: BillingPeriod; unit_price: string; initial_quantity: string };
export function ContractForm({ id, clientId }: { id?: string; clientId?: string }) {
  const [selectedClient, setSelectedClient] = useState<Pick<Client, 'id' | 'name' | 'phone'> | null>(null);
  const [selectingClient, setSelectingClient] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [client, setClient] = useState(Number(clientId) || 0);
  const [searchProduct, setSearchProduct] = useState('');
  const [address, setAddress] = useState('');
  const [started, setStarted] = useState(localDateTime());
  const [nextDate, setNextDate] = useState('');
  const [chargeInterval, setChargeInterval] = useState('');
  const [saturdays, setSaturdays] = useState(false);
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [freightQuantity, setFreightQuantity] = useState('0');
  const [freightPrice, setFreightPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ContractInput | null>(null);
  const [photos, setPhotos] = useState<LocalContractPhoto[]>([]);
  const [pendingUploadContractId, setPendingUploadContractId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([clientId && !id ? getClient(clientId) : Promise.resolve(null), getProducts(), id ? getContract(id) : Promise.resolve(null)]).then(([cs, ps, response]) => {
      if (!active) return;
      if (cs) setSelectedClient(cs);
      setProducts(ps);
      if (response) {
        const c = response.data; setContract(c); setClient(c.client.id); setSelectedClient(c.client); setAddress(c.worksite_address ?? '');
        setStarted(localDateTime(new Date(c.started_at))); setNextDate(c.next_charge_date ?? ''); setSaturdays(c.charge_saturdays); setNotes(c.notes ?? '');
        setChargeInterval(c.charge_interval_days == null ? '' : String(c.charge_interval_days));
        setRows(c.items.map(i => ({ id: i.id, product_id: i.product.id, billing_period: i.billing_period as BillingPeriod, unit_price: i.unit_price, initial_quantity: '' })));
      }
    }).catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, clientId]);
  function changeRow(index: number, patch: Partial<Row>) { setRows(current => current.map((r, i) => i === index ? { ...r, ...patch } : r)); }
  function prepare() {
    try {
      setError(null);
      if (!client || !rows.length) throw new Error('Selecione um cliente e pelo menos um produto.');
      const items: ContractItemInput[] = rows.map(row => ({ ...(row.id ? { id: row.id } : {}), product_id: row.product_id, billing_period: row.billing_period, unit_price: decimalInput(row.unit_price), ...(!id && products.find(p => p.id === row.product_id)?.type === 'QUANTITY' ? { initial_quantity: integerInput(row.initial_quantity) } : {}) }));
      const quantity = id ? 0 : integerInput(freightQuantity);
      setReview({ client_id: client, worksite_address: address.trim() || null, started_at: dateTimeInput(started), charge_saturdays: saturdays, next_charge_date: nextDate || null, ...(chargeInterval ? { charge_interval_days: integerInput(chargeInterval) } : {}), notes: notes.trim() || null, items, ...(quantity > 0 ? { initial_freight: { quantity, unit_amount: decimalInput(freightPrice) } } : {}) });
    } catch (e) { setError(errorMessage(e)); }
  }
  async function submit() {
    if (!review || busy) return;
    setBusy(true); setError(null);
    try {
      const result = id && contract ? await updateContract(id, { ...review, status: contract.status, ended_at: contract.ended_at }) : await createContract(review);
      if (!id && photos.length) {
        const failed = await uploadPhotos(result.id, photos);
        if (failed.length) {
          setPhotos(failed);
          setPendingUploadContractId(result.id);
          setError(`Contrato criado, mas algumas fotos não foram enviadas. ${photos.length - failed.length} de ${photos.length} fotos enviadas.`);
          Alert.alert('Contrato criado', `${photos.length - failed.length} de ${photos.length} fotos enviadas.`);
          return;
        }
      }
      router.replace(`/contracts/${result.id}` as Href);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); setUploadProgress(null); }
  }
  async function retryUpload() {
    if (!pendingUploadContractId || busy) return;
    setBusy(true); setError(null);
    try {
      const failed = await uploadPhotos(pendingUploadContractId, photos);
      if (failed.length) {
        setPhotos(failed);
        setError(`Contrato criado, mas algumas fotos não foram enviadas. ${photos.length - failed.length} de ${photos.length} fotos enviadas.`);
        return;
      }
      router.replace(`/contracts/${pendingUploadContractId}` as Href);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); setUploadProgress(null); }
  }
  async function uploadPhotos(contractId: number, selectedPhotos: LocalContractPhoto[]) {
    const failed: LocalContractPhoto[] = [];
    for (let index = 0; index < selectedPhotos.length; index += 1) {
      setUploadProgress(`Enviando fotos... ${index + 1} de ${selectedPhotos.length}`);
      try {
        await uploadContractAttachment(contractId, selectedPhotos[index]);
      } catch {
        failed.push(selectedPhotos[index]);
      }
    }
    return failed;
  }
  if (loading) return <FormScreen title="Contrato"><ActivityIndicator /></FormScreen>;
  if (id && (!contract || contractPresentation(contract).closed)) return <FormScreen title="Contrato"><ErrorText message={error ?? 'Contrato encerrado. A edição não está disponível.'} /></FormScreen>;
  return <FormScreen title={id ? 'Editar contrato' : 'Novo contrato'}>
    
    <ErrorText message={error} />
    {review ? <>
      <Text className="mb-3 text-lg font-bold text-slate-950 dark:text-white">Revisão · {selectedClient?.name}</Text>
      <Text className="mb-3 text-slate-500">{address || 'Sem endereço'} · {started}</Text>
      {review.items.map(item => <Text key={item.product_id} className="mb-2 text-slate-700 dark:text-slate-200">{products.find(p => p.id === item.product_id)?.name} · {item.billing_period} · R$ {item.unit_price}{item.initial_quantity !== undefined ? ` · Quantidade inicial: ${item.initial_quantity}` : ''}</Text>)}
      {review.initial_freight ? <Text className="text-slate-500">Frete inicial: {review.initial_freight.quantity} × R$ {review.initial_freight.unit_amount}</Text> : null}
      {!id && photos.length ? <Text className="mt-3 text-slate-500">Fotos selecionadas: {photos.length}</Text> : null}
      <Text className="my-3 text-slate-500">O total será apresentado pelo servidor após salvar.</Text>
      {uploadProgress ? <Text className="my-2 font-semibold text-blue-600">{uploadProgress}</Text> : null}
      <Button label="Confirmar e salvar" onPress={submit} busy={busy} /><Button label="Voltar à edição" disabled={busy} onPress={() => setReview(null)} />
      {pendingUploadContractId ? <Button label="Tentar novamente" onPress={retryUpload} busy={busy} /> : null}
    </> : <>
      {selectedClient ? <View className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><Text className="text-xs font-semibold uppercase text-slate-500">Cliente selecionado</Text><Text className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{selectedClient.name}</Text><Text className="mt-1 text-slate-500">{selectedClient.phone || 'Telefone não informado'}</Text><Button label="Alterar" onPress={() => setSelectingClient(true)} /></View> : <Button label="Selecionar cliente" onPress={() => setSelectingClient(true)} />}
      <Field label="Endereço da obra" value={address} onChange={setAddress} />
      <Field label="Início (AAAA-MM-DD HH:mm)" value={started} onChange={setStarted} />
      <Field label="Próxima cobrança (AAAA-MM-DD)" value={nextDate} onChange={setNextDate} />
      <Field label="Intervalo entre cobranças (dias, opcional)" numeric value={chargeInterval} onChange={setChargeInterval} />
      <View className="mb-4 flex-row items-center justify-between"><Text className="text-slate-700 dark:text-slate-200">Cobrar sábados</Text><Switch value={saturdays} onValueChange={setSaturdays} /></View>
      <Text className="mb-3 text-lg font-bold text-slate-950 dark:text-white">Itens</Text>
      {rows.map((row, index) => <View key={row.id ?? row.product_id} className="mb-4 rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
        <Text className="mb-3 font-bold text-slate-950 dark:text-white">{products.find(p => p.id === row.product_id)?.name ?? `Produto #${row.product_id}`}</Text>
        <View className="flex-row flex-wrap">{((products.find(p => p.id === row.product_id)?.type === 'QUANTITY' ? ['DAY'] : ['DAY', 'WEEK', 'MONTH']) as BillingPeriod[]).map(period => <Choice key={period} label={{ DAY: 'Dia', WEEK: 'Semana', MONTH: 'Mês' }[period]} selected={row.billing_period === period} onPress={() => changeRow(index, { billing_period: period })} />)}</View>
        <Field label="Preço unitário" numeric value={row.unit_price} onChange={v => changeRow(index, { unit_price: v })} />
        {!id && products.find(p => p.id === row.product_id)?.type === 'QUANTITY' ? <Field label="Quantidade inicial" numeric value={row.initial_quantity} onChange={v => changeRow(index, { initial_quantity: v })} /> : null}
        {!id ? <Button label="Remover item" onPress={() => setRows(current => current.filter((_, i) => i !== index))} /> : <Text className="text-slate-500">Quantidades físicas são alteradas pela retirada/devolução.</Text>}
      </View>)}
      {!id ? <><Field label="Buscar produto para adicionar" value={searchProduct} onChange={setSearchProduct} />{products.filter(p => p.active && !rows.some(r => r.product_id === p.id) && searchProduct && p.name.toLowerCase().includes(searchProduct.toLowerCase())).slice(0, 20).map(p => <Choice key={p.id} label={p.name} selected={false} onPress={() => { setRows(current => [...current, { product_id: p.id, billing_period: 'DAY', unit_price: p.default_price ?? '', initial_quantity: '0' }]); setSearchProduct(''); }} />)}<Field label="Quantidade de fretes iniciais" numeric value={freightQuantity} onChange={setFreightQuantity} /><Field label="Valor unitário do frete" numeric value={freightPrice} onChange={setFreightPrice} /></> : null}
      {!id ? <ContractPhotoPicker photos={photos} onChange={setPhotos} disabled={busy} /> : null}
      <Field label="Observações" multiline value={notes} onChange={setNotes} /><Button label="Revisar" onPress={prepare} disabled={!client || !products.length} />
    </>}
    {selectingClient ? <ClientPicker onClose={() => setSelectingClient(false)} onSelect={c => { setSelectedClient(c); setClient(c.id); setSelectingClient(false); }} /> : null}
  </FormScreen>;
}
