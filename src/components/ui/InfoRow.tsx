import { Text, View } from 'react-native';

export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800">
      <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</Text>
      <Text className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{value || 'Não informado'}</Text>
    </View>
  );
}
