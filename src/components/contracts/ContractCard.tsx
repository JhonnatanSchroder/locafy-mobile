import {
  CalendarDays,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { MoneyValue } from '@/components/ui/MoneyValue';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Contract } from '@/types/contract';
import {
  getDayDifference,
  getRelativeDateLabel,
} from '@/utils/dateStatus';
import { formatDate } from '@/utils/formatDate';

export function ContractCard({
  contract,
  onPress,
}: {
  contract: Contract;
  onPress: () => void;
}) {
  const chargeDays = contract.next_charge_date
    ? getDayDifference(contract.next_charge_date)
    : null;

  const chargeClassName =
    chargeDays === null
      ? 'text-slate-500 dark:text-slate-400'
      : chargeDays === 0
        ? 'text-blue-600 dark:text-blue-400'
        : chargeDays < 0
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-slate-600 dark:text-slate-300';

  const currentItems = contract.items.filter(
    (item) => (item.current_quantity ?? 0) > 0,
  );

  const itemsSummary =
    currentItems.length > 0
      ? currentItems
          .map(
            (item) =>
              `${item.current_quantity} ${item.product.name}`,
          )
          .join(' · ')
      : 'Nenhum item atualmente fora';

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
    >
      <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Contrato #{contract.number}
            </Text>

            <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
              {contract.client.name}
            </Text>
          </View>

          <StatusBadge status={contract.status} balance={contract.balance} financial_balance={contract.financial_balance} can_finalize={contract.can_finalize} display_status_label={contract.display_status_label} />
        </View>

        <Text
          numberOfLines={2}
          className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {itemsSummary}
        </Text>

        <View className="mt-4 gap-2">
          <View className="flex-row items-center gap-2">
            <CalendarDays size={15} color="#64748B" />

            <Text
              className={`text-sm font-medium ${chargeClassName}`}
            >
              {getRelativeDateLabel(
                contract.next_charge_date,
              )}

              {contract.next_charge_date
                ? ` · ${formatDate(
                    contract.next_charge_date,
                  )}`
                : ''}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <MapPin size={15} color="#64748B" />

            <Text
              numberOfLines={1}
              className="flex-1 text-sm text-slate-500 dark:text-slate-400"
            >
              {contract.worksite_address ||
                'Endereço não informado'}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <View>
            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Valor acumulado
            </Text>

            {contract.calculation_complete &&
            contract.total_accrued != null ? (
              <MoneyValue
                value={Number(contract.total_accrued)}
              />
            ) : (
              <Text className="mt-1 text-base font-semibold text-slate-500">
                —
              </Text>
            )}
          </View>

          <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <ChevronRight
              size={19}
              color="#2563EB"
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
