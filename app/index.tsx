import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { AppName, Colors, FontSize, Spacing } from '@/lib/constants';

export default function HomeScreen() {
  const handleStart = () => {
    console.log('Start Morning Rise pressed');
  };

  const handlePlan = () => {
    console.log('Plan the Ritual pressed');
  };

  return (
    <Screen>
      <Text style={styles.brand}>{AppName}</Text>
      <Text style={styles.eyebrow}>MORNING GRATITUDE + IDENTITY REWIRING</Text>
      <Text style={styles.headline}>Begin as the version of you who already rose.</Text>
      <Text style={styles.subtext}>
        A simple morning ritual to help you feel grateful, grounded, and aligned before the day
        begins.
      </Text>

      <View style={styles.actions}>
        <AppButton label="Start Morning Rise" onPress={handleStart} variant="primary" />
        <AppButton label="Plan the Ritual" onPress={handlePlan} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    letterSpacing: 0.4,
  },
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
    marginBottom: Spacing.xxl,
  },
  actions: {
    gap: Spacing.md,
  },
});
