import { AlertCircle, CalendarClock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChargeCard } from '@/components/charges/ChargeCard';
import { PaymentModal } from '@/components/charges/PaymentModal';
import { charges } from '@/mocks/charges';
import { contracts } from '@/mocks/contracts';
import type { Charge } from '@/types/charge';
import { getDayDifference } from '@/utils/dateStatus';

type ChargeFilter = 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'ALL';

const filters: { label: string; value: ChargeFilter }[] = [
  { label: 'Hoje', value: 'TODAY' },
  { label: 'Atrasadas', value: 'OVERDUE' },
  { label: 'Próximas', value: 'UPCOMING' },
  { label: 'Todas', value: 'ALL' },
];

export default function ChargesScreen() {
  const [filter, setFilter] = useState<ChargeFilter>('TODAY');
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

  const grouped = useMemo(() => {
    return charges.reduce(
      (acc, charge) => {
        const days = getDayDifference(charge.dueDate);

        if (days === 0) acc.today.push(charge);
        if (days < 0 && charge.status !== 'PAID' && charge.status !== 'CANCELLED') acc.overdue.push(charge);
        if (days > 0) acc.upcoming.push(charge);

        return acc;
      },
      { today: [] as Charge[], overdue: [] as Charge[], upcoming: [] as Charge[] },
    );
  }, []);

  const visibleCharges = useMemo(() => {
    if (filter === 'TODAY') return grouped.today;
    if (filter === 'OVERDUE') return grouped.overdue;
    if (filter === 'UPCOMING') return grouped.upcoming;

    return charges;
  }, [filter, grouped]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-slate-950 dark:text-white">Cobranças</Text>
        <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Acompanhe valores previstos e pendências.</Text>

        <View className="mt-5 flex-row gap-3">
          <SummaryCard label="Para hoje" value={grouped.today.length} icon="today" />
          <SummaryCard label="Em atraso" value={grouped.overdue.length} icon="overdue" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-5">
          <View className="flex-row gap-2 pr-5">
            {filters.map((item) => {
              const isActive = filter === item.value;
              return (
                <Pressable key={item.value} onPress={() => setFilter(item.value)}>
                  <View className={isActive ? 'rounded-full bg-blue-600 px-4 py-2' : 'rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900'}>
                    <Text className={isActive ? 'text-sm font-bold text-white' : 'text-sm font-bold text-slate-600 dark:text-slate-300'}>{item.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="mt-5 gap-4">
          {visibleCharges.map((charge) => {
            const contract = contracts.find((item) => item.id === charge.contractId);

            return (
              <ChargeCard
                key={charge.id}
                charge={charge}
                contract={contract}
                onViewContract={() =>
                  Alert.alert(
                    'Cobrança mockada',
                    'Esta fila ainda não está integrada ao backend de cobranças.',
                  )
                }
                onReceive={() => setSelectedCharge(charge)}
              />
            );
          })}

          {visibleCharges.length === 0 ? (
            <View className="items-center rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Text className="text-base font-bold text-slate-950 dark:text-white">Nada nesta fila</Text>
              <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">Troque o filtro para ver outras cobranças mockadas.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <PaymentModal
        key={selectedCharge?.id ?? 'empty-charge'}
        charge={selectedCharge}
        contract={selectedCharge ? contracts.find((item) => item.id === selectedCharge.contractId) : undefined}
        visible={selectedCharge !== null}
        onClose={() => setSelectedCharge(null)}
        onConfirm={() => setSelectedCharge(null)}
      />
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: 'today' | 'overdue' }) {
  const Icon = icon === 'today' ? CalendarClock : AlertCircle;
  const color = icon === 'today' ? '#2563EB' : '#D97706';
  const iconClass = icon === 'today' ? 'bg-blue-50 dark:bg-blue-950' : 'bg-amber-50 dark:bg-amber-950/60';

  return (
    <View className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className={`mb-3 h-10 w-10 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon size={20} color={color} />
      </View>
      <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</Text>
      <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">{value === 1 ? 'cobrança' : 'cobranças'}</Text>
    </View>
  );
}
