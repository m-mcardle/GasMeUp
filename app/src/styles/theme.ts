// GasMeUp design tokens ("Midnight Violet").
// Every colour, size and radius in the UI should come from here. See app/DESIGN.md.
import { Platform, TextStyle } from 'react-native';

export const palette = {
  violet50: '#F1EDFF',
  violet200: '#C9BBFF',
  violet300: '#B3A1FF',
  violet400: '#9479FF',
  violet500: '#7C5CFF',
  violet600: '#6A47F5',
  violet700: '#5634D9',
  violet900: '#24124F',

  ink950: '#09080F',
  ink900: '#0F0D18',
  ink850: '#151321',
  ink800: '#1C192B',
  ink700: '#262238',
  ink600: '#353049',
  ink400: '#6E6A82',
  ink300: '#A19DB4',
  ink100: '#F4F2FA',

  mint400: '#3DDC97',
  coral400: '#FF6B7A',
  amber400: '#FFC24B',
  white: '#FFFFFF',
  black: '#000000',
};

export const color = {
  // Backgrounds, from furthest back to closest
  bg: palette.ink950,
  surface: palette.ink850, // cards, sheets
  surfaceRaised: palette.ink800, // inputs, rows inside cards
  surfacePressed: palette.ink700,
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
  overlay: 'rgba(5,4,10,0.72)',

  text: palette.ink100,
  textSecondary: palette.ink300,
  textTertiary: palette.ink400,
  textOnPrimary: palette.white,

  primary: palette.violet500,
  primaryPressed: palette.violet600,
  primaryDeep: palette.violet700,
  primaryText: palette.violet300, // primary used as text/icon on dark surfaces
  primarySoft: 'rgba(124,92,255,0.16)',
  primaryGlow: 'rgba(124,92,255,0.22)',

  success: palette.mint400,
  successSoft: 'rgba(61,220,151,0.14)',
  danger: palette.coral400,
  dangerSoft: 'rgba(255,107,122,0.14)',
  warning: palette.amber400,
  warningSoft: 'rgba(255,194,75,0.14)',

  splitwise: '#5BBFA1',
};

export const gradient = {
  // Hero card (trip cost)
  hero: ['#8A6CFF', '#5B36E6', '#3A1F9E'] as const,
  // Faint glow at the top of every screen
  screen: ['rgba(124,92,255,0.14)', 'rgba(124,92,255,0)'] as const,
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

// Type scale (size / line height / weight). Use via <Text variant="...">.
export const type = {
  display: {
    fontFamily: font.extrabold, fontSize: 44, lineHeight: 50, letterSpacing: -1.2,
  },
  title1: {
    fontFamily: font.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6,
  },
  title2: {
    fontFamily: font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3,
  },
  title3: {
    fontFamily: font.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2,
  },
  headline: {
    fontFamily: font.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1,
  },
  body: {
    fontFamily: font.regular, fontSize: 16, lineHeight: 22,
  },
  callout: {
    fontFamily: font.medium, fontSize: 15, lineHeight: 20,
  },
  subhead: {
    fontFamily: font.regular, fontSize: 14, lineHeight: 19,
  },
  footnote: {
    fontFamily: font.regular, fontSize: 13, lineHeight: 18,
  },
  caption: {
    fontFamily: font.medium, fontSize: 12, lineHeight: 16,
  },
  overline: {
    fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const size = {
  control: 50, // buttons, inputs
  controlSm: 36,
  iconButton: 40,
  hitSlop: {
    top: 8, bottom: 8, left: 8, right: 8,
  },
  screenGutter: 20,
};

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: palette.black,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    default: { elevation: 6 },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: palette.violet500,
      shadowOpacity: 0.45,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    default: { elevation: 8 },
  }),
};

export const motion = {
  fast: 140,
  base: 220,
  pressScale: 0.97,
};

export default {
  palette, color, gradient, space, radius, font, type, size, shadow, motion,
};
