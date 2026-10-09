import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  router,
  type Href,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  Banknote,
  CalendarDays,
  MapPin,
  MessageCircle,
  Navigation,
  PackageCheck,
  Phone,
  RotateCcw,
  Truck,
  Trash2,
  X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';

import { FinancialSummary } from '@/components/ui/FinancialSummary';
import { subscribeFinancialUpdates } from '@/services/financialUpdates';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BackButton } from '@/components/ui/BackButton';
import { ClientAction } from '@/components/ui/ClientAction';
import { ResponsiveContainer } from '@/components/ui/ResponsiveLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { getContract, finalizeContract } from '@/services/contracts';
import { contractPresentation } from '@/utils/contractStatus';
import { Button, ErrorText } from '@/components/ui/OperationalForm';
import { ContractPhotoPicker } from '@/components/contracts/ContractPhotoPicker';
import { deleteContractAttachment, uploadContractAttachment, type LocalContractPhoto } from '@/services/contractAttachments';
import { getToken } from '@/services/tokenStorage';
import type { Contract, ContractAttachment, ContractMovement } from '@/types/contract';
import { formatDate, formatDateTimeBR } from '@/utils/formatDate';
import { errorMessage } from '@/services/resources';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/useResponsive';

const actions = [
  { label: 'Retirada', icon: PackageCheck },
  { label: 'Devolução', icon: RotateCcw },
  { label: 'Frete', icon: Truck },
  { label: 'Pagamento', icon: Banknote },
];

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL não foi configurada.');
}

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const responsive = useResponsive();

  const [contract, setContract] =
    useState<Contract | null>(null);

  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<ContractAttachment | null>(null);
  const [photosToUpload, setPhotosToUpload] = useState<LocalContractPhoto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<string | null>(null);
  const [imageToken, setImageToken] = useState<string | null>(null);
  const [imageTokenLoaded, setImageTokenLoaded] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
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

        if (active) setContract(response.data);
      } catch (error) {
        console.error(
          'Erro ao carregar contrato:',
          error,
        );

        if (active) setError(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadContract();
    return () => { active = false; };
  }, [id]));

  useEffect(() => subscribeFinancialUpdates(updated => { if (String(updated.id) === id) setContract(updated); }), [id]);
  useEffect(() => {
    let active = true;

    void getToken()
      .then((token) => {
        if (!active) return;
        setImageToken(token);
        setImageTokenLoaded(true);
      })
      .catch((tokenError) => {
        if (!active) return;
        console.error('Erro ao carregar token das imagens:', tokenError);
        setImageToken(null);
        setImageTokenLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

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
  const presentation = contractPresentation(contract);
  const contractId = contract.id;
  const canUploadAttachments = contract.can_upload_attachments ?? !presentation.closed;
  const photoTileClassName = responsive.isTablet && responsive.isLandscape ? 'w-[22%] min-w-24' : 'w-[30%] min-w-24';
  async function reloadContract() {
    const response = await getContract(contractId);
    setContract(response.data);
  }
  async function uploadSelectedPhotos(selectedPhotos = photosToUpload) {
    if (!selectedPhotos.length || photoBusy) return;
    setPhotoBusy(true); setOperationError(null); setFeedback(null);
    const failed: LocalContractPhoto[] = [];
    for (let index = 0; index < selectedPhotos.length; index += 1) {
      setPhotoProgress(`Enviando fotos... ${index + 1} de ${selectedPhotos.length}`);
      try {
        await uploadContractAttachment(contractId, selectedPhotos[index]);
      } catch {
        failed.push(selectedPhotos[index]);
      }
    }
    setPhotosToUpload(failed);
    setPhotoProgress(null); setPhotoBusy(false);
    await reloadContract();
    if (failed.length) setOperationError(`${selectedPhotos.length - failed.length} de ${selectedPhotos.length} fotos enviadas.`);
    else setFeedback('Fotos enviadas com sucesso.');
  }
  function updatePhotosToUpload(selectedPhotos: LocalContractPhoto[]) {
    setPhotosToUpload(selectedPhotos);
    if (selectedPhotos.length > photosToUpload.length) {
      void uploadSelectedPhotos(selectedPhotos);
    }
  }
  function confirmRemoveAttachment(attachment: ContractAttachment) {
    Alert.alert('Remover esta foto?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => { void removeAttachment(attachment); } },
    ]);
  }
  async function removeAttachment(attachment: ContractAttachment) {
    setPhotoBusy(true); setOperationError(null); setFeedback(null);
    try {
      await deleteContractAttachment(contractId, attachment.id);
      if (selectedAttachment?.id === attachment.id) setSelectedAttachment(null);
      await reloadContract();
      setFeedback('Foto removida.');
    } catch (e) { setOperationError(errorMessage(e)); }
    finally { setPhotoBusy(false); }
  }
  async function finish() {
    if (!contract || finalizing) return;
    setFinalizing(true); setOperationError(null); setFeedback(null);
    try {
      const updated = await finalizeContract(contract.id);
      setContract(updated);
      if (updated.status === 'FINALIZED') setFeedback('Contrato finalizado com sucesso.');
      else setOperationError('O servidor não confirmou a finalização. Atualize o contrato.');
    } catch (e) { setOperationError(errorMessage(e)); }
    finally { setFinalizing(false); }
  }
  function confirmFinalization() {
    Alert.alert('Finalizar este contrato?', 'Após a finalização, o contrato será encerrado e não aceitará novas movimentações operacionais.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Finalizar', onPress: () => { void finish(); } }]);
  }

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
    if (label === 'Pagamento') { router.push({ pathname: '/charges', params: { contract_id: id } } as Href); return; }
    if (label === 'Frete') { router.push(`/contracts/${id}/freight` as Href); return; }
    router.push({ pathname: '/contracts/[id]/movement', params: { id, type: label === 'Retirada' ? 'WITHDRAWAL' : 'RETURN' } } as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50  dark:bg-slate-950">
      <ScrollView
        contentContainerClassName="px-5 pb-28 pt-4"
        showsVerticalScrollIndicator={false}
      >
      <ResponsiveContainer>
        <BackButton onPress={() => router.back()} />

        {/* Cabeçalho */}
        <View className="rounded-[32px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                Contrato #{contract.number}
              </Text>

              <Text className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {contract.client.name}
              </Text>
            </View>

            <StatusBadge
              status={contract.status}
              balance={contract.balance}
              financial_balance={contract.financial_balance}
            />
          </View>

          <View className="mt-5 gap-3">
            <View className="flex-row items-center gap-2">
              <MapPin
                size={16}
                color={theme.iconSecondary}
              />

              <Text className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                {contract.worksite_address ||
                  'Endereço não informado'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <CalendarDays
                size={16}
                color={theme.iconSecondary}
              />

              <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Início em{' '}
                {formatDate(contract.started_at)}
              </Text>
            </View>

            {contract.ended_at && (
              <View className="flex-row items-center gap-2">
                <CalendarDays
                  size={16}
                  color={theme.iconSecondary}
                />

                <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
        {!presentation.closed ? <Pressable onPress={() => router.push(`/contracts/${id}/edit` as Href)} className="mt-5 self-start rounded-2xl bg-blue-600 px-4 py-3"><Text className="font-bold text-white">Editar contrato</Text></Pressable> : null}
        <ErrorText message={operationError} />
        {feedback ? <Text accessibilityRole="alert" className="mt-4 font-bold text-emerald-600">{feedback}</Text> : null}
        {presentation.ready ? <Button label="Finalizar contrato" onPress={confirmFinalization} busy={finalizing} /> : null}
        <View className="mt-3 flex-row gap-3"><Pressable onPress={() => router.push({ pathname: '/charges', params: { contract_id: id } } as Href)} className="rounded-2xl border border-blue-600 px-4 py-3"><Text className="font-bold text-blue-600">Ver cobranças</Text></Pressable></View>
        <View className="mt-7">
          <SectionHeader title="Resumo da locação" />

          <SectionCard>
            <FinancialSummary summary={contract} />

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
          </SectionCard>
        </View>

        <View className="mt-7">
          <SectionHeader title="Fotos" />
          <SectionCard>
            {canUploadAttachments ? <ContractPhotoPicker photos={photosToUpload} onChange={updatePhotosToUpload} disabled={photoBusy} helperText="As fotos selecionadas serão enviadas para este contrato." /> : null}
            {photoProgress ? <Text className="mb-3 font-semibold text-blue-600">{photoProgress}</Text> : null}
            {photosToUpload.length && !photoBusy ? <Button label="Tentar novamente" onPress={() => { void uploadSelectedPhotos(); }} /> : null}
            {!contract.attachments?.length ? (
              <Text className="text-slate-500">Nenhuma foto enviada.</Text>
            ) : !imageTokenLoaded ? (
              <View className="items-center py-5">
                <ActivityIndicator />
                <Text className="mt-2 text-sm text-slate-500">
                  Carregando fotos...
                </Text>
              </View>
            ) : !imageToken ? (
              <Text className="text-sm font-semibold text-red-600">
                Não foi possível autenticar o carregamento das fotos.
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {contract.attachments.map((attachment) => {
                  const canDelete =
                    canUploadAttachments &&
                    (attachment.can_delete ?? true);

                  return (
                    <View
                      key={attachment.id}
                      className={photoTileClassName}
                    >
                      <Pressable
                        onPress={() =>
                          setSelectedAttachment(attachment)
                        }
                        className="aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800"
                      >
                        <AuthenticatedAttachmentImage
                          contractId={contractId}
                          attachment={attachment}
                          token={imageToken}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      </Pressable>

                      <Text
                        className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        numberOfLines={1}
                      >
                        {attachment.original_name}
                      </Text>

                      <Text className="mt-1 text-xs text-slate-500">
                        {formatDateTimeBR(attachment.created_at)}
                      </Text>

                      {uploadedByName(attachment) ? (
                        <Text
                          className="mt-1 text-xs text-slate-500"
                          numberOfLines={1}
                        >
                          {uploadedByName(attachment)}
                        </Text>
                      ) : null}

                      {canDelete ? (
                        <Pressable
                          onPress={() =>
                            confirmRemoveAttachment(attachment)
                          }
                          disabled={photoBusy}
                          className="mt-2 flex-row items-center gap-1"
                        >
                          <Trash2 size={14} color={theme.danger} />
                          <Text className="text-xs font-bold text-red-600">
                            Remover
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </SectionCard>
        </View>

        <View className="mt-7">
          <SectionHeader title="Histórico de movimentações" />
          <SectionCard>
            {contract.movements?.length ? (
              contract.movements.map((movement) => (
                <MovementHistoryItem key={movement.id} movement={movement} />
              ))
            ) : (
              <Text className="text-slate-500">
                Nenhuma movimentação registrada.
              </Text>
            )}
          </SectionCard>
        </View>

        {/* Itens */}
        <View className="mt-7">
          <SectionHeader title="Itens atuais" />

          <SectionCard>
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
          </SectionCard>
        </View>

        <View className="mt-7"><SectionHeader title="Histórico de fretes" />
          <SectionCard>
            {contract.freights?.length ? contract.freights.map(freight => <View key={freight.id} className="border-b border-slate-100 py-3 dark:border-slate-800">
              <Text className="font-bold text-slate-950 dark:text-white">{freight.occurred_at ? formatDateTimeBR(freight.occurred_at) : 'Data não informada'}</Text>
              <Text className="mt-1 text-slate-500">{freight.quantity} fretes × {formatCurrency(freight.unit_amount)}</Text>
              <Text className="mt-1 font-bold text-blue-600">Total {freight.total != null ? formatCurrency(freight.total) : '—'}</Text>
              {freight.notes ? <Text className="mt-1 text-slate-500">{freight.notes}</Text> : null}
              {!presentation.closed ? <Pressable onPress={() => router.push({ pathname: '/contracts/[id]/freight', params: { id, freight_id: freight.id } } as Href)} className="mt-2"><Text className="font-bold text-blue-600">Editar frete</Text></Pressable> : null}
            </View>) : <Text className="text-slate-500">Nenhum frete registrado.</Text>}
          </SectionCard>
        </View>
        {/* Observações */}
        {contract.notes ? (
          <View className="mt-7">
            <SectionHeader title="Observações" />

            <SectionCard>
              <Text className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {contract.notes}
              </Text>
            </SectionCard>
          </View>
        ) : null}
      </ResponsiveContainer>
      </ScrollView>

      {/* Barra inferior */}
      {!presentation.closed ? <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 pb-5 pt-3 dark:border-slate-800 dark:bg-slate-950">
        <ResponsiveContainer>
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
                    color={theme.primary}
                  />
                </View>

                <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {label}
                </Text>
              </Pressable>
            ),
          )}
        </View>
        </ResponsiveContainer>
      </View> : null}
      <AttachmentViewer contractId={id} attachment={selectedAttachment} token={imageToken} onClose={() => setSelectedAttachment(null)} onRemove={selectedAttachment && canUploadAttachments && (selectedAttachment.can_delete ?? true) ? () => confirmRemoveAttachment(selectedAttachment) : undefined} />
    </SafeAreaView>
  );
}

function AttachmentViewer({
  contractId,
  attachment,
  token,
  onClose,
  onRemove,
}: {
  contractId: number | string;
  attachment: ContractAttachment | null;
  token: string | null;
  onClose: () => void;
  onRemove?: () => void;
}) {
  return (
    <Modal
      visible={!!attachment}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/90 px-4 pb-8 pt-12">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            onPress={onClose}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>

          {onRemove ? (
            <Pressable
              onPress={onRemove}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
            >
              <Trash2 size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        {attachment && token ? (
          <AuthenticatedAttachmentImage
            contractId={contractId}
            attachment={attachment}
            token={token}
            className="flex-1 rounded-2xl"
            resizeMode="contain"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FFFFFF" />
            <Text className="mt-3 text-sm text-slate-300">
              Carregando foto...
            </Text>
          </View>
        )}

        {attachment ? (
          <View className="mt-4">
            <Text className="font-bold text-white">
              {attachment.original_name}
            </Text>

            <Text className="mt-1 text-slate-300">
              {formatDateTimeBR(attachment.created_at)}
              {uploadedByName(attachment)
                ? ` · ${uploadedByName(attachment)}`
                : ''}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function AuthenticatedAttachmentImage({
  contractId,
  attachment,
  token,
  className,
  resizeMode = 'cover',
}: {
  contractId: number | string;
  attachment: ContractAttachment;
  token: string;
  className?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadImage = async () => {
      setLoadingImage(true);
      setLoadError(null);
      setLocalUri(null);

      const cacheDirectory = FileSystem.cacheDirectory;

      if (!cacheDirectory) {
        if (active) {
          setLoadError('Cache do aplicativo indisponível.');
          setLoadingImage(false);
        }
        return;
      }

      const remoteUri = attachmentRemoteUrl(
        contractId,
        attachment.id,
      );

      const extension = attachmentFileExtension(attachment);

      const cachedUri =
        `${cacheDirectory}locafy-contract-${contractId}` +
        `-attachment-${attachment.id}.${extension}`;

      try {
        const cachedFile =
          await FileSystem.getInfoAsync(cachedUri);

        if (
          cachedFile.exists &&
          'size' in cachedFile &&
          cachedFile.size > 0
        ) {
          if (active) {
            setLocalUri(cachedUri);
            setLoadingImage(false);
          }
          return;
        }

        const result = await FileSystem.downloadAsync(
          remoteUri,
          cachedUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'image/*',
            },
          },
        );

        if (__DEV__) {
          console.log(
            'authenticated attachment download response',
            {
              attachmentId: attachment.id,
              status: result.status,
              remoteUri,
              localUri: result.uri,
            },
          );
        }

        if (
          result.status < 200 ||
          result.status >= 300
        ) {
          await FileSystem.deleteAsync(cachedUri, {
            idempotent: true,
          }).catch(() => undefined);

          throw new Error(
            `HTTP ${result.status} ao carregar a foto.`,
          );
        }

        if (active) {
          setLocalUri(result.uri);
        }
      } catch (imageError) {
        if (__DEV__) {
          console.log(
            'authenticated attachment image error',
            {
              attachmentId: attachment.id,
              remoteUri,
              error:
                imageError instanceof Error
                  ? imageError.message
                  : String(imageError),
            },
          );
        }

        if (active) {
          setLoadError(
            imageError instanceof Error
              ? imageError.message
              : 'Não foi possível carregar a foto.',
          );
        }
      } finally {
        if (active) {
          setLoadingImage(false);
        }
      }
    };

    void loadImage();

    return () => {
      active = false;
    };
  }, [attachment, attachment.id, contractId, token]);

  if (loadingImage) {
    return (
      <View
        className={`items-center justify-center ${className ?? ''}`}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (loadError || !localUri) {
    return (
      <View
        className={`items-center justify-center bg-slate-100 px-2 dark:bg-slate-800 ${className ?? ''}`}
      >
        <Text className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          Imagem indisponível
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: localUri }}
      className={className}
      resizeMode={resizeMode}
      onError={(event) => {
        console.log(
          'local attachment image render error',
          {
            attachmentId: attachment.id,
            uri: localUri,
            error: event.nativeEvent.error,
          },
        );

        setLoadError(
          'Não foi possível renderizar a foto.',
        );
      }}
    />
  );
}

function attachmentRemoteUrl(
  contractId: number | string,
  attachmentId: number | string,
) {
  return `${API_URL}/contracts/${contractId}/attachments/${attachmentId}`;
}

function attachmentFileExtension(
  attachment: ContractAttachment,
) {
  const mimeType =
    'mime_type' in attachment
      ? attachment.mime_type
      : undefined;

  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  const match =
    attachment.original_name?.match(
      /\.([a-zA-Z0-9]+)$/,
    );

  const extension =
    match?.[1]?.toLowerCase();

  if (
    extension === 'png' ||
    extension === 'webp' ||
    extension === 'jpg' ||
    extension === 'jpeg'
  ) {
    return extension;
  }

  return 'jpg';
}
function uploadedByName(attachment: ContractAttachment) {
  if (!attachment.uploaded_by) return null;
  return typeof attachment.uploaded_by === 'string' ? attachment.uploaded_by : attachment.uploaded_by.name ?? null;
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

function MovementHistoryItem({
  movement,
}: {
  movement: ContractMovement;
}) {
  return (
    <View className="border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800">
      <Text className="text-xs font-bold uppercase text-blue-600 dark:text-blue-300">
        {movement.type_label ?? movementTypeLabel(movement.type)}
      </Text>
      <Text className="mt-1 font-bold text-slate-950 dark:text-white">
        {formatDateTimeBR(movement.occurred_at)}
      </Text>
      <View className="mt-3 gap-1">
        {movement.items.map((item) => (
          <Text
            key={item.id}
            className="text-sm text-slate-700 dark:text-slate-200"
          >
            {item.quantity}x {item.product?.name ?? 'Item do contrato'}
            {item.equipment?.name ? ` · ${item.equipment.name}` : ''}
          </Text>
        ))}
      </View>
      {movement.notes ? (
        <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Observação: {movement.notes}
        </Text>
      ) : null}
    </View>
  );
}

function movementTypeLabel(type: ContractMovement['type']) {
  return type === 'WITHDRAWAL' ? 'Retirada' : 'Devolução';
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
