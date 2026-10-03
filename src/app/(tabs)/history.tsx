import { FlatList, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { addDays, dayKey, dayTotals, isDone, lastDays, parseDay, progressOn } from '@/lib/habit-logic';

function dayLabel(day: string): string {
  const today = dayKey();
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  return parseDay(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const theme = useTheme();
  const { habits } = useHabits();

  const days = lastDays(60)
    .reverse()
    .filter((day) => dayTotals(habits, day).active.length > 0);

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">History</ThemedText>
        <ThemedText themeColor="textSecondary">Everything you&apos;ve logged, newest first</ThemedText>
      </View>

      <FlatList
        data={days}
        keyExtractor={(day) => day}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<ThemedText themeColor="textSecondary">Nothing logged yet.</ThemedText>}
        renderItem={({ item: day }) => {
          const { active, done } = dayTotals(habits, day);
          return (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.cardHeader}>
                <ThemedText type="smallBold">{dayLabel(day)}</ThemedText>
                <ThemedText
                  type="smallBold"
                  style={{ color: done === active.length ? Palette.success : theme.textSecondary }}>
                  {done}/{active.length}
                </ThemedText>
              </View>
              {active.map((habit) => {
                const complete = isDone(habit, day);
                const progress = progressOn(habit, day);
                return (
                  <View key={habit.id} style={styles.entry}>
                    <ThemedText style={{ color: complete ? Palette.success : theme.textSecondary }}>
                      {complete ? '✓' : '○'}
                    </ThemedText>
                    <ThemedText style={styles.entryName}>
                      {habit.emoji} {habit.name}
                    </ThemedText>
                    {habit.type === 'count' && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {progress}/{habit.target}
                      </ThemedText>
                    )}
                  </View>
                );
              })}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.four, paddingBottom: Spacing.three },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.two },
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  entryName: { flex: 1 },
});
