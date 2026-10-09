import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Edit3, FilePlus2, MapPin, MessageCircle, Phone } from 'lucide-react-native';

import { BackButton } from '@/components/ui/BackButton';
import { ClientAction } from '@/components/ui/ClientAction';
import { InfoRow } from '@/components/ui/InfoRow';
import { ResponsiveContainer, ResponsiveColumns } from '@/components/ui/ResponsiveLayout';
import { SectionCard } from '@/components/ui/SectionCard';

import { getClient } from '@/services/clients';

import type { Client } from '@/types/client';

import { useTheme } from '@/hooks/use-theme';

export default function ClientDetailScreen() {
  const theme = useTheme();
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

  useFocusEffect(useCallback(() => { void loadClient(); }, [loadClient]));

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
    if (!phone.startsWith('55') && (phone.length === 10 || phone.length === 11)) phone = `55${phone}`;
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
      <ResponsiveContainer>
        <BackButton onPress={() => router.back()} />

        <ResponsiveColumns
          left={<>
            <View className="rounded-[32px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Text className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">{client.type_label}</Text>
              <Text className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">{client.name}</Text>

              <View className="mt-5 flex-row gap-2">
                <ClientAction label="Telefone" icon={Phone} onPress={openPhone} disabled={!client.phone} />
                <ClientAction label="WhatsApp" icon={MessageCircle} onPress={openWhatsApp} disabled={!client.phone} />
              </View>
            </View>

            <View className="mt-5 flex-row gap-3">
              <Pressable onPress={() => router.push({ pathname: '/clients/[id]/edit', params: { id: client.id } } as Href)} className="flex-1 active:opacity-80">
                <View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600">
                  <Edit3 size={17} color={theme.onPrimary} />
                  <Text className="font-bold text-white">Editar</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: '/contracts/new', params: { client_id: client.id } } as Href)} className="flex-1 active:opacity-80">
                <View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <FilePlus2 size={17} color={theme.primary} />
                  <Text className="font-bold text-slate-700 dark:text-slate-200">Criar contrato</Text>
                </View>
              </Pressable>
            </View>
          </>}
          right={<>
            <SectionCard>
              <InfoRow label="Documento" value={client.document} />
              <InfoRow label="Telefone" value={client.phone} />
              <InfoRow label="Endereço" value={client.residential_address} />
              <InfoRow label="Observações" value={client.notes} />
            </SectionCard>

            <SectionCard className="mt-7 border-dashed">
              <View className="flex-row items-center gap-2">
                <MapPin size={17} color={theme.iconSecondary} />
                <Text className="text-base font-bold text-slate-950 dark:text-white">Contratos do cliente</Text>
              </View>
              <Text className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">Consulte as locações na aba Contratos.</Text>
            </SectionCard>
          </>}
        />
      </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
