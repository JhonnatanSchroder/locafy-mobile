import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  MapPin,
  MessageCircle,
  Navigation,
  PackageCheck,
  Phone,
  RotateCcw,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoneyValue } from '@/components/ui/MoneyValue';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getContract } from '@/services/contracts';
import type { Contract } from '@/types/contract';
import { formatDate } from '@/utils/formatDate';

const actions = [
  { label: 'Retirada', icon: PackageCheck },
  { label: 'Devolução', icon: RotateCcw },
  { label: 'Frete', icon: Truck },
  { label: 'Pagamento', icon: Banknote },
];

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [contract, setContract] =
    useState<Contract | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadContract = async () => {
      if (!id) {
        setError('Contrato inválido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getContract(id);

        setContract(response.data);
      } catch (error) {
        console.error(
          'Erro ao carregar contrato:',
          error,
        );

        setError(
          'Não foi possível carregar este contrato.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator />

        <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Carregando contrato...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !contract) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">
        <Text className="text-xl font-bold text-slate-950 dark:text-white">
          Contrato não encontrado
        </Text>

        <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {error}
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-full bg-blue-600 px-5 py-3"
        >
          <Text className="font-bold text-white">
            Voltar
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentItems = contract.items.filter(
    (item) => (item.current_quantity ?? 0) > 0,
  );

  const rentalTotal =
    contract.calculation_complete &&
    contract.rental_total !== null
      ? Number(contract.rental_total)
      : null;

  const handlePhone = async () => {
    const phone = contract.client.phone;

    if (!phone) {
      Alert.alert(
        'Telefone não informado',
        'Este cliente não possui telefone cadastrado.',
      );

      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    try {
      await Linking.openURL(`tel:${cleanPhone}`);
    } catch {
      Alert.alert(
        'Não foi possível abrir o telefone',
      );
    }
  };

  const handleWhatsApp = async () => {
    const phone = contract.client.phone;

    if (!phone) {
      Alert.alert(
        'Telefone não informado',
        'Este cliente não possui telefone cadastrado.',
      );

      return;
    }

    let cleanPhone = phone.replace(/\D/g, '');

    // Telefone brasileiro sem DDI.
    if (
      !cleanPhone.startsWith('55') &&
      (cleanPhone.length === 10 ||
        cleanPhone.length === 11)
    ) {
      cleanPhone = `55${cleanPhone}`;
    }

    const url = `https://wa.me/${cleanPhone}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Não foi possível abrir o WhatsApp',
      );
    }
  };

  const handleLocation = async () => {
    const address = contract.worksite_address;

    if (!address) {
      Alert.alert(
        'Endereço não informado',
        'Este contrato não possui endereço da obra.',
      );

      return;
    }

    const query = encodeURIComponent(address);

    const url =
      `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Não foi possível abrir a localização',
      );
    }
  };

  const handlePendingAction = (label: string) => {
    Alert.alert(
      label,
      `A ação "${label}" ainda não está integrada ao aplicativo.`,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerClassName="px-5 pb-28 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Voltar */}
        <Pressable
          onPress={() => router.back()}
          className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-900"
        >
          <ArrowLeft
            size={22}
            color="#2563EB"
          />
        </Pressable>

        {/* Cabeçalho */}
        <View className="rounded-[32px] bg-slate-950 p-5 dark:bg-slate-900">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                Contrato #{contract.number}
              </Text>

              <Text className="mt-2 text-3xl font-bold text-white">
                {contract.client.name}
              </Text>
            </View>

            <StatusBadge
              status={contract.status}
            />
          </View>

          <View className="mt-5 gap-3">
            <View className="flex-row items-center gap-2">
              <MapPin
                size={16}
                color="#CBD5E1"
              />

              <Text className="flex-1 text-sm font-medium text-slate-300">
                {contract.worksite_address ||
                  'Endereço não informado'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <CalendarDays
                size={16}
                color="#CBD5E1"
              />

              <Text className="text-sm font-medium text-slate-300">
                Início em{' '}
                {formatDate(contract.started_at)}
              </Text>
            </View>

            {contract.ended_at && (
              <View className="flex-row items-center gap-2">
                <CalendarDays
                  size={16}
                  color="#CBD5E1"
                />

                <Text className="text-sm font-medium text-slate-300">
                  Finalizado em{' '}
                  {formatDate(contract.ended_at)}
                </Text>
              </View>
            )}
          </View>

          {/* Ações rápidas do cliente */}
          <View className="mt-5 flex-row gap-2">
            <ClientAction
              label="Telefone"
              icon={Phone}
              onPress={handlePhone}
              disabled={!contract.client.phone}
            />

            <ClientAction
              label="WhatsApp"
              icon={MessageCircle}
              onPress={handleWhatsApp}
              disabled={!contract.client.phone}
            />

            <ClientAction
              label="Localização"
              icon={Navigation}
              onPress={handleLocation}
              disabled={!contract.worksite_address}
            />
          </View>
        </View>

        {/* Resumo */}
        <View className="mt-7">
          <SectionHeader title="Resumo da locação" />

          <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Valor acumulado
              </Text>

              {rentalTotal !== null ? (
                <MoneyValue value={rentalTotal} />
              ) : (
                <Text className="font-semibold text-slate-400">
                  —
                </Text>
              )}
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Calculado até
              </Text>

              <Text className="text-sm font-bold text-slate-950 dark:text-white">
                {contract.calculated_until
                  ? formatDate(
                      contract.calculated_until,
                    )
                  : '—'}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Próxima cobrança
              </Text>

              <Text className="text-sm font-bold text-slate-950 dark:text-white">
                {contract.next_charge_date
                  ? formatDate(
                      contract.next_charge_date,
                    )
                  : '—'}
              </Text>
            </View>

            {!contract.calculation_complete && (
              <View className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Text className="text-sm text-amber-600 dark:text-amber-400">
                  O cálculo ainda não está disponível
                  para todos os itens deste contrato.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Itens */}
        <View className="mt-7">
          <SectionHeader title="Itens atuais" />

          <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <View
                  key={item.id}
                  className="border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-950 dark:text-white">
                        {item.current_quantity}x{' '}
                        {item.product.name}
                      </Text>

                      <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {getBillingDescription(
                          item.billing_period,
                          item.unit_price,
                        )}
                      </Text>
                    </View>

                    {item.accrued_subtotal !==
                      undefined &&
                    item.accrued_subtotal !==
                      null ? (
                      <View className="items-end">
                        <Text className="text-xs font-medium text-slate-400">
                          Acumulado
                        </Text>

                        <Text className="mt-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                            item.accrued_subtotal,
                          )}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <View className="py-4">
                <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum item atualmente fora.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Observações */}
        {contract.notes ? (
          <View className="mt-7">
            <SectionHeader title="Observações" />

            <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Text className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {contract.notes}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Barra inferior */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 pb-5 pt-3 dark:border-slate-800 dark:bg-slate-950">
        <View className="flex-row justify-between">
          {actions.map(
            ({ label, icon: Icon }) => (
              <Pressable
                key={label}
                onPress={() =>
                  handlePendingAction(label)
                }
                className="items-center gap-1 active:opacity-80"
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950">
                  <Icon
                    size={19}
                    color="#2563EB"
                  />
                </View>

                <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {label}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ClientAction({
  label,
  icon: Icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 items-center rounded-2xl bg-white/10 px-2 py-3 active:opacity-80 ${
        disabled ? 'opacity-35' : ''
      }`}
    >
      <Icon
        size={18}
        color="#BFDBFE"
      />

      <Text className="mt-1 text-xs font-bold text-blue-100">
        {label}
      </Text>
    </Pressable>
  );
}

function getBillingDescription(
  period: string,
  unitPrice: string,
) {
  const price = formatCurrency(unitPrice);

  switch (period) {
    case 'DAY':
      return `${price} por unidade/dia`;

    case 'WEEK':
      return `${price} por semana`;

    case 'MONTH':
      return `${price} por mês`;

    default:
      return price;
  }
}

function formatCurrency(
  value: string | number,
) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
}
