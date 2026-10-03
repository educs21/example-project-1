import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatReminder, type Reminder } from '@/lib/habit-logic';

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

/** Simple time picker that works everywhere: hours step by 1, minutes by 15. */
export function TimeStepper({ value, onChange }: { value: Reminder; onChange: (r: Reminder) => void }) {
  const shift = (minutes: number) => {
    const total = (value.hour * 60 + value.minute + minutes + 1440) % 1440;
    onChange({ hour: Math.floor(total / 60), minute: total % 60 });
  };

  return (
    <View style={styles.row}>
      <StepButton label="−1h" onPress={() => shift(-60)} />
      <StepButton label="−15m" onPress={() => shift(-15)} />
      <ThemedText style={[styles.time, { color: Palette.accent }]}>{formatReminder(value)}</ThemedText>
      <StepButton label="+15m" onPress={() => shift(15)} />
      <StepButton label="+1h" onPress={() => shift(60)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  button: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  time: { fontSize: 18, fontWeight: 700, minWidth: 84, textAlign: 'center' },
});
