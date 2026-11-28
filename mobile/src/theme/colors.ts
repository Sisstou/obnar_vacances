/**
 * Central design tokens for the OBNAR VACANCES mobile app.
 * Values intentionally preserve the existing component palette.
 */
export const colors = {
  navy: '#102D46',
  blue: '#174B68',
  gold: '#C9A45C',
  goldStrong: '#A47B36',
  goldDeep: '#80602C',
  goldMuted: '#B38A43',
  goldText: '#7B5A24',
  goldStatus: '#8B6428',
  sand: '#F1E7D3',
  sandLight: '#F2EEE6',
  sandPale: '#F6F3ED',
  background: '#F8F7F3',
  surface: '#FFFFFF',
  surfaceMuted: '#E8E2D6',
  disabledSurface: '#E8E8E8',
  ink: '#20384A',
  text: '#243447',
  textSecondary: '#667085',
  textMuted: '#71818B',
  textSoft: '#786B57',
  textDisabled: '#6F777B',
  line: '#E9E1D2',
  border: '#E8E0D2',
  adminText: '#344054',
  adminNavy: '#12345A',
  success: '#237B62',
  disabledSuccess: '#DCE8E2',
  disabledDanger: '#F0DEDA',
  overlay: '#071827EE',
  whiteOverlay: '#FFFFFF55',
} as const;

export type ColorToken = keyof typeof colors;
