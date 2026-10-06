import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Button, ErrorText, Field, FormScreen } from '@/components/ui/OperationalForm';
import { getContract, refreshContractOperations } from '@/services/contracts';
import { contractPresentation } from '@/utils/contractStatus';
import { createFreight, updateFreight } from '@/services/freights';
import { errorMessage } from '@/services/resources';
import { dateTimeInput, decimalInput, integerInput, localDateTime } from '@/utils/formValues';

export default function FreightScreen() {
  const { id, freight_id } = useLocalSearchParams<{ id: string; freight_id?: string }>();
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(localDateTime());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    getContract(id).then(r => {
      if (!active) return;
      if (contractPresentation(r.data).closed) throw new Error('Contrato encerrado.');
      if (!freight_id) { setReady(true); return; }
      const freight = r.data.freights?.find(f => String(f.id) === freight_id);
      if (!freight) throw new Error('Frete não encontrado.');
      setQuantity(String(freight.quantity)); setPrice(freight.unit_amount); setDate(freight.occurred_at ? localDateTime(new Date(freight.occurred_at)) : localDateTime()); setNotes(freight.notes ?? ''); setReady(true);
    }).catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, freight_id]);
  async function save() {
    if (busy || !ready) return;
    setBusy(true); setError(null);
    try {
      if (!saved) {
        const input = { quantity: integerInput(quantity), unit_amount: decimalInput(price), occurred_at: dateTimeInput(date), notes: notes.trim() || null };
        if (freight_id) await updateFreight(Number(id), Number(freight_id), input); else await createFreight(Number(id), input);
        setSaved(true);
      }
      await refreshContractOperations(id);
      router.back();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <FormScreen title={freight_id ? 'Editar frete' : 'Novo frete'}><ErrorText message={error} />{loading ? <ActivityIndicator /> : <><Field label="Quantidade de fretes" value={quantity} onChange={setQuantity} numeric /><Field label="Valor unitário" value={price} onChange={setPrice} numeric /><Field label="Data/hora (AAAA-MM-DD HH:mm)" value={date} onChange={setDate} /><Field label="Observações" value={notes} onChange={setNotes} multiline /><Button label={saved ? "Frete salvo - Atualizar contrato" : "Salvar frete"} onPress={save} busy={busy} disabled={!ready} /></>}</FormScreen>;
}
