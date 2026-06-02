import { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { CaretLeft } from '@/components/Icon';
import { theme } from '@/lib/constants';

type ScreenHeaderProps = {
  title: string;
  onBack: () => void;
  rightAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
  leftStyle?: StyleProp<ViewStyle>;
  backButtonStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  iconSize?: number;
};

export function ScreenHeader({
  title,
  onBack,
  rightAccessory,
  style,
  leftStyle,
  backButtonStyle,
  titleStyle,
  iconColor = theme.colors.text,
  iconSize = 22,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.left, leftStyle]}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            backButtonStyle,
            pressed && styles.backButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <CaretLeft size={iconSize} color={iconColor} />
        </Pressable>
        <Text style={[styles.title, titleStyle]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {rightAccessory}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  backButtonPressed: {
    backgroundColor: theme.colors.surfaceNested,
  },
  title: {
    fontFamily: theme.fontFamily.serifSemiBold,
    fontSize: 25,
    letterSpacing: -0.4,
    color: theme.colors.text,
  },
});
