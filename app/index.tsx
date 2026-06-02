import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberOrb } from '@/components/EmberOrb';
import { AppName, theme, typography } from '@/lib/constants';
import { timeOfDayGreeting } from '@/lib/greeting';
import { NAME_KEY } from '@/lib/user';

type TileProps = {
  title: string;
  onPress: () => void;
};

function Tile({ title, onPress }: TileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={styles.tileDot} />
      <Text style={styles.tileTitle}>{title}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(NAME_KEY).then((name) => {
      if (cancelled) return;
      if (!name) {
        router.replace('/onboarding');
        return;
      }
      setUserName(name);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const greetingText = useMemo(() => {
    const base = timeOfDayGreeting();
    return userName ? `${base}, ${userName}` : base;
  }, [userName]);

  if (!ready) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[
          theme.colors.homeGlowInner,
          theme.colors.homeBackground,
          theme.colors.homeBottomFade,
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.brand}>{AppName}</Text>
            <Text style={styles.greeting}>{greetingText}</Text>
          </View>

          <View style={styles.orbZone}>
            <EmberOrb size={140} instanceId="home" />
          </View>

          <View style={styles.tilesWrap}>
            <Tile title="Gratitude List" onPress={() => router.push('/gratitude')} />
            <Tile title="Prosperity Game" onPress={() => router.push('/prosperity')} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safe: { flex: 1 },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },

  top: {
    alignItems: 'flex-start',
  },
  brand: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
  greeting: {
    ...typography.bodyMedium,
    color: theme.colors.textBody,
    marginTop: theme.spacing.xs,
  },

  orbZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tilesWrap: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  tile: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tilePressed: {
    backgroundColor: theme.colors.surfaceNested,
  },
  tileDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.highlight,
  },
  tileTitle: {
    ...typography.headline3,
    color: theme.colors.text,
  },
});
