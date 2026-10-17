import { useCallback, useEffect, useState } from 'react';
import { router, type Href, useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter, X } from 'lucide-react-native';
import { useAuth } from '@/auth/AuthProvider';
import { AuditCard } from '@/components/audits/AuditCard';
import { Button, ErrorText } from '@/components/ui/OperationalForm';
import { useTheme } from '@/hooks/use-theme';
import { getAudits } from '@/services/audits';
import { errorMessage } from '@/services/resources';
import type { Audit, AuditFilters } from '@/types/audit';

export default function AuditsScreen() {
  const { user, loading: authLoading } = useAuth();
  const theme = useTheme();
  const [filters, setFilters] = useState<AuditFilters>({});
  const [draft, setDraft] = useState<AuditFilters>({});
  const [audits, setAudits] = useState<Audit[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { if (!authLoading && user?.role !== 'ADMIN') router.replace('/' as Href); }, [authLoading, user?.role]);
  const load = useCallback(async (nextPage = 1, replace = true) => {
    if (nextPage > 1) setLoadingMore(true); else setLoading(true);
    setError(null);
    try { const response = await getAudits(filters, nextPage); setAudits(current => replace ? response.data : [...current, ...response.data]); setPage(response.meta.current_page); setLastPage(response.meta.last_page); }
    catch (caught) { setError(errorMessage(caught)); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [filters]);
  useFocusEffect(useCallback(() => { if (!authLoading && user?.role === 'ADMIN') void load(); }, [authLoading, load, user?.role]));
  function applyFilters() { setFilters(draft); setShowFilters(false); }
  function clearFilters() { setDraft({}); setFilters({}); setShowFilters(false); }
  const field = (key: keyof AuditFilters, placeholder: string, keyboardType?: 'numeric') => <TextInput placeholder={placeholder} placeholderTextColor={theme.disabled} keyboardType={keyboardType} value={draft[key] ?? ''} onChangeText={value => setDraft(current => ({ ...current, [key]: value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 dark:border-slate-700 dark:text-white" />;
  return <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950"><FlatList data={loading ? [] : audits} keyExtractor={item => String(item.id)} contentContainerClassName="px-5 pb-12 pt-4" ItemSeparatorComponent={() => <View className="h-3" />} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load()} />} onEndReached={() => { if (!loadingMore && page < lastPage) void load(page + 1, false); }} onEndReachedThreshold={0.4} ListHeaderComponent={<View><View className="flex-row items-start justify-between gap-3"><View className="flex-1"><Text className="text-3xl font-bold text-slate-950 dark:text-white">Auditoria</Text><Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Histórico operacional da empresa.</Text></View><Pressable accessibilityLabel="Filtros" onPress={() => setShowFilters(value => !value)} className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Filter size={19} color={theme.primary} /></Pressable></View>{showFilters ? <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><View className="flex-row items-center justify-between"><Text className="text-base font-bold text-slate-950 dark:text-white">Filtrar eventos</Text><Pressable onPress={() => setShowFilters(false)}><X size={19} color={theme.iconSecondary} /></Pressable></View><View className="mt-3 gap-3">{field('from', 'De (AAAA-MM-DD)')}{field('to', 'Até (AAAA-MM-DD)')}{field('module', 'Módulo')}{field('operation', 'Operação')}{field('entity_type', 'Tipo de entidade')}{field('entity_id', 'ID da entidade', 'numeric')}{field('user_id', 'ID do usuário', 'numeric')}<View className="flex-row gap-3"><Button label="Aplicar" onPress={applyFilters} /><Pressable onPress={clearFilters} className="flex-1 items-center justify-center"><Text className="font-bold text-slate-500">Limpar</Text></Pressable></View></View></View> : null}<ErrorText message={error} />{error ? <Button label="Tentar novamente" onPress={() => load()} /> : null}{loading ? <ActivityIndicator className="mt-4" /> : null}{!loading && !error && !audits.length ? <Text className="mt-5 text-center text-slate-500">Nenhum evento encontrado.</Text> : null}</View>} renderItem={({ item }) => <AuditCard audit={item} onPress={() => router.push(`/audits/${item.id}` as Href)} />} ListFooterComponent={loadingMore ? <ActivityIndicator className="mt-4" /> : null} /></SafeAreaView>;
}
