import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface HomeSectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

/** Reusable heading for guest-home content sections. */
export function HomeSectionHeader({
  title,
  subtitle,
  style,
}: HomeSectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    color: '#123B5D',
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'auto',
  },
  subtitle: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'auto',
  },
});
