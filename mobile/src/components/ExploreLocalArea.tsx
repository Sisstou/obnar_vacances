import React from 'react';
import { colors } from '../theme/tokens';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { getLocalDiscoverySuggestions } from '../lib/local-discovery-suggestions.mjs';

export type ExploreLocalAreaLocale = 'ar' | 'fr';

export interface LocalAreaItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
}

export interface ExploreLocalAreaProps {
  locale?: ExploreLocalAreaLocale;
  items: LocalAreaItem[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Horizontal local-discovery presentation.
 * The parent supplies verified place names, descriptions, and image URLs.
 * Empty state presents discovery categories only, not unverified place claims.
 */
export function ExploreLocalArea({
  locale = 'ar',
  items,
  title,
  style,
}: ExploreLocalAreaProps) {
  const isArabic = locale === 'ar';
  const sectionTitle = title ?? (isArabic ? 'اكتشف المنطقة' : 'Découvrez la région');
  const emptyText = isArabic
    ? 'نعمل على إعداد دليل موثوق للأماكن والصور في المنطقة.'
    : 'Nous préparons un guide fiable des lieux et des photos de la région.';
  const comingSoonText = isArabic ? 'قريباً' : 'Bientôt';
  const suggestions = getLocalDiscoverySuggestions(locale);

  return (
    <View style={[styles.container, { direction: isArabic ? 'rtl' : 'ltr' }, style]}>
      <Text style={[styles.heading, { width: '100%', textAlign: isArabic ? 'right' : 'left' }]}>
        {sectionTitle}
      </Text>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { width: '100%', textAlign: isArabic ? 'right' : 'left' }]}>
            {emptyText}
          </Text>
          <View style={styles.suggestionGrid}>
            {suggestions.map((item) => (
              <View
                key={item.id}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${item.title}. ${item.description}. ${comingSoonText}`}
                style={styles.suggestionCard}
              >
                <View style={styles.suggestionTop}>
                  <Text style={styles.suggestionSymbol}>{item.symbol}</Text>
                  <Text style={styles.comingSoon}>{comingSoonText}</Text>
                </View>
                <Text style={[styles.suggestionTitle, { width: '100%', textAlign: isArabic ? 'right' : 'left' }]}>
                  {item.title}
                </Text>
                <Text style={[styles.suggestionDescription, { width: '100%', textAlign: isArabic ? 'right' : 'left' }]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={item.title}
                />
              ) : (
                <View style={styles.imageFallback}>
                  <Text style={styles.imageGlyph}>⌖</Text>
                  <Text style={styles.imageFallbackText}>
                    {isArabic ? 'الصورة غير متوفرة' : 'Image indisponible'}
                  </Text>
                </View>
              )}
              <View style={styles.copy}>
                <Text numberOfLines={2} style={[styles.itemTitle, { width: '100%', textAlign: isArabic ? 'right' : 'left' }]}>{item.title}</Text>
                {item.description ? (
                  <Text numberOfLines={3} style={[styles.description, { width: '100%', textAlign: isArabic ? 'right' : 'left' }]}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  heading: {
    color: colors.navy,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '900',
  },
  list: {
    gap: 12,
    paddingVertical: 2,
  },
  card: {
    width: 232,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.white,
  },
  image: {
    width: '100%',
    height: 132,
    backgroundColor: colors.canvas,
  },
  imageFallback: {
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.canvas,
  },
  imageGlyph: {
    color: colors.gold,
    fontSize: 28,
  },
  imageFallbackText: {
    color: colors.fallbackText,
    fontSize: 11,
  },
  copy: {
    gap: 6,
    padding: 12,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'auto',
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'auto',
  },
  empty: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.white,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  suggestionCard: {
    width: '48%',
    minHeight: 112,
    flexGrow: 1,
    gap: 7,
    padding: 11,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 13,
    backgroundColor: colors.canvasWarm,
  },
  suggestionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionSymbol: {
    color: colors.gold,
    fontSize: 21,
    fontWeight: '800',
  },
  comingSoon: {
    color: colors.goldMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  suggestionDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
