import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '@/components/ui/OperationalForm';
import { getProducts } from '@/services/products';
import { getEquipments } from '@/services/equipments';
import { errorMessage } from '@/services/resources';
import type { Equipment, Product } from '@/types/product';
import { formatCurrency } from '@/utils/formatCurrency';

export function CatalogScreen({ equipment = false }: { equipment?: boolean }) {
  const [items, setItems] = useState<(Product | Equipment)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await (equipment ? getEquipments() : getProducts())); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [equipment]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const visible = useMemo(() => items.filter(item => `${item.name} ${item.id}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  return <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950"><FlatList contentContainerClassName="px-5 pt-4 pb-12" data={loading || error ? [] : visible} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} ListHeaderComponent={<><Pressable onPress={() => router.back()} className="mb-4"><Text className="font-bold text-blue-600">‹ Voltar</Text></Pressable><Text className="mb-5 text-2xl font-bold text-slate-950 dark:text-white">{equipment ? 'Equipamentos' : 'Produtos'}</Text><TextInput placeholder="Buscar nome ou identificação" placeholderTextColor="#64748B" value={search} onChangeText={setSearch} className="mb-4 rounded-2xl bg-white p-4 text-slate-950 dark:bg-slate-900 dark:text-white" /><ErrorText message={error} />{error ? <Button label="Tentar novamente" onPress={load} /> : null}{loading ? <ActivityIndicator /> : null}</>} ListEmptyComponent={!loading && !error ? <Text className="text-slate-500">Nenhum resultado.</Text> : null} renderItem={({ item }) => <View className="mb-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><Text className="text-lg font-bold text-slate-950 dark:text-white">{item.name}</Text>{'status' in item ? <><Text className="mt-2 text-slate-500">#{item.id} · {item.status_label}</Text><Text className="mt-1 text-slate-500">{item.product?.name} {item.brand}</Text></> : <><Text className="mt-2 text-slate-500">{item.type_label} · {item.default_price == null ? 'Preço não informado' : formatCurrency(Number(item.default_price))}</Text>{item.stock_total != null ? <Text className="mt-1 text-slate-500">Estoque: {item.stock_total} {item.unit}</Text> : null}</>}</View>} /></SafeAreaView>;
}
