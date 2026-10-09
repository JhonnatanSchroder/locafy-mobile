import { useWindowDimensions } from 'react-native';

export const RESPONSIVE_BREAKPOINTS = {
  tablet: 768,
  wideTablet: 1024,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= RESPONSIVE_BREAKPOINTS.tablet;
  const isWideTablet = width >= RESPONSIVE_BREAKPOINTS.wideTablet;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isWideTablet,
  };
}
