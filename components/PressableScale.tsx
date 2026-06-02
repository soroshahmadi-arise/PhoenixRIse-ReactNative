import { ReactNode, useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { AccessibilityRole, AccessibilityState, Insets } from 'react-native';

import { theme } from '@/lib/constants';
import { useReducedMotion } from '@/lib/useReducedMotion';

const OUT = theme.motion.easing.out;

type PressableScaleProps = {
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  /** Base style for the (scaling) surface. */
  style?: StyleProp<ViewStyle>;
  /** Extra style applied only while pressed — e.g. a darker background. */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Style applied while disabled. */
  disabledStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** How far down to scale on press. Rows want subtler (0.98) than buttons. */
  scaleTo?: number;
  hitSlop?: number | Insets;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
};

/**
 * A Pressable that gives the tactile press feedback great UI relies on: a
 * subtle, eased scale-down on touch and a snappy return on release. Honors
 * Reduce Motion (no scale) and keeps the press feedback meaningful via
 * `pressedStyle`. Motion values come from the shared `theme.motion` tokens.
 */
export function PressableScale({
  children,
  onPress,
  style,
  pressedStyle,
  disabledStyle,
  disabled = false,
  scaleTo = theme.motion.scale.press,
  hitSlop,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const spring = useCallback(
    (to: number, duration: number) => {
      if (reduceMotion) return;
      Animated.timing(scale, {
        toValue: to,
        duration,
        easing: Easing.bezier(OUT[0], OUT[1], OUT[2], OUT[3]),
        useNativeDriver: true,
      }).start();
    },
    [reduceMotion, scale],
  );

  const handlePressIn = useCallback(() => {
    setPressed(true);
    spring(scaleTo, theme.motion.duration.press);
  }, [scaleTo, spring]);

  const handlePressOut = useCallback(() => {
    setPressed(false);
    spring(1, theme.motion.duration.micro);
  }, [spring]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
    >
      <Animated.View
        style={[
          style,
          pressed && pressedStyle,
          disabled && disabledStyle,
          { transform: [{ scale }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
