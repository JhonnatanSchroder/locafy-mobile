import '@/global.css';

import { type Href, DarkTheme, DefaultTheme, Stack, ThemeProvider, router, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';

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
  const { loading, user, sessionError, restoreSession, signOut } = useAuth();

  useEffect(() => {
    if (loading || sessionError) {
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
  }, [loading, pathname, segments, sessionError, user]);

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
      {loading || sessionError ? (
        <View className="absolute inset-0 items-center justify-center bg-slate-950">
          {loading ? <ActivityIndicator /> : null}
          <Text className="mt-3 px-5 text-center text-sm text-slate-400">{sessionError ?? 'Restaurando sessão...'}</Text>
          {!loading && sessionError ? <><Pressable onPress={restoreSession} className="mt-4 rounded-2xl bg-blue-600 px-5 py-3"><Text className="font-bold text-white">Tentar novamente</Text></Pressable><Pressable onPress={signOut} className="mt-4"><Text className="text-blue-400">Voltar ao login</Text></Pressable></> : null}
        </View>
      ) : null}
    </ThemeProvider>
  );
}
