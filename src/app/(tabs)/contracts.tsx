import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Search, X } from 'lucide-react-native';

import { ContractCard } from '@/components/contracts/ContractCard';
import { useResponsive } from '@/hooks/useResponsive';
import { getContracts } from '@/services/contracts';
import type { Contract } from '@/types/contract';

type Filter =
  | 'ALL'
  | 'ACTIVE'
  | 'RETURNED'
  | 'FINALIZED'
  | 'CANCELLED';

const filters: {
  label: string;
  value: Filter;
}[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Ativos', value: 'ACTIVE' },
  { label: 'Devolvidos', value: 'RETURNED' },
  { label: 'Finalizados', value: 'FINALIZED' },
  { label: 'Cancelados', value: 'CANCELLED' },
];

export default function ContractsScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const numColumns = responsive.isTablet && responsive.isLandscape ? 2 : 1;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const loadContracts = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        const response = await getContracts();

        setContracts(response.data);
      } catch (error) {
        console.error('Erro ao carregar contratos:', error);

        setError('Não foi possível carregar os contratos.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadContracts();
    }, [loadContracts]),
  );

  const filteredContracts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return contracts.filter((contract) => {
      const matchesFilter =
        filter === 'ALL' || contract.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      const clientName =
        contract.client?.name?.toLowerCase() ?? '';

      return (
        String(contract.number).includes(term) ||
        clientName.includes(term)
      );
    });
  }, [contracts, filter, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadContracts(false);
  };

  const activeContracts = contracts.filter(
    (contract) => contract.status === 'ACTIVE',
  ).length;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <FlatList
        key={`contracts-${numColumns}`}
        data={filteredContracts}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerClassName="px-4 pb-28"
        contentContainerStyle={{
          alignSelf: 'center',
          width: '100%',
          maxWidth: responsive.isWideTablet ? 1180 : responsive.isTablet ? 860 : undefined,
        }}
        columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
        ItemSeparatorComponent={() => (
          <View className="h-3" />
        )}
        ListHeaderComponent={
          <View>
            {/* Cabeçalho */}
            <View className="pb-5 pt-3">
              <View className="flex-row items-end justify-between">
                <View>
                  <Text className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Contratos
                  </Text>

                  <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Acompanhe suas locações
                  </Text>
                </View>

                {!loading && (
                  <View className="items-end">
                    <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {activeContracts}
                    </Text>

                    <Text className="text-xs text-slate-400 dark:text-slate-500">
                      ativos
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Busca */}
            <Pressable onPress={() => router.push('/contracts/new' as Href)} className="mb-4 self-start rounded-2xl bg-blue-600 px-4 py-3"><Text className="font-bold text-white">Novo contrato</Text></Pressable>
            <View className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
              <Search
                size={17}
                strokeWidth={2}
                color="#64748B"
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar cliente ou contrato"
                placeholderTextColor="#64748B"
                className="ml-2 flex-1 py-3 text-sm text-slate-950 dark:text-white"
              />

              {search.length > 0 && (
                <Pressable
                  onPress={() => setSearch('')}
                  hitSlop={10}
                  className="h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
                >
                  <X
                    size={14}
                    color="#64748B"
                  />
                </Pressable>
              )}
            </View>

            {/* Filtros */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-4"
              contentContainerClassName="gap-2 px-4 pb-5"
            >
              {filters.map((item) => {
                const active = filter === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilter(item.value)}
                    className={
                      active
                        ? 'rounded-full bg-blue-600 px-4 py-2'
                        : 'rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'text-sm font-semibold text-white'
                          : 'text-sm font-medium text-slate-600 dark:text-slate-300'
                      }
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Loading */}
            {loading && (
              <View className="items-center py-10">
                <ActivityIndicator />

                <Text className="mt-3 text-sm text-slate-400">
                  Carregando contratos...
                </Text>
              </View>
            )}

            {/* Erro */}
            {!loading && error && (
              <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                <Text className="text-sm font-medium text-red-600 dark:text-red-400">
                  {error}
                </Text>

                <Pressable
                  onPress={() => loadContracts()}
                  className="mt-3 self-start"
                >
                  <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Tentar novamente
                  </Text>
                </Pressable>
              </View>
            )}

            {!loading && !error && (
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {filter === 'ALL'
                    ? 'Todos os contratos'
                    : filters.find(
                        (item) => item.value === filter,
                      )?.label}
                </Text>

                <Text className="text-xs text-slate-400 dark:text-slate-500">
                  {filteredContracts.length}{' '}
                  {filteredContracts.length === 1
                    ? 'resultado'
                    : 'resultados'}
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) =>
          !loading && !error ? (
            <View className={numColumns > 1 ? 'flex-1' : 'w-full'}>
              <ContractCard
                contract={item}
                onPress={() =>
                  router.push(`/contracts/${item.id}`)
                }
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 dark:border-slate-800 dark:bg-slate-900">
              <Text className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Nenhum contrato encontrado
              </Text>

              <Text className="mt-2 text-center text-sm leading-5 text-slate-500 dark:text-slate-400">
                {search
                  ? 'Tente buscar por outro cliente ou número de contrato.'
                  : filter !== 'ALL'
                    ? 'Não há contratos nesse status.'
                    : 'Os contratos cadastrados aparecerão aqui.'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
