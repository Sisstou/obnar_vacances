import React from 'react';
import { getCategoryAccessibilityLabel } from '../lib/category-accessibility.mjs';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayCategoryLocale = 'ar' | 'fr';
export type StayCategoryId = 'apartments' | 'studios' | 'houses';

export interface StayCategory {
  id: StayCategoryId;
  label?: string;
  count?: number;
}

export interface StayCategoryTilesProps {
  locale?: StayCategoryLocale;
  categories?: StayCategory[];
  onSelect?: (category: StayCategoryId) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Presentational accommodation categories.
 * Counts are shown only when supplied by a trusted parent source.
 */
export function StayCategoryTiles({
  locale = 'ar',
  categories,
  onSelect,
  style,
}: StayCategoryTilesProps) {
  const isArabic = locale === 'ar';
  const defaults: StayCategory[] = [
    { id: 'apartments' },
    { id: 'studios' },
    { id: 'houses' },
  ];
  const labels: Record<StayCategoryId, { ar: string; fr: string; symbol: string }> = {
    apartments: { ar: 'شقق', fr: 'Appartements', symbol: '⌂' },
    studios: { ar: 'استوديوهات', fr: 'Studios', symbol: '▦' },
    houses: { ar: 'منازل', fr: 'Maisons', symbol: '⌂' },
  };

  return (
    <View style={[styles.container, { direction: isArabic ? 'rtl' : 'ltr' }, style]}>
      {(categories ?? defaults).map((category) => {
        const copy = labels[category.id];
        const label = category.label ?? (isArabic ? copy.ar : copy.fr);
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={getCategoryAccessibilityLabel(locale, label, category.count)}
            onPress={() => onSelect?.(category.id)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <View style={styles.symbolWrap}>
              <Text style={styles.symbol}>{copy.symbol}</Text>
            </View>
            <Text style={styles.label}>
              {label}
            </Text>
            {category.count != null ? (
              <Text style={styles.count}>
                {category.count} {isArabic ? 'إقامة' : 'logements'}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8E0D2',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  symbolWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F4EFE5',
  },
  symbol: {
    color: '#A47B36',
    fontSize: 25,
    fontWeight: '800',
  },
  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  count: {
    color: '#7A8492',
    fontSize: 10,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
