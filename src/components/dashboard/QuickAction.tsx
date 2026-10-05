import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export function QuickAction({ label, icon: Icon, onPress }: { label: string; icon: LucideIcon; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="w-[48%] active:opacity-80">
      <View className="rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <View className="mb-2 h-9 w-9 items-center justify-center rounded-2xl bg-blue-600">
          <Icon size={19} color="#FFFFFF" />
        </View>
        <Text className="text-sm font-bold text-slate-950 dark:text-white">{label}</Text>
      </View>
    </Pressable>
  );
}
