import { type Href, router } from 'expo-router';
import { Plus, Search, X } from 'lucide-react-native';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useClientSearch } from '@/hooks/use-client-search';
import { useResponsive } from '@/hooks/useResponsive';
import type { Client } from '@/types/client';

export default function ClientsScreen() {
    const { clients, loading, loadingMore, error, search, setSearch, refresh, loadMore, retry, total } = useClientSearch();
    const responsive = useResponsive();
    const numColumns = responsive.isTablet && responsive.isLandscape ? 2 : 1;

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <FlatList
                key={`clients-${numColumns}`}
                data={loading ? [] : clients}
                numColumns={numColumns}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
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
                            {search ? <Pressable accessibilityLabel="Limpar busca" onPress={() => setSearch('')} hitSlop={10}><X size={18} color="#64748B" /></Pressable> : null}
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
                                <Pressable onPress={retry} className="mt-3 self-start">
                                    <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">Tentar novamente</Text>
                                </Pressable>
                            </View>
                        ) : null}

                        {!loading && !error ? (
                            <View className="mb-3 mt-5 flex-row items-center justify-between">
                                <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Lista de clientes</Text>
                                <Text className="text-xs text-slate-400 dark:text-slate-500">
                                    {total} {total === 1 ? 'resultado' : 'resultados'}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                }
                renderItem={({ item }) =>
                    !loading ? (
                        <View className={numColumns > 1 ? 'flex-1' : 'w-full'}>
                            <ClientCard client={item} onPress={() => router.push({ pathname: '/clients/[id]', params: { id: item.id } } as Href)} />
                        </View>
                    ) : null
                }
                ListFooterComponent={loadingMore ? <ActivityIndicator className="my-4" /> : null}
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
            </KeyboardAvoidingView>
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
