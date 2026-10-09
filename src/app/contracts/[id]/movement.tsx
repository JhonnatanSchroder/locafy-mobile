import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { DateTimeField } from '@/components/ui/DateFields';
import { Button, Choice, ErrorText, Field, FormScreen } from '@/components/ui/OperationalForm';
import { getContract, refreshContractOperations } from '@/services/contracts';
import { contractPresentation } from '@/utils/contractStatus';
import { createMovement } from '@/services/movements';
import { errorMessage } from '@/services/resources';
import type { Contract } from '@/types/contract';
import { integerInput } from '@/utils/formValues';
import { dateToApiDateTime } from '@/utils/formatDate';

export default function MovementScreen() {
  const { id, type: initialType } = useLocalSearchParams<{ id: string; type?: string }>();
  const [type, setType] = useState<'WITHDRAWAL' | 'RETURN'>(initialType === 'RETURN' ? 'RETURN' : 'WITHDRAWAL');
  const [contract, setContract] = useState<Contract | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [date, setDate] = useState(() => new Date());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  useEffect(() => { let active = true; getContract(id).then(r => { if (active) setContract(r.data); }).catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
  async function save() {
    if (!contract || busy || contractPresentation(contract).closed) return;
    setError(null); setBusy(true);
    try {
      if (!saved) {
        const items = contract.items.map(i => ({ contract_item_id: i.id, quantity: integerInput(quantities[i.id] || '0') })).filter(i => i.quantity > 0);
        if (!items.length) throw new Error('Informe a quantidade de pelo menos um item.');
        await createMovement({ contract_id: contract.id, type, occurred_at: dateToApiDateTime(date), notes: notes.trim() || null, items });
        setSaved(true);
      }
      await refreshContractOperations(contract.id);
      router.back();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <FormScreen title="Movimentação"><ErrorText message={error} />{loading ? <ActivityIndicator /> : contract && !contractPresentation(contract).closed ? <><View className="flex-row"><Choice label="Retirada" selected={type === 'WITHDRAWAL'} onPress={() => setType('WITHDRAWAL')} /><Choice label="Devolução" selected={type === 'RETURN'} onPress={() => setType('RETURN')} /></View><DateTimeField label="Data" value={date} onChange={setDate} />{contract.items.map(item => <Field key={item.id} label={`${item.product.name} · Atualmente fora: ${item.current_quantity ?? '—'}`} value={quantities[item.id] ?? ''} numeric onChange={v => setQuantities(current => ({ ...current, [item.id]: v }))} />)}<Field label="Observação" value={notes} onChange={setNotes} multiline /><Button label={saved ? "Movimento salvo - Atualizar contrato" : "Registrar movimenta\u00e7\u00e3o"} onPress={save} busy={busy} /></> : contract ? <ErrorText message="Contrato encerrado." /> : null}</FormScreen>;
}
