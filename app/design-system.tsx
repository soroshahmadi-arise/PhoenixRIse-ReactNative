import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme, typography } from '@/lib/constants';

/**
 * Living style guide — renders the design tokens from `lib/constants.ts`
 * so the visual reference never drifts from the source of truth.
 */
export default function DesignSystemScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.intro}>
            <Text style={typography.micro}>PHOENIX RISE</Text>
            <Text style={[typography.headline1, styles.introTitle]}>Design System</Text>
            <Text style={typography.bodyMedium}>
              A living reference rendered straight from the design tokens. Every
              value below reads from theme — update the tokens and this page
              follows.
            </Text>
          </View>

          {/* ─── Colors ─────────────────────────────────────────── */}
          <Section title="Color" caption="Grouped by role">
            {COLOR_GROUPS.map((group) => (
              <View key={group.title} style={styles.colorGroup}>
                <Text style={[typography.micro, styles.groupLabel]}>{group.title}</Text>
                <View style={styles.swatchGrid}>
                  {group.tokens.map((name) => (
                    <Swatch key={name} name={name} value={colorValue(name)} />
                  ))}
                </View>
              </View>
            ))}
          </Section>

          {/* ─── Typography ─────────────────────────────────────── */}
          <Section title="Typography" caption="Source Serif 4 for earned moments · Manrope for everything else">
            {TYPE_SAMPLES.map(({ name, sample }) => (
              <View key={name} style={styles.typeRow}>
                <Text style={[typography.meta, styles.typeName]}>{name}</Text>
                <Text style={typography[name]}>{sample}</Text>
              </View>
            ))}
          </Section>

          {/* ─── Spacing ────────────────────────────────────────── */}
          <Section title="Spacing" caption="4pt-based scale">
            {(Object.keys(theme.spacing) as Array<keyof typeof theme.spacing>).map((key) => (
              <View key={key} style={styles.scaleRow}>
                <Text style={[typography.meta, styles.scaleLabel]}>{key}</Text>
                <View style={[styles.spacingBar, { width: theme.spacing[key] }]} />
                <Text style={[typography.meta, styles.scaleValue]}>{theme.spacing[key]}</Text>
              </View>
            ))}
          </Section>

          {/* ─── Radius ─────────────────────────────────────────── */}
          <Section title="Border Radius">
            <View style={styles.radiusGrid}>
              {(Object.keys(theme.borderRadius) as Array<keyof typeof theme.borderRadius>).map(
                (key) => (
                  <View key={key} style={styles.radiusItem}>
                    <View
                      style={[
                        styles.radiusBox,
                        { borderRadius: Math.min(theme.borderRadius[key], 40) },
                      ]}
                    />
                    <Text style={[typography.meta, styles.radiusLabel]}>{key}</Text>
                    <Text style={typography.meta}>{theme.borderRadius[key]}</Text>
                  </View>
                ),
              )}
            </View>
          </Section>

          {/* ─── Elevation ──────────────────────────────────────── */}
          <Section title="Elevation" caption="Warm brown shadows">
            <View style={styles.shadowGrid}>
              {(Object.keys(theme.shadows) as Array<keyof typeof theme.shadows>).map((key) => (
                <View key={key} style={[styles.shadowCard, theme.shadows[key]]}>
                  <Text style={[typography.meta, styles.shadowLabel]}>{key}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* ─── Buttons ────────────────────────────────────────── */}
          <Section title="Buttons">
            <DemoButton spec={theme.buttons.primary} label="Primary" />
            <DemoButton spec={theme.buttons.secondary} label="Secondary" />
            <View style={styles.darkDemo}>
              <DemoButton spec={theme.buttons.primaryDark} label="Primary on dark" />
            </View>
            <DemoButton spec={theme.buttons.primary} label="Disabled" disabled />
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Building blocks ──────────────────────────────────────── */

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[typography.headline2, styles.sectionTitle]}>{title}</Text>
      {caption ? <Text style={[typography.bodySmall, styles.sectionCaption]}>{caption}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchChip, { backgroundColor: value }]} />
      <Text style={[typography.meta, styles.swatchName]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[typography.meta, styles.swatchValue]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function DemoButton({
  spec,
  label,
  disabled,
}: {
  spec: { backgroundColor: string; pressedBackground?: string; textColor: string; height: number; borderRadius: number };
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.demoButton,
        {
          height: spec.height,
          borderRadius: spec.borderRadius,
          backgroundColor:
            pressed && spec.pressedBackground ? spec.pressedBackground : spec.backgroundColor,
          opacity: disabled ? theme.buttons.disabled.opacity : 1,
        },
      ]}
    >
      <Text style={[typography.button, { color: spec.textColor }]}>{label}</Text>
    </Pressable>
  );
}

/* ─── Token maps ───────────────────────────────────────────── */

function colorValue(name: string): string {
  return (theme.colors as Record<string, string>)[name];
}

const COLOR_GROUPS: { title: string; tokens: string[] }[] = [
  {
    title: 'Brand',
    tokens: ['primary', 'background', 'cta', 'ctaHover', 'highlight', 'highlightPressed', 'mocha', 'sage'],
  },
  { title: 'Text', tokens: ['text', 'textBody', 'textLight'] },
  {
    title: 'Surfaces',
    tokens: ['surface', 'surfaceNested', 'border', 'disabled', 'darkBackground', 'darkSurface'],
  },
  { title: 'Feedback', tokens: ['success', 'error', 'warning'] },
  { title: 'Tiers', tokens: ['tierReset', 'tierSettle', 'tierRenewal', 'tierRebirth'] },
  {
    title: 'Post-session',
    tokens: ['postGreetingBg', 'postFeelingsBg', 'postNoteBg', 'postReflectionBg'],
  },
  { title: 'Home ambient', tokens: ['homeBackground', 'homeGlowInner', 'homeGlowMid'] },
];

const TYPE_SAMPLES: { name: string; sample: string }[] = [
  { name: 'headline1', sample: 'Rise again' },
  { name: 'headline2', sample: 'Section header' },
  { name: 'headline3', sample: 'Card title' },
  { name: 'bodyLarge', sample: 'Body large — breathing room for longer reflective passages.' },
  { name: 'bodyMedium', sample: 'Body medium — the default reading size across the app.' },
  { name: 'bodySmall', sample: 'Body small — supporting copy and secondary detail.' },
  { name: 'label', sample: 'Label' },
  { name: 'micro', sample: 'MICRO LABEL' },
  { name: 'meta', sample: 'Meta · 12pt' },
  { name: 'ember', sample: "Ember's voice — warm and steady." },
  { name: 'emberGreeting', sample: 'Good evening' },
  { name: 'tierName', sample: 'Renewal' },
  { name: 'reflectionTitle', sample: 'What stayed with you?' },
  { name: 'button', sample: 'Button label' },
  { name: 'buttonSmall', sample: 'Button small' },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  inner: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  intro: {
    marginBottom: theme.spacing.xl,
  },
  introTitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },

  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
  },
  sectionCaption: {
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  sectionBody: {
    marginTop: theme.spacing.sm,
  },

  /* Color */
  colorGroup: {
    marginBottom: theme.spacing.lg,
  },
  groupLabel: {
    marginBottom: theme.spacing.sm,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  swatch: {
    width: 96,
  },
  swatchChip: {
    height: 56,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warmBorderLight,
    marginBottom: theme.spacing.xs,
  },
  swatchName: {
    color: theme.colors.text,
  },
  swatchValue: {
    color: theme.colors.textLight,
  },

  /* Typography */
  typeRow: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  typeName: {
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },

  /* Spacing */
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  scaleLabel: {
    width: 32,
    color: theme.colors.text,
  },
  spacingBar: {
    height: 16,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.highlight,
  },
  scaleValue: {
    color: theme.colors.textLight,
  },

  /* Radius */
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  radiusItem: {
    alignItems: 'center',
    width: 64,
  },
  radiusBox: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.cta,
    marginBottom: theme.spacing.xs,
  },
  radiusLabel: {
    color: theme.colors.text,
  },

  /* Elevation */
  shadowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  shadowCard: {
    width: 96,
    height: 72,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowLabel: {
    color: theme.colors.textBody,
  },

  /* Buttons */
  demoButton: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  darkDemo: {
    backgroundColor: theme.colors.darkSurface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});
