import { type Href, router } from 'expo-router';
import { Banknote, CalendarClock, FilePlus2, FileText, HandCoins, PackagePlus, WalletCards } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttentionCard } from '@/components/dashboard/AttentionCard';
import { QuickAction } from '@/components/dashboard/QuickAction';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { attentionItems, contracts, dashboardSummary } from '@/mocks/contracts';
import { formatCurrency } from '@/utils/formatCurrency';

export default function DashboardScreen() {
  const activeContracts = contracts.filter((contract) => contract.status === 'ATIVO').slice(0, 2);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <View className="rounded-[28px] bg-blue-600 p-4">
          <Text className="text-sm font-semibold uppercase tracking-wide text-blue-100">Locafy</Text>
          <Text className="mt-1 text-3xl font-bold text-white">Boa tarde, Alex</Text>
          <Text className="mt-1 text-base text-blue-100">Resumo operacional das locações de hoje.</Text>
        </View>

        <View className="mt-5 flex-row flex-wrap justify-between gap-y-4">
          <StatCard title="Contratos ativos" value={String(dashboardSummary.activeContracts)} caption="em locação" icon={FileText} />
          <StatCard title="Cobranças hoje" value={String(dashboardSummary.chargesToday)} caption="previstas" icon={CalendarClock} />
          <StatCard title="Recebido hoje" value={formatCurrency(dashboardSummary.receivedToday)} caption="entradas do dia" icon={HandCoins} />
          <StatCard title="Recebido no mês" value={formatCurrency(dashboardSummary.receivedMonth)} caption="até agora" icon={WalletCards} />
        </View>

        <View className="mt-7">
          <SectionHeader title="Precisa de atenção" />
          <AttentionCard items={attentionItems} />
        </View>

        <View className="mt-7">
          <SectionHeader title="Ações rápidas" />
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <QuickAction label="Novo contrato" icon={FilePlus2} />
            <QuickAction label="Registrar pagamento" icon={Banknote} />
            <QuickAction label="Nova retirada" icon={PackagePlus} />
            <QuickAction label="Ver cobranças" icon={CalendarClock} onPress={() => router.push('/charges' as Href)} />
          </View>
        </View>

        <View className="mt-7">
          <SectionHeader title="Contratos recentes" action="Ver todos" />
          <View className="gap-3">
            {activeContracts.map((contract) => (
              <View key={contract.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">#{contract.number}</Text>
                <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{contract.clientName}</Text>
                <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">{contract.itemsSummary}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
