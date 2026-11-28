import React from 'react';
import { colors } from '../theme/tokens';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type HomeSectionHeaderLocale = 'ar' | 'fr';

export interface HomeSectionHeaderProps {
  title: string;
  locale?: HomeSectionHeaderLocale;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

/** Reusable heading for guest-home content sections. */
export function HomeSectionHeader({
  title,
  locale = 'ar',
  subtitle,
  style,
}: HomeSectionHeaderProps) {
  return (
    <View style={[styles.container, { direction: locale === 'ar' ? 'rtl' : 'ltr' }, style]}>
      <Text accessibilityRole="header" style={[styles.title, { textAlign: locale === 'ar' ? 'right' : 'left' }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { textAlign: locale === 'ar' ? 'right' : 'left' }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    color: colors.navyText,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'auto',
  },
});
