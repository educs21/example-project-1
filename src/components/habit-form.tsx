import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TimeStepper } from '@/components/time-stepper';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HabitInput, HabitType, Reminder } from '@/lib/habit-logic';

const EMOJIS = ['💧', '🏃', '📖', '🧘', '😴', '🥗', '✍️', '💪'];
const DEFAULT_REMINDER: Reminder = { hour: 9, minute: 0 };

type Props = {
  submitLabel: string;
  onSubmit: (input: HabitInput) => void;
  /** Shows the reminder controls. Turned off on web, where reminders can't be delivered. */
  showReminder?: boolean;
};

export function HabitForm({ submitLabel, onSubmit, showReminder = true }: Props) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [type, setType] = useState<HabitType>('daily');
  const [target, setTarget] = useState(3);
  const [remind, setRemind] = useState(true);
  const [time, setTime] = useState<Reminder>(DEFAULT_REMINDER);

  const canSubmit = name.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      name,
      emoji,
      type,
      target: type === 'daily' ? 1 : target,
      reminder: showReminder && remind ? time : null,
    });
  };

  return (
    <View style={styles.form}>
      <TextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={submit}
        placeholder="e.g. Drink water"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />

      <View style={styles.emojiRow}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={[
              styles.emoji,
              { backgroundColor: e === emoji ? Palette.accent : theme.backgroundElement },
            ]}>
            <ThemedText style={styles.emojiText}>{e}</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText type="smallBold" themeColor="textSecondary">
        How often?
      </ThemedText>
      <View style={styles.segment}>
        {(['daily', 'count'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[
              styles.segmentItem,
              { backgroundColor: t === type ? Palette.accent : theme.backgroundElement },
            ]}>
            <ThemedText type="smallBold" style={t === type && styles.onAccent}>
              {t === 'daily' ? 'Once a day' : 'Multiple times'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {type === 'count' && (
        <View style={styles.countRow}>
          <ThemedText>Times per day</ThemedText>
          <View style={styles.stepper}>
            <Pressable
              accessibilityLabel="Fewer times"
              onPress={() => setTarget((n) => Math.max(2, n - 1))}
              style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="subtitle">−</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">{target}</ThemedText>
            <Pressable
              accessibilityLabel="More times"
              onPress={() => setTarget((n) => Math.min(20, n + 1))}
              style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="subtitle">+</ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      {showReminder && (
        <>
          <View style={styles.countRow}>
            <ThemedText>Remind me daily</ThemedText>
            <Switch value={remind} onValueChange={setRemind} trackColor={{ true: Palette.accent }} />
          </View>
          {remind && <TimeStepper value={time} onChange={setTime} />}
        </>
      )}

      <Pressable
        onPress={submit}
        disabled={!canSubmit}
        style={[styles.submit, { opacity: canSubmit ? 1 : 0.4 }]}>
        <ThemedText style={styles.submitText}>{submitLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emoji: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22, lineHeight: 28 },
  segment: { flexDirection: 'row', gap: Spacing.two },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  onAccent: { color: '#fff' },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  submit: {
    backgroundColor: Palette.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitText: { color: '#fff', fontWeight: 700, fontSize: 17 },
});
