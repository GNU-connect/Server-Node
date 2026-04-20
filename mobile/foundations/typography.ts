import { TextStyle } from 'react-native';

const Typography = {
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  } as TextStyle,

  heading2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  } as TextStyle,

  heading3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.2,
  } as TextStyle,

  body1: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,

  body2: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,

  body3: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,

  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof Typography;
export default Typography;
