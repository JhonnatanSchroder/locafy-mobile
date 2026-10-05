import '@/global.css';

import { type Href, DarkTheme, DefaultTheme, Stack, ThemeProvider, router, useSegments } from 'expo-router';
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
  const segments = useSegments();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    const isLoginRoute = segments[0] === 'login';

    if (!user && !isLoginRoute) {
      router.replace('/login' as Href);
      return;
    }

    if (user && isLoginRoute) {
      router.replace('/(tabs)' as Href);
    }
  }, [loading, segments, user]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator />
        <Text className="mt-3 text-sm text-slate-400">Restaurando sessão...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contracts/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </ThemeProvider>
  );
}
