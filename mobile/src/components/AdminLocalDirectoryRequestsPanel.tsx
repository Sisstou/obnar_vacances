import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminLocalDirectoryRequest = {
  id: string;
  activityName: string;
  categoryLabel?: string;
  applicantDisplayName?: string;
  publicArea?: string;
  descriptionPreview?: string;
  statusLabel: string;
  submittedAtLabel?: string;
  updatedAtLabel?: string;
  adminNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  requests: AdminLocalDirectoryRequest[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
  onOpenRequest?: (request: AdminLocalDirectoryRequest) => void;
};

const copy = {
  ar: {
    heading: 'إدارة طلبات إدراج الأنشطة والخدمات',
    subtitle: 'متابعة الطلبات المقدمة لإضافة المحلات والحرفيين ومقدمي الخدمات إلى الدليل المحلي',
    total: 'إجمالي الطلبات',
    period: 'الفترة',
    search: 'ابحث باسم النشاط أو مقدم الطلب أو المنطقة أو التصنيف',
    list: 'طلبات الإدراج',
    category: 'التصنيف',
    applicant: 'مقدم الطلب',
    area: 'المنطقة العامة',
    description: 'وصف النشاط',
    status: 'الحالة المسجلة',
    submitted: 'تاريخ التقديم',
    updated: 'آخر تحديث',
    note: 'ملاحظة الإدارة',
    open: 'عرض تفاصيل الطلب',
    empty: 'لا توجد طلبات مطابقة.',
    emptyAll: 'لا توجد طلبات إدراج لعرضها.',
    trusted: 'البيانات مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر البيانات غير مؤكد؛ تم إخفاء تفاصيل الطلبات.',
    staging: 'طلبات بيئة الاختبار لا تمثل بالضرورة طلبات حقيقية أو إدراجات منشورة.',
    privacy: 'تعرض اللوحة الحد الأدنى من البيانات العامة. لا تعرض أرقام الهواتف أو البريد أو العناوين الخاصة أو وثائق مقدمي الطلبات.',
    readOnly: 'عرض فقط: لا تقبل الطلبات ولا ترفضها ولا تطلب تعديلات ولا تنشر الإدراجات أو تحذفها. لا يتم إرسال إشعارات أو حفظ تغييرات.',
    unknown: 'غير محدد',
  },
  fr: {
    heading: 'Gestion des demandes d’inscription des activités et services',
    subtitle: 'Suivi des demandes d’ajout de commerces, artisans et prestataires à l’annuaire local',
    total: 'Nombre total de demandes',
    period: 'Période',
    search: 'Rechercher par activité, demandeur, zone ou catégorie',
    list: 'Demandes d’inscription',
    category: 'Catégorie',
    applicant: 'Demandeur',
    area: 'Zone générale',
    description: 'Description de l’activité',
    status: 'Statut enregistré',
    submitted: 'Date de soumission',
    updated: 'Dernière mise à jour',
    note: 'Note de l’administration',
    open: 'Voir les détails de la demande',
    empty: 'Aucune demande correspondante.',
    emptyAll: 'Aucune demande d’inscription à afficher.',
    trusted: 'Les données proviennent d’une source administrative fiable.',
    untrusted: 'La source des données n’est pas confirmée ; les détails des demandes sont masqués.',
    staging: 'Les demandes de test ne représentent pas nécessairement de vraies demandes ou des fiches publiées.',
    privacy: 'Le panneau affiche le minimum d’informations publiques. Aucun téléphone, e-mail, adresse privée ou document du demandeur.',
    readOnly: 'Consultation uniquement : aucune approbation, aucun refus, aucune demande de correction, publication ou suppression. Aucune notification ni sauvegarde.',
    unknown: 'Non précisé',
  },
};

/**
 * Read-only moderation queue for local directory submissions.
 * Status and category labels are supplied by the parent source because no
 * verified request schema or moderation-state vocabulary was found.
 * This component does not approve, reject, publish, edit, delete, or persist.
 */
export default function AdminLocalDirectoryRequestsPanel({
  requests,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
  onOpenRequest,
}: Props) {
  const [query, setQuery] = useState('');
  const t = copy[language];
  const rtl = language === 'ar';

  const filteredRequests = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return requests;
    return requests.filter((request) =>
      request.activityName.toLocaleLowerCase().includes(normalized)
      || (request.categoryLabel || '').toLocaleLowerCase().includes(normalized)
      || (request.applicantDisplayName || '').toLocaleLowerCase().includes(normalized)
      || (request.publicArea || '').toLocaleLowerCase().includes(normalized)
      || request.statusLabel.toLocaleLowerCase().includes(normalized),
    );
  }, [requests, query]);

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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      keyboardShouldPersistTaps="handled"
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

      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{requests.length}</Text>
        <Text style={styles.summaryLabel}>{t.total}</Text>
      </View>

      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.list}</Text>
      <TextInput
        accessibilityLabel={t.search}
        onChangeText={setQuery}
        placeholder={t.search}
        placeholderTextColor="#98A2B3"
        returnKeyType="search"
        style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
        value={query}
      />

      {filteredRequests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{requests.length === 0 ? t.emptyAll : t.empty}</Text>
        </View>
      ) : (
        <View style={styles.cards}>
          {filteredRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={[styles.cardHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <View style={styles.titleBlock}>
                  <Text style={[styles.requestName, { textAlign: rtl ? 'right' : 'left' }]}>
                    {request.activityName}
                  </Text>
                  {request.categoryLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.category}: {request.categoryLabel}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{request.statusLabel}</Text>
                </View>
              </View>

              {request.applicantDisplayName ? <Info label={t.applicant} value={request.applicantDisplayName} rtl={rtl} /> : null}
              {request.publicArea ? <Info label={t.area} value={request.publicArea} rtl={rtl} /> : null}
              {request.submittedAtLabel ? <Info label={t.submitted} value={request.submittedAtLabel} rtl={rtl} /> : null}
              {request.updatedAtLabel ? <Info label={t.updated} value={request.updatedAtLabel} rtl={rtl} /> : null}

              {request.descriptionPreview ? (
                <View style={styles.detailBox}>
                  <Text style={[styles.detailLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.description}</Text>
                  <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {request.descriptionPreview}
                  </Text>
                </View>
              ) : null}

              {request.adminNote ? (
                <View style={styles.noteBox}>
                  <Text style={[styles.detailLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.note}</Text>
                  <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {request.adminNote}
                  </Text>
                </View>
              ) : null}

              {onOpenRequest ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.open + ': ' + request.activityName}
                  onPress={() => onOpenRequest(request)}
                  style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                >
                  <Text style={styles.openButtonText}>{t.open}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
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
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    padding: 15,
  },
  summaryValue: {
    color: '#123B5D',
    fontSize: 26,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#123B5D',
    fontSize: 17,
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE3EA',
    borderRadius: 11,
    borderWidth: 1,
    color: '#344054',
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 13,
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
  requestName: {
    color: '#123B5D',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
  meta: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
  },
  statusBadge: {
    backgroundColor: '#EAF0F7',
    borderRadius: 999,
    maxWidth: 150,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusText: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '700',
  },
  detailBox: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
    padding: 10,
  },
  noteBox: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
    padding: 10,
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
  openButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 44,
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
  pressed: {
    opacity: 0.78,
  },
});
