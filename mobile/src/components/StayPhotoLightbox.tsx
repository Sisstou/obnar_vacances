import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

export type StayPhotoLightboxLocale = 'ar' | 'fr';

export interface StayPhotoLightboxImage {
  id: string;
  source: ImageSourcePropType;
  accessibilityLabel?: string;
}

export interface StayPhotoLightboxProps {
  visible: boolean;
  photos: StayPhotoLightboxImage[];
  initialIndex?: number;
  locale?: StayPhotoLightboxLocale;
  onClose: () => void;
}

/**
 * Full-screen, presentational photo viewer.
 * Supports previous/next navigation and button-based zoom.
 * Image sources and visibility are controlled by the parent.
 * No network requests, uploads, persistence, or listing-data access occur here.
 */
export function StayPhotoLightbox({
  visible,
  photos,
  initialIndex = 0,
  locale = 'ar',
  onClose,
}: StayPhotoLightboxProps) {
  const isArabic = locale === 'ar';
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (visible) {
      const safeIndex = Math.min(
        Math.max(0, Math.floor(initialIndex)),
        Math.max(0, photos.length - 1),
      );
      setActiveIndex(safeIndex);
      setZoom(1);
    }
  }, [visible, initialIndex, photos.length]);

  const labels = isArabic
    ? {
        close: 'إغلاق عارض الصور',
        previous: 'الصورة السابقة',
        next: 'الصورة التالية',
        zoomIn: 'تكبير الصورة',
        zoomOut: 'تصغير الصورة',
        reset: 'الحجم الأصلي',
        empty: 'لا توجد صور للعرض',
      }
    : {
        close: 'Fermer la visionneuse',
        previous: 'Photo précédente',
        next: 'Photo suivante',
        zoomIn: 'Agrandir la photo',
        zoomOut: 'Réduire la photo',
        reset: 'Taille originale',
        empty: 'Aucune photo à afficher',
      };

  const currentPhoto = photos[activeIndex];
  const canNavigate = photos.length > 1;

  const move = (direction: -1 | 1) => {
    if (!canNavigate) return;
    setActiveIndex((current) => (current + direction + photos.length) % photos.length);
    setZoom(1);
  };

  const changeZoom = (amount: number) => {
    setZoom((current) => Math.min(3, Math.max(1, Number((current + amount).toFixed(2)))));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.topBar, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
          <Text style={styles.counter}>
            {photos.length > 0 ? `${activeIndex + 1} / ${photos.length}` : '0 / 0'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.close}
            onPress={onClose}
            hitSlop={8}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        {currentPhoto ? (
          <>
            <View style={styles.imageStage}>
              <Image
                source={currentPhoto.source}
                resizeMode="contain"
                style={[styles.image, { transform: [{ scale: zoom }] }]}
                accessible
                accessibilityRole="image"
                accessibilityLabel={
                  currentPhoto.accessibilityLabel ??
                  (isArabic ? `صورة رقم ${activeIndex + 1}` : `Photo ${activeIndex + 1}`)
                }
              />
            </View>

            {canNavigate ? (
              <View style={[styles.navigation, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={labels.previous}
                  onPress={() => move(-1)}
                  style={styles.navButton}
                >
                  <Text style={styles.navText}>{isArabic ? 'التالي ←' : '← Précédente'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={labels.next}
                  onPress={() => move(1)}
                  style={styles.navButton}
                >
                  <Text style={styles.navText}>{isArabic ? '→ السابقة' : 'Suivante →'}</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={[styles.zoomControls, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={labels.zoomOut}
                disabled={zoom <= 1}
                onPress={() => changeZoom(-0.25)}
                style={[styles.zoomButton, zoom <= 1 ? styles.disabled : null]}
              >
                <Text style={styles.zoomText}>−</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={labels.reset}
                onPress={() => setZoom(1)}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>{Math.round(zoom * 100)}%</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={labels.zoomIn}
                disabled={zoom >= 3}
                onPress={() => changeZoom(0.25)}
                style={[styles.zoomButton, zoom >= 3 ? styles.disabled : null]}
              >
                <Text style={styles.zoomText}>+</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{labels.empty}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 38,
    paddingBottom: 28,
    backgroundColor: '#071521',
  },
  topBar: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#123B5D',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
  },
  imageStage: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navigation: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  navButton: {
    minHeight: 44,
    minWidth: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#123B5D',
  },
  navText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  zoomControls: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 18,
  },
  zoomButton: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#123B5D',
  },
  zoomText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '600',
  },
  resetButton: {
    minWidth: 76,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#A47B36',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.35,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
  },
});
