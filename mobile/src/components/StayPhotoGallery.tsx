import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
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
 * Interactive, presentational photo gallery. The parent supplies image sources.
 * This component does not fetch listing records, upload images, or persist data.
 */
export function StayPhotoGallery({
  photos,
  locale = 'ar',
  title,
  style,
  imageHeight = 190,
}: StayPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const heading = title ?? (isArabic ? 'صور الإقامة' : 'Photos du séjour');
  const emptyMessage = isArabic
    ? 'لا توجد صور للعرض حالياً'
    : 'Aucune photo à afficher pour le moment';
  const imageLabel = (index: number) =>
    isArabic ? `صورة رقم ${index + 1}` : `Photo ${index + 1}`;
  const closeLabel = isArabic ? 'إغلاق الصورة' : 'Fermer la photo';
  const previousLabel = isArabic ? 'الصورة السابقة' : 'Photo précédente';
  const nextLabel = isArabic ? 'الصورة التالية' : 'Photo suivante';
  const zoomInLabel = isArabic ? 'تكبير الصورة' : 'Agrandir';
  const zoomOutLabel = isArabic ? 'تصغير الصورة' : 'Réduire';
  const openPhoto = (index: number) => {
    setActiveIndex(index);
    setZoomScale(1);
  };
  const movePhoto = (direction: -1 | 1) => {
    if (activeIndex === null || photos.length < 2) return;
    setActiveIndex((activeIndex + direction + photos.length) % photos.length);
    setZoomScale(1);
  };

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
            <Pressable
              key={photo.id}
              accessibilityRole="button"
              accessibilityLabel={isArabic
                ? `فتح ${imageLabel(index)} مكبّرة`
                : `Ouvrir ${imageLabel(index)} en grand`}
              onPress={() => openPhoto(index)}
              style={({ pressed }) => [styles.photoFrame, pressed && styles.photoPressed]}
            >
              <Image
                source={photo.source}
                style={[styles.photo, { height: imageHeight }]}
                resizeMode="cover"
                accessible
                accessibilityRole="image"
                accessibilityLabel={photo.accessibilityLabel ?? imageLabel(index)}
              />
              <View style={styles.expandHint}>
                <Text style={styles.expandHintText}>⤢</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Text style={[styles.helper, { textAlign: rtl ? 'right' : 'left' }]}>
        {isArabic
          ? 'اضغط على أي صورة لفتحها مكبّرة، ثم استعمل أزرار التكبير والتنقل.'
          : 'Touchez une photo pour l’ouvrir en grand, puis utilisez les commandes de zoom et de navigation.'}
      </Text>

      <Modal
        visible={activeIndex !== null && photos.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveIndex(null)}
        statusBarTranslucent
      >
        <View style={styles.viewerBackdrop}>
          <View style={styles.viewerCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={() => setActiveIndex(null)}
              style={styles.closeButton}
              hitSlop={8}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>

            {activeIndex !== null && photos[activeIndex] ? (
              <>
                <View style={styles.viewerImageFrame}>
                  <Image
                    source={photos[activeIndex].source}
                    style={[styles.viewerImage, { transform: [{ scale: zoomScale }] }]}
                    resizeMode="contain"
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={photos[activeIndex].accessibilityLabel ?? imageLabel(activeIndex)}
                  />
                </View>

                <Text style={styles.counter}>
                  {activeIndex + 1} / {photos.length}
                </Text>

                <View style={styles.controlRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={zoomOutLabel}
                    disabled={zoomScale <= 1}
                    onPress={() => setZoomScale((scale) => Math.max(1, Number((scale - 0.5).toFixed(1))))}
                    style={[styles.controlButton, zoomScale <= 1 && styles.controlDisabled]}
                  >
                    <Text style={styles.controlText}>−</Text>
                  </Pressable>
                  <Text style={styles.zoomValue}>{Math.round(zoomScale * 100)}%</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={zoomInLabel}
                    disabled={zoomScale >= 3}
                    onPress={() => setZoomScale((scale) => Math.min(3, Number((scale + 0.5).toFixed(1))))}
                    style={[styles.controlButton, zoomScale >= 3 && styles.controlDisabled]}
                  >
                    <Text style={styles.controlText}>＋</Text>
                  </Pressable>
                </View>

                <View style={styles.controlRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={previousLabel}
                    disabled={photos.length < 2}
                    onPress={() => movePhoto(-1)}
                    style={[styles.controlButton, photos.length < 2 && styles.controlDisabled]}
                  >
                    <Text style={styles.controlText}>{rtl ? '›' : '‹'}</Text>
                  </Pressable>
                  <Text style={styles.navigationLabel}>
                    {isArabic ? 'التنقل بين الصور' : 'Navigation'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={nextLabel}
                    disabled={photos.length < 2}
                    onPress={() => movePhoto(1)}
                    style={[styles.controlButton, photos.length < 2 && styles.controlDisabled]}
                  >
                    <Text style={styles.controlText}>{rtl ? '‹' : '›'}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  photoPressed: {
    opacity: 0.82,
  },
  photo: {
    width: '100%',
    backgroundColor: '#E8EEF3',
  },
  expandHint: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071827CC',
  },
  expandHintText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
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
  viewerBackdrop: {
    flex: 1,
    backgroundColor: '#071827F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  viewerCard: {
    width: '100%',
    maxWidth: 560,
    minHeight: 420,
    borderRadius: 18,
    backgroundColor: '#F8F7F3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingTop: 48,
    paddingBottom: 18,
    gap: 12,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 2,
    top: 5,
    right: 7,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#102D46',
    fontSize: 32,
    fontWeight: '700',
  },
  viewerImageFrame: {
    width: '100%',
    height: 270,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#E8EEF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  counter: {
    color: '#52606D',
    fontSize: 13,
    fontWeight: '800',
  },
  controlRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  controlButton: {
    minWidth: 48,
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlText: {
    color: '#174B68',
    fontSize: 25,
    fontWeight: '800',
  },
  zoomValue: {
    minWidth: 62,
    color: '#20384A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  navigationLabel: {
    color: '#52606D',
    fontSize: 12,
    fontWeight: '700',
  },
});
