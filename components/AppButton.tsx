import { Pressable, StyleSheet, Text } from 'react-native';

import { theme, typography } from '@/lib/constants';
import type { AppButtonProps } from '@/lib/types';

export function AppButton({ label, onPress, variant = 'primary' }: AppButtonProps) {
  const spec = variant === 'primary' ? theme.buttons.primary : theme.buttons.secondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? spec.pressedBackground : spec.backgroundColor,
          height: spec.height,
          borderRadius: spec.borderRadius,
        },
      ]}
    >
      <Text style={[typography.button, { color: spec.textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
