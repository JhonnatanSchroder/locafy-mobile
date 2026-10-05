import { Activity, BarChart3, Boxes, LogOut, Settings, UserRound, Wrench } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';

const items = [
  { label: 'Produtos', icon: Boxes },
  { label: 'Equipamentos', icon: Wrench },
  { label: 'Relatórios', icon: BarChart3 },
  { label: 'Atividades', icon: Activity },
  { label: 'Configurações', icon: Settings },
  { label: 'Perfil', icon: UserRound },
];

export default function MorePlaceholder() {
  const { signOut, user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-5 pt-4 dark:bg-slate-950">
      <Text className="text-3xl font-bold text-slate-950 dark:text-white">Mais</Text>
      <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">Atalhos visuais para módulos futuros.</Text>

      <View className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <Text className="text-base font-bold text-slate-950 dark:text-white">{user?.name ?? 'Usuário'}</Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.email ?? 'Sessão ativa'}</Text>

        <Pressable onPress={signOut} className="mt-4 active:opacity-80">
          <View className="h-11 flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40">
            <LogOut size={17} color="#DC2626" />
            <Text className="text-sm font-bold text-red-600 dark:text-red-300">Sair</Text>
          </View>
        </Pressable>
      </View>

      <View className="mt-6 gap-3">
        {items.map(({ label, icon: Icon }) => (
          <View key={label} className="flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950">
              <Icon size={20} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-950 dark:text-white">{label}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">Placeholder desta primeira fase</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
