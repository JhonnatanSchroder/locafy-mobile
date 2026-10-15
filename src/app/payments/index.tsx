import { router, type Href, useFocusEffect } from 'expo-router';
import { Plus, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/BackButton';
import { DateField } from '@/components/ui/DateFields';
import { Choice, ErrorText } from '@/components/ui/OperationalForm';
import { SectionCard } from '@/components/ui/SectionCard';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/use-theme';
import { listPayments } from '@/services/payments';
import { errorMessage } from '@/services/resources';
import type { Payment } from '@/types/payment';
import type { PaymentMethod } from '@/types/charge';
import { dateToApiDate, formatDateTimeBR } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';

type MethodFilter = PaymentMethod | 'ALL';

const methodFilters: { label: string; value: MethodFilter }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'PIX', value: 'PIX' },
  { label: 'Dinheiro', value: 'CASH' },
  { label: 'Cartão', value: 'CARD' },
  { label: 'Transferência', value: 'TRANSFER' },
  { label: 'Outro', value: 'OTHER' },
];

export default function PaymentsScreen() {
  const responsive = useResponsive();
  const theme = useTheme();
  const numColumns = responsive.isTablet && responsive.isLandscape ? 2 : 1;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [method, setMethod] = useState<MethodFilter>('ALL');
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
      const response = await listPayments({
        page: nextPage,
        search: debouncedSearch,
        payment_method: method,
        date_from: dateFrom ? dateToApiDate(dateFrom) : null,
        date_to: dateTo ? dateToApiDate(dateTo) : null,
      });

      if (version !== generation.current) return;
      setPayments(current => mode === 'append' ? [...current, ...response.data] : response.data);
      setPage(response.meta.current_page);
      setLastPage(response.meta.last_page);
    } catch (loadError) {
      if (version === generation.current) setError(errorMessage(loadError));
    } finally {
      if (version === generation.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, [dateFrom, dateTo, debouncedSearch, method]);

  useFocusEffect(useCallback(() => { void loadPage(1, 'replace'); }, [loadPage]));

  function refresh() {
    setRefreshing(true);
    void loadPage(1, 'refresh');
  }

  function loadMore() {
    if (loading || loadingMore || page >= lastPage) return;
    void loadPage(page + 1, 'append');
  }

  const hasFilters = !!debouncedSearch || method !== 'ALL' || !!dateFrom || !!dateTo;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <FlatList
        key={`payments-${numColumns}`}
        data={loading || error ? [] : payments}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-28 pt-4"
        contentContainerStyle={{ alignSelf: 'center', width: '100%', maxWidth: responsive.isWideTablet ? 1180 : responsive.isTablet ? 860 : undefined }}
        columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={<View>
          <BackButton onPress={() => router.back()} />
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-slate-950 dark:text-white">Pagamentos</Text>
              <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Recebimentos registrados no Laravel</Text>
            </View>
            <Pressable onPress={() => router.push('/payments/new' as Href)} className="active:opacity-80">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
                <Plus size={20} color={theme.onPrimary} />
              </View>
            </Pressable>
          </View>

          <View className="mt-5 flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Search size={20} color={theme.iconSecondary} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Buscar cliente, contrato ou observação" placeholderTextColor={theme.disabled} className="flex-1 text-base font-medium text-slate-950 dark:text-white" />
            {search ? <Pressable accessibilityLabel="Limpar busca" onPress={() => setSearch('')} hitSlop={10}><X size={18} color={theme.iconSecondary} /></Pressable> : null}
          </View>

          <View className="my-4 flex-row flex-wrap gap-2">
            {methodFilters.map(filter => <Choice key={filter.value} label={filter.label} selected={method === filter.value} onPress={() => setMethod(filter.value)} />)}
          </View>

          <View className={responsive.isTablet ? 'flex-row gap-3' : ''}>
            <View className={responsive.isTablet ? 'flex-1' : ''}><DateField label="Data inicial" value={dateFrom} onChange={setDateFrom} /></View>
            <View className={responsive.isTablet ? 'flex-1' : ''}><DateField label="Data final" value={dateTo} onChange={setDateTo} /></View>
          </View>
          {(dateFrom || dateTo) ? <Pressable onPress={() => { setDateFrom(null); setDateTo(null); }} className="mb-3 self-start"><Text className="font-bold text-blue-600 dark:text-blue-300">Limpar período</Text></Pressable> : null}
          <ErrorText message={error ? 'Não foi possível carregar os pagamentos.' : null} />
          {loading ? <View className="items-center py-10"><ActivityIndicator /><Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Carregando pagamentos...</Text></View> : null}
        </View>}
        renderItem={({ item }) => <View className={numColumns > 1 ? 'flex-1' : 'w-full'}><PaymentCard payment={item} onPress={() => router.push(`/payments/${item.id}` as Href)} /></View>}
        ListEmptyComponent={!loading && !error ? <EmptyPayments filtered={hasFilters} /> : null}
        ListFooterComponent={loadingMore ? <ActivityIndicator className="my-4" /> : null}
      />
    </SafeAreaView>
  );
}

function PaymentCard({ payment, onPress }: { payment: Payment; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <SectionCard>
        <Text className="text-lg font-bold text-slate-950 dark:text-white">{payment.client_name ?? payment.client?.name ?? 'Cliente não informado'}</Text>
        <Text className="mt-1 text-sm font-semibold text-slate-500">Contrato #{payment.contract?.number ?? payment.contract_id}</Text>
        <Text className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">{formatDateTimeBR(payment.paid_at)}</Text>
        <View className="mt-3 gap-1">
          <PaymentRow label="Recebido" value={payment.amount} />
          <PaymentRow label="Desconto" value={payment.discount_amount} />
          <PaymentRow label="Liquidado" value={payment.settled_amount} strong />
        </View>
        <Text className="mt-3 self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{payment.method}</Text>
      </SectionCard>
    </Pressable>
  );
}

function PaymentRow({ label, value, strong = false }: { label: string; value?: string | null; strong?: boolean }) {
  return <View className="flex-row items-center justify-between gap-3"><Text className={strong ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-sm text-slate-500 dark:text-slate-400'}>{label}</Text><Text className={strong ? 'font-bold text-slate-950 dark:text-white' : 'font-semibold text-slate-950 dark:text-white'}>{value == null ? '—' : formatCurrency(Number(value))}</Text></View>;
}

function EmptyPayments({ filtered }: { filtered: boolean }) {
  return <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 dark:border-slate-800 dark:bg-slate-900"><Text className="text-center text-base font-semibold text-slate-800 dark:text-slate-200">{filtered ? 'Nenhum pagamento encontrado para estes filtros.' : 'Nenhum pagamento registrado.'}</Text></View>;
}
