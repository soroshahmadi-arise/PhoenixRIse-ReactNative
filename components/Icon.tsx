import {
  CaretLeft as PhosphorCaretLeft,
  type IconProps as PhosphorIconProps,
} from 'phosphor-react-native';

import { theme } from '@/lib/constants';

export const DEFAULT_ICON_WEIGHT: PhosphorIconProps['weight'] = 'regular';

type AppIconProps = Omit<PhosphorIconProps, 'color' | 'size' | 'weight'> & {
  color?: string;
  size?: number;
  weight?: PhosphorIconProps['weight'];
};

function withIconDefaults(props: AppIconProps) {
  return {
    size: 24,
    color: theme.colors.primary,
    weight: DEFAULT_ICON_WEIGHT,
    ...props,
  };
}

export function CaretLeft(props: AppIconProps) {
  return <PhosphorCaretLeft {...withIconDefaults(props)} />;
}
