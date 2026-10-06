import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FormScreen({ title, children }: { title: string; children: ReactNode }) {
  return <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950"><KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pt-4 pb-12"><Pressable onPress={() => router.back()} className="mb-4"><Text className="font-bold text-blue-600">‹ Voltar</Text></Pressable><Text className="mb-5 text-2xl font-bold text-slate-950 dark:text-white">{title}</Text>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function Field({ label, value, onChange, numeric = false, multiline = false }: { label: string; value: string; onChange: (value: string) => void; numeric?: boolean; multiline?: boolean }) {
  return <View className="mb-4"><Text className="mb-2 font-semibold text-slate-600 dark:text-slate-300">{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} autoCapitalize="none" className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white" /></View>;
}
export function Button({ label, onPress, busy = false, disabled = false }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  return <Pressable disabled={busy || disabled} onPress={onPress} className={`my-2 min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 ${busy || disabled ? 'opacity-50' : ''}`}>{busy ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">{label}</Text>}</Pressable>;
}
export function ErrorText({ message }: { message: string | null }) {
  return message ? <Text accessibilityRole="alert" className="my-3 text-red-600 dark:text-red-400">{message}</Text> : null;
}
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} className={`mb-2 mr-2 rounded-2xl border px-4 py-3 ${selected ? 'border-blue-600 bg-blue-600' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}><Text className={selected ? 'font-bold text-white' : 'text-slate-700 dark:text-slate-200'}>{label}</Text></Pressable>;
}
