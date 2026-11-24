import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NewListingDraft } from './OwnerListingForm';
import type { OwnerListingLocalPhoto } from './OwnerListingPhotoPicker';

type Language = 'ar' | 'fr';

export type OwnerListingReviewProps = {
  language: Language;
  draft: NewListingDraft;
  photos: OwnerListingLocalPhoto[];
  onEditDetails?: () => void;
  onEditPhotos?: () => void;
};

const amenityLabels: Record<string, { ar: string; fr: string }> = {
  wifi: { ar: 'واي فاي', fr: 'Wi-Fi' },
  air_conditioning: { ar: 'مكيّف', fr: 'Climatisation' },
  parking: { ar: 'موقف سيارات', fr: 'Parking' },
  kitchen: { ar: 'مطبخ', fr: 'Cuisine' },
  sea_view: { ar: 'إطلالة على البحر', fr: 'Vue sur mer' },
  pool: { ar: 'مسبح', fr: 'Piscine' },
  garden: { ar: 'حديقة', fr: 'Jardin' },
  tv: { ar: 'تلفاز', fr: 'Télévision' },
};

/** Read-only, local review screen. It never submits, saves, uploads, or contacts a backend. */
export default function OwnerListingReview({
  language,
  draft,
  photos,
  onEditDetails,
  onEditPhotos,
}: OwnerListingReviewProps) {
  const isArabic = language === 'ar';
  const rtl = isArabic;
  const t = isArabic
    ? {
        title: 'مراجعة الإقامة قبل تقديمها',
        subtitle: 'تحقق من المعلومات والصور قبل الانتقال إلى الخطوة التالية.',
        details: 'معلومات الإقامة',
        photos: 'صور الإقامة',
        noPhotos: 'لم تتم إضافة صور.',
        editDetails: 'تعديل المعلومات',
        editPhotos: 'تعديل الصور',
        location: 'الموقع',
        price: 'السعر لكل ليلة',
        deposit: 'العربون الإضافي',
        guests: 'أقصى عدد للضيوف',
        bedrooms: 'غرف النوم',
        bathrooms: 'الحمامات',
        amenities: 'المرافق',
        noAmenities: 'لم يتم تحديد مرافق.',
        totalNote: 'العربون مبلغ إضافي فوق سعر الإقامة، ويُدفع للمالك.',
        localNotice: 'هذه مراجعة محلية فقط. لا يتم إرسال طلب أو إنشاء إقامة أو حفظ بيانات أو رفع صور. ظهور هذه المعاينة لا يعني قبول الإقامة أو نشرها.',
        image: (index: number) => `صورة رقم ${index + 1}`,
      }
    : {
        title: 'Vérification avant soumission',
        subtitle: 'Vérifiez les informations et les photos avant de passer à l’étape suivante.',
        details: 'Informations du logement',
        photos: 'Photos du logement',
        noPhotos: 'Aucune photo ajoutée.',
        editDetails: 'Modifier les informations',
        editPhotos: 'Modifier les photos',
        location: 'Lieu',
        price: 'Prix par nuit',
        deposit: 'Dépôt supplémentaire',
        guests: 'Nombre maximal de voyageurs',
        bedrooms: 'Chambres',
        bathrooms: 'Salles de bain',
        amenities: 'Équipements',
        noAmenities: 'Aucun équipement sélectionné.',
        totalNote: 'Le dépôt s’ajoute au prix du logement et est versé au propriétaire.',
        localNotice: 'Vérification locale uniquement. Aucune demande n’est envoyée, aucun logement n’est créé, aucune donnée n’est enregistrée et aucune photo n’est téléversée. Cet aperçu ne signifie ni validation ni publication.',
        image: (index: number) => `Photo numéro ${index + 1}`,
      };

  const amenities = draft.amenities
    .map((id) => amenityLabels[id]?.[language])
    .filter((label): label is string => Boolean(label));

  const rows = [
    { label: t.location, value: draft.location },
    { label: t.price, value: `${draft.pricePerNight.toLocaleString()} DZD` },
    { label: t.deposit, value: `${draft.depositAmount.toLocaleString()} DZD` },
    { label: t.guests, value: String(draft.maxGuests) },
    { label: t.bedrooms, value: String(draft.bedrooms) },
    { label: t.bathrooms, value: String(draft.bathrooms) },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.title}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.subtitle}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.sectionHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.sectionTitle}>{t.details}</Text>
          {onEditDetails ? (
            <Pressable
              accessibilityRole="button"
              onPress={onEditDetails}
              style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
            >
              <Text style={styles.smallButtonText}>{t.editDetails}</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.listingTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {draft.title}
        </Text>
        <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>
          {draft.description}
        </Text>

        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.label} style={[styles.dataRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.rowLabel, { textAlign: rtl ? 'right' : 'left' }]}>{row.label}</Text>
              <Text style={[styles.rowValue, { textAlign: rtl ? 'left' : 'right' }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.amenityHeading, { textAlign: rtl ? 'right' : 'left' }]}>{t.amenities}</Text>
        <Text style={[styles.amenities, { textAlign: rtl ? 'right' : 'left' }]}>
          {amenities.length ? amenities.join(' · ') : t.noAmenities}
        </Text>
        <Text style={[styles.depositNote, { textAlign: rtl ? 'right' : 'left' }]}>{t.totalNote}</Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.sectionHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.sectionTitle}>{t.photos}</Text>
          {onEditPhotos ? (
            <Pressable
              accessibilityRole="button"
              onPress={onEditPhotos}
              style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
            >
              <Text style={styles.smallButtonText}>{t.editPhotos}</Text>
            </Pressable>
          ) : null}
        </View>

        {photos.length === 0 ? (
          <Text style={[styles.emptyPhotos, { textAlign: rtl ? 'right' : 'left' }]}>{t.noPhotos}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.photoList, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
          >
            {photos.map((photo, index) => (
              <Image
                key={photo.id}
                source={{ uri: photo.uri }}
                style={styles.photo}
                resizeMode="cover"
                accessible
                accessibilityRole="image"
                accessibilityLabel={photo.accessibilityLabel ?? t.image(index)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.localNotice}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    gap: 14,
    padding: 16,
    paddingBottom: 28,
  },
  headingBlock: {
    gap: 5,
  },
  heading: {
    color: '#12243A',
    fontSize: 21,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D9E3',
    borderRadius: 15,
    borderWidth: 1,
    gap: 13,
    padding: 15,
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    color: '#12345A',
    fontSize: 16,
    fontWeight: '800',
  },
  smallButton: {
    alignItems: 'center',
    borderColor: '#B8C7D6',
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 11,
  },
  smallButtonText: {
    color: '#12345A',
    fontSize: 12,
    fontWeight: '700',
  },
  listingTitle: {
    color: '#12243A',
    fontSize: 19,
    fontWeight: '800',
  },
  description: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 22,
  },
  rows: {
    borderTopColor: '#EAECF0',
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12,
  },
  dataRow: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#667085',
    flex: 1,
    fontSize: 13,
  },
  rowValue: {
    color: '#26384D',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  amenityHeading: {
    color: '#26384D',
    fontSize: 13,
    fontWeight: '800',
  },
  amenities: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 20,
  },
  depositNote: {
    backgroundColor: '#F5F7FA',
    borderRadius: 9,
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
    padding: 10,
  },
  emptyPhotos: {
    color: '#667085',
    fontSize: 13,
    paddingVertical: 12,
  },
  photoList: {
    gap: 9,
  },
  photo: {
    backgroundColor: '#E8EEF3',
    borderRadius: 11,
    height: 124,
    width: 150,
  },
  notice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F2D49B',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    color: '#694B16',
    fontSize: 12,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.75,
  },
});
