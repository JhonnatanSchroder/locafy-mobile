import { useCallback, useRef, useState } from 'react';
import { router, type Href, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Linking, Text, View } from 'react-native';
import { MessageCircle, Phone, UserRound } from 'lucide-react-native';
import { Button, ErrorText, FormScreen } from '@/components/ui/OperationalForm';
import { FinancialSummary } from '@/components/ui/FinancialSummary';
import { PaymentModal } from '@/components/charges/PaymentModal';
import { getCharge } from '@/services/charges';
import { refreshPaymentContext } from '@/services/payments';
import { errorMessage } from '@/services/resources';
import type { Charge } from '@/types/charge';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTimeBR } from '@/utils/formatDate';
import { getPhoneUrl, getWhatsAppUrl } from '@/utils/clientContact';
import { ClientAction } from '@/components/ui/ClientAction';

export default function ChargeDetail() {
  const { id, payment } = useLocalSearchParams<{ id: string; payment?: string }>();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(payment === 'true');
  const generation = useRef(0);
  const load = useCallback(async () => {
    const version = ++generation.current;
    setLoading(true); setError(null);
    try { const response = await getCharge(id); if (version === generation.current) setCharge(response); }
    catch (e) { if (version === generation.current) setError(errorMessage(e)); }
    finally { if (version === generation.current) setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current += 1; }; }, [load]));
  async function afterPayment() {
    if (!charge) return;
    const version = ++generation.current;
    setLoading(true); setError(null);
    try { const updated = await refreshPaymentContext(charge.contract_id); if (version === generation.current) setCharge(updated); }
    catch (e) { if (version === generation.current) setError(`Pagamento registrado. ${errorMessage(e)}`); }
    finally { if (version === generation.current) setLoading(false); }
  }
  const canReceive = charge && ['PENDING', 'PARTIAL'].includes(charge.financial_status) && !['FINALIZED', 'CANCELLED'].includes(charge.contract_status);
  async function openExternal(url: string | null, label: string) {
    if (!url) { Alert.alert('Telefone inválido', 'O telefone do cliente não possui um formato válido.'); return; }
    try { await Linking.openURL(url); } catch { Alert.alert(`Não foi possível abrir ${label}`); }
  }
  return <><FormScreen title="Detalhe da cobrança"><ErrorText message={error} />{error ? <Button label="Atualizar dados" onPress={load} /> : null}{loading ? <ActivityIndicator /> : charge && !error ? <>
    <Text className="mb-2 text-xl font-bold text-slate-950 dark:text-white">{charge.client_contact?.name ?? charge.client}</Text>
    <Text className="mb-4 text-slate-500">Contrato #{charge.contract_id} · Cobrança {formatDate(charge.next_charge_date)}</Text>
    <View className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><Text className="text-lg font-bold text-slate-950 dark:text-white">Contato do cliente</Text><Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{charge.client_contact?.phone ?? 'Telefone não cadastrado'}</Text><View className="mt-4 flex-row gap-2">{charge.client_contact?.phone ? <><ClientAction label="WhatsApp" icon={MessageCircle} onPress={() => { void openExternal(getWhatsAppUrl(charge.client_contact?.phone), 'o WhatsApp'); }} /><ClientAction label="Ligar" icon={Phone} onPress={() => { void openExternal(getPhoneUrl(charge.client_contact?.phone), 'o telefone'); }} /></> : null}<ClientAction label="Ver cliente" icon={UserRound} onPress={() => { const clientId = charge.client_contact?.id ?? charge.client_id; if (clientId) router.push(`/clients/${clientId}` as Href); else Alert.alert('Cliente indisponível', 'Não foi possível identificar o cliente desta cobrança.'); }} /></View></View>
    <Text className="mb-4 font-bold text-blue-600">{{ PENDING: 'Pendente', PARTIAL: 'Pendente · pagamento parcial', PAID: 'Quitado', UNAVAILABLE: 'Cálculo indisponível' }[charge.financial_status]}</Text>
    <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><FinancialSummary summary={charge} /></View>
    <Text className="my-3 text-slate-500">Intervalo entre cobranças: {charge.charge_interval_days} dias</Text>
    {charge.notes ? <Text className="my-3 text-slate-500">{charge.notes}</Text> : null}
    <Button label="Ver contrato" onPress={() => router.push(`/contracts/${charge.contract_id}` as Href)} />
    {canReceive ? <Button label="Registrar pagamento" onPress={() => setReceiving(true)} /> : null}
    <Text className="mb-3 mt-5 text-lg font-bold text-slate-950 dark:text-white">Pagamentos</Text>
    {charge.payments?.length ? charge.payments.map(p => <View key={p.id} className="mb-3 rounded-3xl bg-white p-4 dark:bg-slate-900"><Text className="font-bold text-slate-950 dark:text-white">Valor recebido: {formatCurrency(Number(p.amount))} · {p.method}</Text>{Number(p.discount_amount ?? 0) > 0 ? <Text className="mt-1 font-semibold text-slate-700 dark:text-slate-200">Desconto: {formatCurrency(Number(p.discount_amount))}</Text> : null}<Text className="mt-1 font-semibold text-blue-600 dark:text-blue-300">Total abatido: {formatCurrency(Number(p.settled_amount ?? p.amount))}</Text><Text className="mt-2 text-slate-500">{formatDateTimeBR(p.paid_at)}</Text>{p.notes ? <Text className="mt-1 text-slate-500">{p.notes}</Text> : null}</View>) : <Text className="text-slate-500">Nenhum pagamento registrado.</Text>}
  </> : null}</FormScreen>{receiving && charge && !loading && !error && canReceive ? <PaymentModal key={charge.id} visible charge={charge} onClose={() => setReceiving(false)} onConfirm={afterPayment} /> : null}</>;
}
