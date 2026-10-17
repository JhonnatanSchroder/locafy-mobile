import { ChevronRight, CircleDot, ScrollText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { Audit } from '@/types/audit';
import { formatDateTimeBR } from '@/utils/formatDate';

function label(value: string | null) {
  return value ? value.replaceAll('_', ' ') : '—';
}

export function AuditCard({ audit, onPress }: { audit: Audit; onPress: () => void }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} className="active:opacity-80"><View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><View className="flex-row items-start gap-3"><View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950"><ScrollText size={19} color={theme.primary} /></View><View className="flex-1"><Text className="text-base font-bold capitalize text-slate-950 dark:text-white">{label(audit.operation)}</Text><Text className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{label(audit.entity_type)} #{audit.entity_id}</Text></View><ChevronRight size={19} color={theme.iconSecondary} /></View><View className="mt-4 flex-row flex-wrap gap-x-3 gap-y-2"><View className="flex-row items-center gap-1"><CircleDot size={13} color={theme.iconSecondary} /><Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label(audit.module)}</Text></View><Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label(audit.source)}</Text></View><View className="mt-3 flex-row justify-between gap-3"><Text className="flex-1 text-sm text-slate-600 dark:text-slate-300">{audit.user ?? 'Sistema'}</Text><Text className="text-xs text-slate-500 dark:text-slate-400">{formatDateTimeBR(audit.created_at)}</Text></View></View></Pressable>;
}
