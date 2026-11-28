import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type AdminListingRequestStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'needs_changes';

export type AdminListingReviewItem = {
  id: string;
  listingTitle: string;
  location: string;
  ownerDisplayName: string;
  status: AdminListingRequestStatus;
  submittedAtLabel?: string;
  updatedAtLabel?: string;
  reviewNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  requests: AdminListingReviewItem[];
  language: Language;
  reportingPeriodLabel?: string;
  trustedAdminSource?: boolean;
  onOpenRequest?: (request: AdminListingReviewItem) => void;
};

const copy = {
  ar: {
    heading: 'مراجعة طلبات الإقامات',
    subtitle: 'متابعة الطلبات الواردة وحالاتها وملاحظات المراجعة',
    total: 'إجمالي الطلبات',
    review: 'قيد المراجعة',
    drafts: 'مسودات المالكين',
    approved: 'مقبولة',
    changes: 'تتطلب تعديلات',
    reviewQueue: 'طلبات تنتظر المراجعة',
    draftQueue: 'مسودات غير مرسلة',
    approvedQueue: 'طلبات مقبولة',
    changesQueue: 'طلبات تتطلب تعديلات',
    owner: 'المالك',
    location: 'الموقع',
    submitted: 'تاريخ التقديم',
    updated: 'آخر تحديث',
    note: 'ملاحظة الإدارة',
    noNote: 'لا توجد ملاحظة مرفقة.',
    open: 'عرض التفاصيل',
    empty: 'لا توجد طلبات ضمن هذه الفئة.',
    emptyAll: 'لا توجد طلبات لعرضها.',
    draft: 'مسودة',
    under_review: 'قيد المراجعة',
    approvedStatus: 'مقبول',
    needs_changes: 'يتطلب تعديلات',
    untrusted: 'لا يمكن عرض بيانات المراجعة قبل التأكد من موثوقية مصدرها.',
    trusted: 'البيانات مقدمة من مصدر إداري موثوق.',
    staging: 'بيانات الاختبار ليست طلبات حقيقية، ولا تثبت قبول إقامة أو نشرها أو توفرها للحجز.',
    readOnly: 'هذه اللوحة للعرض والتنقل إلى التفاصيل فقط. لا تنفذ قبولاً أو رفضاً أو طلب تعديلات، ولا ترسل ملاحظات أو تحفظ تغييرات.',
    draftInfo: 'المسودة لم تُرسل للمراجعة بعد، لذلك لا تُحتسب ضمن قائمة الطلبات المنتظرة.',
    period: 'الفترة',
  },
  fr: {
    heading: 'Vérification des demandes de logement',
    subtitle: 'Suivi des demandes reçues, de leurs statuts et des remarques',
    total: 'Total des demandes',
    review: 'En vérification',
    drafts: 'Brouillons des propriétaires',
    approved: 'Approuvées',
    changes: 'Modifications requises',
    reviewQueue: 'Demandes en attente de vérification',
    draftQueue: 'Brouillons non soumis',
    approvedQueue: 'Demandes approuvées',
    changesQueue: 'Demandes nécessitant des modifications',
    owner: 'Propriétaire',
    location: 'Emplacement',
    submitted: 'Date de soumission',
    updated: 'Dernière mise à jour',
    note: 'Remarque de l’administration',
    noNote: 'Aucune remarque jointe.',
    open: 'Voir les détails',
    empty: 'Aucune demande dans cette catégorie.',
    emptyAll: 'Aucune demande à afficher.',
    draft: 'Brouillon',
    under_review: 'En vérification',
    approvedStatus: 'Approuvée',
    needs_changes: 'Modifications requises',
    untrusted: 'Les données de vérification sont masquées jusqu’à confirmation de leur source.',
    trusted: 'Les données proviennent d’une source administrative fiable.',
    staging: 'Les données de test ne sont pas de vraies demandes et ne prouvent ni approbation, ni publication, ni disponibilité.',
    readOnly: 'Ce panneau sert uniquement à consulter et ouvrir les détails. Il n’approuve, ne refuse et ne demande aucune modification, n’envoie aucune remarque et n’enregistre aucun changement.',
    draftInfo: 'Le brouillon n’a pas encore été soumis à la vérification et n’est donc pas compté dans la file d’attente.',
    period: 'Période',
  },
} as const;

const statusColors: Record<AdminListingRequestStatus, { background: string; foreground: string }> = {
  draft: { background: '#EEF2F7', foreground: '#344054' },
  under_review: { background: '#FFF4D6', foreground: '#805B00' },
  approved: { background: '#E4F5EC', foreground: '#176B42' },
  needs_changes: { background: '#FDECEC', foreground: '#A12B2B' },
};

export default function AdminListingReviewPanel({
  requests,
  language,
  reportingPeriodLabel,
  trustedAdminSource = false,
  onOpenRequest,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';

  if (!trustedAdminSource) {
    return (
      <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <View style={styles.warningCard}>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
        </View>
        <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
      </View>
    );
  }

  const reviewItems = requests.filter((item) => item.status === 'under_review');
  const draftItems = requests.filter((item) => item.status === 'draft');
  const approvedItems = requests.filter((item) => item.status === 'approved');
  const changesItems = requests.filter((item) => item.status === 'needs_changes');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
        {reportingPeriodLabel ? (
          <Text style={[styles.period, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.period}: {reportingPeriodLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.trusted}</Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <Metric label={t.total} value={requests.length} />
        <Metric label={t.review} value={reviewItems.length} />
        <Metric label={t.drafts} value={draftItems.length} />
        <Metric label={t.approved} value={approvedItems.length} />
        <Metric label={t.changes} value={changesItems.length} />
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t.emptyAll}</Text>
        </View>
      ) : (
        <>
          <RequestSection
            title={t.reviewQueue}
            items={reviewItems}
            language={language}
            onOpenRequest={onOpenRequest}
            emptyLabel={t.empty}
          />
          <RequestSection
            title={t.draftQueue}
            items={draftItems}
            language={language}
            onOpenRequest={onOpenRequest}
            emptyLabel={t.empty}
          />
          <Text style={[styles.helper, { textAlign: rtl ? 'right' : 'left' }]}>{t.draftInfo}</Text>
          <RequestSection
            title={t.approvedQueue}
            items={approvedItems}
            language={language}
            onOpenRequest={onOpenRequest}
            emptyLabel={t.empty}
          />
          <RequestSection
            title={t.changesQueue}
            items={changesItems}
            language={language}
            onOpenRequest={onOpenRequest}
            emptyLabel={t.empty}
          />
        </>
      )}

      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function RequestSection({
  title,
  items,
  language,
  onOpenRequest,
  emptyLabel,
}: {
  title: string;
  items: AdminListingReviewItem[];
  language: Language;
  onOpenRequest?: (request: AdminListingReviewItem) => void;
  emptyLabel: string;
}) {
  const rtl = language === 'ar';
  const t = copy[language];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[styles.emptyInline, { textAlign: rtl ? 'right' : 'left' }]}>{emptyLabel}</Text>
      ) : (
        <View style={styles.cards}>
          {items.map((item) => {
            const color = statusColors[item.status];
            const statusLabel = item.status === 'approved'
              ? t.approvedStatus
              : t[item.status];
            return (
              <View key={item.id} style={styles.requestCard}>
                <View style={[styles.cardHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <View style={styles.titleBlock}>
                    <Text style={[styles.listingTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {item.listingTitle}
                    </Text>
                    <Text style={[styles.ownerName, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.owner}: {item.ownerDisplayName}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: color.background }]}>
                    <Text style={[styles.statusText, { color: color.foreground }]}>{statusLabel}</Text>
                  </View>
                </View>

                <Info label={t.location} value={item.location} rtl={rtl} />
                {item.submittedAtLabel ? <Info label={t.submitted} value={item.submittedAtLabel} rtl={rtl} /> : null}
                {item.updatedAtLabel ? <Info label={t.updated} value={item.updatedAtLabel} rtl={rtl} /> : null}

                <View style={styles.noteBox}>
                  <Text style={[styles.noteLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.note}</Text>
                  <Text style={[styles.noteText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {item.reviewNote?.trim() || t.noNote}
                  </Text>
                </View>

                {onOpenRequest ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.open + ': ' + item.listingTitle}
                    onPress={() => onOpenRequest(item)}
                    style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.openButtonText}>{t.open}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Info({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
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
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  period: {
    color: '#667085',
    fontSize: 12,
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
  warningCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F1DCA8',
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 13,
  },
  warningText: {
    color: '#77520A',
    fontSize: 13,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    gap: 4,
    minHeight: 76,
    padding: 11,
  },
  metricValue: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#123B5D',
    fontSize: 17,
    fontWeight: '800',
  },
  cards: {
    gap: 10,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 15,
    borderWidth: 1,
    gap: 11,
    padding: 13,
  },
  cardHeader: {
    alignItems: 'flex-start',
    gap: 9,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 5,
  },
  listingTitle: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },
  ownerName: {
    color: '#667085',
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 999,
    maxWidth: 145,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoRow: {
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#667085',
    flex: 1,
    fontSize: 11,
  },
  infoValue: {
    color: '#344054',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  noteBox: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  noteLabel: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '800',
  },
  noteText: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 43,
    paddingHorizontal: 12,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
  },
  emptyInline: {
    color: '#667085',
    fontSize: 12,
    paddingVertical: 8,
  },
  helper: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 18,
  },
  footer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
  },
});
