import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';

export function ResponsiveContainer({
  children,
  maxWidth,
}: {
  children: ReactNode;
  maxWidth?: number;
}) {
  const { isTablet, isWideTablet } = useResponsive();
  const resolvedMaxWidth = maxWidth ?? (isWideTablet ? 1180 : isTablet ? 860 : undefined);

  return (
    <View
      style={{
        alignSelf: 'center',
        width: '100%',
        maxWidth: resolvedMaxWidth,
      }}
    >
      {children}
    </View>
  );
}

export function ResponsiveColumns({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  const { isLandscape, isTablet } = useResponsive();
  const twoColumns = isTablet && isLandscape;

  return (
    <View
      style={{
        flexDirection: twoColumns ? 'row' : 'column',
        gap: 20,
      }}
    >
      <View style={{ flex: 1 }}>{left}</View>
      <View style={{ flex: 1 }}>{right}</View>
    </View>
  );
}
