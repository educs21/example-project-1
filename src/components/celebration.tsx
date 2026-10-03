import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CelebrationData = {
  kind: 'complete' | 'challenge';
  title: string;
  subtitle?: string;
};

const COLORS = [Palette.accent, Palette.success, Palette.streak, Palette.gold, '#ff375f', '#af52de'];

type PieceConfig = { x: number; delay: number; duration: number; size: number; color: string; spin: number; drift: number };

function Piece({ config, height }: { config: PieceConfig; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: config.duration, easing: Easing.in(Easing.quad) }),
    );
  }, [progress, config]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * progress.value,
    transform: [
      { translateY: -20 + progress.value * (height + 40) },
      { translateX: Math.sin(progress.value * 6) * config.drift },
      { rotate: `${progress.value * config.spin}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: config.x, width: config.size, height: config.size * 0.6, backgroundColor: config.color },
        style,
      ]}
    />
  );
}

function Confetti({ count }: { count: number }) {
  const { width, height } = useWindowDimensions();
  const [pieces] = useState<PieceConfig[]>(() =>
    Array.from({ length: count }, () => ({
      x: Math.random() * width,
      delay: Math.random() * 400,
      duration: 1400 + Math.random() * 1200,
      size: 8 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: 360 + Math.random() * 720,
      drift: 10 + Math.random() * 30,
    })),
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((config, i) => (
        <Piece key={i} config={config} height={height} />
      ))}
    </View>
  );
}

/** Full-screen reward: a quick confetti burst for a habit, a big card for a finished challenge. */
export function Celebration({ data, onDone }: { data: CelebrationData; onDone: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(0.4);
  const isChallenge = data.kind === 'challenge';

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 140 });
    if (!isChallenge) {
      const timer = setTimeout(onDone, 1800);
      return () => clearTimeout(timer);
    }
  }, [scale, isChallenge, onDone]);

  const badge = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.overlay} pointerEvents={isChallenge ? 'auto' : 'none'}>
      {isChallenge && <View style={styles.backdrop} />}
      <Confetti count={isChallenge ? 80 : 28} />
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundElement },
          isChallenge ? styles.cardBig : styles.cardSmall,
          badge,
        ]}>
        <ThemedText style={isChallenge ? styles.trophy : styles.check}>
          {isChallenge ? '🏆' : '✓'}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.centered}>
          {data.title}
        </ThemedText>
        {data.subtitle && (
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {data.subtitle}
          </ThemedText>
        )}
        {isChallenge && (
          <Pressable onPress={onDone} style={styles.cta}>
            <ThemedText style={styles.ctaText}>Awesome!</ThemedText>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  piece: { position: 'absolute', top: 0, borderRadius: 2 },
  card: { alignItems: 'center', borderRadius: 24, gap: Spacing.two },
  cardSmall: { paddingVertical: Spacing.four, paddingHorizontal: Spacing.five, minWidth: 180 },
  cardBig: { padding: Spacing.five, marginHorizontal: Spacing.four, maxWidth: 360 },
  check: { color: Palette.success, fontSize: 56, lineHeight: 64, fontWeight: 700 },
  trophy: { fontSize: 72, lineHeight: 84 },
  centered: { textAlign: 'center' },
  cta: {
    backgroundColor: Palette.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.three,
  },
  ctaText: { color: '#fff', fontWeight: 700, fontSize: 17 },
});
