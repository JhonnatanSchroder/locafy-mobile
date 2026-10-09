import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';

export function StatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
}) {
  const { isWideTablet, isTablet } = useResponsive();
  const basis = isWideTablet ? '23.5%' : isTablet ? '48%' : '48%';

  return (
    <View style={{ flexBasis: basis }} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="mb-4 h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950">
        <Icon size={20} color="#2563EB" />
      </View>
      <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</Text>
      <Text className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</Text>
      <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">{caption}</Text>
    </View>
  );
}
