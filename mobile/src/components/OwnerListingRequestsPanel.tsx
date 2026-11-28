import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type OwnerListingRequestStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'needs_changes';

export type OwnerListingRequest = {
  id: string;
  listingTitle: string;
  location: string;
  status: OwnerListingRequestStatus;
  submittedAtLabel?: string;
  updatedAtLabel?: string;
  reviewNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  requests: OwnerListingRequest[];
  language: Language;
  onOpenRequest?: (request: OwnerListingRequest) => void;
  onEditRequest?: (request: OwnerListingRequest) => void;
  trustedStatusSource?: boolean;
};

const copy = {
  ar: {
    heading: 'طلبات الإقامات',
    subtitle: 'تابع حالة كل طلب وملاحظات المراجعة',
    open: 'عرض الطلب',
    edit: 'تعديل الطلب',
    emptyTitle: 'لا توجد طلبات حالياً',
    emptyBody: 'ستظهر هنا طلبات الإقامات التي يمررها مصدر البيانات إلى هذه الشاشة.',
    submitted: 'تاريخ التقديم',
    updated: 'آخر تحديث',
    reviewNote: 'ملاحظة المراجعة',
    draft: 'مسودة',
    under_review: 'قيد المراجعة',
    approved: 'مقبول',
    needs_changes: 'يتطلب تعديلات',
    demo: 'واجهة عرض فقط؛ لا يتم إرسال الطلبات أو تعديلها أو حفظها من هذه الشاشة.',
    untrusted: 'حالات الطلبات غير مؤكدة ما لم يثبت مصدرها.',
    trusted: 'حالات الطلبات مقدمة من مصدر موثوق.',
    staging: 'بيانات الاختبار ليست طلبات حقيقية، ولا تعني أن أي إقامة متاحة للضيوف.',
    noNote: 'لم تُرفق ملاحظة مراجعة.',
  },
  fr: {
    heading: 'Demandes de logement',
    subtitle: 'Suivez le statut de chaque demande et les remarques',
    open: 'Voir la demande',
    edit: 'Modifier la demande',
    emptyTitle: 'Aucune demande pour le moment',
    emptyBody: 'Les demandes fournies par la source de données apparaîtront ici.',
    submitted: 'Date de soumission',
    updated: 'Dernière mise à jour',
    reviewNote: 'Remarque de vérification',
    draft: 'Brouillon',
    under_review: 'En cours de vérification',
    approved: 'Approuvée',
    needs_changes: 'Modifications requises',
    demo: 'Affichage uniquement ; cette interface n’envoie, ne modifie et n’enregistre aucune demande.',
    untrusted: 'Les statuts ne sont pas confirmés tant que leur source n’est pas vérifiée.',
    trusted: 'Les statuts proviennent d’une source fiable.',
    staging: 'Les données de test ne sont pas de vraies demandes et ne signifient pas qu’un logement est disponible.',
    noNote: 'Aucune remarque de vérification fournie.',
  },
} as const;

const statusStyles: Record<
  OwnerListingRequestStatus,
  { backgroundColor: string; color: string }
> = {
  draft: { backgroundColor: '#EEF2F7', color: '#344054' },
  under_review: { backgroundColor: '#FFF4D6', color: '#805B00' },
  approved: { backgroundColor: '#E4F5EC', color: '#176B42' },
  needs_changes: { backgroundColor: '#FDECEC', color: '#A12B2B' },
};

/**
 * Presentational-only owner request tracker.
 * All request data and status labels are supplied by the parent.
 * This component performs no fetching, persistence, submission, approval,
 * publication, editing, or deletion.
 */
export default function OwnerListingRequestsPanel({
  requests,
  language,
  onOpenRequest,
  onEditRequest,
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

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedStatusSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={styles.emptyBody}>{t.emptyBody}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {requests.map((request) => {
            const status = statusStyles[request.status];
            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.cardTop}>
                  <View style={styles.titleBlock}>
                    <Text
                      numberOfLines={2}
                      style={[styles.requestTitle, { textAlign: rtl ? 'right' : 'left' }]}
                    >
                      {request.listingTitle}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.location, { textAlign: rtl ? 'right' : 'left' }]}
                    >
                      {request.location}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {t[request.status]}
                    </Text>
                  </View>
                </View>

                {request.submittedAtLabel ? (
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.submitted}: {request.submittedAtLabel}
                  </Text>
                ) : null}
                {request.updatedAtLabel ? (
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.updated}: {request.updatedAtLabel}
                  </Text>
                ) : null}

                <View style={styles.reviewBox}>
                  <Text style={[styles.reviewLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.reviewNote}
                  </Text>
                  <Text style={[styles.reviewText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {request.reviewNote?.trim() || t.noNote}
                  </Text>
                </View>

                {onOpenRequest || (onEditRequest && (request.status === 'draft' || request.status === 'needs_changes')) ? (
                  <View style={[styles.actions, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                    {onOpenRequest ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.open + ': ' + request.listingTitle}
                        onPress={() => onOpenRequest(request)}
                        style={({ pressed }) => [styles.actionButton, styles.secondaryButton, pressed && styles.pressed]}
                      >
                        <Text style={[styles.actionText, styles.secondaryText]}>{t.open}</Text>
                      </Pressable>
                    ) : null}
                    {onEditRequest && (request.status === 'draft' || request.status === 'needs_changes') ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.edit + ': ' + request.listingTitle}
                        onPress={() => onEditRequest(request)}
                        style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.actionText}>{t.edit}</Text>
                      </Pressable>
                    ) : null}
                  </View>
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
  requestCard: {
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
  requestTitle: {
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
    maxWidth: 150,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    color: '#667085',
    fontSize: 12,
  },
  reviewBox: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 11,
    borderWidth: 1,
    gap: 5,
    padding: 11,
  },
  reviewLabel: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '800',
  },
  reviewText: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    gap: 9,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8C7D6',
    borderWidth: 1,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryText: {
    color: '#123B5D',
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
