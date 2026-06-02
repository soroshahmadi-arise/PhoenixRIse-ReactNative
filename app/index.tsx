import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { AppName, theme, typography } from '@/lib/constants';

export default function HomeScreen() {
  const router = useRouter();

  const handleStart = () => {
    console.log('Start Morning Rise pressed');
  };

  const handlePlan = () => {
    console.log('Plan the Ritual pressed');
  };

  const handleGratitude = () => {
    router.push('/gratitude');
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
        <AppButton label="Gratitude List" onPress={handleGratitude} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...typography.label,
    marginBottom: theme.spacing.xl,
  },
  eyebrow: {
    ...typography.micro,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  headline: {
    ...typography.headline1,
    marginBottom: theme.spacing.lg,
  },
  subtext: {
    ...typography.bodyLarge,
    marginBottom: theme.spacing.xxl,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
