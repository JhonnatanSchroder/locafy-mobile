import { AlertTriangle } from 'lucide-react-native';
import { Text, View } from 'react-native';

export function AttentionCard({ items }: { items: string[] }) {
  return (
    <View className="rounded-3xl border border-amber-300 bg-white p-4 dark:border-amber-800 dark:bg-slate-900">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60">
          <AlertTriangle size={18} color="#D97706" />
        </View>
        <Text className="text-base font-bold text-slate-950 dark:text-white">Operação em alerta</Text>
      </View>
      <View className="gap-2">
        {items.map((item) => (
          <View key={item} className="flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <Text className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
