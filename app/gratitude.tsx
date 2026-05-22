import { Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Colors, FontSize, Spacing } from '@/lib/constants';

export default function GratitudeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Gratitude', headerShown: true }} />
      <Screen>
        <Text style={styles.eyebrow}>GRATITUDE LIST</Text>
        <Text style={styles.headline}>What are you grateful for today?</Text>
        <Text style={styles.subtext}>
          Designed layout coming soon — drop the generated code into this file.
        </Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: FontSize.eyebrow,
    fontWeight: '700',
    color: Colors.eyebrow,
    letterSpacing: 1.6,
    marginBottom: Spacing.md,
  },
  headline: {
    fontSize: FontSize.headline,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 40,
    marginBottom: Spacing.lg,
  },
  subtext: {
    fontSize: FontSize.subtext,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
});
