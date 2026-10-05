import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { ApiValidationErrors } from '@/services/api';
import type { Client, ClientPayload, ClientType } from '@/types/client';

const clientTypes: Array<{ label: string; value: ClientType }> = [
    { label: 'Pessoa Física', value: 'INDIVIDUAL' },
    { label: 'Pessoa Jurídica', value: 'COMPANY' },
];

function toInputValue(value: string | null | undefined) {
    return value ?? '';
}

function emptyToNull(value: string) {
    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
}

export function ClientForm({
    client,
    submitLabel,
    submitting,
    validationErrors,
    onSubmit,
}: {
    client?: Client;
    submitLabel: string;
    submitting: boolean;
    validationErrors?: ApiValidationErrors;
    onSubmit: (input: ClientPayload) => Promise<void>;
}) {
    const [type, setType] = useState<ClientType>(client?.type ?? 'INDIVIDUAL');
    const [name, setName] = useState(toInputValue(client?.name));
    const [document, setDocument] = useState(toInputValue(client?.document));
    const [phone, setPhone] = useState(toInputValue(client?.phone));
    const [residentialAddress, setResidentialAddress] = useState(toInputValue(client?.residential_address));
    const [notes, setNotes] = useState(toInputValue(client?.notes));
    const [localError, setLocalError] = useState<string | null>(null);

    const firstValidationMessage = useMemo(() => {
        if (!validationErrors) {
            return null;
        }

        return Object.values(validationErrors).flat()[0] ?? null;
    }, [validationErrors]);

    async function handleSubmit() {
        if (!name.trim()) {
            setLocalError('Informe o nome do cliente.');
            return;
        }

        setLocalError(null);

        await onSubmit({
            type,
            name: name.trim(),
            document: emptyToNull(document),
            phone: emptyToNull(phone),
            residential_address: emptyToNull(residentialAddress),
            notes: emptyToNull(notes),
        });
    }

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
            <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Tipo</Text>
            <View className="flex-row gap-2">
                {clientTypes.map((item) => {
                    const active = type === item.value;

                    return (
                        <Pressable key={item.value} onPress={() => setType(item.value)} className="flex-1 active:opacity-80">
                            <View className={active ? 'h-11 items-center justify-center rounded-2xl bg-blue-600' : 'h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}>
                                <Text className={active ? 'text-sm font-bold text-white' : 'text-sm font-bold text-slate-600 dark:text-slate-300'}>{item.label}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            <Field label="Nome" value={name} onChangeText={setName} error={validationErrors?.name?.[0]} required />
            <Field label="Documento" value={document} onChangeText={setDocument} error={validationErrors?.document?.[0]} />
            <Field label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={validationErrors?.phone?.[0]} />
            <Field label="Endereço residencial" value={residentialAddress} onChangeText={setResidentialAddress} error={validationErrors?.residential_address?.[0]} />
            <Field label="Observações" value={notes} onChangeText={setNotes} error={validationErrors?.notes?.[0]} multiline />

            {localError || firstValidationMessage ? (
                <View className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/40">
                    <Text className="text-sm font-medium text-red-600 dark:text-red-300">{localError ?? firstValidationMessage}</Text>
                </View>
            ) : null}

            <Pressable onPress={handleSubmit} disabled={submitting} className="mt-5 active:opacity-80">
                <View className={`h-12 items-center justify-center rounded-2xl bg-blue-600 ${submitting ? 'opacity-70' : ''}`}>
                    {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white">{submitLabel}</Text>}
                </View>
            </Pressable>
        </ScrollView>
    );
}

function Field({
    label,
    value,
    onChangeText,
    error,
    keyboardType,
    multiline = false,
    required = false,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    error?: string;
    keyboardType?: 'default' | 'phone-pad';
    multiline?: boolean;
    required?: boolean;
}) {
    return (
        <View className="mt-4">
            <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {label}
                {required ? ' *' : ''}
            </Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                placeholderTextColor="#94A3B8"
                className={
                    multiline
                        ? 'min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white'
                        : 'h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white'
                }
            />
            {error ? <Text className="mt-2 text-xs font-semibold text-red-500">{error}</Text> : null}
        </View>
    );
}
