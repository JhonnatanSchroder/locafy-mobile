import { router, type Href, useLocalSearchParams } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/BackButton';
import { InfoRow } from '@/components/ui/InfoRow';
import { SectionCard } from '@/components/ui/SectionCard';
import { useTheme } from '@/hooks/use-theme';
import { getPayment } from '@/services/payments';
import { errorMessage } from '@/services/resources';
import type { Payment } from '@/types/payment';
import { formatDateTimeBR } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPayment(id)
      .then(response => { if (active) setPayment(response.data); })
      .catch(loadError => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950"><ActivityIndicator /><Text className="mt-3 text-slate-500">Carregando pagamento...</Text></SafeAreaView>;
  if (error || !payment) return <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-5 dark:bg-slate-950"><Text className="text-xl font-bold text-slate-950 dark:text-white">Pagamento não encontrado</Text><Text className="mt-2 text-center text-slate-500">{error}</Text><BackButton onPress={() => router.back()} /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-5 pt-4 dark:bg-slate-950">
      <BackButton onPress={() => router.back()} />
      <SectionCard>
        <Text className="text-xs font-bold uppercase text-blue-600 dark:text-blue-300">{payment.method}</Text>
        <Text className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{payment.client_name ?? payment.client?.name ?? 'Cliente não informado'}</Text>
        <Text className="mt-2 font-semibold text-slate-600 dark:text-slate-300">{formatDateTimeBR(payment.paid_at)}</Text>
      </SectionCard>

      <SectionCard className="mt-5">
        <InfoRow label="Cliente" value={payment.client_name ?? payment.client?.name} />
        <InfoRow label="Contrato" value={`#${payment.contract?.number ?? payment.contract_id}`} />
        <InfoRow label="Valor recebido" value={formatCurrency(Number(payment.amount))} />
        <InfoRow label="Desconto" value={payment.discount_amount == null ? null : formatCurrency(Number(payment.discount_amount))} />
        <InfoRow label="Valor liquidado" value={payment.settled_amount == null ? null : formatCurrency(Number(payment.settled_amount))} />
        <InfoRow label="Método" value={payment.method} />
        <InfoRow label="Observações" value={payment.notes} />
      </SectionCard>

      {payment.contract ? <Pressable onPress={() => router.push(`/contracts/${payment.contract!.id}` as Href)} className="mt-5 active:opacity-80"><View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600"><FileText size={17} color={theme.onPrimary} /><Text className="font-bold text-white">Ver contrato</Text></View></Pressable> : null}
    </SafeAreaView>
  );
}
