import { Text, View } from 'react-native';

import type { Contract, ContractStatus } from '@/types/contract';
import { contractPresentation } from '@/utils/contractStatus';

const statusStyles: Record<ContractStatus, string> = {
  ACTIVE: 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
  RETURNED: 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300',
  FINALIZED: 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
  CANCELLED: 'bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300',
};

export function StatusBadge(props: Pick<Contract, 'status' | 'balance' | 'financial_balance' | 'can_finalize' | 'display_status_label'>) {
  const { status } = props;
  const presentation = contractPresentation(props);
  return (
    <View className={`rounded-full border px-3 py-1 ${statusStyles[presentation.ready ? 'ACTIVE' : status]}`}>
      <Text className={`text-xs font-bold ${statusStyles[presentation.ready ? 'ACTIVE' : status]}`}>{presentation.label}</Text>
    </View>
  );
}
