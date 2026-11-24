import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ListingReviewStatus =
  | 'draft'
  | 'under_review'
  | 'published'
  | 'needs_changes';

type Language = 'ar' | 'fr';

type Props = {
  status: ListingReviewStatus;
  language: Language;
  title?: string;
  description?: string;
};

/**
 * Presentational-only owner listing status card.
 * It does not fetch, persist, or submit listing data.
 */
const labels = {
  ar: {
    title: 'حالة الإقامة',
    draft: 'مسودة',
    under_review: 'قيد المراجعة',
    published: 'منشورة',
    needs_changes: 'تحتاج إلى تعديل',
    descriptions: {
      draft: 'لم تُرسل الإقامة للمراجعة بعد.',
      under_review: 'الإقامة قيد مراجعة إدارة المنصة.',
      published: 'اجتازت الإقامة المراجعة ويمكن عرضها وفق صلاحيات النشر.',
      needs_changes: 'يرجى مراجعة الملاحظات واستكمال المعلومات المطلوبة.',
    },
    note: 'هذه حالة عرض فقط؛ يجب جلب الحالة الفعلية من مصدر موثوق قبل استخدامها.',
  },
  fr: {
    title: 'État du logement',
    draft: 'Brouillon',
    under_review: 'En cours de vérification',
    published: 'Publié',
    needs_changes: 'Modifications requises',
    descriptions: {
      draft: 'Le logement n’a pas encore été soumis à la vérification.',
      under_review: 'Le logement est en cours de vérification par la plateforme.',
      published: 'Le logement a passé la vérification et peut être affiché selon les droits de publication.',
      needs_changes: 'Consultez les remarques et complétez les informations demandées.',
    },
    note: 'Affichage uniquement : récupérer un état réel depuis une source fiable avant utilisation.',
  },
} as const;

const statusColors: Record<ListingReviewStatus, { background: string; foreground: string }> = {
  draft: { background: '#EEF2F7', foreground: '#344054' },
  under_review: { background: '#FFF4D6', foreground: '#805B00' },
  published: { background: '#E4F5EC', foreground: '#176B42' },
  needs_changes: { background: '#FDECEC', foreground: '#A12B2B' },
};

export default function OwnerListingStatusCard({
  status,
  language,
  title,
  description,
}: Props) {
  const copy = labels[language];
  const color = statusColors[status];
  const rtl = language === 'ar';

  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { direction: rtl ? 'rtl' : 'ltr' }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title ?? copy.title}</Text>
        <View style={[styles.badge, { backgroundColor: color.background }]}>
          <Text style={[styles.badgeText, { color: color.foreground }]}>
            {copy[status]}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>
        {description ?? copy.descriptions[status]}
      </Text>

      <Text style={[styles.note, { textAlign: rtl ? 'right' : 'left' }]}>
        {copy.note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: '#12243A',
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    color: '#344054',
    fontSize: 14,
    lineHeight: 22,
  },
  note: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
  },
});
