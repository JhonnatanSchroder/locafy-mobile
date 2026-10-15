import { router, type Href, useFocusEffect } from 'expo-router';
import { CalendarDays, Plus, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/components/ui/DateFields';
import { BackButton } from '@/components/ui/BackButton';
import { Choice, ErrorText } from '@/components/ui/OperationalForm';
import { SectionCard } from '@/components/ui/SectionCard';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/services/resources';
import { listMovements } from '@/services/movements';
import type { Movement, MovementType } from '@/types/movement';
import { dateToApiDate, formatDateTimeBR } from '@/utils/formatDate';

type FilterType = 'ALL' | MovementType;

const typeFilters: { label: string; value: FilterType }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Retiradas', value: 'WITHDRAWAL' },
  { label: 'Devoluções', value: 'RETURN' },
];

export default function MovementsScreen() {
  const responsive = useResponsive();
  const theme = useTheme();
  const numColumns = responsive.isTablet && responsive.isLandscape ? 2 : 1;
  const [movements, setMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState<FilterType>('ALL');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const generation = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadPage = useCallback(async (nextPage = 1, mode: 'replace' | 'append' | 'refresh' = 'replace') => {
    const version = ++generation.current;
    if (mode === 'append') setLoadingMore(true);
    else if (mode === 'replace') setLoading(true);
    setError(null);

    try {
      const response = await listMovements({
        page: nextPage,
        search: debouncedSearch,
        type,
        date_from: dateFrom ? dateToApiDate(dateFrom) : null,
        date_to: dateTo ? dateToApiDate(dateTo) : null,
      });

      if (version !== generation.current) return;
      setMovements(current => mode === 'append' ? [...current, ...response.data] : response.data);
      setPage(response.meta.current_page);
      setLastPage(response.meta.last_page);
    } catch (loadError) {
      if (version === generation.current) setError(errorMessage(loadError) || 'Não foi possível carregar as movimentações.');
    } finally {
      if (version === generation.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, [dateFrom, dateTo, debouncedSearch, type]);

  useFocusEffect(
    useCallback(() => {
      void loadPage(1, 'replace');
    }, [loadPage]),
  );

  function refresh() {
    setRefreshing(true);
    void loadPage(1, 'refresh');
  }

  function loadMore() {
    if (loading || loadingMore || page >= lastPage) return;
    void loadPage(page + 1, 'append');
  }

  const hasFilters = !!debouncedSearch || type !== 'ALL' || !!dateFrom || !!dateTo;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <FlatList
        key={`movements-${numColumns}`}
        data={loading || error ? [] : movements}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-28 pt-4"
        contentContainerStyle={{
          alignSelf: 'center',
          width: '100%',
          maxWidth: responsive.isWideTablet ? 1180 : responsive.isTablet ? 860 : undefined,
        }}
        columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View>
            <BackButton onPress={() => router.back()} />
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-slate-950 dark:text-white">Movimentações</Text>
                <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Histórico operacional da locadora</Text>
              </View>
              <Pressable onPress={() => router.push('/movements/new' as Href)} className="active:opacity-80">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
                  <Plus size={20} color={theme.onPrimary} />
                </View>
              </Pressable>
            </View>

            <View className="mt-5 flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <Search size={20} color={theme.iconSecondary} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Buscar cliente, contrato ou item" placeholderTextColor={theme.disabled} className="flex-1 text-base font-medium text-slate-950 dark:text-white" />
              {search ? <Pressable accessibilityLabel="Limpar busca" onPress={() => setSearch('')} hitSlop={10}><X size={18} color={theme.iconSecondary} /></Pressable> : null}
            </View>

            <View className="my-4 flex-row flex-wrap gap-2">
              {typeFilters.map(filter => <Choice key={filter.value} label={filter.label} selected={type === filter.value} onPress={() => setType(filter.value)} />)}
            </View>

            <View className={responsive.isTablet ? 'flex-row gap-3' : ''}>
              <View className={responsive.isTablet ? 'flex-1' : ''}><DateField label="Data inicial" value={dateFrom} onChange={setDateFrom} /></View>
              <View className={responsive.isTablet ? 'flex-1' : ''}><DateField label="Data final" value={dateTo} onChange={setDateTo} /></View>
            </View>
            {(dateFrom || dateTo) ? <Pressable onPress={() => { setDateFrom(null); setDateTo(null); }} className="mb-3 self-start"><Text className="font-bold text-blue-600 dark:text-blue-300">Limpar período</Text></Pressable> : null}

            <ErrorText message={error ? 'Não foi possível carregar as movimentações.' : null} />
            {loading ? <View className="items-center py-10"><ActivityIndicator /><Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Carregando movimentações...</Text></View> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View className={numColumns > 1 ? 'flex-1' : 'w-full'}>
            <MovementCard movement={item} onPress={() => router.push(`/movements/${item.id}` as Href)} />
          </View>
        )}
        ListEmptyComponent={!loading && !error ? <EmptyMovements filtered={hasFilters} /> : null}
        ListFooterComponent={loadingMore ? <ActivityIndicator className="my-4" /> : null}
      />
    </SafeAreaView>
  );
}

function MovementCard({ movement, onPress }: { movement: Movement; onPress: () => void }) {
  const theme = useTheme();
  const badgeClass = movement.type === 'WITHDRAWAL'
    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';

  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <SectionCard>
        <View className={`self-start rounded-full border px-3 py-1 ${badgeClass}`}>
          <Text className={`text-xs font-bold uppercase ${badgeClass}`}>{movement.type_label ?? movementTypeLabel(movement.type)}</Text>
        </View>
        <Text className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{movement.contract?.client?.name ?? 'Cliente não informado'}</Text>
        <Text className="mt-1 text-sm font-semibold text-slate-500">Contrato #{movement.contract?.number ?? movement.contract?.id ?? '—'}</Text>
        <View className="mt-3 flex-row items-center gap-2">
          <CalendarDays size={16} color={theme.iconSecondary} />
          <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">{formatDateTimeBR(movement.occurred_at)}</Text>
        </View>
        <View className="mt-3 gap-1">
          {movement.items.map(item => <Text key={item.id} className="text-sm text-slate-700 dark:text-slate-200">{item.quantity}x {item.product?.name ?? 'Item do contrato'}{item.equipment?.name ? ` · ${item.equipment.name}` : ''}</Text>)}
        </View>
        {movement.notes ? <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400" numberOfLines={2}>{movement.notes}</Text> : null}
      </SectionCard>
    </Pressable>
  );
}

function EmptyMovements({ filtered }: { filtered: boolean }) {
  return (
    <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 dark:border-slate-800 dark:bg-slate-900">
      <Text className="text-center text-base font-semibold text-slate-800 dark:text-slate-200">
        {filtered ? 'Nenhuma movimentação encontrada para estes filtros.' : 'Nenhuma movimentação registrada.'}
      </Text>
    </View>
  );
}

function movementTypeLabel(type: MovementType) {
  return type === 'WITHDRAWAL' ? 'Retirada' : 'Devolução';
}
