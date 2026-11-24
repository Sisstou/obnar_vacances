import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayDetailsLocale = 'ar' | 'fr';

export interface StayDetailsCardProps {
  locale?: StayDetailsLocale;
  title: string;
  location: string;
  description?: string;
  pricePerNight?: number;
  currency?: string;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Presentational preview only. Values must be supplied by the parent.
 * This component does not load, persist, or submit listing or booking data.
 */
export function StayDetailsCard({
  locale = 'ar',
  title,
  location,
  description,
  pricePerNight,
  currency = 'DZD',
  maxGuests,
  bedrooms,
  bathrooms,
  amenities = [],
  style,
}: StayDetailsCardProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(isArabic ? 'ar-DZ' : 'fr-DZ').format(value);

  const labels = isArabic
    ? {
        preview: 'معاينة تجريبية — ليست عرضاً منشوراً',
        location: 'الموقع',
        perNight: 'لليلة الواحدة',
        guests: 'الضيوف',
        bedrooms: 'غرف النوم',
        bathrooms: 'الحمّامات',
        amenities: 'المرافق',
        noPrice: 'السعر غير محدد',
      }
    : {
        preview: 'Aperçu de démonstration — annonce non publiée',
        location: 'Emplacement',
        perNight: 'par nuit',
        guests: 'Voyageurs',
        bedrooms: 'Chambres',
        bathrooms: 'Salles de bain',
        amenities: 'Équipements',
        noPrice: 'Prix non renseigné',
      };

  const facts = [
    maxGuests != null
      ? { label: labels.guests, value: String(maxGuests) }
      : null,
    bedrooms != null
      ? { label: labels.bedrooms, value: String(bedrooms) }
      : null,
    bathrooms != null
      ? { label: labels.bathrooms, value: String(bathrooms) }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <View
      accessibilityLabel={isArabic ? 'تفاصيل الإقامة، معاينة تجريبية' : 'Détails du séjour, aperçu de démonstration'}
      style={[styles.card, style]}
    >
      <View style={[styles.previewBanner, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <View style={styles.previewDot} />
        <Text style={[styles.previewText, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.preview}
        </Text>
      </View>

      <View style={styles.content}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}
        >
          {title}
        </Text>

        <View style={[styles.locationRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.locationPin}>⌖</Text>
          <Text style={[styles.location, { textAlign: rtl ? 'right' : 'left' }]}>
            {location}
          </Text>
        </View>

        {description ? (
          <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>
            {description}
          </Text>
        ) : null}

        <View style={styles.pricePanel}>
          <Text style={[styles.price, { textAlign: rtl ? 'right' : 'left' }]}>
            {pricePerNight != null
              ? `${formatPrice(pricePerNight)} ${currency}`
              : labels.noPrice}
          </Text>
          {pricePerNight != null ? (
            <Text style={[styles.priceCaption, { textAlign: rtl ? 'right' : 'left' }]}>
              {labels.perNight}
            </Text>
          ) : null}
        </View>

        {facts.length > 0 ? (
          <View style={[styles.factsRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            {facts.map((fact) => (
              <View key={fact.label} style={styles.fact}>
                <Text style={styles.factValue}>{fact.value}</Text>
                <Text style={styles.factLabel}>{fact.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {amenities.length > 0 ? (
          <View style={styles.amenitiesSection}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
              {labels.amenities}
            </Text>
            <View style={[styles.amenitiesList, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
              {amenities.map((amenity, index) => (
                <View key={`${amenity}-${index}`} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    backgroundColor: '#FFFFFF',
  },
  previewBanner: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFF7E6',
  },
  previewDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#B7791F',
  },
  previewText: {
    flex: 1,
    color: '#754C12',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#102A43',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  locationRow: {
    alignItems: 'center',
    gap: 6,
  },
  locationPin: {
    color: '#0F766E',
    fontSize: 17,
    fontWeight: '700',
  },
  location: {
    flex: 1,
    color: '#52606D',
    fontSize: 14,
  },
  description: {
    color: '#334E68',
    fontSize: 14,
    lineHeight: 22,
  },
  pricePanel: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F0F7F7',
  },
  price: {
    color: '#075E59',
    fontSize: 19,
    fontWeight: '700',
  },
  priceCaption: {
    marginTop: 2,
    color: '#486581',
    fontSize: 12,
  },
  factsRow: {
    flexWrap: 'wrap',
    gap: 9,
  },
  fact: {
    minWidth: 82,
    flexGrow: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },
  factValue: {
    color: '#102A43',
    fontSize: 17,
    fontWeight: '700',
  },
  factLabel: {
    marginTop: 3,
    color: '#627D98',
    fontSize: 11,
    textAlign: 'center',
  },
  amenitiesSection: {
    gap: 8,
  },
  sectionTitle: {
    color: '#243B53',
    fontSize: 14,
    fontWeight: '700',
  },
  amenitiesList: {
    flexWrap: 'wrap',
    gap: 7,
  },
  amenityChip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: '#EEF3F8',
  },
  amenityText: {
    color: '#334E68',
    fontSize: 12,
  },
});
