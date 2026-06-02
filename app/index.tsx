import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppName, INPUT_HEIGHT, theme, typography } from '@/lib/constants';

function timeOfDayGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Resting hours';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen() {
  const router = useRouter();
  const greeting = useMemo(() => timeOfDayGreeting(), []);

  const handleGratitude = () => {
    router.push('/gratitude');
  };

  const primaryBtn = theme.buttons.primary;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[
          theme.colors.homeGlowInner,
          theme.colors.homeBackground,
          theme.colors.homeBottomFade,
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.brand}>{AppName}</Text>
            <Text style={styles.greeting}>{greeting}</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.headline}>
              Begin as the version of you who already rose.
            </Text>
          </View>

          <View style={styles.cta}>
            <Pressable
              onPress={handleGratitude}
              accessibilityRole="button"
              accessibilityLabel="Open gratitude list"
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: pressed
                    ? primaryBtn.pressedBackground
                    : primaryBtn.backgroundColor,
                },
              ]}
            >
              <Text style={styles.primaryButtonText}>Gratitude List</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },

  top: {
    alignItems: 'flex-start',
  },
  brand: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
  greeting: {
    ...typography.bodySmall,
    color: theme.colors.textBody,
    marginTop: theme.spacing.xs,
  },

  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  headline: {
    ...typography.headline1,
  },

  cta: {
    width: '100%',
  },
  primaryButton: {
    borderRadius: theme.borderRadius.lg,
    height: INPUT_HEIGHT,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: theme.buttons.primary.textColor,
  },
});
