import { CalendarClock, ChevronRight, CreditCard, MessageCircle } from 'lucide-react-native';
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
export function ChargeCard({ charge, onViewContract, onReceive, onWhatsApp }: { charge: Charge; onViewContract: () => void; onReceive: () => void; onWhatsApp: () => void }) {
  const color = charge.days_overdue > 0 ? '#D97706' : '#2563EB';
  const canReceive = ['PENDING', 'PARTIAL'].includes(charge.financial_status) && !['FINALIZED', 'CANCELLED'].includes(charge.contract_status);
  return <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <View className="flex-row items-start justify-between gap-3"><View className="flex-1"><Text className="text-lg font-bold text-slate-950 dark:text-white">{charge.client}</Text><Text className="mt-1 text-sm font-semibold text-slate-500">Contrato #{charge.contract_id}</Text></View><View className={`rounded-full border px-3 py-1 ${styles[charge.financial_status]}`}><Text className={`text-xs font-bold ${styles[charge.financial_status]}`}>{labels[charge.financial_status]}</Text></View></View>
    <View className="mt-4 flex-row items-center gap-2"><CalendarClock size={16} color={color} /><Text className="flex-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Cobrança: {formatDate(charge.next_charge_date)}{charge.days_overdue > 0 ? ` · ${charge.days_overdue} dias em atraso` : charge.due_today ? ' · Hoje' : ''}</Text></View>
    <View className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950"><FinancialSummary summary={charge} compact /></View>
    <Pressable onPress={onViewContract} className="mt-4 flex-row items-center self-start gap-1 px-1 py-1 active:opacity-70"><Text className="text-sm font-bold text-blue-600 dark:text-blue-300">Ver cobrança</Text><ChevronRight size={16} color="#2563EB" /></Pressable>
    {charge.client_contact?.phone || canReceive ? <View className="mt-3 flex-row gap-3">{charge.client_contact?.phone ? <Pressable accessibilityLabel="Abrir WhatsApp" onPress={onWhatsApp} className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 active:opacity-80 dark:border-emerald-900 dark:bg-emerald-950/40"><MessageCircle size={18} color="#059669" /><Text numberOfLines={1} className="text-sm font-bold text-emerald-700 dark:text-emerald-300">WhatsApp</Text></Pressable> : null}{canReceive ? <Pressable onPress={onReceive} className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-3 active:opacity-80"><CreditCard size={18} color="#FFFFFF" /><Text numberOfLines={1} className="text-sm font-bold text-white">Receber</Text></Pressable> : null}</View> : null}
  </View>;
}
