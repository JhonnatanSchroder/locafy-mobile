import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ScrollText } from 'lucide-react-native';
import { useAuth } from '@/auth/AuthProvider';
import { BackButton } from '@/components/ui/BackButton';
import { InfoRow } from '@/components/ui/InfoRow';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button, ErrorText } from '@/components/ui/OperationalForm';
import { getAudit } from '@/services/audits';
import { errorMessage } from '@/services/resources';
import type { AuditDetail } from '@/types/audit';
import { formatDateTimeBR } from '@/utils/formatDate';

function label(value: string | null | undefined) { return value ? value.replaceAll('_', ' ') : '—'; }
function formatValue(value: unknown, field: string): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([key, nested]) => `${key.replaceAll('_', ' ')}: ${formatValue(nested, key)}`).join(' · ');
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (/(amount|balance|price|total|discount|value)/i.test(field) && (typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)))) return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  if (/(date|_at)$/i.test(field) && typeof value === 'string') return formatDateTimeBR(value);
  return typeof value === 'string' ? value.replaceAll('_', ' ') : String(value);
}

export default function AuditDetailScreen() {
  const { user, loading: authLoading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setAudit(await getAudit(id)); } catch (caught) { setError(errorMessage(caught)); } finally { setLoading(false); } }, [id]);
  useEffect(() => { if (!authLoading && user?.role !== 'ADMIN') router.replace('/' as never); }, [authLoading, user?.role]);
  useFocusEffect(useCallback(() => { if (!authLoading && user?.role === 'ADMIN') void load(); }, [authLoading, load, user?.role]));
  const fields = audit ? [...new Set([...Object.keys(audit.before_state ?? {}), ...Object.keys(audit.after_state ?? {})])] : [];

  return <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="px-5 pb-12 pt-4"><BackButton onPress={() => router.back()} /><Text className="mt-4 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">Evento #{id}</Text><Text className="mt-1 text-3xl font-bold capitalize text-slate-950 dark:text-white">{label(audit?.operation)}</Text>{loading ? <ActivityIndicator className="mt-8" /> : error ? <View className="mt-5"><ErrorText message={error} /><Button label="Tentar novamente" onPress={load} /></View> : audit ? <><Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">{label(audit.entity_type)} #{audit.entity_id} · {formatDateTimeBR(audit.created_at)}</Text><SectionCard className="mt-5"><InfoRow label="Operação" value={label(audit.operation)} /><InfoRow label="Módulo" value={audit.module ?? '—'} /><InfoRow label="Entidade" value={`${audit.entity_type} #${audit.entity_id}`} /><InfoRow label="Responsável" value={audit.user ?? 'Sistema'} /><InfoRow label="Origem" value={audit.source ?? '—'} /></SectionCard>{audit.reason ? <SectionCard className="mt-4"><Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivo</Text><Text className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{audit.reason}</Text></SectionCard> : null}<SectionCard className="mt-4"><View className="flex-row items-center gap-2"><ScrollText size={18} color="#2563EB" /><Text className="text-lg font-bold text-slate-950 dark:text-white">Campos alterados</Text></View>{fields.length ? <View className="mt-4 gap-3">{fields.map(field => <View key={field} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950"><Text className="font-bold text-slate-950 dark:text-white">{field.replaceAll('_', ' ')}</Text><Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">Antes: {formatValue(audit.before_state?.[field], field)}</Text><Text className="mt-1 text-sm text-slate-700 dark:text-slate-200">Depois: {formatValue(audit.after_state?.[field], field)}</Text></View>)}</View> : <Text className="mt-4 text-sm text-slate-500">Este evento não possui comparação de campos.</Text>}</SectionCard></> : null}</ScrollView>;
}
