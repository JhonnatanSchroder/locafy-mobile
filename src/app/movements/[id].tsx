import { router, type Href, useLocalSearchParams } from 'expo-router';
import { CalendarDays, FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/BackButton';
import { InfoRow } from '@/components/ui/InfoRow';
import { SectionCard } from '@/components/ui/SectionCard';
import { useTheme } from '@/hooks/use-theme';
import { getMovement } from '@/services/movements';
import { errorMessage } from '@/services/resources';
import type { Movement, MovementType } from '@/types/movement';
import { formatDateTimeBR } from '@/utils/formatDate';

export default function MovementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMovement(id)
      .then(response => { if (active) setMovement(response.data); })
      .catch(loadError => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950"><ActivityIndicator /><Text className="mt-3 text-slate-500">Carregando movimentação...</Text></SafeAreaView>;
  if (error || !movement) return <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-5 dark:bg-slate-950"><Text className="text-xl font-bold text-slate-950 dark:text-white">Movimentação não encontrada</Text><Text className="mt-2 text-center text-slate-500">{error}</Text><BackButton onPress={() => router.back()} /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-5 pt-4 dark:bg-slate-950">
      <BackButton onPress={() => router.back()} />
      <SectionCard>
        <Text className="text-xs font-bold uppercase text-blue-600 dark:text-blue-300">{movementTypeLabel(movement.type)}</Text>
        <Text className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{movement.contract?.client?.name ?? 'Cliente não informado'}</Text>
        <View className="mt-4 flex-row items-center gap-2">
          <CalendarDays size={17} color={theme.iconSecondary} />
          <Text className="font-semibold text-slate-600 dark:text-slate-300">{formatDateTimeBR(movement.occurred_at)}</Text>
        </View>
      </SectionCard>

      <SectionCard className="mt-5">
        <InfoRow label="Tipo" value={movementTypeLabel(movement.type)} />
        <InfoRow label="Contrato" value={movement.contract ? `#${movement.contract.number}` : null} />
        <InfoRow label="Cliente" value={movement.contract?.client?.name} />
        <InfoRow label="Observação" value={movement.notes} />
      </SectionCard>

      <SectionCard className="mt-5">
        <Text className="mb-3 text-base font-bold text-slate-950 dark:text-white">Itens</Text>
        {movement.items.map(item => <Text key={item.id} className="mb-2 text-slate-700 dark:text-slate-200">{item.quantity}x {item.product?.name ?? 'Item do contrato'}{item.equipment?.name ? ` · ${item.equipment.name}` : ''}</Text>)}
      </SectionCard>

      {movement.contract ? <Pressable onPress={() => router.push(`/contracts/${movement.contract!.id}` as Href)} className="mt-5 active:opacity-80"><View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600"><FileText size={17} color={theme.onPrimary} /><Text className="font-bold text-white">Ver contrato</Text></View></Pressable> : null}
    </SafeAreaView>
  );
}

function movementTypeLabel(type: MovementType) {
  return type === 'WITHDRAWAL' ? 'Retirada' : 'Devolução';
}
