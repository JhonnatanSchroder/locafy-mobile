import '@/global.css';

import { type Href, DarkTheme, DefaultTheme, Stack, ThemeProvider, router, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const segments = useSegments();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    const isLoginRoute = pathname === '/login' || segments[0] === 'login';

    if (!user && !isLoginRoute) {
      router.replace('/login' as Href);
      return;
    }

    if (user && isLoginRoute) {
      router.replace('/' as Href);
    }
  }, [loading, pathname, segments, user]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contracts/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="clients/new" options={{ presentation: 'card' }} />
        <Stack.Screen name="clients/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="clients/[id]/edit" options={{ presentation: 'card' }} />
      </Stack>
      {loading ? (
        <View className="absolute inset-0 items-center justify-center bg-slate-950">
          <ActivityIndicator />
          <Text className="mt-3 text-sm text-slate-400">Restaurando sessão...</Text>
        </View>
      ) : null}
    </ThemeProvider>
  );
}
