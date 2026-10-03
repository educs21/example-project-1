import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentStreak, dayKey, isDone, progressOn, type Habit } from '@/lib/habit-logic';

type Props = {
  habit: Habit;
  onTrack: (delta: 1 | -1) => void;
  onLongPress: () => void;
};

export function HabitCard({ habit, onTrack, onLongPress }: Props) {
  const theme = useTheme();
  const today = dayKey();
  const done = isDone(habit, today);
  const progress = progressOn(habit, today);
  const streak = currentStreak(habit);
  const isCount = habit.type === 'count';

  // Pop the check badge whenever the habit flips to done.
  const pop = useSharedValue(1);
  useEffect(() => {
    if (done) pop.value = withSequence(withSpring(1.35, { damping: 6 }), withSpring(1));
  }, [done, pop]);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const body = (
    <>
      <Animated.View
        style={[
          styles.badge,
          done
            ? { backgroundColor: Palette.success, borderColor: Palette.success }
            : { borderColor: theme.textSecondary },
          badgeStyle,
        ]}>
        <ThemedText style={done ? styles.badgeDone : styles.emoji}>{done ? '✓' : habit.emoji}</ThemedText>
      </Animated.View>

      <View style={styles.flex}>
        <ThemedText style={done && styles.doneText}>{habit.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {streak > 0 ? `🔥 ${streak} day streak` : 'No streak yet'}
          {isCount ? ` · ${progress}/${habit.target} today` : ''}
        </ThemedText>
        {isCount && (
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.fill,
                { width: `${(progress / habit.target) * 100}%`, backgroundColor: done ? Palette.success : Palette.accent },
              ]}
            />
          </View>
        )}
      </View>

      {isCount && (
        <View style={styles.buttons}>
          <Pressable
            accessibilityLabel={`Remove one ${habit.name}`}
            onPress={() => onTrack(-1)}
            disabled={progress === 0}
            style={[styles.round, { backgroundColor: theme.backgroundSelected, opacity: progress === 0 ? 0.4 : 1 }]}>
            <ThemedText type="subtitle">−</ThemedText>
          </Pressable>
          <Pressable
            accessibilityLabel={`Add one ${habit.name}`}
            onPress={() => onTrack(1)}
            disabled={done}
            style={[styles.round, { backgroundColor: Palette.accent, opacity: done ? 0.4 : 1 }]}>
            <ThemedText type="subtitle" style={styles.plus}>
              +
            </ThemedText>
          </Pressable>
        </View>
      )}
    </>
  );

  const cardStyle = [styles.card, { backgroundColor: theme.backgroundElement }];

  // A once-a-day habit is one big tap target; a count habit uses its +/- buttons.
  return isCount ? (
    <Pressable onLongPress={onLongPress} style={cardStyle}>
      {body}
    </Pressable>
  ) : (
    <Pressable
      onPress={() => onTrack(done ? -1 : 1)}
      onLongPress={onLongPress}
      accessibilityLabel={`${habit.name}, ${done ? 'done' : 'not done'}`}
      style={cardStyle}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 16 },
  badge: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22, lineHeight: 28 },
  badgeDone: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: 700 },
  doneText: { textDecorationLine: 'line-through', opacity: 0.6 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  fill: { height: '100%', borderRadius: 3 },
  buttons: { flexDirection: 'row', gap: Spacing.two },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  plus: { color: '#fff' },
});
