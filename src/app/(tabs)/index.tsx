import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Celebration, type CelebrationData } from '@/components/celebration';
import { ChallengeBanner } from '@/components/challenge-banner';
import { HabitCard } from '@/components/habit-card';
import { HabitForm } from '@/components/habit-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { reward } from '@/lib/feedback';
import { challengeStatus, dayKey, isDone, type Habit } from '@/lib/habit-logic';
import { remindersSupported, requestReminderPermission } from '@/lib/notifications';

export default function TodayScreen() {
  const theme = useTheme();
  const { habits, challenge, settings, track, addHabit, removeHabit, startChallenge } = useHabits();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const today = dayKey();
  const doneCount = habits.filter((h) => isDone(h, today)).length;
  const status = challenge ? challengeStatus(challenge, habits) : null;
  const challengeHabit = challenge && habits.find((h) => h.id === challenge.habitId);

  const onTrack = (habit: Habit, delta: 1 | -1) => {
    const result = track(habit.id, delta);
    if (result === 'none') return;
    reward(result, settings);
    if (result === 'complete') {
      setCelebration({ kind: 'complete', title: 'Nice work!', subtitle: `${habit.name} done` });
    } else if (result === 'challenge' && challenge) {
      setCelebration({
        kind: 'challenge',
        title: `${challenge.length}-day challenge complete!`,
        subtitle: `${challenge.length} days of ${habit.name} in a row. That's how habits are built.`,
      });
    }
  };

  const confirmRemove = (habit: Habit) =>
    confirmAction('Delete habit', `Delete "${habit.name}" and its history?`, 'Delete', () =>
      removeHabit(habit.id),
    );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <ThemedText type="subtitle">Today</ThemedText>
          <ThemedText themeColor="textSecondary">
            {habits.length === 0 ? 'Add a habit to get started' : `${doneCount} of ${habits.length} done`}
          </ThemedText>
        </View>
        <Pressable onPress={() => setSheetOpen(true)} accessibilityLabel="New habit" style={styles.add}>
          <ThemedText style={styles.addText}>+ New</ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          challenge && status && challengeHabit ? (
            <ChallengeBanner
              challenge={challenge}
              status={status}
              habitName={challengeHabit.name}
              onRestart={() => startChallenge(challenge.habitId, challenge.length)}
              onNext={() => startChallenge(challenge.habitId, 7)}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <HabitCard habit={item} onTrack={(d) => onTrack(item, d)} onLongPress={() => confirmRemove(item)} />
        )}
        ListFooterComponent={
          habits.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              Long-press a habit to delete it
            </ThemedText>
          ) : null
        }
      />

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={styles.sheetHeader}>
              <ThemedText type="subtitle">New habit</ThemedText>
              <Pressable onPress={() => setSheetOpen(false)} accessibilityLabel="Close">
                <ThemedText type="subtitle" themeColor="textSecondary">
                  ✕
                </ThemedText>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HabitForm
                submitLabel="Add habit"
                showReminder={remindersSupported}
                onSubmit={async (input) => {
                  if (input.reminder) await requestReminderPermission();
                  addHabit(input);
                  setSheetOpen(false);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {celebration && <Celebration data={celebration} onDone={() => setCelebration(null)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.four, paddingBottom: Spacing.three },
  add: { backgroundColor: Palette.accent, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 10 },
  addText: { color: '#fff', fontWeight: 700 },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.two },
  hint: { textAlign: 'center', paddingTop: Spacing.three },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
