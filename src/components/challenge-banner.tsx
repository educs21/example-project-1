import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Challenge, ChallengeStatus } from '@/lib/habit-logic';

type Props = {
  challenge: Challenge;
  status: ChallengeStatus;
  habitName: string;
  onRestart: () => void;
  onNext: () => void;
};

export function ChallengeBanner({ challenge, status, habitName, onRestart, onNext }: Props) {
  const theme = useTheme();
  const { state, doneDays, length } = status;

  const title =
    state === 'completed'
      ? `🏆 ${length}-day challenge complete!`
      : state === 'failed'
        ? 'You missed a day'
        : `${length}-day challenge · Day ${Math.min(doneDays + (status.todayDone ? 0 : 1), length)} of ${length}`;

  const subtitle =
    state === 'completed'
      ? `You showed up for ${habitName} every day.`
      : state === 'failed'
        ? 'It happens. Start again and build the streak back up.'
        : status.todayDone
          ? 'Today is done. See you tomorrow!'
          : `Complete ${habitName} today to keep going.`;

  return (
    <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <View style={styles.dots}>
        {Array.from({ length: challenge.length }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i < doneDays ? Palette.success : theme.backgroundSelected }]}
          />
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {subtitle}
      </ThemedText>
      {state === 'failed' && (
        <Pressable onPress={onRestart} style={styles.action}>
          <ThemedText style={styles.actionText}>Restart challenge</ThemedText>
        </Pressable>
      )}
      {state === 'completed' && (
        <Pressable onPress={onNext} style={styles.action}>
          <ThemedText style={styles.actionText}>Go again: 7-day challenge</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  dots: { flexDirection: 'row', gap: Spacing.one + 2 },
  dot: { flex: 1, height: 8, borderRadius: 4 },
  action: { backgroundColor: Palette.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: 700 },
});
