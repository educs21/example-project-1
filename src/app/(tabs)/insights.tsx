import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { consistency, currentStreak, dayTotals, lastDays, parseDay } from '@/lib/habit-logic';

const CHART_HEIGHT = 140;

const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function InsightsScreen() {
  const theme = useTheme();
  const { habits } = useHabits();
  const [range, setRange] = useState<7 | 30>(7);

  const days = lastDays(range);
  const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(h)), 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <ThemedText type="subtitle">Insights</ThemedText>
          <ThemedText themeColor="textSecondary">How consistent you&apos;ve been</ThemedText>
        </View>

        <View style={styles.stats}>
          <Stat label="Best streak" value={`🔥 ${bestStreak}`} />
          <Stat label="Last 7 days" value={percent(consistency(habits, lastDays(7)))} />
          <Stat label="Last 30 days" value={percent(consistency(habits, lastDays(30)))} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.chartHeader}>
            <ThemedText type="smallBold">Daily completion</ThemedText>
            <View style={styles.toggle}>
              {([7, 30] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRange(r)}
                  style={[styles.toggleItem, r === range && { backgroundColor: Palette.accent }]}>
                  <ThemedText type="smallBold" style={r === range && styles.onAccent}>
                    {r}d
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.chart}>
            {days.map((day, i) => {
              const { active, done } = dayTotals(habits, day);
              const fraction = active.length === 0 ? 0 : done / active.length;
              const showLabel = range === 7 || (days.length - 1 - i) % 5 === 0;
              return (
                <View key={day} style={styles.barColumn}>
                  <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${fraction * 100}%`,
                          backgroundColor: fraction === 1 ? Palette.success : Palette.accent,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.barLabel}>
                    {showLabel
                      ? range === 7
                        ? parseDay(day).toLocaleDateString(undefined, { weekday: 'narrow' })
                        : parseDay(day).getDate()
                      : ' '}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        <ThemedText type="smallBold">By habit</ThemedText>
        {habits.length === 0 && <ThemedText themeColor="textSecondary">No habits yet.</ThemedText>}
        {habits.map((habit) => (
          <View key={habit.id} style={[styles.habitRow, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.flex}>
              {habit.emoji} {habit.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              🔥 {currentStreak(habit)} · {percent(consistency([habit], days))}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="subtitle">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, borderRadius: 16, padding: Spacing.three, gap: 2 },
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { flexDirection: 'row', gap: Spacing.one },
  toggleItem: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  onAccent: { color: '#fff' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: CHART_HEIGHT + 24 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: '100%', height: CHART_HEIGHT, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11, lineHeight: 16 },
  habitRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: Spacing.three },
});
