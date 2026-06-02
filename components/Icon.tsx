import {
  ArrowCounterClockwise as PhosphorArrowCounterClockwise,
  CaretLeft as PhosphorCaretLeft,
  Gear as PhosphorGear,
  Image as PhosphorImage,
  Microphone as PhosphorMicrophone,
  Money as PhosphorMoney,
  Plus as PhosphorPlus,
  Sparkle as PhosphorSparkle,
  X as PhosphorX,
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

export function ArrowCounterClockwise(props: AppIconProps) {
  return <PhosphorArrowCounterClockwise {...withIconDefaults(props)} />;
}

export function Banknote(props: AppIconProps) {
  return <PhosphorMoney {...withIconDefaults(props)} />;
}

export function Gear(props: AppIconProps) {
  return <PhosphorGear {...withIconDefaults(props)} />;
}

export function Image(props: AppIconProps) {
  return <PhosphorImage {...withIconDefaults(props)} />;
}

export function Microphone(props: AppIconProps) {
  return <PhosphorMicrophone {...withIconDefaults(props)} />;
}

export function Plus(props: AppIconProps) {
  return <PhosphorPlus {...withIconDefaults(props)} />;
}

export function Sparkle(props: AppIconProps) {
  return <PhosphorSparkle {...withIconDefaults(props)} />;
}

export function X(props: AppIconProps) {
  return <PhosphorX {...withIconDefaults(props)} />;
}
