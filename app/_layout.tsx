import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  SourceSerif4_400Regular,
  SourceSerif4_500Medium,
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from '@/lib/constants';

/** On wide screens (desktop web) the app is capped to a phone-width column
 *  centered over a soft backdrop, so it reads as a mobile app. */
const MOBILE_MAX_WIDTH = 420;

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    SourceSerif4_400Regular,
    SourceSerif4_500Medium,
    SourceSerif4_600SemiBold,
    SourceSerif4_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.backdrop}>
        <View style={styles.column}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="gratitude"
              options={{
                headerShown: true,
                title: 'Gratitude',
                headerBackTitle: 'Back',
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  fontFamily: theme.fontFamily.semiBold,
                  fontSize: 17,
                },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen name="prosperity" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    ...Platform.select({
      web: { backgroundColor: '#EAE3DC', alignItems: 'center' },
      default: {},
    }),
  },
  column: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.background,
    ...Platform.select({
      web: {
        maxWidth: MOBILE_MAX_WIDTH,
        boxShadow: '0 0 40px rgba(89,59,46,0.10)' as never,
      },
      default: {},
    }),
  },
});
