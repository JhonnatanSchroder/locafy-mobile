import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import type { LocalContractPhoto } from '@/services/contractAttachments';

const MAX_PHOTOS = 10;

export function ContractPhotoPicker({
  photos,
  onChange,
  disabled = false,
  helperText = 'As fotos serão enviadas após criar o contrato.',
}: {
  photos: LocalContractPhoto[];
  onChange: (photos: LocalContractPhoto[]) => void;
  disabled?: boolean;
  helperText?: string;
}) {
  const remaining = MAX_PHOTOS - photos.length;

  async function addFromCamera() {
    if (remaining <= 0) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Autorize o acesso à câmera para tirar fotos do contrato.');
      return;
    }
    await pick(() => ImagePicker.launchCameraAsync(pickerOptions(false)));
  }

  async function addFromLibrary() {
    if (remaining <= 0) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Autorize o acesso à galeria para escolher fotos do contrato.');
      return;
    }
    await pick(() => ImagePicker.launchImageLibraryAsync(pickerOptions(true)));
  }

  async function pick(openPicker: () => Promise<ImagePicker.ImagePickerResult>) {
    try {
      const result = await openPicker();
      if (result.canceled) return;
      const selected = result.assets.slice(0, remaining).map(toLocalPhoto);
      onChange([...photos, ...selected]);
    } catch {
      Alert.alert('Não foi possível adicionar fotos', 'Tente novamente em instantes.');
    }
  }

  function chooseSource() {
    if (disabled || remaining <= 0) return;
    Alert.alert('Adicionar fotos', undefined, [
      { text: 'Tirar foto', onPress: () => { void addFromCamera(); } },
      { text: 'Escolher da galeria', onPress: () => { void addFromLibrary(); } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return <View className="mb-4">
    <View className="mb-3 flex-row items-center justify-between gap-3">
      <Text className="text-lg font-bold text-slate-950 dark:text-white">Fotos</Text>
      <Text className="text-sm font-semibold text-slate-500">{photos.length}/{MAX_PHOTOS}</Text>
    </View>
    <Pressable onPress={chooseSource} disabled={disabled || remaining <= 0} className={`mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40 ${disabled || remaining <= 0 ? 'opacity-50' : ''}`}>
      <View className="flex-row items-center justify-center gap-2">
        <ImagePlus size={18} color="#2563EB" />
        <Text className="font-bold text-blue-600 dark:text-blue-300">Adicionar fotos</Text>
      </View>
    </Pressable>
    <View className="flex-row flex-wrap gap-3">
      {photos.map(photo => <View key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
        <Image source={{ uri: photo.uri }} className="h-full w-full" resizeMode="cover" />
        <Pressable onPress={() => onChange(photos.filter(item => item.id !== photo.id))} disabled={disabled} className="absolute right-1 top-1 h-8 w-8 items-center justify-center rounded-full bg-black/60">
          <Trash2 size={15} color="#FFFFFF" />
        </Pressable>
      </View>)}
    </View>
    {photos.length ? <View className="mt-3 flex-row items-center gap-2"><Camera size={15} color="#64748B" /><Text className="flex-1 text-sm text-slate-500">{helperText}</Text></View> : null}
  </View>;
}

function pickerOptions(multiple: boolean): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? MAX_PHOTOS : 1,
    quality: 0.8,
  };
}

function toLocalPhoto(asset: ImagePicker.ImagePickerAsset, index: number): LocalContractPhoto {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = mimeType.split('/')[1] || 'jpg';
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
    uri: asset.uri,
    name: asset.fileName ?? `contrato-foto-${Date.now()}-${index}.${extension}`,
    mimeType,
    fileSize: asset.fileSize,
  };
}
