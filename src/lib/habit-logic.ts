export type HabitType = 'daily' | 'count';

export type Reminder = { hour: number; minute: number };

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  /** `daily` = once a day. `count` = needs `target` taps a day (e.g. 4 glasses of water). */
  type: HabitType;
  target: number;
  /** Local `YYYY-MM-DD` the habit was created. */
  createdAt: string;
  reminder: Reminder | null;
  /** Progress per local `YYYY-MM-DD` day. */
  logs: Record<string, number>;
};

export type Challenge = {
  habitId: string;
  startDay: string;
  length: number;
  /** True once the finish celebration has been shown. */
  celebrated: boolean;
};

export type Settings = { sound: boolean; haptics: boolean; reminders: boolean };

export type AppState = {
  version: 2;
  onboarded: boolean;
  habits: Habit[];
  challenge: Challenge | null;
  settings: Settings;
};

export const DEFAULT_STATE: AppState = {
  version: 2,
  onboarded: false,
  habits: [],
  challenge: null,
  settings: { sound: true, haptics: true, reminders: true },
};

export type HabitInput = {
  name: string;
  emoji: string;
  type: HabitType;
  target: number;
  reminder: Reminder | null;
};

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses a day key at local noon, which keeps day maths safe around DST changes. */
export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, amount: number): string {
  const date = parseDay(key);
  date.setDate(date.getDate() + amount);
  return dayKey(date);
}

/** The last `count` day keys ending at `end`, oldest first. */
export function lastDays(count: number, end: string = dayKey()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

export function progressOn(habit: Habit, day: string): number {
  return habit.logs[day] ?? 0;
}

export function isDone(habit: Habit, day: string): boolean {
  return progressOn(habit, day) >= habit.target;
}

/** Consecutive completed days ending today (or yesterday, if today isn't done yet). */
export function currentStreak(habit: Habit): number {
  let cursor = dayKey();
  if (!isDone(habit, cursor)) cursor = addDays(cursor, -1);

  let streak = 0;
  while (isDone(habit, cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Habits that existed on `day`, and how many of them were completed. */
export function dayTotals(habits: Habit[], day: string) {
  const active = habits.filter((h) => h.createdAt <= day);
  return { active, done: active.filter((h) => isDone(h, day)).length };
}

/** Average completion (0..1) across `days`, ignoring days with no habits yet. */
export function consistency(habits: Habit[], days: string[]): number {
  let sum = 0;
  let counted = 0;
  for (const day of days) {
    const { active, done } = dayTotals(habits, day);
    if (active.length === 0) continue;
    sum += done / active.length;
    counted += 1;
  }
  return counted === 0 ? 0 : sum / counted;
}

export type ChallengeStatus = {
  state: 'active' | 'completed' | 'failed';
  /** Challenge days completed so far. */
  doneDays: number;
  length: number;
  todayDone: boolean;
};

/** A challenge day counts when its habit is fully done; missing a past day fails the challenge. */
export function challengeStatus(
  challenge: Challenge,
  habits: Habit[],
  today: string = dayKey(),
): ChallengeStatus | null {
  const habit = habits.find((h) => h.id === challenge.habitId);
  if (!habit) return null;

  let doneDays = 0;
  let failed = false;
  for (let i = 0; i < challenge.length; i++) {
    const day = addDays(challenge.startDay, i);
    if (day > today) break;
    if (isDone(habit, day)) doneDays += 1;
    else if (day < today) failed = true;
  }

  const state = doneDays >= challenge.length ? 'completed' : failed ? 'failed' : 'active';
  return { state, doneDays, length: challenge.length, todayDone: isDone(habit, today) };
}

export function formatReminder({ hour, minute }: Reminder): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Converts the original v1 storage shape (`{ id, name, completions[] }[]`) to the v2 habit shape. */
export function migrateV1(raw: unknown): AppState {
  const habits: Habit[] = Array.isArray(raw)
    ? raw.map((item: { id: string; name: string; completions?: string[] }) => {
        const completions = item.completions ?? [];
        return {
          id: String(item.id),
          name: String(item.name),
          emoji: '✅',
          type: 'daily' as const,
          target: 1,
          createdAt: [...completions].sort()[0] ?? dayKey(),
          reminder: null,
          logs: Object.fromEntries(completions.map((d) => [d, 1])),
        };
      })
    : [];
  return { ...DEFAULT_STATE, onboarded: habits.length > 0, habits };
}
