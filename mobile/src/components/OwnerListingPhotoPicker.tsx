import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type OwnerListingLocalPhoto = {
  id: string;
  uri: string;
  accessibilityLabel?: string;
};

type Language = 'ar' | 'fr';

export type OwnerListingPhotoPickerProps = {
  language: Language;
  photos: OwnerListingLocalPhoto[];
  onChange: (photos: OwnerListingLocalPhoto[]) => void;
  /** Parent may connect a native image picker later; this component never opens one itself. */
  onRequestPick?: () => void;
  maxPhotos?: number;
};

/**
 * Local photo selection preview for the owner listing form.
 * Receives device-local URIs from its parent and emits removals through onChange.
 * It does not request permissions, open the device library, upload, fetch, or persist images.
 */
export default function OwnerListingPhotoPicker({
  language,
  photos,
  onChange,
  onRequestPick,
  maxPhotos = 8,
}: OwnerListingPhotoPickerProps) {
  const isArabic = language === 'ar';
  const rtl = isArabic;
  const limit = Math.max(1, Math.floor(maxPhotos));
  const canAdd = photos.length < limit && typeof onRequestPick === 'function';

  const t = isArabic
    ? {
        title: 'صور الإقامة',
        add: 'إضافة صور',
        count: (count: number) => `${count} من ${limit} صور`,
        remove: 'حذف الصورة من المعاينة',
        empty: 'لم تتم إضافة صور بعد.',
        limit: 'وصلت إلى الحد الأقصى للصور.',
        pickerUnavailable: 'اختيار الصور من الهاتف غير مفعّل في هذه المرحلة.',
        note: 'تُعرض الصور محلياً فقط. لا يتم رفعها أو حفظها أو إرسالها إلى المنصة.',
      }
    : {
        title: 'Photos du logement',
        add: 'Ajouter des photos',
        count: (count: number) => `${count} sur ${limit} photos`,
        remove: 'Retirer la photo de l’aperçu',
        empty: 'Aucune photo ajoutée pour le moment.',
        limit: 'Le nombre maximal de photos est atteint.',
        pickerUnavailable: 'La sélection depuis la galerie du téléphone n’est pas encore activée.',
        note: 'Aperçu local uniquement. Les photos ne sont ni téléversées, ni enregistrées, ni envoyées à la plateforme.',
      };

  const removePhoto = (id: string) => {
    onChange(photos.filter((photo) => photo.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text accessibilityRole="header" style={styles.title}>{t.title}</Text>
        <Text style={styles.counter}>{t.count(photos.length)}</Text>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyGlyph}>▧</Text>
          <Text style={styles.emptyText}>{t.empty}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.photoList,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
          accessibilityLabel={t.title}
        >
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoItem}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photo}
                resizeMode="cover"
                accessible
                accessibilityRole="image"
                accessibilityLabel={
                  photo.accessibilityLabel ??
                  (isArabic ? `صورة الإقامة ${index + 1}` : `Photo du logement ${index + 1}`)
                }
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.remove}
                onPress={() => removePhoto(photo.id)}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
              <View style={styles.indexPill}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canAdd }}
        disabled={!canAdd}
        onPress={onRequestPick}
        style={({ pressed }) => [
          styles.addButton,
          !canAdd && styles.addButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.addButtonText, !canAdd && styles.addButtonTextDisabled]}>
          + {t.add}
        </Text>
      </Pressable>

      {photos.length >= limit ? (
        <Text style={styles.helper}>{t.limit}</Text>
      ) : !onRequestPick ? (
        <Text style={styles.helper}>{t.pickerUnavailable}</Text>
      ) : null}

      <Text style={[styles.disclaimer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 11,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    color: '#12243A',
    fontSize: 17,
    fontWeight: '800',
  },
  counter: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderColor: '#C8D5E2',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 7,
    justifyContent: 'center',
    minHeight: 132,
    padding: 18,
  },
  emptyGlyph: {
    color: '#829AB1',
    fontSize: 30,
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
  },
  photoList: {
    gap: 10,
  },
  photoItem: {
    backgroundColor: '#E8EEF3',
    borderRadius: 13,
    height: 142,
    overflow: 'hidden',
    position: 'relative',
    width: 142,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 7,
    top: 7,
    width: 36,
  },
  removeText: {
    color: '#B42318',
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '500',
  },
  indexPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 36, 58, 0.82)',
    borderRadius: 10,
    bottom: 7,
    left: 7,
    minWidth: 25,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  indexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#12345A',
    borderRadius: 11,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 15,
  },
  addButtonDisabled: {
    backgroundColor: '#E4E7EC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addButtonTextDisabled: {
    color: '#667085',
  },
  helper: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  disclaimer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
  },
});
