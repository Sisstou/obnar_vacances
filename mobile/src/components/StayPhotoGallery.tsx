import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayPhotoGalleryLocale = 'ar' | 'fr';

export interface StayGalleryPhoto {
  id: string;
  /** Remote URI or a local React Native image source. */
  source: ImageSourcePropType;
  accessibilityLabel?: string;
}

export interface StayPhotoGalleryProps {
  photos: StayGalleryPhoto[];
  locale?: StayPhotoGalleryLocale;
  title?: string;
  style?: StyleProp<ViewStyle>;
  imageHeight?: number;
}

/**
 * Presentational photo gallery. The parent supplies image sources.
 * This component does not fetch listing records, upload images, or persist data.
 * React Native Image handles rendering the supplied image source.
 */
export function StayPhotoGallery({
  photos,
  locale = 'ar',
  title,
  style,
  imageHeight = 190,
}: StayPhotoGalleryProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const heading = title ?? (isArabic ? 'صور الإقامة' : 'Photos du séjour');
  const emptyMessage = isArabic
    ? 'لا توجد صور للعرض حالياً'
    : 'Aucune photo à afficher pour le moment';
  const imageLabel = (index: number) =>
    isArabic ? `صورة رقم ${index + 1}` : `Photo ${index + 1}`;

  return (
    <View style={[styles.container, style]}>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}
      >
        {heading}
      </Text>

      {photos.length === 0 ? (
        <View style={[styles.emptyState, { minHeight: imageHeight }]}>
          <Text style={styles.emptyIcon}>▧</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.galleryContent,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
          accessibilityLabel={heading}
        >
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoFrame}>
              <Image
                source={photo.source}
                style={[styles.photo, { height: imageHeight }]}
                resizeMode="cover"
                accessible
                accessibilityRole="image"
                accessibilityLabel={photo.accessibilityLabel ?? imageLabel(index)}
              />
            </View>
          ))}
        </ScrollView>
      )}
      <Text style={[styles.helper, { textAlign: rtl ? 'right' : 'left' }]}>
        {isArabic
          ? 'صور مقدّمة للعرض فقط؛ لا يتم رفع الصور أو حفظها من هذه البطاقة.'
          : 'Images fournies pour affichage uniquement ; aucun téléversement ni enregistrement depuis cette carte.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  heading: {
    color: '#102A43',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  galleryContent: {
    gap: 10,
  },
  photoFrame: {
    width: 280,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#E8EEF3',
  },
  photo: {
    width: '100%',
    backgroundColor: '#E8EEF3',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8D3DF',
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
  },
  emptyIcon: {
    color: '#829AB1',
    fontSize: 30,
  },
  emptyText: {
    color: '#52606D',
    fontSize: 13,
    textAlign: 'center',
  },
  helper: {
    color: '#627D98',
    fontSize: 11,
    lineHeight: 17,
  },
});
