import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/lib/constants';
import type { AppButtonProps } from '@/lib/types';

export function AppButton({ label, onPress, variant = 'primary' }: AppButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
      ]}
    >
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryPressed: {
    backgroundColor: Colors.primaryPressed,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.secondaryBorder,
  },
  secondaryPressed: {
    backgroundColor: 'rgba(232, 201, 168, 0.2)',
  },
  label: {
    fontSize: FontSize.button,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryLabel: {
    color: Colors.primaryText,
  },
  secondaryLabel: {
    color: Colors.secondaryText,
  },
});
