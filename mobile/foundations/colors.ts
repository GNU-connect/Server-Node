const Colors = {
  primary: '#3182F6',
  primaryLight: '#EBF3FF',
  primaryDark: '#1B64DA',

  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F2F4F6',

  textPrimary: '#191F28',
  textSecondary: '#8B95A1',
  textTertiary: '#B0B8C1',
  textOnPrimary: '#FFFFFF',

  border: '#E5E8EB',
  divider: '#F2F4F6',

  chipSelectedBg: '#3182F6',
  chipUnselectedBg: '#F2F4F6',
  chipSelectedText: '#FFFFFF',
  chipUnselectedText: '#4E5968',

  success: '#17C3A2',
  warning: '#F7C948',
  error: '#F04452',
  errorBackground: '#FFF5F5',

  overlay: 'rgba(0, 0, 0, 0.45)',
  shadow: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;
export default Colors;
