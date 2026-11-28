import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AdminReviewItem = {
  id: string;
  authorLabel: string;
  rating: number;
  comment: string;
  dateLabel?: string;
  relatedListingTitle?: string;
  verifiedStay?: boolean;
  moderationStatusLabel?: string;
  adminNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  reviews: AdminReviewItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
  onOpenReview?: (review: AdminReviewItem) => void;
};

const copy = {
  ar: {
    heading: 'إدارة التقييمات والمراجعات',
    subtitle: 'متابعة آراء الضيوف وتقييماتهم دون تعديلها',
    total: 'إجمالي التقييمات',
    average: 'متوسط التقييم',
    period: 'الفترة',
    author: 'صاحب التقييم',
    listing: 'الإقامة',
    date: 'تاريخ النشر',
    verified: 'إقامة مؤكدة',
    note: 'ملاحظة الإدارة',
    open: 'عرض التفاصيل',
    emptyTitle: 'لا توجد تقييمات للعرض',
    emptyBody: 'ستظهر هنا التقييمات التي يمررها مصدر الإدارة الموثوق.',
    trusted: 'البيانات مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر البيانات غير مؤكد؛ تم إخفاء التقييمات والإحصائيات.',
    privacy: 'الخصوصية: لا تعرض هذه اللوحة البريد الإلكتروني أو أرقام الهواتف أو بيانات الاتصال الخاصة. اعرض الاسم المختصر أو المعرّف العام فقط.',
    staging: 'بيانات الاختبار لا تمثل آراء حقيقية ولا ينبغي عرضها كدليل اجتماعي للضيوف.',
    readOnly: 'واجهة عرض وتنقل فقط؛ لا تحذف التقييمات ولا تخفيها ولا تعدّلها ولا ترد عليها ولا تغيّر حالة المراجعة.',
    hidden: 'التقييمات مخفية إلى حين تأكيد مصدر الإدارة.',
    outOf: 'من 5',
  },
  fr: {
    heading: 'Gestion des avis et évaluations',
    subtitle: 'Suivi des avis des voyageurs sans les modifier',
    total: 'Nombre total d’avis',
    average: 'Note moyenne',
    period: 'Période',
    author: 'Auteur de l’avis',
    listing: 'Logement',
    date: 'Date de publication',
    verified: 'Séjour vérifié',
    note: 'Note de l’administration',
    open: 'Voir les détails',
    emptyTitle: 'Aucun avis à afficher',
    emptyBody: 'Les avis fournis par une source administrative fiable apparaîtront ici.',
    trusted: 'Les données proviennent d’une source administrative fiable.',
    untrusted: 'La source des données n’est pas confirmée ; les avis et statistiques sont masqués.',
    privacy: 'Confidentialité : ce panneau n’affiche ni e-mail, ni téléphone, ni coordonnées privées. Utilisez uniquement un nom abrégé ou un identifiant public.',
    staging: 'Les données de test ne représentent pas de vrais avis et ne doivent pas être présentées comme preuve sociale aux voyageurs.',
    readOnly: 'Consultation et navigation uniquement ; aucun avis n’est supprimé, masqué, modifié ou commenté, et aucun statut de modération ne change.',
    hidden: 'Les avis sont masqués jusqu’à confirmation de la source administrative.',
    outOf: 'sur 5',
  },
};

function renderStars(value: number) {
  const rounded = Math.round(Math.max(0, Math.min(5, value)));
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

/**
 * Read-only administrative reviews overview.
 * Moderation status is a parent-provided label; no workflow states are assumed.
 * No personal contact details, fetching, persistence, moderation, or mutations.
 */
export default function AdminReviewsPanel({
  reviews,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
  onOpenReview,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const visibleReviews = trustedAdminSource ? reviews : [];
  const validRatings = visibleReviews
    .map((review) => review.rating)
    .filter((rating) => Number.isFinite(rating) && rating >= 0 && rating <= 5);
  const average =
    validRatings.length > 0
      ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
      : undefined;

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.subtitle}
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedAdminSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {trustedAdminSource ? (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{visibleReviews.length}</Text>
              <Text style={styles.summaryLabel}>{t.total}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {average == null ? '—' : average.toFixed(1)}
              </Text>
              <Text style={styles.summaryLabel}>{t.average} ({t.outOf})</Text>
            </View>
          </View>
          {reportingPeriodLabel ? (
            <Text style={[styles.period, { textAlign: rtl ? 'right' : 'left' }]}>
              {t.period}: {reportingPeriodLabel}
            </Text>
          ) : null}

          {visibleReviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyTitle}
              </Text>
              <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyBody}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {visibleReviews.map((review) => {
                const rating =
                  Number.isFinite(review.rating) && review.rating >= 0 && review.rating <= 5
                    ? review.rating
                    : 0;
                return (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.authorBlock}>
                        <Text style={[styles.author, { textAlign: rtl ? 'right' : 'left' }]}>
                          {review.authorLabel}
                        </Text>
                        {review.dateLabel ? (
                          <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                            {t.date}: {review.dateLabel}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingValue}>{rating.toFixed(1)} / 5</Text>
                        <Text style={styles.stars}>{renderStars(rating)}</Text>
                      </View>
                    </View>

                    {review.relatedListingTitle ? (
                      <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.listing}: {review.relatedListingTitle}
                      </Text>
                    ) : null}

                    {review.verifiedStay ? (
                      <Text style={[styles.verified, { textAlign: rtl ? 'right' : 'left' }]}>
                        ✓ {t.verified}
                      </Text>
                    ) : null}

                    <Text style={[styles.comment, { textAlign: rtl ? 'right' : 'left' }]}>
                      {review.comment}
                    </Text>

                    {review.moderationStatusLabel ? (
                      <View style={styles.statusBox}>
                        <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.outOf}: {review.moderationStatusLabel}
                        </Text>
                      </View>
                    ) : null}

                    {review.adminNote ? (
                      <View style={styles.noteBox}>
                        <Text style={[styles.noteLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.note}
                        </Text>
                        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                          {review.adminNote}
                        </Text>
                      </View>
                    ) : null}

                    {onOpenReview ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.open + ': ' + review.authorLabel}
                        onPress={() => onOpenReview(review)}
                        style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.openButtonText}>{t.open}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.hidden}
          </Text>
        </View>
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.privacy}
        </Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.readOnly}
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
    gap: 5,
  },
  heading: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
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
    fontSize: 11,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 9,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    padding: 13,
  },
  summaryValue: {
    color: '#123B5D',
    fontSize: 23,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  period: {
    color: '#667085',
    fontSize: 11,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  authorBlock: {
    flex: 1,
    gap: 4,
  },
  author: {
    color: '#123B5D',
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  ratingBadge: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderRadius: 11,
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  ratingValue: {
    color: '#805B00',
    fontSize: 11,
    fontWeight: '800',
  },
  stars: {
    color: '#B7791F',
    fontSize: 12,
    letterSpacing: 1,
  },
  verified: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
  },
  comment: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 20,
  },
  statusBox: {
    backgroundColor: '#F8F5EF',
    borderRadius: 9,
    padding: 9,
  },
  noteBox: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
    padding: 10,
  },
  noteLabel: {
    color: '#805B00',
    fontSize: 11,
    fontWeight: '800',
  },
  bodyText: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  emptyTitle: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
  },
  privacyNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  footer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 18,
  },
});
