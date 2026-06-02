/**
 * ICON SOURCE OF TRUTH
 * ---------------------------------------------------------------------------
 * Every icon in the app comes from Phosphor (`phosphor-react-native`) and is
 * re-exported through this file with shared defaults (size, color, weight).
 *
 * RULES (apply to all future work):
 *   1. Do NOT import icons directly from 'phosphor-react-native' anywhere else.
 *      Import them from '@/components/Icon' instead.
 *   2. Do NOT use text/emoji/unicode glyphs (›, →, ✦, ✧, ✓, ❋, etc.) as icons.
 *   3. Do NOT add other icon libraries. Phosphor has 3000+ icons — use those.
 *
 * TO ADD A NEW ICON:
 *   - Find its name at https://phosphoricons.com
 *   - Import it below with the `Phosphor` prefix, then export a wrapper that
 *     spreads `withIconDefaults(props)` (copy the pattern of the ones below).
 *   - If Phosphor's name differs from what the app calls it, alias on export
 *     (see `Banknote`, which maps to Phosphor's `Money`).
 *
 * Note: react-native-svg artwork (e.g. components/EmberOrb.tsx) is NOT an icon
 * and is exempt from these rules.
 * ---------------------------------------------------------------------------
 */
import {
  ArrowCounterClockwise as PhosphorArrowCounterClockwise,
  CaretLeft as PhosphorCaretLeft,
  CaretRight as PhosphorCaretRight,
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

export function CaretRight(props: AppIconProps) {
  return <PhosphorCaretRight {...withIconDefaults(props)} />;
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
