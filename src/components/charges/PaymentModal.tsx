import { X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Charge, PaymentMethod } from '@/types/charge';
import { registerPayment } from '@/services/payments';
import { errorMessage } from '@/services/resources';
import { dateTimeInput, decimalInput, localDateTime } from '@/utils/formValues';
import { ErrorText } from '@/components/ui/OperationalForm';
import { formatCurrency } from '@/utils/formatCurrency';

const paymentMethods: { value: PaymentMethod; label: string }[] = [{ value: 'PIX', label: 'PIX' }, { value: 'CASH', label: 'Dinheiro' }, { value: 'CARD', label: 'Cartão' }, { value: 'TRANSFER', label: 'Transferência' }, { value: 'OTHER', label: 'Outro' }];

export function PaymentModal({
  visible,
  charge,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  charge: Charge | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const currentBalance = charge?.financial_balance ?? charge?.balance ?? '';
  const [receivedValue, setReceivedValue] = useState(currentBalance);
  const [discountValue, setDiscountValue] = useState('');
  const [paidAt, setPaidAt] = useState(localDateTime());
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [observation, setObservation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const preview = useMemo(() => {
    const balance = moneyValue(currentBalance);
    const received = moneyValue(receivedValue);
    const discount = moneyValue(discountValue);
    const settled = received == null || discount == null ? null : received + discount;
    return {
      received,
      discount,
      settled,
      balanceAfter: balance == null || settled == null ? null : Math.max(balance - settled, 0),
    };
  }, [currentBalance, discountValue, receivedValue]);

  function changeDiscount(value: string) {
    setDiscountValue(value);
    const balance = moneyValue(currentBalance);
    const discount = moneyValue(value);
    if (balance == null || discount == null || value.trim() === '') return;
    setReceivedValue(Math.max(balance - discount, 0).toFixed(2));
  }

  async function confirm() {
    if (!charge || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null);
    try {
      await registerPayment(charge.contract_id, { amount: decimalInput(receivedValue), ...(discountValue.trim() ? { discount_amount: decimalInput(discountValue) } : {}), paid_at: dateTimeInput(paidAt), method, notes: observation.trim() || null });
    } catch (e) { setError(errorMessage(e)); setBusy(false); submitting.current = false; return; }
    // Close before refreshing so a failed read cannot cause a second payment submission.
    onClose();
    await onConfirm();
  }
  function close() { if (!busy) onClose(); }

  if (!charge) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
        <Pressable onPress={close} className="flex-1" />
        <SafeAreaView edges={['bottom']} className="rounded-t-[32px] bg-white dark:bg-slate-950">
          <View className="max-h-[88%]">
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <View>
                <Text className="text-xl font-bold text-slate-950 dark:text-white">Registrar pagamento</Text>
                <Text className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Contrato #{charge.contract_id}
                </Text>
              </View>
              <Pressable onPress={close} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-80 dark:bg-slate-800">
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-5 pt-4" showsVerticalScrollIndicator={false}>
              <View className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                <Text className="text-base font-bold text-slate-950 dark:text-white">{charge.client}</Text>
                <View className="mt-3 flex-row justify-between">
                  <View>
                    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor da cobrança</Text>
                    <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{charge.total_accrued == null ? '—' : formatCurrency(Number(charge.total_accrued))}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Restante</Text>
                    <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{currentBalance === '' ? '—' : formatCurrency(Number(currentBalance))}</Text>
                  </View>
                </View>
              </View>

              <Field label="Valor recebido" value={receivedValue} onChangeText={setReceivedValue} keyboardType="decimal-pad" />
              <Field label="Desconto" value={discountValue} onChangeText={changeDiscount} keyboardType="decimal-pad" placeholder="0,00" />

              <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <PreviewRow label="Recebido" value={preview.received} />
                <PreviewRow label="Desconto" value={preview.discount} />
                <PreviewRow label="Total abatido" value={preview.settled} strong />
                <View className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <PreviewRow label="Saldo após operação" value={preview.balanceAfter} strong />
                </View>
              </View>

              <Text className="mb-2 mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">Forma de pagamento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-5">
                  {paymentMethods.map((item) => {
                    const isActive = method === item.value;
                    return (
                      <Pressable key={item.value} onPress={() => setMethod(item.value)} className="active:opacity-80">
                        <View className={isActive ? 'rounded-full bg-blue-600 px-4 py-2' : 'rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900'}>
                          <Text className={isActive ? 'text-sm font-bold text-white' : 'text-sm font-bold text-slate-600 dark:text-slate-300'}>{item.label}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <Field label="Data/hora (AAAA-MM-DD HH:mm)" value={paidAt} onChangeText={setPaidAt} />
              <Field label="Observação" value={observation} onChangeText={setObservation} placeholder="opcional" multiline />
              <ErrorText message={error} />

              <View className="mt-5 flex-row gap-3">
                <Pressable onPress={close} disabled={busy} className="flex-1 active:opacity-80">
                  <View className="h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <Text className="font-bold text-slate-700 dark:text-slate-200">Cancelar</Text>
                  </View>
                </Pressable>
                <Pressable onPress={confirm} disabled={busy} className="flex-1 active:opacity-80">
                  <View className="h-12 items-center justify-center rounded-2xl bg-blue-600">
                    <Text className="font-bold text-white">{busy ? 'Salvando...' : 'Confirmar'}</Text>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function moneyValue(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function PreviewRow({ label, value, strong = false }: { label: string; value: number | null; strong?: boolean }) {
  return <View className="flex-row items-center justify-between gap-3 py-1"><Text className={strong ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-sm text-slate-500 dark:text-slate-400'}>{label}</Text><Text className={strong ? 'font-bold text-slate-950 dark:text-white' : 'font-semibold text-slate-950 dark:text-white'}>{value == null ? '—' : formatCurrency(value)}</Text></View>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={
          multiline
            ? 'min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white'
            : 'h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white'
        }
      />
    </View>
  );
}
