import { type Href, router, useFocusEffect } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getClients } from '@/services/clients';
import type { Client } from '@/types/client';

export default function ClientsScreen() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const loadClients = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            setError(null);
            setClients(await getClients());
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            setError('Não foi possível carregar os clientes.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadClients();
        }, [loadClients]),
    );

    const filteredClients = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
            return clients;
        }

        return clients.filter((client) => {
            return (
                client.name.toLowerCase().includes(term) ||
                (client.phone?.toLowerCase().includes(term) ?? false) ||
                (client.document?.toLowerCase().includes(term) ?? false)
            );
        });
    }, [clients, search]);

    function handleRefresh() {
        setRefreshing(true);
        loadClients(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <FlatList
                data={filteredClients}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                contentContainerClassName="px-5 pb-28 pt-4"
                ItemSeparatorComponent={() => <View className="h-3" />}
                ListHeaderComponent={
                    <View>
                        <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                                <Text className="text-3xl font-bold text-slate-950 dark:text-white">Clientes</Text>
                                <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Gerencie seus clientes</Text>
                            </View>

                            <Pressable onPress={() => router.push('/clients/new' as Href)} className="active:opacity-80">
                                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
                                    <Plus size={20} color="#FFFFFF" />
                                </View>
                            </Pressable>
                        </View>

                        <View className="mt-5 flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                            <Search size={20} color="#64748B" />
                            <TextInput
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Buscar por nome, telefone ou documento"
                                placeholderTextColor="#94A3B8"
                                className="flex-1 text-base font-medium text-slate-950 dark:text-white"
                            />
                        </View>

                        {loading ? (
                            <View className="items-center py-10">
                                <ActivityIndicator />
                                <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Carregando clientes...</Text>
                            </View>
                        ) : null}

                        {!loading && error ? (
                            <View className="my-5 rounded-3xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40">
                                <Text className="text-sm font-medium text-red-600 dark:text-red-300">{error}</Text>
                                <Pressable onPress={() => loadClients()} className="mt-3 self-start">
                                    <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">Tentar novamente</Text>
                                </Pressable>
                            </View>
                        ) : null}

                        {!loading && !error ? (
                            <View className="mb-3 mt-5 flex-row items-center justify-between">
                                <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Lista de clientes</Text>
                                <Text className="text-xs text-slate-400 dark:text-slate-500">
                                    {filteredClients.length} {filteredClients.length === 1 ? 'resultado' : 'resultados'}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                }
                renderItem={({ item }) =>
                    !loading && !error ? (
                        <ClientCard client={item} onPress={() => router.push({ pathname: '/clients/[id]', params: { id: item.id } } as Href)} />
                    ) : null
                }
                ListEmptyComponent={
                    !loading && !error ? (
                        <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 dark:border-slate-800 dark:bg-slate-900">
                            <Text className="text-base font-semibold text-slate-800 dark:text-slate-200">Nenhum cliente encontrado</Text>
                            <Text className="mt-2 text-center text-sm leading-5 text-slate-500 dark:text-slate-400">
                                {search ? 'Tente buscar por outro termo.' : 'Os clientes cadastrados aparecerão aqui.'}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

function ClientCard({ client, onPress }: { client: Client; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} className="active:opacity-80">
            <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">{client.type_label}</Text>
                <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{client.name}</Text>
                <View className="mt-3 gap-1">
                    <Text className="text-sm text-slate-500 dark:text-slate-400">{client.phone ?? 'Telefone não informado'}</Text>
                    {client.document ? <Text className="text-sm text-slate-500 dark:text-slate-400">{client.document}</Text> : null}
                </View>
            </View>
        </Pressable>
    );
}
