import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type OwnerListingStatus =
  | 'draft'
  | 'under_review'
  | 'published'
  | 'needs_changes';

export type OwnerListingItem = {
  id: string;
  title: string;
  location: string;
  status: OwnerListingStatus;
  updatedAtLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  listings: OwnerListingItem[];
  language: Language;
  onOpenListing?: (listing: OwnerListingItem) => void;
  onAddListing?: () => void;
  trustedStatusSource?: boolean;
};

const copy = {
  ar: {
    heading: 'إقاماتي',
    subtitle: 'إدارة ومتابعة الإقامات التي أضفتها',
    add: 'إضافة إقامة',
    open: 'فتح التفاصيل',
    emptyTitle: 'لا توجد إقامات في القائمة',
    emptyBody: 'ستظهر هنا الإقامات التي تضيفها إلى حسابك.',
    updated: 'آخر تحديث',
    draft: 'مسودة',
    under_review: 'قيد المراجعة',
    published: 'منشورة',
    needs_changes: 'تحتاج إلى تعديل',
    demo: 'واجهة معاينة فقط. البيانات والحالات تصل من الشاشة المستضيفة، ولا يتم حفظ أي تغيير هنا.',
    untrusted: 'الحالات المعروضة غير مؤكدة؛ لم يثبت مصدرها بعد.',
    trusted: 'الحالات مقدمة من مصدر موثوق.',
    staging: 'بيانات الاختبار ليست إقامات منشورة للضيوف ولا يجوز اعتبارها عروضاً حقيقية.',
  },
  fr: {
    heading: 'Mes logements',
    subtitle: 'Gérez et suivez les logements ajoutés',
    add: 'Ajouter un logement',
    open: 'Ouvrir les détails',
    emptyTitle: 'Aucun logement dans la liste',
    emptyBody: 'Les logements ajoutés à votre compte apparaîtront ici.',
    updated: 'Dernière mise à jour',
    draft: 'Brouillon',
    under_review: 'En vérification',
    published: 'Publié',
    needs_changes: 'Modifications requises',
    demo: 'Aperçu uniquement. Les données et statuts sont fournis par le composant parent ; aucun changement n’est enregistré ici.',
    untrusted: 'Les statuts affichés ne sont pas confirmés ; leur source n’est pas encore vérifiée.',
    trusted: 'Les statuts proviennent d’une source fiable.',
    staging: 'Les données de test ne sont pas des logements publiés et ne doivent pas être considérées comme des offres réelles.',
  },
} as const;

const statusStyle: Record<
  OwnerListingStatus,
  { backgroundColor: string; color: string }
> = {
  draft: { backgroundColor: '#EEF2F7', color: '#344054' },
  under_review: { backgroundColor: '#FFF4D6', color: '#805B00' },
  published: { backgroundColor: '#E4F5EC', color: '#176B42' },
  needs_changes: { backgroundColor: '#FDECEC', color: '#A12B2B' },
};

/**
 * Presentational-only owner listings panel.
 * Data is supplied by the parent. This component does not fetch, persist,
 * publish, edit, or delete listings.
 */
export default function OwnerListingsPanel({
  listings,
  language,
  onOpenListing,
  onAddListing,
  trustedStatusSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.headingBlock}>
        <Text style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.subtitle}
        </Text>
      </View>

      {onAddListing ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAddListing}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>{t.add}</Text>
        </Pressable>
      ) : null}

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedStatusSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {listings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={styles.emptyBody}>{t.emptyBody}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {listings.map((listing) => {
            const badge = statusStyle[listing.status];
            const statusLabel = t[listing.status];

            return (
              <View key={listing.id} style={styles.listingCard}>
                <View style={styles.cardTop}>
                  <View style={styles.titleBlock}>
                    <Text
                      numberOfLines={2}
                      style={[styles.listingTitle, { textAlign: rtl ? 'right' : 'left' }]}
                    >
                      {listing.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.location, { textAlign: rtl ? 'right' : 'left' }]}
                    >
                      {listing.location}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {listing.updatedAtLabel ? (
                  <Text style={[styles.updated, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.updated}: {listing.updatedAtLabel}
                  </Text>
                ) : null}

                {onOpenListing ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.open + ': ' + listing.title}
                    onPress={() => onOpenListing(listing)}
                    style={({ pressed }) => [
                      styles.openButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.openButtonText}>{t.open}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Text style={[styles.footerNote, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.demo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
  },
  headingBlock: {
    gap: 4,
  },
  heading: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  notice: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  noticeText: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 18,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 5,
  },
  listingTitle: {
    color: '#123B5D',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  location: {
    color: '#667085',
    fontSize: 13,
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 999,
    maxWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  updated: {
    color: '#667085',
    fontSize: 12,
  },
  openButton: {
    alignItems: 'center',
    borderColor: '#C8D5E2',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  openButtonText: {
    color: '#123B5D',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 22,
  },
  emptyTitle: {
    color: '#123B5D',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerNote: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
  },
});
