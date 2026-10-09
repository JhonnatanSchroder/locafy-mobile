import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Variant = 'solid' | 'soft';

export function ClientAction({
  label,
  icon: Icon,
  onPress,
  disabled = false,
  variant = 'soft',
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
}) {
  const theme = useTheme();
  const iconColor = disabled ? theme.disabled : theme.primary;
  const textClass = variant === 'solid' ? 'text-blue-100' : 'text-blue-600 dark:text-blue-300';
  const backgroundClass = variant === 'solid' ? 'bg-white/10' : 'border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 items-center rounded-2xl px-2 py-3 active:opacity-80 ${backgroundClass} ${disabled ? 'opacity-35' : ''}`}
    >
      <Icon size={18} color={iconColor} />
      <Text className={`mt-1 text-xs font-bold ${textClass}`}>{label}</Text>
    </Pressable>
  );
}
