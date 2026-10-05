import { CalendarClock, CheckCircle2, Clock3, CreditCard, FileText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { MoneyValue } from '@/components/ui/MoneyValue';
import type { MockContract } from '@/mocks/contracts';
import type { Charge, ChargeStatus } from '@/types/charge';
import { getDayDifference, getRelativeDateLabel } from '@/utils/dateStatus';

const statusLabels: Record<ChargeStatus, string> = {
  PENDING: 'Pendente',
  PARTIAL: 'Parcial',
  PAID: 'Paga',
  CANCELLED: 'Cancelada',
};

const statusStyles: Record<ChargeStatus, string> = {
  PENDING: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

function getTimingStyle(dueDate: string) {
  const days = getDayDifference(dueDate);

  if (days === 0) {
    return { iconColor: '#2563EB', dotClassName: 'bg-blue-500', textClassName: 'text-blue-600 dark:text-blue-300' };
  }

  if (days < 0) {
    return { iconColor: '#D97706', dotClassName: 'bg-amber-500', textClassName: 'text-amber-600 dark:text-amber-300' };
  }

  return { iconColor: '#64748B', dotClassName: 'bg-slate-400', textClassName: 'text-slate-500 dark:text-slate-400' };
}

export function ChargeCard({
  charge,
  contract,
  onViewContract,
  onReceive,
}: {
  charge: Charge;
  contract?: MockContract;
  onViewContract: () => void;
  onReceive: () => void;
}) {
  const timing = getTimingStyle(charge.dueDate);
  const canReceive = charge.status === 'PENDING' || charge.status === 'PARTIAL';

  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-950 dark:text-white">{charge.clientName}</Text>
          <Text className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Contrato {contract ? `#${contract.number}` : charge.contractId}
          </Text>
        </View>
        <View className={`rounded-full border px-3 py-1 ${statusStyles[charge.status]}`}>
          <Text className={`text-xs font-bold ${statusStyles[charge.status]}`}>{statusLabels[charge.status]}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${timing.dotClassName}`} />
        <CalendarClock size={16} color={timing.iconColor} />
        <Text className={`text-sm font-bold ${timing.textClassName}`}>{getRelativeDateLabel(charge.dueDate)}</Text>
      </View>

      <View className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor</Text>
            <MoneyValue value={charge.amount} />
          </View>
          {charge.status === 'PARTIAL' ? (
            <View className="items-end">
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Restante</Text>
              <MoneyValue value={charge.remainingAmount} muted />
            </View>
          ) : null}
        </View>
      </View>

      {charge.observation ? <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">{charge.observation}</Text> : null}

      <View className="mt-4 flex-row gap-3">
        <Pressable onPress={onViewContract} className="flex-1 active:opacity-80">
          <View className="h-11 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <FileText size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Ver contrato</Text>
          </View>
        </Pressable>

        {canReceive ? (
          <Pressable onPress={onReceive} className="flex-1 active:opacity-80">
            <View className="h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600">
              <CreditCard size={16} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">Receber</Text>
            </View>
          </Pressable>
        ) : (
          <View className="flex-1">
            <View className="h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <CheckCircle2 size={16} color="#64748B" />
              <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Sem ação</Text>
            </View>
          </View>
        )}
      </View>

      {charge.status === 'PARTIAL' ? (
        <View className="mt-3 flex-row items-center gap-2">
          <Clock3 size={14} color="#D97706" />
          <Text className="text-xs font-semibold text-amber-600 dark:text-amber-300">Pagamento parcial registrado visualmente</Text>
        </View>
      ) : null}
    </View>
  );
}
