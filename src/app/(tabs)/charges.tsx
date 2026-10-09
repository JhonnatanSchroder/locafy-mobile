import { router, type Href, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Choice, ErrorText } from '@/components/ui/OperationalForm';
import { ChargeCard } from '@/components/charges/ChargeCard';
import { useResponsive } from '@/hooks/useResponsive';
import { getCharges, type ChargeFilter } from '@/services/charges';
import { errorMessage } from '@/services/resources';
import type { Charge } from '@/types/charge';
import { subscribeFinancialUpdates } from '@/services/financialUpdates';

export default function ChargesScreen() {
  const { contract_id } = useLocalSearchParams<{ contract_id?: string }>();
  const responsive = useResponsive();
  const columns = responsive.isTablet && responsive.isLandscape ? 2 : 1;
  const [filter, setFilter] = useState<ChargeFilter>(contract_id ? 'all' : 'today');
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const version = ++generation.current;
    try { const result = await getCharges(filter, contract_id); if (version === generation.current) setCharges(result); }
    catch (e) { if (version === generation.current) setError(errorMessage(e)); }
    finally { if (version === generation.current) setLoading(false); }
  }, [filter, contract_id]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current += 1; }; }, [load]));
  useEffect(() => subscribeFinancialUpdates(() => { void load(); }), [load]);
  return <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950"><FlatList key={`charges-${columns}`} numColumns={columns} contentContainerClassName="px-5 pt-4 pb-12" contentContainerStyle={{ alignSelf: 'center', width: '100%', maxWidth: responsive.isWideTablet ? 1180 : responsive.isTablet ? 860 : undefined }} columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined} data={loading || error ? [] : charges} keyExtractor={c => String(c.id)} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} ItemSeparatorComponent={() => <View className="h-3" />} ListHeaderComponent={<><Text className="text-3xl font-bold text-slate-950 dark:text-white">Cobranças</Text><View className="my-4 flex-row flex-wrap">{([{ value: 'today', label: 'Hoje' }, { value: 'overdue', label: 'Atrasadas' }, { value: 'upcoming', label: 'Próximas' }, { value: 'all', label: 'Todas' }] as { value: ChargeFilter; label: string }[]).map(f => <Choice key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />)}</View><ErrorText message={error} />{error ? <Button label="Tentar novamente" onPress={load} /> : null}{loading ? <ActivityIndicator /> : null}</>} ListEmptyComponent={!loading && !error ? <Text className="text-slate-500">Nenhuma cobrança nesta fila.</Text> : null} renderItem={({ item }) => <View className="flex-1"><ChargeCard charge={item} onViewContract={() => router.push(`/charges/${item.id}` as Href)} onReceive={() => router.push({ pathname: '/charges/[id]', params: { id: item.id, payment: 'true' } } as Href)} /></View>} /></SafeAreaView>;
}
