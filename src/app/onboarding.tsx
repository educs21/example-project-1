import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { HabitForm } from '@/components/habit-form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { reward } from '@/lib/feedback';
import { remindersSupported, requestReminderPermission } from '@/lib/notifications';

export default function OnboardingScreen() {
  const { completeOnboarding, settings } = useHabits();

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.hero}>🌱</ThemedText>
          <View style={styles.copy}>
            <ThemedText type="subtitle">Build a habit that sticks</ThemedText>
            <ThemedText themeColor="textSecondary">
              Pick your first habit. We&apos;ll start a 3-day challenge. Show up three days in a row and
              we&apos;ll celebrate.
            </ThemedText>
          </View>

          <HabitForm
            submitLabel="Start my 3-day challenge"
            showReminder={remindersSupported}
            onSubmit={async (input) => {
              if (input.reminder) await requestReminderPermission();
              completeOnboarding(input, 3);
              reward('step', settings);
              router.replace('/');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.four },
  hero: { fontSize: 64, lineHeight: 76, textAlign: 'center' },
  copy: { gap: Spacing.two },
});
