import { Text } from 'react-native';

import { formatCurrency } from '@/utils/formatCurrency';

export function MoneyValue({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <Text className={muted ? 'text-sm font-semibold text-slate-500 dark:text-slate-400' : 'text-lg font-bold text-slate-950 dark:text-white'}>
      {formatCurrency(value)}
    </Text>
  );
}
