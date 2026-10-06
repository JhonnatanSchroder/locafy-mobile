import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { ClientForm } from '@/components/clients/ClientForm';
import { Button, ErrorText } from '@/components/ui/OperationalForm';
import { useClientSearch } from '@/hooks/use-client-search';
import { createClient } from '@/services/clients';
import { ApiError, type ApiValidationErrors } from '@/services/api';
import { errorMessage } from '@/services/resources';
import type { Client, ClientPayload } from '@/types/client';

export function ClientPicker({ onSelect, onClose }: { onSelect: (client: Client) => void; onClose: () => void }) {
  const search = useClientSearch();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ApiValidationErrors>();
  const submitting = useRef(false);
  const input = useRef<TextInput>(null);
  const closed = useRef(false);
  function close() { if (!submitting.current) { closed.current = true; onClose(); } }
  function select(client: Client) { if (!closed.current) { closed.current = true; onSelect(client); } }
  function back() { if (submitting.current) return; if (creating) setCreating(false); else close(); }
  async function save(payload: ClientPayload) {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(null); setValidationErrors(undefined);
    try { select(await createClient(payload)); }
    catch (e) { setError(errorMessage(e)); if (e instanceof ApiError) setValidationErrors(e.errors); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Modal visible animationType="slide" onRequestClose={back} onShow={() => input.current?.focus()}>
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="border-b border-slate-200 px-5 pb-4 pt-2 dark:border-slate-800">
          <Pressable disabled={busy} onPress={back} className="mb-3 self-start py-2"><Text className="font-bold text-blue-600">‹ {creating ? 'Voltar à busca' : 'Voltar ao contrato'}</Text></Pressable>
          <Text className="text-2xl font-bold text-slate-950 dark:text-white">{creating ? 'Novo cliente' : 'Selecionar cliente'}</Text>
        </View>
        {creating ? <><View className="px-5"><ErrorText message={error} /></View><ClientForm submitLabel="Cadastrar e selecionar" submitting={busy} validationErrors={validationErrors} onSubmit={save} /></> : <>
          <View className="px-5 pt-4">
            <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
              <Search size={20} color="#64748B" />
              <TextInput ref={input} autoFocus accessibilityLabel="Buscar cliente por nome, telefone ou documento" value={search.search} onChangeText={search.setSearch} autoCapitalize="none" autoCorrect={false} placeholder="Nome, telefone ou CPF/CNPJ" placeholderTextColor="#64748B" className="min-h-12 flex-1 py-3 text-base text-slate-950 dark:text-white" />
              {search.search ? <Pressable accessibilityLabel="Limpar busca" hitSlop={10} onPress={() => { search.setSearch(''); input.current?.focus(); }}><X size={18} color="#64748B" /></Pressable> : null}
            </View>
            <Button label="+ Novo cliente" onPress={() => setCreating(true)} />
            {search.loading ? <View className="flex-row items-center gap-2 py-2"><ActivityIndicator size="small" /><Text className="text-sm text-slate-500">Buscando clientes...</Text></View> : <Text className="py-2 text-sm text-slate-500">{search.total} resultados</Text>}
          </View>
          <FlatList data={search.loading ? [] : search.clients} keyExtractor={client => String(client.id)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerClassName="px-5 pb-5" refreshControl={<RefreshControl refreshing={search.loading} onRefresh={search.refresh} />} onEndReached={search.loadMore} onEndReachedThreshold={0.4} ItemSeparatorComponent={() => <View className="h-3" />} renderItem={({ item }) => <Pressable onPress={() => select(item)} accessibilityRole="button" className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><Text className="text-lg font-bold text-slate-950 dark:text-white">{item.name}</Text><Text className="mt-1 text-sm text-slate-500">{item.phone || 'Telefone não informado'}</Text>{item.document ? <Text className="mt-1 text-sm text-slate-500">{item.type === 'COMPANY' ? 'CNPJ' : 'CPF'} {item.document}</Text> : null}</Pressable>} ListEmptyComponent={!search.loading && !search.error ? <View className="py-8"><Text className="text-center font-semibold text-slate-700 dark:text-slate-200">Nenhum cliente encontrado</Text><Text className="mt-2 text-center text-slate-500">Tente outro termo ou cadastre um novo cliente.</Text></View> : null} ListFooterComponent={<><ErrorText message={search.error} />{search.error ? <Button label="Tentar novamente" onPress={search.retry} /> : null}{search.loadingMore ? <ActivityIndicator className="my-4" /> : null}</>} />
        </>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
