import { X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MockContract } from '@/mocks/contracts';
import type { Charge } from '@/types/charge';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const paymentMethods = ['PIX', 'Dinheiro', 'Cartão', 'Transferência', 'Outro'];

function demoDateFromToday(offsetInDays: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetInDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function PaymentModal({
  visible,
  charge,
  contract,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  charge: Charge | null;
  contract?: MockContract;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [receivedValue, setReceivedValue] = useState(charge ? formatCurrency(charge.remainingAmount || charge.amount) : '');
  const [discount, setDiscount] = useState('R$ 0,00');
  const [nextChargeDate, setNextChargeDate] = useState(formatDate(demoDateFromToday(15)));
  const [method, setMethod] = useState('PIX');
  const [observation, setObservation] = useState('');

  if (!charge) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
        <Pressable onPress={onClose} className="flex-1" />
        <SafeAreaView edges={['bottom']} className="rounded-t-[32px] bg-white dark:bg-slate-950">
          <View className="max-h-[88%]">
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <View>
                <Text className="text-xl font-bold text-slate-950 dark:text-white">Registrar pagamento</Text>
                <Text className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Contrato {contract ? `#${contract.number}` : charge.contractId}
                </Text>
              </View>
              <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-80 dark:bg-slate-800">
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-5 pt-4" showsVerticalScrollIndicator={false}>
              <View className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                <Text className="text-base font-bold text-slate-950 dark:text-white">{charge.clientName}</Text>
                <View className="mt-3 flex-row justify-between">
                  <View>
                    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor da cobrança</Text>
                    <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{formatCurrency(charge.amount)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Restante</Text>
                    <Text className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{formatCurrency(charge.remainingAmount)}</Text>
                  </View>
                </View>
              </View>

              <Field label="Valor recebido" value={receivedValue} onChangeText={setReceivedValue} keyboardType="decimal-pad" />

              <Text className="mb-2 mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">Forma de pagamento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-5">
                  {paymentMethods.map((item) => {
                    const isActive = method === item;
                    return (
                      <Pressable key={item} onPress={() => setMethod(item)} className="active:opacity-80">
                        <View className={isActive ? 'rounded-full bg-blue-600 px-4 py-2' : 'rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900'}>
                          <Text className={isActive ? 'text-sm font-bold text-white' : 'text-sm font-bold text-slate-600 dark:text-slate-300'}>{item}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <Field label="Desconto" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" />
              <Field label="Próxima cobrança" value={nextChargeDate} onChangeText={setNextChargeDate} />
              <Field label="Observação" value={observation} onChangeText={setObservation} placeholder="opcional" multiline />

              <View className="mt-5 flex-row gap-3">
                <Pressable onPress={onClose} className="flex-1 active:opacity-80">
                  <View className="h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <Text className="font-bold text-slate-700 dark:text-slate-200">Cancelar</Text>
                  </View>
                </Pressable>
                <Pressable onPress={onConfirm} className="flex-1 active:opacity-80">
                  <View className="h-12 items-center justify-center rounded-2xl bg-blue-600">
                    <Text className="font-bold text-white">Confirmar</Text>
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
