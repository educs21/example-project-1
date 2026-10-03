# example-project-1

A habit tracker built around a reward loop, made with [Expo](https://expo.dev) (SDK 57), React Native and Expo Router. It runs on iOS, Android and web.

## Features

- **Daily and count habits**: tick off a once-a-day habit, or track one with a target of N per day.
- **Rewards**: confetti, haptics and sounds when you complete a habit or challenge (each can be turned off in Settings).
- **Streaks and consistency**: see how you're doing in History and Insights.
- **Challenges**: tie a challenge to a habit. A day counts when that habit is fully done, and missing a past day fails the challenge.
- **Reminders**: local daily notifications per habit, plus an 8 PM check-in (iOS and Android only).
- **Offline-first**: all data is stored on the device with AsyncStorage.

## Getting started

```bash
npm install
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator) or `w` (web), or scan the QR code with [Expo Go](https://expo.dev/go). Shortcuts also exist as `npm run ios`, `npm run android` and `npm run web`.

Web is the quickest way to iterate, but reminders and some haptics only work on a device or simulator.

## Scripts

| Command | What it does |
| --- | --- |
| `npx expo start` | Start the dev server |
| `npm run lint` | Lint with ESLint (`eslint-config-expo`) |
| `npx tsc --noEmit` | Typecheck (strict) |
| `node scripts/make-sounds.js` | Regenerate `assets/sounds/*.wav` |

## Project structure

```
src/
  app/          Expo Router screens: onboarding + (tabs) Today, History, Insights, Settings
  components/   UI pieces (habit card, habit form, celebration overlay, ...)
  hooks/        use-habits (state provider), theme and color-scheme hooks
  lib/          Pure habit logic, rewards feedback, notifications, confirm helper
  constants/    Theme tokens (colors, spacing, palette)
assets/         Images and generated sounds
```

State lives in a single `HabitsProvider` (`src/hooks/use-habits.tsx`) persisted to AsyncStorage. Domain rules such as streaks, consistency and challenge status are pure functions in `src/lib/habit-logic.ts`.

See [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) for more detailed development notes.

## License

[MIT](LICENSE)
