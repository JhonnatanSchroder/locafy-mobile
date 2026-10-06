import { type Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit3, FilePlus2, MapPin, MessageCircle, Phone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getClient } from '@/services/clients';
import type { Client } from '@/types/client';

export default function ClientDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadClient = useCallback(async () => {
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
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadClient();
        }, [loadClient]),
    );

    async function openPhone() {
        if (!client?.phone) {
            Alert.alert('Telefone não informado', 'Este cliente não possui telefone cadastrado.');
            return;
        }

        await Linking.openURL(`tel:${client.phone.replace(/\D/g, '')}`);
    }

    async function openWhatsApp() {
        if (!client?.phone) {
            Alert.alert('Telefone não informado', 'Este cliente não possui telefone cadastrado.');
            return;
        }

        let phone = client.phone.replace(/\D/g, '');

        if (!phone.startsWith('55') && (phone.length === 10 || phone.length === 11)) {
            phone = `55${phone}`;
        }

        await Linking.openURL(`https://wa.me/${phone}`);
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <ActivityIndicator />
                <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Carregando cliente...</Text>
            </SafeAreaView>
        );
    }

    if (error || !client) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">
                <Text className="text-xl font-bold text-slate-950 dark:text-white">Cliente não encontrado</Text>
                <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{error}</Text>
                <Pressable onPress={() => router.back()} className="mt-4 rounded-full bg-blue-600 px-5 py-3">
                    <Text className="font-bold text-white">Voltar</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <ScrollView contentContainerClassName="px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
                <Pressable onPress={() => router.back()} className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-900">
                    <ArrowLeft size={22} color="#2563EB" />
                </Pressable>

                <View className="rounded-[32px] bg-slate-950 p-5 dark:bg-slate-900">
                    <Text className="text-sm font-semibold uppercase tracking-wide text-blue-300">{client.type_label}</Text>
                    <Text className="mt-2 text-3xl font-bold text-white">{client.name}</Text>

                    <View className="mt-5 flex-row gap-2">
                        <ClientAction label="Telefone" icon={<Phone size={18} color="#BFDBFE" />} onPress={openPhone} disabled={!client.phone} />
                        <ClientAction label="WhatsApp" icon={<MessageCircle size={18} color="#BFDBFE" />} onPress={openWhatsApp} disabled={!client.phone} />
                    </View>
                </View>

                <View className="mt-7 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <InfoRow label="Documento" value={client.document} />
                    <InfoRow label="Telefone" value={client.phone} />
                    <InfoRow label="Endereço" value={client.residential_address} />
                    <InfoRow label="Observações" value={client.notes} />
                </View>

                <View className="mt-5 flex-row gap-3">
                    <Pressable onPress={() => router.push({ pathname: '/clients/[id]/edit', params: { id: client.id } } as Href)} className="flex-1 active:opacity-80">
                        <View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600">
                            <Edit3 size={17} color="#FFFFFF" />
                            <Text className="font-bold text-white">Editar</Text>
                        </View>
                    </Pressable>
                    <Pressable onPress={() => router.push({ pathname: '/contracts/new', params: { client_id: client.id } } as Href)} className="flex-1 active:opacity-80">
                        <View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <FilePlus2 size={17} color="#2563EB" />
                            <Text className="font-bold text-slate-700 dark:text-slate-200">Criar contrato</Text>
                        </View>
                    </Pressable>
                </View>

                <View className="mt-7 rounded-3xl border border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <View className="flex-row items-center gap-2">
                        <MapPin size={17} color="#64748B" />
                        <Text className="text-base font-bold text-slate-950 dark:text-white">Contratos do cliente</Text>
                    </View>
                    <Text className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        Consulte as locações na aba Contratos.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
    return (
        <View className="border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</Text>
            <Text className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{value || 'Não informado'}</Text>
        </View>
    );
}

function ClientAction({ label, icon, onPress, disabled = false }: { label: string; icon: ReactNode; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable onPress={onPress} disabled={disabled} className={`flex-1 items-center rounded-2xl bg-white/10 px-2 py-3 active:opacity-80 ${disabled ? 'opacity-35' : ''}`}>
            {icon}
            <Text className="mt-1 text-xs font-bold text-blue-100">{label}</Text>
        </Pressable>
    );
}
