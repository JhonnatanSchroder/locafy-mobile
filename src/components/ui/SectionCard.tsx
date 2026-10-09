import type { ReactNode } from 'react';
import { View } from 'react-native';

export function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </View>
  );
}
