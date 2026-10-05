import { type Href, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientForm } from '@/components/clients/ClientForm';
import { ApiError, type ApiValidationErrors } from '@/services/api';
import { getClient, updateClient } from '@/services/clients';
import type { Client, ClientPayload } from '@/types/client';

export default function EditClientScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<ApiValidationErrors | undefined>();

    useEffect(() => {
        async function loadClient() {
            if (!id) {
                setError('Cliente inválido.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                setClient(await getClient(id));
            } catch (error) {
                console.error('Erro ao carregar cliente:', error);
                setError('Não foi possível carregar este cliente.');
            } finally {
                setLoading(false);
            }
        }

        loadClient();
    }, [id]);

    async function handleSubmit(input: ClientPayload) {
        if (!id) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            setValidationErrors(undefined);

            const updatedClient = await updateClient(id, input);

            router.replace({ pathname: '/clients/[id]', params: { id: updatedClient.id } } as Href);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);

            if (error instanceof ApiError) {
                setValidationErrors(error.errors);
                setError(error.message);
                return;
            }

            setError('Não foi possível atualizar o cliente.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <ActivityIndicator />
                <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Carregando cliente...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="px-5 pt-4">
                <Pressable onPress={() => router.back()} className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-900">
                    <ArrowLeft size={22} color="#2563EB" />
                </Pressable>
                <Text className="text-3xl font-bold text-slate-950 dark:text-white">Editar cliente</Text>
                <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Atualize os dados principais do cliente.</Text>
                {error ? <Text className="mt-3 text-sm font-medium text-red-500">{error}</Text> : null}
            </View>

            {client ? (
                <ClientForm client={client} submitLabel="Salvar alterações" submitting={submitting} validationErrors={validationErrors} onSubmit={handleSubmit} />
            ) : (
                <View className="px-5 py-8">
                    <Text className="text-center text-sm text-slate-500 dark:text-slate-400">{error ?? 'Cliente não encontrado.'}</Text>
                </View>
            )}
        </SafeAreaView>
    );
}
