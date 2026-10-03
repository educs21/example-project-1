import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';

import { Palette } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';

const icon = (glyph: string) =>
  function TabIcon() {
    return <Text style={{ fontSize: 20 }}>{glyph}</Text>;
  };

export default function TabsLayout() {
  const theme = useTheme();
  const { loaded, onboarded } = useHabits();

  if (!loaded) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.backgroundSelected },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('✅') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('📅') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
