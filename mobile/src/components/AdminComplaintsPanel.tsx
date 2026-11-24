import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AdminComplaintItem = {
  id: string;
  subject: string;
  categoryLabel?: string;
  statusLabel: string;
  descriptionPreview?: string;
  reporterDisplayName?: string;
  relatedListingTitle?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  adminNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  complaints: AdminComplaintItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
  onOpenComplaint?: (complaint: AdminComplaintItem) => void;
};

const copy = {
  ar: {
    heading: 'إدارة الشكاوى والبلاغات',
    subtitle: 'متابعة البلاغات الواردة والاطلاع على تفاصيلها',
    total: 'إجمالي البلاغات',
    period: 'الفترة',
    category: 'التصنيف',
    status: 'الحالة',
    reporter: 'مقدم البلاغ',
    relatedListing: 'الإقامة المرتبطة',
    created: 'تاريخ الإرسال',
    updated: 'آخر تحديث',
    description: 'ملخص البلاغ',
    adminNote: 'ملاحظة الإدارة',
    open: 'عرض التفاصيل',
    emptyTitle: 'لا توجد بلاغات للعرض',
    emptyBody: 'ستظهر هنا البلاغات التي يمررها مصدر الإدارة الموثوق.',
    trusted: 'البيانات مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر البيانات غير مؤكد؛ تم إخفاء تفاصيل البلاغات.',
    privacy: 'الخصوصية: لا تعرض هذه اللوحة أرقام الهواتف أو البريد الإلكتروني أو العناوين الخاصة أو المرفقات الحساسة. مرّر الحد الأدنى اللازم من البيانات فقط.',
    staging: 'بيانات الاختبار لا تمثل شكاوى حقيقية ولا تثبت وجود بلاغات إنتاجية.',
    readOnly: 'واجهة عرض وتنقل فقط؛ لا تغيّر حالة البلاغ ولا ترسل رداً أو إشعاراً ولا تحذف أو تحفظ أي بيانات.',
    hidden: 'تفاصيل البلاغات مخفية إلى حين تأكيد مصدر الإدارة.',
  },
  fr: {
    heading: 'Gestion des réclamations et signalements',
    subtitle: 'Suivi des signalements reçus et consultation de leurs détails',
    total: 'Total des signalements',
    period: 'Période',
    category: 'Catégorie',
    status: 'Statut',
    reporter: 'Auteur du signalement',
    relatedListing: 'Logement concerné',
    created: 'Date d’envoi',
    updated: 'Dernière mise à jour',
    description: 'Résumé du signalement',
    adminNote: 'Note de l’administration',
    open: 'Voir les détails',
    emptyTitle: 'Aucun signalement à afficher',
    emptyBody: 'Les signalements fournis par une source administrative fiable apparaîtront ici.',
    trusted: 'Les données proviennent d’une source administrative fiable.',
    untrusted: 'La source des données n’est pas confirmée ; les détails sont masqués.',
    privacy: 'Confidentialité : ce panneau n’affiche ni téléphone, ni e-mail, ni adresse privée, ni pièce jointe sensible. Ne transmettez que les données strictement nécessaires.',
    staging: 'Les données de test ne représentent pas de vraies réclamations et ne prouvent pas l’existence de signalements en production.',
    readOnly: 'Consultation et navigation uniquement ; aucun changement de statut, réponse, notification, suppression ou enregistrement.',
    hidden: 'Les détails sont masqués jusqu’à confirmation de la source administrative.',
  },
};

/**
 * Read-only administrative complaint queue.
 * Status and category labels are supplied by the parent because the current
 * verified schema does not establish a complete complaint workflow vocabulary.
 * No personal contact fields, attachments, fetching, persistence, or mutations.
 */
export default function AdminComplaintsPanel({
  complaints,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
  onOpenComplaint,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const visibleComplaints = trustedAdminSource ? complaints : [];

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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{visibleComplaints.length}</Text>
            <Text style={[styles.summaryLabel, { textAlign: 'center' }]}>{t.total}</Text>
            {reportingPeriodLabel ? (
              <Text style={[styles.period, { textAlign: 'center' }]}>
                {t.period}: {reportingPeriodLabel}
              </Text>
            ) : null}
          </View>

          {visibleComplaints.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyTitle}
              </Text>
              <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyBody}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {visibleComplaints.map((complaint) => (
                <View key={complaint.id} style={styles.complaintCard}>
                  <View style={styles.cardHeader}>
                    <Text
                      numberOfLines={2}
                      style={[styles.subject, { textAlign: rtl ? 'right' : 'left' }]}
                    >
                      {complaint.subject}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{complaint.statusLabel}</Text>
                    </View>
                  </View>

                  {complaint.categoryLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.category}: {complaint.categoryLabel}
                    </Text>
                  ) : null}
                  {complaint.reporterDisplayName ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.reporter}: {complaint.reporterDisplayName}
                    </Text>
                  ) : null}
                  {complaint.relatedListingTitle ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.relatedListing}: {complaint.relatedListingTitle}
                    </Text>
                  ) : null}
                  {complaint.createdAtLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.created}: {complaint.createdAtLabel}
                    </Text>
                  ) : null}
                  {complaint.updatedAtLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.updated}: {complaint.updatedAtLabel}
                    </Text>
                  ) : null}

                  {complaint.descriptionPreview ? (
                    <View style={styles.detailBox}>
                      <Text style={[styles.detailLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.description}
                      </Text>
                      <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {complaint.descriptionPreview}
                      </Text>
                    </View>
                  ) : null}

                  {complaint.adminNote ? (
                    <View style={styles.noteBox}>
                      <Text style={[styles.detailLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.adminNote}
                      </Text>
                      <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {complaint.adminNote}
                      </Text>
                    </View>
                  ) : null}

                  {onOpenComplaint ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.open + ': ' + complaint.subject}
                      onPress={() => onOpenComplaint(complaint)}
                      style={({ pressed }) => [
                        styles.openButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.openButtonText}>{t.open}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
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
    color: '#12243A',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  notice: {
    backgroundColor: '#F2F6FA',
    borderColor: '#DCE6EF',
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
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    padding: 15,
  },
  summaryValue: {
    color: '#12345A',
    fontSize: 26,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  period: {
    color: '#667085',
    fontSize: 11,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  complaintCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'space-between',
  },
  subject: {
    color: '#12243A',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: '#EEF2F7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#344054',
    fontSize: 10,
    fontWeight: '800',
  },
  meta: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  detailBox: {
    backgroundColor: '#F7F9FC',
    borderRadius: 11,
    gap: 5,
    padding: 11,
  },
  noteBox: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 11,
    borderWidth: 1,
    gap: 5,
    padding: 11,
  },
  detailLabel: {
    color: '#344054',
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
    backgroundColor: '#12345A',
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
    borderColor: '#E5EAF0',
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
