import { type Href, router } from 'expo-router';
import { Banknote, CalendarClock, FilePlus2, FileText, PackagePlus, WalletCards } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttentionCard } from '@/components/dashboard/AttentionCard';
import { QuickAction } from '@/components/dashboard/QuickAction';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { getContracts } from '@/services/contracts';
import type { Contract } from '@/types/contract';

export default function DashboardScreen() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getContracts();
      setContracts(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Não foi possível carregar o resumo operacional.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContracts();
    }, [loadContracts]),
  );

  const summary = useMemo(() => {
    const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE');
    const returnedContracts = contracts.filter((contract) => contract.status === 'RETURNED');
    const rentedItems = activeContracts.reduce((total, contract) => {
      return total + contract.items.reduce((itemsTotal, item) => itemsTotal + (item.current_quantity ?? 0), 0);
    }, 0);

    return {
      activeContracts,
      returnedContracts,
      rentedItems,
    };
  }, [contracts]);

  const recentContracts = summary.activeContracts.slice(0, 2);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <View className="rounded-[28px] bg-blue-600 p-4">
          <Text className="text-sm font-semibold uppercase tracking-wide text-blue-100">Locafy</Text>
          <Text className="mt-1 text-3xl font-bold text-white">Boa tarde, Alex</Text>
          <Text className="mt-1 text-base text-blue-100">Resumo operacional das locações de hoje.</Text>
        </View>

        <View className="mt-5 flex-row flex-wrap justify-between gap-y-4">
          <StatCard title="Contratos ativos" value={String(summary.activeContracts.length)} caption="em locação" icon={FileText} />
          <StatCard title="Devolvidos" value={String(summary.returnedContracts.length)} caption="aguardam revisão" icon={CalendarClock} />
          <StatCard title="Itens alugados" value={String(summary.rentedItems)} caption="quantidade atual" icon={PackagePlus} />
          <StatCard title="Cobranças" value="Pendente" caption="backend futuro" icon={WalletCards} />
        </View>

        {loading ? (
          <View className="mt-7 items-center rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <ActivityIndicator />
            <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Carregando resumo...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View className="mt-7 rounded-3xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40">
            <Text className="text-sm font-medium text-red-600 dark:text-red-300">{error}</Text>
            <Pressable onPress={loadContracts} className="mt-3 self-start">
              <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && summary.returnedContracts.length > 0 ? (
          <View className="mt-7">
            <SectionHeader title="Precisa de atenção" />
            <AttentionCard items={[`${summary.returnedContracts.length} contratos devolvidos para revisar`]} />
          </View>
        ) : null}

        <View className="mt-7">
          <SectionHeader title="Ações rápidas" />
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <QuickAction label="Novo contrato" icon={FilePlus2} />
            <QuickAction label="Registrar pagamento" icon={Banknote} />
            <QuickAction label="Nova retirada" icon={PackagePlus} />
            <QuickAction label="Ver cobranças" icon={CalendarClock} onPress={() => router.push('/charges' as Href)} />
          </View>
        </View>

        {!loading && !error ? (
        <View className="mt-7">
          <SectionHeader title="Contratos recentes" action="Ver todos" />
          <View className="gap-3">
            {recentContracts.map((contract) => (
              <View key={contract.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">#{contract.number}</Text>
                <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{contract.client.name}</Text>
                <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {contract.items
                    .filter((item) => (item.current_quantity ?? 0) > 0)
                    .map((item) => `${item.current_quantity} ${item.product.name}`)
                    .join(' · ') || 'Nenhum item atualmente fora'}
                </Text>
              </View>
            ))}
            {recentContracts.length === 0 ? (
              <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum contrato ativo encontrado.</Text>
              </View>
            ) : null}
          </View>
        </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
