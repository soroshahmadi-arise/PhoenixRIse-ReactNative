import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberOrb } from '@/components/EmberOrb';
import { INPUT_HEIGHT, theme, typography } from '@/lib/constants';
import { timeOfDayGreeting } from '@/lib/greeting';
import { NAME_KEY } from '@/lib/user';

export default function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const greeting = timeOfDayGreeting();
  const canBegin = name.trim().length > 0 && ageConfirmed;

  const handleBegin = async () => {
    if (!canBegin) return;
    await AsyncStorage.setItem(NAME_KEY, name.trim());
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.top}>
            <View style={styles.orbWrap}>
              <EmberOrb size={120} instanceId="onboarding" />
            </View>

            <Text style={styles.headline}>{greeting}</Text>
            <Text style={styles.subtext}>A couple of things before we begin.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>WHAT SHOULD I CALL YOU?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel="Your name"
            />

            <Pressable
              onPress={() => setAgeConfirmed(!ageConfirmed)}
              style={({ pressed }) => [
                styles.checkboxRow,
                pressed && styles.checkboxRowPressed,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ageConfirmed }}
              accessibilityLabel="I am 18 years of age or older"
            >
              <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                {ageConfirmed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I am 18 years of age or older</Text>
            </Pressable>
          </View>

          <View style={styles.spacer} />

          <Pressable
            onPress={handleBegin}
            disabled={!canBegin}
            style={({ pressed }) => [
              styles.ctaButton,
              !canBegin && styles.ctaButtonDisabled,
              pressed && canBegin && styles.ctaButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Let's begin"
            accessibilityState={{ disabled: !canBegin }}
          >
            <Text style={styles.ctaText}>Let's Begin</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  kav: { flex: 1 },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  top: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  orbWrap: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  headline: {
    ...typography.headline1,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtext: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },

  form: {
    width: '100%',
  },
  label: {
    ...typography.micro,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: INPUT_HEIGHT,
    paddingHorizontal: theme.spacing.md,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    ...Platform.select<object>({
      web: { outlineStyle: 'none' as 'none' },
      default: {},
    }),
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  checkboxRowPressed: { opacity: 0.7 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.highlight,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
    lineHeight: 16,
  },
  checkboxLabel: {
    ...typography.bodyMedium,
    color: theme.colors.text,
    flex: 1,
  },

  spacer: { flex: 1 },

  ctaButton: {
    backgroundColor: theme.colors.highlight,
    height: INPUT_HEIGHT,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonPressed: {
    backgroundColor: '#9A5731',
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    ...typography.button,
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
  },
});
