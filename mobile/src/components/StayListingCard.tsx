import React from 'react';
import { colors } from '../theme/colors';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayListingCardLocale = 'ar' | 'fr';

export interface StayListingCardData {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  maxGuests?: number;
  bedrooms?: number;
  coverImageUrl?: string | null;
}

export interface StayListingCardProps {
  stay: StayListingCardData;
  locale?: StayListingCardLocale;
  currency?: string;
  onPress?: (stay: StayListingCardData) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Presentational guest-discovery card.
 * The parent must supply approved, non-test listing data. This component
 * performs no query, availability check, booking, or persistence.
 */
export function StayListingCard({
  stay,
  locale = 'ar',
  currency = 'DZD',
  onPress,
  style,
}: StayListingCardProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const labels = isArabic
    ? {
        perNight: 'لليلة الواحدة',
        guests: 'ضيوف',
        bedrooms: 'غرف',
        image: 'صورة الإقامة',
        noImage: 'لا توجد صورة',
        open: 'عرض تفاصيل الإقامة',
      }
    : {
        perNight: 'par nuit',
        guests: 'voyageurs',
        bedrooms: 'chambres',
        image: 'Photo du logement',
        noImage: 'Aucune photo',
        open: 'Voir les détails du logement',
      };

  const formattedPrice = new Intl.NumberFormat(isArabic ? 'ar-DZ' : 'fr-DZ', {
    maximumFractionDigits: 0,
  }).format(stay.pricePerNight);

  const content = (
    <>
      <View style={styles.imageFrame}>
        {stay.coverImageUrl ? (
          <Image
            source={{ uri: stay.coverImageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={labels.image}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackGlyph}>⌂</Text>
            <Text style={styles.imageFallbackText}>{labels.noImage}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={[styles.title, { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}
        >
          {stay.title}
        </Text>

        <View style={[styles.locationRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.locationGlyph}>⌖</Text>
          <Text numberOfLines={1} style={[styles.location, { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}>
            {stay.location}
          </Text>
        </View>

        <View style={[styles.footer, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.priceBlock}>
            <Text style={[styles.price, { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}>
              {formattedPrice} {currency}
            </Text>
            <Text style={[styles.priceCaption, { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}>{labels.perNight}</Text>
          </View>

          <View style={[styles.facts, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            {stay.maxGuests != null ? (
              <Text style={[styles.fact, { writingDirection: rtl ? 'rtl' : 'ltr' }]}>{stay.maxGuests} {labels.guests}</Text>
            ) : null}
            {stay.bedrooms != null ? (
              <Text style={[styles.fact, { writingDirection: rtl ? 'rtl' : 'ltr' }]}>{stay.bedrooms} {labels.bedrooms}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );

  if (!onPress) {
    return <View style={[styles.card, { direction: rtl ? 'rtl' : 'ltr' }, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${labels.open}: ${stay.title}`}
      onPress={() => onPress(stay)}
      style={({ pressed }) => [styles.card, { direction: rtl ? 'rtl' : 'ltr' }, style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.88,
  },
  imageFrame: {
    height: 176,
    width: '100%',
    backgroundColor: colors.sandLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageFallbackGlyph: {
    color: colors.goldMuted,
    fontSize: 34,
  },
  imageFallbackText: {
    color: colors.textSoft,
    fontSize: 12,
  },
  content: {
    gap: 9,
    padding: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  locationRow: {
    alignItems: 'center',
    gap: 6,
  },
  locationGlyph: {
    color: colors.goldStrong,
    fontSize: 16,
  },
  location: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 3,
  },
  priceBlock: {
    flexShrink: 1,
    gap: 2,
  },
  price: {
    color: colors.goldDeep,
    fontSize: 16,
    fontWeight: '800',
  },
  priceCaption: {
    color: colors.textMuted,
    fontSize: 11,
  },
  facts: {
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  fact: {
    color: colors.adminText,
    backgroundColor: colors.sandPale,
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
  },
});
