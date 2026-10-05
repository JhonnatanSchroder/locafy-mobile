import { Text, View } from 'react-native';

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="text-lg font-bold text-slate-950 dark:text-white">{title}</Text>
      {action ? <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">{action}</Text> : null}
    </View>
  );
}
