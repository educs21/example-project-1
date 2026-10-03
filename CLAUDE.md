# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See [AGENTS.md](AGENTS.md) for the project's Expo rules (versioned docs lookup, `npx expo install`, CNG, lint/typecheck before finishing). The notes below are what AGENTS.md doesn't cover.

## Commands

npm is the package manager (`package-lock.json`; no bun lock), so use `npx`.

```bash
npx expo start            # dev server (also: npm run ios / android / web)
npm run lint              # expo lint (ESLint flat config, eslint-config-expo)
npx tsc --noEmit          # typecheck (strict)
node scripts/make-sounds.js   # regenerates assets/sounds/*.wav
```

There is no test runner configured. Typed routes (`.expo/types`) regenerate only while the dev server runs, so `tsc` can report new routes as missing until it has been started. `npm run reset-project` moves the starter code aside — don't run it casually.

## Architecture

Expo SDK 57 / React Native 0.86, Expo Router with typed routes, React Compiler on (`app.json` `experiments`) — it flags impure render code and components defined inside components. The app is a habit tracker built around a reward loop; it is developed and tested mostly in Chrome (`expo start --web`).

**Screens (keep it to 5–7):** `onboarding` + the `(tabs)` group (`index`=Today, `history`, `insights`, `settings`). Adding a habit is a modal sheet on Today, not a screen. `(tabs)/_layout.tsx` redirects to `/onboarding` until `onboarded` is true.

**State** — `src/hooks/use-habits.tsx` is a context provider (`HabitsProvider` in `src/app/_layout.tsx`) holding one `AppState` object persisted to AsyncStorage key `habits.v2`; the old `habits.v1` shape is migrated on first load (`migrateV1`). Bump the key and add a migration when changing the stored shape. `track(id, ±1)` returns a `TrackResult` (`none | step | complete | challenge`) that the UI turns into rewards; it also detects challenge completion and marks it `celebrated`.

**Domain logic** — `src/lib/habit-logic.ts` is pure (types, `dayKey` local-date keys, streaks, consistency, `challengeStatus`). Habits are `daily` (target 1) or `count` (target N); progress is `logs[YYYY-MM-DD]`. A challenge is tied to one habit; a day counts when that habit is fully done, and missing a past day makes it `failed` (derived, not stored).

**Rewards** — `src/lib/feedback.ts` (`reward()`: expo-haptics + expo-audio, sounds in `assets/sounds`, all failures swallowed) and `src/components/celebration.tsx` (reanimated confetti overlay). Both respect `settings.sound` / `settings.haptics`.

**Reminders** — `src/lib/notifications.ts` schedules local daily notifications (one per habit with a reminder, plus a fixed 8 PM check-in) and replaces them all on every change; the provider re-syncs when the reminder plan changes. They are no-ops on web (`remindersSupported`), so reminder UI is hidden there. Android Expo Go supports only local notifications (no remote push).

**Platform notes** — `Alert.alert` does nothing on web; use `confirmAction` from `src/lib/confirm.ts`. Platform splits use file suffixes (`use-color-scheme.web.ts`, `animated-icon.web.tsx`).

Theme tokens: `Colors` (light/dark via `useTheme()`), `Spacing`, and `Palette` (accent/success/streak/gold) in `src/constants/theme.ts`. Path alias: `@/*` → `src/*`.
