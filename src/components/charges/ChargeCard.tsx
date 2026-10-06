import { CalendarClock, CreditCard, FileText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { FinancialSummary } from '@/components/ui/FinancialSummary';
import type { Charge, ChargeStatus } from '@/types/charge';
import { formatDate } from '@/utils/formatDate';

const labels: Record<ChargeStatus, string> = { PENDING: 'Pendente', PARTIAL: 'Pendente · parcial', PAID: 'Quitado', UNAVAILABLE: 'Indisponível' };
const styles: Record<ChargeStatus, string> = {
  PENDING: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  UNAVAILABLE: 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300',
};
export function ChargeCard({ charge, onViewContract, onReceive }: { charge: Charge; onViewContract: () => void; onReceive: () => void }) {
  const color = charge.days_overdue > 0 ? '#D97706' : '#2563EB';
  const canReceive = ['PENDING', 'PARTIAL'].includes(charge.financial_status) && !['FINALIZED', 'CANCELLED'].includes(charge.contract_status);
  return <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <View className="flex-row items-start justify-between gap-3"><View className="flex-1"><Text className="text-lg font-bold text-slate-950 dark:text-white">{charge.client}</Text><Text className="mt-1 text-sm font-semibold text-slate-500">Contrato #{charge.contract_id}</Text></View><View className={`rounded-full border px-3 py-1 ${styles[charge.financial_status]}`}><Text className={`text-xs font-bold ${styles[charge.financial_status]}`}>{labels[charge.financial_status]}</Text></View></View>
    <View className="mt-4 flex-row items-center gap-2"><CalendarClock size={16} color={color} /><Text className="flex-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Cobrança: {formatDate(charge.next_charge_date)}{charge.days_overdue > 0 ? ` · ${charge.days_overdue} dias em atraso` : charge.due_today ? ' · Hoje' : ''}</Text></View>
    <View className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950"><FinancialSummary summary={charge} compact /></View>
    <View className="mt-4 flex-row gap-3"><Pressable onPress={onViewContract} className="flex-1"><View className="min-h-11 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 px-2 py-3 dark:border-slate-800"><FileText size={16} color="#2563EB" /><Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Ver cobrança</Text></View></Pressable>{canReceive ? <Pressable onPress={onReceive} className="flex-1"><View className="min-h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 px-2 py-3"><CreditCard size={16} color="#FFFFFF" /><Text className="text-sm font-bold text-white">Receber</Text></View></Pressable> : null}</View>
  </View>;
}
