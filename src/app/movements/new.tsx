import { router, type Href, useFocusEffect } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/BackButton';
import { ErrorText } from '@/components/ui/OperationalForm';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/use-theme';
import { getContracts } from '@/services/contracts';
import { errorMessage } from '@/services/resources';
import type { Contract } from '@/types/contract';

export default function NewMovementContractPicker() {
  const responsive = useResponsive();
  const theme = useTheme();
  const numColumns = responsive.isTablet && responsive.isLandscape ? 2 : 1;
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const response = await getContracts(); setContracts(response.data); }
    catch (loadError) { setError(errorMessage(loadError)); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visibleContracts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contracts
      .filter(contract => !['FINALIZED', 'CANCELLED'].includes(contract.status))
      .filter(contract => !term || contract.client.name.toLowerCase().includes(term) || String(contract.number).includes(term) || (contract.worksite_address ?? '').toLowerCase().includes(term));
  }, [contracts, search]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <FlatList
        key={`movement-contracts-${numColumns}`}
        data={loading || error ? [] : visibleContracts}
        numColumns={numColumns}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerClassName="px-5 pb-12 pt-4"
        contentContainerStyle={{ alignSelf: 'center', width: '100%', maxWidth: responsive.isWideTablet ? 1180 : responsive.isTablet ? 860 : undefined }}
        columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={<View><BackButton onPress={() => router.back()} /><Text className="text-3xl font-bold text-slate-950 dark:text-white">Nova movimentação</Text><Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Selecione um contrato ativo</Text><View className="my-5 flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"><Search size={20} color={theme.iconSecondary} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar cliente, contrato ou endereço" placeholderTextColor={theme.disabled} className="flex-1 text-base font-medium text-slate-950 dark:text-white" /></View><ErrorText message={error} />{loading ? <ActivityIndicator /> : null}</View>}
        renderItem={({ item }) => <View className={numColumns > 1 ? 'flex-1' : 'w-full'}><Pressable onPress={() => router.push({ pathname: '/contracts/[id]/movement', params: { id: item.id } } as Href)} className="rounded-3xl border border-slate-200 bg-white p-4 active:opacity-80 dark:border-slate-800 dark:bg-slate-900"><Text className="font-bold text-slate-950 dark:text-white">{item.client.name}</Text><Text className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-300">Contrato #{item.number}</Text>{item.worksite_address ? <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.worksite_address}</Text> : null}</Pressable></View>}
        ListEmptyComponent={!loading && !error ? <Text className="text-slate-500">Nenhum contrato ativo encontrado.</Text> : null}
      />
    </SafeAreaView>
  );
}
