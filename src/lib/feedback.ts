import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import type { Settings } from '@/lib/habit-logic';

export type RewardKind = 'step' | 'complete' | 'challenge';

const SOURCES = {
  chime: require('../../assets/sounds/chime.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
};

const players: Partial<Record<keyof typeof SOURCES, AudioPlayer>> = {};

function playSound(name: keyof typeof SOURCES) {
  try {
    const player = (players[name] ??= createAudioPlayer(SOURCES[name]));
    Promise.resolve(player.seekTo(0)).catch(() => {});
    player.play();
  } catch {
    // Audio is a nice-to-have; never let it break tracking.
  }
}

function haptic(run: () => Promise<void>) {
  run().catch(() => {});
}

/** Fires the haptic + sound that rewards a tap. Safe to call on web, where haptics may be unsupported. */
export function reward(kind: RewardKind, settings: Pick<Settings, 'sound' | 'haptics'>) {
  if (settings.haptics) {
    if (kind === 'step') {
      haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    } else {
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    }
    if (kind === 'challenge') {
      setTimeout(() => haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 200);
      setTimeout(() => haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 400);
    }
  }
  if (settings.sound) playSound(kind === 'challenge' ? 'fanfare' : 'chime');
}

export function tapFeedback(settings: Pick<Settings, 'haptics'>) {
  if (settings.haptics) haptic(() => Haptics.selectionAsync());
}
