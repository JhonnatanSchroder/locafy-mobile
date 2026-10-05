import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';

import { getContracts } from '@/services/contracts';

import type {
    Contract,
    ContractStatus,
} from '@/types/contract';

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
    {
        label: 'Todos',
        value: 'ALL',
    },
    {
        label: 'Ativos',
        value: 'ACTIVE',
    },
    {
        label: 'Devolvidos',
        value: 'RETURNED',
    },
    {
        label: 'Finalizados',
        value: 'FINALIZED',
    },
    {
        label: 'Cancelados',
        value: 'CANCELLED',
    },
];

function formatCurrency(value: string | null | undefined) {
    if (value === null || value === undefined) {
        return '—';
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return '—';
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(number);
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('pt-BR');
}

function getStatusStyle(status: ContractStatus) {
    switch (status) {
        case 'ACTIVE':
            return {
                label: 'Ativo',
                container: 'bg-emerald-500/10',
                text: 'text-emerald-400',
            };

        case 'RETURNED':
            return {
                label: 'Devolvido',
                container: 'bg-blue-500/10',
                text: 'text-blue-400',
            };

        case 'FINALIZED':
            return {
                label: 'Finalizado',
                container: 'bg-slate-500/10',
                text: 'text-slate-300',
            };

        case 'CANCELLED':
            return {
                label: 'Cancelado',
                container: 'bg-red-500/10',
                text: 'text-red-400',
            };

        default:
            return {
                label: status,
                container: 'bg-slate-500/10',
                text: 'text-slate-300',
            };
    }
}

function ContractCard({
    contract,
    onPress,
}: {
    contract: Contract;
    onPress: () => void;
}) {
    const status = getStatusStyle(contract.status);

    const currentItems = contract.items.filter(
        (item) =>
            item.current_quantity !== null &&
            item.current_quantity !== undefined &&
            item.current_quantity > 0,
    );

    return (
        <Pressable
            onPress={onPress}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 active:opacity-80"
        >
            <View className="mb-3 flex-row items-start justify-between gap-3">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-50">
                        Contrato #{contract.number}
                    </Text>

                    <Text
                        className="mt-1 text-sm text-slate-400"
                        numberOfLines={1}
                    >
                        {contract.client?.name ?? 'Cliente não informado'}
                    </Text>
                </View>

                <View
                    className={`rounded-full px-3 py-1 ${status.container}`}
                >
                    <Text
                        className={`text-xs font-semibold ${status.text}`}
                    >
                        {contract.status_label ?? status.label}
                    </Text>
                </View>
            </View>

            <View className="mb-4 rounded-xl bg-slate-950/60 p-3">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Itens atuais
                </Text>

                {currentItems.length > 0 ? (
                    <View className="gap-1.5">
                        {currentItems.map((item) => (
                            <View
                                key={item.id}
                                className="flex-row items-center justify-between gap-3"
                            >
                                <Text
                                    className="flex-1 text-sm text-slate-200"
                                    numberOfLines={1}
                                >
                                    {item.product.name}
                                </Text>

                                <Text className="text-sm font-semibold text-slate-50">
                                    {item.current_quantity}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text className="text-sm text-slate-500">
                        Nenhum item atualmente fora
                    </Text>
                )}
            </View>

            <View className="flex-row gap-3">
                <View className="flex-1">
                    <Text className="text-xs text-slate-500">
                        Início
                    </Text>

                    <Text className="mt-1 text-sm font-medium text-slate-200">
                        {formatDate(contract.started_at)}
                    </Text>
                </View>

                <View className="flex-1">
                    <Text className="text-xs text-slate-500">
                        Próxima cobrança
                    </Text>

                    <Text className="mt-1 text-sm font-medium text-slate-200">
                        {formatDate(contract.next_charge_date)}
                    </Text>
                </View>
            </View>

            <View className="mt-4 border-t border-slate-800 pt-3">
                <Text className="text-xs text-slate-500">
                    Valor acumulado
                </Text>

                {contract.calculation_complete ? (
                    <Text className="mt-1 text-xl font-bold text-slate-50">
                        {formatCurrency(contract.rental_total)}
                    </Text>
                ) : (
                    <>
                        <Text className="mt-1 text-lg font-semibold text-slate-400">
                            —
                        </Text>

                        <Text className="mt-1 text-xs text-amber-400">
                            Cálculo ainda não disponível para todos os itens
                        </Text>
                    </>
                )}

                {contract.calculated_until && (
                    <Text className="mt-1 text-xs text-slate-500">
                        Calculado até{' '}
                        {formatDate(contract.calculated_until)}
                    </Text>
                )}
            </View>
        </Pressable>
    );
}

export default function ContractsScreen() {
    const router = useRouter();

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
            } catch (err) {
                console.error('Erro ao carregar contratos:', err);

                setError(
                    'Não foi possível carregar os contratos.',
                );
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

    const handleRefresh = () => {
        setRefreshing(true);
        loadContracts(false);
    };

    const filteredContracts = useMemo(() => {
        const normalizedSearch = search
            .trim()
            .toLowerCase();

        return contracts.filter((contract) => {
            const matchesStatus =
                filter === 'ALL' ||
                contract.status === filter;

            if (!matchesStatus) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const contractNumber =
                String(contract.number);

            const clientName =
                contract.client?.name
                    ?.toLowerCase() ?? '';

            return (
                contractNumber.includes(
                    normalizedSearch,
                ) ||
                clientName.includes(
                    normalizedSearch,
                )
            );
        });
    }, [contracts, filter, search]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-950">
                <ActivityIndicator size="large" />

                <Text className="mt-4 text-sm text-slate-400">
                    Carregando contratos...
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <View className="px-4 pb-3 pt-4">
                <Text className="text-2xl font-bold text-slate-50">
                    Contratos
                </Text>

                <Text className="mt-1 text-sm text-slate-400">
                    Acompanhe as locações em andamento
                </Text>
            </View>

            <View className="px-4">
                <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-900 px-3">
                    <Search
                        size={18}
                        color="#94A3B8"
                    />

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Buscar cliente ou contrato"
                        placeholderTextColor="#64748B"
                        className="ml-2 flex-1 py-3 text-slate-50"
                    />
                </View>
            </View>

            <FlatList
                horizontal
                data={filters}
                keyExtractor={(item) => item.value}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 px-4 py-4"
                renderItem={({ item }) => {
                    const active =
                        filter === item.value;

                    return (
                        <Pressable
                            onPress={() =>
                                setFilter(item.value)
                            }
                            className={
                                active
                                    ? 'rounded-full bg-blue-600 px-4 py-2'
                                    : 'rounded-full border border-slate-800 bg-slate-900 px-4 py-2'
                            }
                        >
                            <Text
                                className={
                                    active
                                        ? 'text-sm font-semibold text-white'
                                        : 'text-sm font-medium text-slate-400'
                                }
                            >
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                }}
            />

            {error ? (
                <View className="mx-4 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <Text className="font-medium text-red-400">
                        {error}
                    </Text>

                    <Pressable
                        onPress={() =>
                            loadContracts()
                        }
                        className="mt-3 self-start rounded-lg bg-red-500/10 px-3 py-2"
                    >
                        <Text className="text-sm font-semibold text-red-400">
                            Tentar novamente
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            <FlatList
                data={filteredContracts}
                keyExtractor={(item) =>
                    String(item.id)
                }
                renderItem={({ item }) => (
                    <ContractCard
                        contract={item}
                        onPress={() =>
                            router.push(
                                `/contracts/${item.id}`,
                            )
                        }
                    />
                )}
                contentContainerClassName="px-4 pb-28"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
                ListEmptyComponent={
                    <View className="items-center py-16">
                        <Text className="text-base font-semibold text-slate-300">
                            Nenhum contrato encontrado
                        </Text>

                        <Text className="mt-2 text-center text-sm text-slate-500">
                            {search ||
                            filter !== 'ALL'
                                ? 'Tente alterar a busca ou os filtros.'
                                : 'Os contratos cadastrados no Locafy aparecerão aqui.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
