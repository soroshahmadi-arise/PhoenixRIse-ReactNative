import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { EmberOrb } from '@/components/EmberOrb';
import { PressableScale } from '@/components/PressableScale';
import { theme, typography } from '@/lib/constants';
import { timeOfDayGreeting } from '@/lib/greeting';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { NAME_KEY } from '@/lib/user';

/* ------------------------------------------------------------------ */
/*  Mini-app registry. The home is a calm launcher — a few little      */
/*  rituals, like apps on a phone home screen. Data-driven so it       */
/*  scales gracefully from 2 → 6 practices later.                      */
/* ------------------------------------------------------------------ */
type Ritual = {
  key: string;
  title: string;
  phrase: string; // the inviting line on the left
  glyph: string;
  route: '/gratitude' | '/prosperity';
  tone: 'ember' | 'clay';
};

const RITUALS: Ritual[] = [
  {
    key: 'gratitude',
    title: 'Gratitude List',
    phrase: 'Start with gratitude',
    glyph: '❋',
    route: '/gratitude',
    tone: 'ember',
  },
  {
    key: 'prosperity',
    title: 'Prosperity Game',
    phrase: 'Practice prosperity',
    glyph: '✧',
    route: '/prosperity',
    tone: 'clay',
  },
];

type Period = 'morning' | 'afternoon' | 'evening';

// time of day quietly shifts the orb's glow: bright at dawn, hushed at night
const GLOW_RANGE: Record<Period, [number, number]> = {
  morning: [0.92, 1],
  afternoon: [0.82, 0.95],
  evening: [0.66, 0.82],
};

function periodForHour(hour: number): Period {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export default function HomeScreen() {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const now = useMemo(() => new Date(), []);
  const period = periodForHour(now.getHours());

  /* ---- first-mount: hydrate the name, or send new users to onboarding ---- */
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(NAME_KEY)
      .then((stored) => {
        if (!alive) return;
        if (!stored || stored.trim() === '') {
          router.replace('/onboarding');
          return;
        }
        setName(stored.trim());
        setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* ---- the orb's quiet breath (stilled when Reduce Motion is on) ---- */
  const reduceMotion = useReducedMotion();
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      breath.setValue(0.6); // rest at a calm, lit midpoint — no looping motion
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reduceMotion]);

  const orbScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const [glowLo, glowHi] = GLOW_RANGE[period];
  const orbGlow = breath.interpolate({ inputRange: [0, 1], outputRange: [glowLo, glowHi] });

  const gradientColors = [
    theme.colors.homeGlowInner,
    theme.colors.homeBackground,
    theme.colors.homeBottomFade,
  ] as const;

  if (!ready) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* gentle space above so the orb isn't jammed to the top */}
          <View style={styles.topSpacer} />

          {/* the orb — the emotional anchor of the screen */}
          <View style={styles.orbBed}>
            <Animated.View
              style={{ transform: [{ scale: orbScale }], opacity: orbGlow }}
            >
              <EmberOrb size={200} instanceId="home" />
            </Animated.View>
          </View>

          {/* simple, personal greeting */}
          <View style={styles.hero}>
            <Text style={[st.h1, styles.greeting]}>
              {timeOfDayGreeting()}, {name}
            </Text>
            <Text style={[st.bodyLarge, styles.question]}>
              How would you like to start your day today?
            </Text>
          </View>

          {/* push the launcher toward the bottom — breathing room above */}
          <View style={styles.spacer} />

          {/* the rituals — the app icon on the left, an inviting line and
              the app name beside it, split by a hairline */}
          <View style={styles.appsList}>
            {RITUALS.map((r, i) => (
              <React.Fragment key={r.key}>
                {i > 0 && <View style={styles.divider} />}
                <PressableScale
                  onPress={() => router.push(r.route)}
                  accessibilityLabel={r.title}
                  scaleTo={0.98}
                  style={styles.row}
                  pressedStyle={styles.rowPressed}
                >
                  <View
                    style={[
                      styles.appIcon,
                      r.tone === 'ember' ? styles.iconEmber : styles.iconClay,
                    ]}
                  >
                    <Text style={styles.appGlyph}>{r.glyph}</Text>
                  </View>
                  <View style={styles.rowText}>
                    <Text
                      style={styles.rowPhrase}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {r.phrase}
                    </Text>
                    <Text style={[st.label, styles.rowApp]} numberOfLines={1}>
                      {r.title}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </PressableScale>
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Type styles — spec-faithful local fallbacks with the shared        */
/*  `typography` tokens spread on top (so it renders even before the   */
/*  tokens/fonts resolve).                                             */
/* ------------------------------------------------------------------ */
const st = StyleSheet.create({
  h1: {
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.1,
    ...typography.headline1,
  },
  h3: {
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    ...typography.headline3,
  },
  bodyLarge: {
    fontFamily: 'Manrope_400Regular',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 27.2,
    letterSpacing: -0.51,
    ...typography.bodyLarge,
  },
  bodySmall: {
    fontFamily: 'Manrope_400Regular',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19.5,
    ...typography.bodySmall,
  },
  label: {
    fontFamily: 'Manrope_500Medium',
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: 0.56,
    ...typography.label,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.homeBackground,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 24, // lg
    paddingTop: 32, // xl
    paddingBottom: 48, // xxl
  },

  /* orb */
  topSpacer: {
    flex: 0.55,
    minHeight: 24,
  },
  orbBed: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  /* greeting */
  hero: {
    alignItems: 'center',
    marginTop: 32, // xl — breathing room between orb and greeting
  },
  timeGreeting: {
    color: theme.colors.textBody,
    marginBottom: 8, // sm
  },
  greeting: {
    color: theme.colors.text,
    textAlign: 'center',
  },
  question: {
    color: theme.colors.textBody,
    textAlign: 'center',
    marginTop: 24, // lg
    maxWidth: 320,
  },

  /* the rituals */
  spacer: {
    flex: 1,
    minHeight: 48, // xxl
  },
  appsList: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // md
    paddingVertical: 24, // lg
  },
  rowPressed: {
    backgroundColor: theme.colors.warmOverlay,
  },
  rowText: {
    flex: 1,
    gap: 4, // xs
  },
  rowPhrase: {
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  rowApp: {
    color: theme.colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 16, // xl — rounded-square app icon
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmber: {
    backgroundColor: theme.colors.highlight,
  },
  iconClay: {
    backgroundColor: theme.colors.cta,
  },
  appGlyph: {
    fontSize: 24,
    color: '#FDFBFA',
  },
  chevron: {
    fontSize: 24,
    lineHeight: 24,
    color: theme.colors.textLight,
  },
});
