import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';
import { formatDateBR, formatDateTimeBR } from '@/utils/formatDate';

type DateMode = 'date' | 'time';

type DateFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
};

export function DateField({ label, value, onChange }: DateFieldProps) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const pickerValue = value ?? new Date();

  function handleChange(
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    if (Platform.OS === 'android') setVisible(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    onChange(selectedDate);
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </Text>
      <Pressable
        onPress={() => setVisible(true)}
        className="min-h-12 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
      >
        <CalendarDays size={18} color={theme.iconSecondary} />
        <Text className="font-semibold text-slate-950 dark:text-white">
          {formatDateBR(value)}
        </Text>
      </Pressable>
      {visible ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

export function DateTimeField({
  label,
  value,
  onChange,
}: DateFieldProps) {
  const [mode, setMode] = useState<DateMode | null>(null);
  const theme = useTheme();
  const pickerValue = value ?? new Date();

  function handleChange(
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    if (Platform.OS === 'android') setMode(null);
    if (event.type === 'dismissed' || !selectedDate) return;
    onChange(selectedDate);
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => setMode('date')}
          className="min-h-12 flex-1 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <CalendarDays size={18} color={theme.iconSecondary} />
          <Text className="font-semibold text-slate-950 dark:text-white">
            {formatDateBR(value)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('time')}
          className="min-h-12 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <Clock size={18} color={theme.iconSecondary} />
          <Text className="font-semibold text-slate-950 dark:text-white">
            {formatDateTimeBR(value).split(' às ')[1] ?? '00:00'}
          </Text>
        </Pressable>
      </View>
      {mode ? (
        <DateTimePicker
          value={pickerValue}
          mode={mode}
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
