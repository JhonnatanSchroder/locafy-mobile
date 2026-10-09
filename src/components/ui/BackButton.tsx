import { Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';

export function BackButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-900">
      <ArrowLeft size={22} color={theme.primary} />
    </Pressable>
  );
}
