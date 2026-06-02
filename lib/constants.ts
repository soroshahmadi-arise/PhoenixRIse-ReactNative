import { TextStyle } from 'react-native';

export const AppName = 'Phoenix Rise';

/** Shared input/button height for auth and form screens */
export const INPUT_HEIGHT = 52;

export const theme = {
  colors: {
    // Brand
    primary: '#593B2E',
    background: '#FDFBFA',
    cta: '#5C483C',
    ctaHover: '#4E3D32',
    highlight: '#B5663A',
    highlightPressed: '#9A5731',

    // Legacy aliases (map to new tokens, migrate gradually)
    accent: '#5C483C',
    accentHover: '#4E3D32',

    // Text hierarchy
    text: '#593B2E',
    textBody: '#796558',
    textLight: '#8C7B70',

    // Legacy text aliases
    textSecondary: '#796558',
    textMuted: '#796558',
    textMicro: '#8C7B70',

    // Mood & tertiary
    mocha: '#A47864',
    sage: '#829D94',

    // Neutrals
    white: '#FFFFFF',
    black: '#000000',
    border: '#E8E2D9',
    disabled: '#E9E2DB',
    surface: '#F5F0EC',
    surfaceMuted: '#F5F0EC',
    surfaceNested: '#EEEAE5',
    darkBackground: '#2E170E',
    shadow: 'rgba(89, 59, 46, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Feedback
    success: '#5E7A70',
    error: '#A85A45',
    warning: '#D4A574',

    // Ember chat
    emberBubble: 'rgba(181, 102, 58, 0.07)',

    // Tier colors (session depth)
    tierReset: '#FFFFFF',
    tierSettle: '#FEF6EE',
    tierRenewal: '#F8EAD8',
    tierRebirth: '#3D2010',
    tierRebirthText: '#FFFFFF',
    tierRebirthMuted: 'rgba(255,255,255,0.55)',
    tierResetBorder: 'rgba(100,60,30,0.08)',
    tierSettleBorder: 'rgba(196,120,74,0.14)',
    tierRenewalBorder: 'rgba(196,120,74,0.22)',
    tierRebirthBorder: 'rgba(196,120,74,0.28)',

    // Breathing Room (home) ambient
    homeBackground: '#F6F1EC',
    homeGlowInner: '#EDE0D4',
    homeGlowMid: '#F0E6DD',
    homeBottomFade: 'rgba(237,224,212,0.88)',
    homeCtaFill: 'rgba(239,230,226,0.88)',

    // Dark surfaces (active session)
    darkSurface: '#1A1412',
    darkText: '#FDFBFA',
    darkTextSecondary: 'rgba(253,251,250,0.85)',
    darkBody: 'rgba(255,255,255,0.58)',
    darkMuted: 'rgba(255,255,255,0.42)',
    darkBorder: 'rgba(255,255,255,0.08)',
    darkElevated: 'rgba(255,255,255,0.06)',
    darkTrack: 'rgba(255,255,255,0.12)',

    // Post-session flow
    postGreetingBg: '#151010',
    postFeelingsBg: '#1E1714',
    postNoteBg: '#3D2E27',
    postReflectionBg: '#7D5B4C',
    onDarkPrimary: '#F1EFEE',
    onDarkStrong: 'rgba(255,255,255,0.92)',
    onDarkBody: 'rgba(241,239,238,0.78)',
    onDarkSecondary: 'rgba(255,255,255,0.72)',
    onDarkMeta: 'rgba(255,255,255,0.58)',
    onDarkHint: 'rgba(255,255,255,0.45)',
    onDarkChipBg: 'rgba(255,255,255,0.08)',
    onDarkChipBgSelected: 'rgba(255,255,255,0.18)',
    onDarkChipBorder: 'rgba(255,255,255,0.10)',
    onDarkChipBorderSelected: 'rgba(255,255,255,0.28)',
    onDarkInputBg: 'rgba(255,255,255,0.06)',
    onDarkInputBorder: 'rgba(255,255,255,0.10)',
    onDarkPillBg: 'rgba(46,23,14,0.30)',

    // Translucent / overlay
    glassBg: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    warmBorder: 'rgba(100,60,30,0.12)',
    warmBorderLight: 'rgba(100,60,30,0.08)',
    warmOverlay: 'rgba(89, 59, 46, 0.04)',

    // Receipt card gradient
    receiptGradientStart: '#2A1A10',
    receiptGradientEnd: '#3D2318',
    receiptAccent: 'rgba(232,149,106,0.95)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 20,
    full: 999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 24,
    xxl: 28,
    xxxl: 32,
  },
  fontFamily: {
    serif: 'SourceSerif4_400Regular',
    serifMedium: 'SourceSerif4_500Medium',
    serifSemiBold: 'SourceSerif4_600SemiBold',
    serifBold: 'SourceSerif4_700Bold',
    serifRegular: 'SourceSerif4_400Regular',
    light: 'Manrope_300Light',
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  shadows: {
    subtle: {
      shadowColor: '#593B2E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#593B2E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    elevated: {
      shadowColor: '#593B2E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    ctaGlow: {
      shadowColor: '#5C483C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 4,
    },
    button: {
      shadowColor: '#5C483C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 2,
    },
    warmCard: {
      shadowColor: 'rgba(89, 59, 46, 0.06)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 3,
    },
    small: {
      shadowColor: '#593B2E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    medium: {
      shadowColor: '#593B2E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    large: {
      shadowColor: '#593B2E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  animation: {
    fast: 120,
    normal: 250,
    slow: 450,
    pressScale: 0.98,
    stagger: 50,
  },
  motion: {
    duration: {
      press: 140,
      micro: 200,
      short: 280,
      base: 420,
      long: 700,
      breath: 4000,
    },
    easing: {
      out: [0.23, 1, 0.32, 1] as [number, number, number, number],
      drawer: [0.32, 0.72, 0, 1] as [number, number, number, number],
      breath: [0.45, 0, 0.15, 1] as [number, number, number, number],
      linear: [0, 0, 1, 1] as [number, number, number, number],
    },
    scale: {
      press: 0.97,
      enterFrom: 0.96,
    },
    stagger: {
      tight: 30,
      base: 60,
      loose: 90,
    },
  },
  buttons: {
    primary: {
      backgroundColor: 'rgba(239,230,226,0.88)',
      pressedBackground: 'rgba(239,230,226,0.96)',
      textColor: '#5C483C',
      height: 52,
      borderRadius: 14,
      fontSize: 15,
      fontFamily: 'Manrope_600SemiBold',
      shadow: null as null | {
        shadowColor: string;
        shadowOffset: { width: number; height: number };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
      },
    },
    primaryDark: {
      backgroundColor: 'rgba(239,230,226,0.88)',
      pressedBackground: 'rgba(239,230,226,0.96)',
      textColor: '#5C483C',
      height: 52,
      borderRadius: 14,
      fontSize: 15,
      fontFamily: 'Manrope_600SemiBold',
      shadow: null as null | {
        shadowColor: string;
        shadowOffset: { width: number; height: number };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
      },
    },
    secondary: {
      backgroundColor: 'transparent',
      pressedBackground: 'rgba(89, 59, 46, 0.04)',
      textColor: '#5C483C',
      height: 52,
      borderRadius: 14,
      fontSize: 15,
      fontFamily: 'Manrope_600SemiBold',
      shadow: null as null | {
        shadowColor: string;
        shadowOffset: { width: number; height: number };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
      },
    },
    disabled: {
      backgroundColor: 'rgba(239,230,226,0.88)',
      textColor: '#5C483C',
      opacity: 0.35,
      borderColor: 'transparent',
    },
  },
};

export const typography: Record<string, TextStyle> = {
  headline1: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.1,
    color: theme.colors.text,
  },
  headline2: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.72,
    color: theme.colors.text,
  },
  headline3: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  bodyLarge: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 17,
    lineHeight: 27.2,
    letterSpacing: -0.51,
    color: theme.colors.textBody,
  },
  bodyMedium: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: theme.colors.textBody,
  },
  bodySmall: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: -0.13,
    color: theme.colors.textBody,
  },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    lineHeight: 19.6,
    letterSpacing: 0.56,
    color: theme.colors.text,
  },
  micro: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2,
    color: theme.colors.textLight,
  },
  meta: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 16.8,
    letterSpacing: 0.48,
    color: theme.colors.textLight,
  },
  ember: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 15,
    lineHeight: 25,
    letterSpacing: -0.15,
    color: theme.colors.text,
  },
  emberGreeting: {
    fontFamily: theme.fontFamily.serifSemiBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  tierName: {
    fontFamily: theme.fontFamily.serifSemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
  reflectionTitle: {
    fontFamily: theme.fontFamily.serifSemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  button: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  buttonSmall: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
};

export type Theme = typeof theme;
export type Typography = typeof typography;
