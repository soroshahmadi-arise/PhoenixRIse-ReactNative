import { StyleSheet, Text, View } from 'react-native';

import { EmberOrb } from '@/components/EmberOrb';
import { Screen } from '@/components/Screen';
import { theme, typography } from '@/lib/constants';

export default function ProsperityScreen() {
  return (
    <Screen scrollable={false}>
      <View style={styles.center}>
        <EmberOrb size={120} instanceId="prosperity" />
        <Text style={styles.headline}>Prosperity Game</Text>
        <Text style={styles.subtext}>Coming soon.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  headline: {
    ...typography.headline2,
    marginTop: theme.spacing.lg,
  },
  subtext: {
    ...typography.bodyLarge,
    color: theme.colors.textBody,
  },
});
