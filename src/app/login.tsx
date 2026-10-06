import { LockKeyhole, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/services/resources';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await signIn(email.trim(), password);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-5">
        <View className="rounded-[32px] bg-blue-600 p-5">
          <Text className="text-sm font-semibold uppercase tracking-wide text-blue-100">Locafy</Text>
          <Text className="mt-2 text-3xl font-bold text-white">Entrar</Text>
          <Text className="mt-2 text-base text-blue-100">Acesse a operação mobile da sua locadora.</Text>
        </View>

        <View className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <View className="flex-row items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4">
            <Mail size={18} color="#94A3B8" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              className="flex-1 py-4 text-base font-medium text-white"
            />
          </View>

          <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4">
            <LockKeyhole size={18} color="#94A3B8" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor="#64748B"
              secureTextEntry
              textContentType="password"
              className="flex-1 py-4 text-base font-medium text-white"
            />
          </View>

          {error ? <Text className="mt-3 text-sm font-medium text-red-400">{error}</Text> : null}

          <Pressable onPress={handleSubmit} disabled={submitting} className="mt-5 active:opacity-80">
            <View className={`h-12 items-center justify-center rounded-2xl bg-blue-600 ${submitting ? 'opacity-70' : ''}`}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white">Entrar</Text>}
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
