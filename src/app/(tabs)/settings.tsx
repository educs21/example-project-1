import { ScrollView, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { TimeStepper } from '@/components/time-stepper';
import { Palette, Spacing } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { reward } from '@/lib/feedback';
import { remindersSupported, requestReminderPermission } from '@/lib/notifications';

export default function SettingsScreen() {
  const theme = useTheme();
  const { habits, settings, updateSettings, setReminder, removeHabit } = useHabits();

  const toggleReminders = async (on: boolean) => {
    if (on && !(await requestReminderPermission())) return;
    updateSettings({ reminders: on });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Settings</ThemedText>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <Row label="Sound">
            <Switch
              value={settings.sound}
              onValueChange={(sound) => {
                updateSettings({ sound });
                if (sound) reward('step', { sound, haptics: false });
              }}
              trackColor={{ true: Palette.accent }}
            />
          </Row>
          <Row label="Haptics">
            <Switch
              value={settings.haptics}
              onValueChange={(haptics) => updateSettings({ haptics })}
              trackColor={{ true: Palette.accent }}
            />
          </Row>
          <Row label="Daily reminders">
            <Switch
              value={settings.reminders && remindersSupported}
              disabled={!remindersSupported}
              onValueChange={toggleReminders}
              trackColor={{ true: Palette.accent }}
            />
          </Row>
          {!remindersSupported && (
            <ThemedText type="small" themeColor="textSecondary">
              Reminders are sent by the phone app. They aren&apos;t available in the browser.
            </ThemedText>
          )}
        </View>

        <ThemedText type="smallBold">Your habits</ThemedText>
        {habits.length === 0 && <ThemedText themeColor="textSecondary">No habits yet.</ThemedText>}
        {habits.map((habit) => (
          <View key={habit.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <Row label={`${habit.emoji} ${habit.name}`}>
              <Pressable
                onPress={() =>
                  confirmAction('Delete habit', `Delete "${habit.name}" and its history?`, 'Delete', () =>
                    removeHabit(habit.id),
                  )
                }>
                <ThemedText type="smallBold" style={styles.delete}>
                  Delete
                </ThemedText>
              </Pressable>
            </Row>
            {remindersSupported && (
              <>
                <Row label="Reminder">
                  <Switch
                    value={habit.reminder !== null}
                    onValueChange={(on) => setReminder(habit.id, on ? { hour: 9, minute: 0 } : null)}
                    trackColor={{ true: Palette.accent }}
                  />
                </Row>
                {habit.reminder && (
                  <TimeStepper value={habit.reminder} onChange={(r) => setReminder(habit.id, r)} />
                )}
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.flex}>{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center' },
  delete: { color: '#ff3b30' },
});
