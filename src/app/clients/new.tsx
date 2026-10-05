import { type Href, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientForm } from '@/components/clients/ClientForm';
import { ApiError, type ApiValidationErrors } from '@/services/api';
import { createClient } from '@/services/clients';
import type { ClientPayload } from '@/types/client';

export default function NewClientScreen() {
    const [submitting, setSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ApiValidationErrors | undefined>();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(input: ClientPayload) {
        try {
            setSubmitting(true);
            setError(null);
            setValidationErrors(undefined);

            const client = await createClient(input);

            router.replace({ pathname: '/clients/[id]', params: { id: client.id } } as Href);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);

            if (error instanceof ApiError) {
                setValidationErrors(error.errors);
                setError(error.message);
                return;
            }

            setError('Não foi possível criar o cliente.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="px-5 pt-4">
                <Pressable onPress={() => router.back()} className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-900">
                    <ArrowLeft size={22} color="#2563EB" />
                </Pressable>
                <Text className="text-3xl font-bold text-slate-950 dark:text-white">Novo cliente</Text>
                <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Cadastre os dados principais do cliente.</Text>
                {error ? <Text className="mt-3 text-sm font-medium text-red-500">{error}</Text> : null}
            </View>

            <ClientForm submitLabel="Salvar cliente" submitting={submitting} validationErrors={validationErrors} onSubmit={handleSubmit} />
        </SafeAreaView>
    );
}
