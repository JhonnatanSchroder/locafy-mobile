import { Text, View } from 'react-native';
import { formatCurrency } from '@/utils/formatCurrency';

type Summary = {
  rental_total?: string | null;
  freight_total?: string | null;
  total_accrued?: string | null;
  total_paid?: string | null;
  total_discount?: string | null;
  balance?: string | null;
  financial_balance?: string | null;
};
export function FinancialSummary({ summary, compact = false }: { summary: Summary; compact?: boolean }) {
  const balance = summary.financial_balance ?? summary.balance;
  const rows = [...(compact ? [] : [{ label: 'Locação', value: summary.rental_total }, { label: 'Fretes', value: summary.freight_total }]), { label: 'Total acumulado', value: summary.total_accrued }, { label: 'Pago', value: summary.total_paid }, { label: 'Descontos', value: summary.total_discount }];
  return <View>{rows.map(row => <View key={row.label} className="flex-row items-center justify-between gap-3 py-2"><Text className="text-sm text-slate-500 dark:text-slate-400">{row.label}</Text><Text className="font-semibold text-slate-950 dark:text-white">{row.value == null ? '—' : formatCurrency(Number(row.value))}</Text></View>)}<View className="mt-2 flex-row items-center justify-between gap-3 rounded-2xl bg-blue-50 p-3 dark:bg-blue-950"><Text className="font-bold text-blue-600 dark:text-blue-300">Saldo</Text><Text className="text-2xl font-bold text-blue-600 dark:text-blue-300">{balance == null ? '—' : formatCurrency(Number(balance))}</Text></View></View>;
}
