import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import {
  DEFAULT_STATE,
  challengeStatus,
  dayKey,
  migrateV1,
  newId,
  type AppState,
  type Habit,
  type HabitInput,
  type Reminder,
  type Settings,
} from '@/lib/habit-logic';
import { syncReminders } from '@/lib/notifications';

const STORAGE_KEY = 'habits.v2';
const LEGACY_KEY = 'habits.v1';

/** What a `track` call did, so the UI can pick the right reward. */
export type TrackResult = 'none' | 'step' | 'complete' | 'challenge';

type HabitsContextValue = {
  loaded: boolean;
  onboarded: boolean;
  habits: Habit[];
  challenge: AppState['challenge'];
  settings: Settings;
  track: (id: string, delta: 1 | -1) => TrackResult;
  addHabit: (input: HabitInput) => string;
  removeHabit: (id: string) => void;
  setReminder: (id: string, reminder: Reminder | null) => void;
  startChallenge: (habitId: string, length?: number) => void;
  completeOnboarding: (input: HabitInput, challengeLength?: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const HabitsContext = createContext<HabitsContextValue | null>(null);

async function loadState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const saved = JSON.parse(raw) as AppState;
    return { ...DEFAULT_STATE, ...saved, settings: { ...DEFAULT_STATE.settings, ...saved.settings } };
  }
  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  return legacy ? migrateV1(JSON.parse(legacy)) : DEFAULT_STATE;
}

function makeHabit(input: HabitInput): Habit {
  return {
    id: newId(),
    name: input.name.trim(),
    emoji: input.emoji,
    type: input.type,
    target: input.type === 'daily' ? 1 : Math.max(2, input.target),
    createdAt: dayKey(),
    reminder: input.reminder,
    logs: {},
  };
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadState()
      .then(setState)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  // Re-schedule reminders only when something that affects them changes, not on every tap.
  const reminderPlan = JSON.stringify(
    state.habits
      .filter((h) => h.reminder)
      .map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, ...h.reminder })),
  );
  useEffect(() => {
    if (loaded) syncReminders(JSON.parse(reminderPlan), state.settings.reminders);
  }, [loaded, reminderPlan, state.settings.reminders]);

  const track = (id: string, delta: 1 | -1): TrackResult => {
    const habit = state.habits.find((h) => h.id === id);
    if (!habit) return 'none';

    const today = dayKey();
    const previous = habit.logs[today] ?? 0;
    const next = Math.min(habit.target, Math.max(0, previous + delta));
    if (next === previous) return 'none';

    setState((s) => ({
      ...s,
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, logs: { ...h.logs, [today]: next } } : h,
      ),
    }));

    if (delta < 0) return 'none';
    if (next < habit.target) return 'step';

    const { challenge } = state;
    if (challenge && challenge.habitId === id && !challenge.celebrated) {
      const updated = { ...habit, logs: { ...habit.logs, [today]: next } };
      if (challengeStatus(challenge, [updated])?.state === 'completed') {
        setState((s) => ({
          ...s,
          challenge: s.challenge && { ...s.challenge, celebrated: true },
        }));
        return 'challenge';
      }
    }
    return 'complete';
  };

  const addHabit = (input: HabitInput) => {
    const habit = makeHabit(input);
    setState((s) => ({ ...s, habits: [...s.habits, habit] }));
    return habit.id;
  };

  const removeHabit = (id: string) =>
    setState((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
      challenge: s.challenge?.habitId === id ? null : s.challenge,
    }));

  const setReminder = (id: string, reminder: Reminder | null) =>
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? { ...h, reminder } : h)),
    }));

  const startChallenge = (habitId: string, length = 3) =>
    setState((s) => ({
      ...s,
      challenge: { habitId, startDay: dayKey(), length, celebrated: false },
    }));

  const completeOnboarding = (input: HabitInput, challengeLength = 3) => {
    const habit = makeHabit(input);
    setState((s) => ({
      ...s,
      onboarded: true,
      habits: [...s.habits, habit],
      challenge: { habitId: habit.id, startDay: dayKey(), length: challengeLength, celebrated: false },
    }));
  };

  const updateSettings = (patch: Partial<Settings>) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  return (
    <HabitsContext
      value={{
        loaded,
        onboarded: state.onboarded,
        habits: state.habits,
        challenge: state.challenge,
        settings: state.settings,
        track,
        addHabit,
        removeHabit,
        setReminder,
        startChallenge,
        completeOnboarding,
        updateSettings,
      }}>
      {children}
    </HabitsContext>
  );
}

export function useHabits(): HabitsContextValue {
  const value = use(HabitsContext);
  if (!value) throw new Error('useHabits must be used inside <HabitsProvider>');
  return value;
}
