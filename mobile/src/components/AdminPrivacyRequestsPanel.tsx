import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export type AdminPrivacyRequestItem = {
  id: string;
  requesterMaskedLabel?: string;
  requestTypeLabel: string;
  requestStatusLabel: string;
  receivedAtLabel?: string;
  lastUpdatedAtLabel?: string;
  requestedScopeLabel?: string;
  identityCheckStatusLabel?: string;
  reviewDecisionLabel?: string;
  decisionReasonLabel?: string;
  targetDateLabel?: string;
  completionDateLabel?: string;
  outcomeLabel?: string;
  retainedDataCategoryLabels?: string[];
  retentionBasisLabel?: string;
  auditReferenceLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  requests: AdminPrivacyRequestItem[];
  language: Language;
  trustedAdminSource?: boolean;
  lastUpdatedLabel?: string;
};

/**
 * Read-only view of account and personal-data requests.
 * All statuses, dates, verification outcomes and retention explanations are
 * supplied by the trusted parent. No deletion or retention period is inferred.
 */
export default function AdminPrivacyRequestsPanel({
  requests,
  language,
  trustedAdminSource = false,
  lastUpdatedLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const [search, setSearch] = useState('');
  const visibleRequests = trustedAdminSource ? requests : [];

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleRequests;
    return visibleRequests.filter((request) =>
      [
        request.requesterMaskedLabel ?? '',
        request.requestTypeLabel,
        request.requestStatusLabel,
        request.requestedScopeLabel ?? '',
        request.identityCheckStatusLabel ?? '',
        request.reviewDecisionLabel ?? '',
        request.decisionReasonLabel ?? '',
        request.outcomeLabel ?? '',
        request.retentionBasisLabel ?? '',
        request.auditReferenceLabel ?? '',
        ...(request.retainedDataCategoryLabels ?? []),
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleRequests]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedAdminSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      {trustedAdminSource ? (
        <>
          {lastUpdatedLabel ? (
            <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
              {t.updated}: {lastUpdatedLabel}
            </Text>
          ) : null}
          <View style={[styles.summary, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <Text style={styles.summaryNumber}>{visibleRequests.length}</Text>
            <Text style={[styles.summaryLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.total}</Text>
          </View>
          <TextInput
            accessibilityLabel={t.search}
            value={search}
            onChangeText={setSearch}
            placeholder={t.search}
            placeholderTextColor="#98A2B3"
            style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
            autoCorrect={false}
            returnKeyType="search"
          />

          {filteredRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleRequests.length === 0 ? t.empty : t.noResults}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredRequests.map((request) => (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {request.requestTypeLabel}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{request.requestStatusLabel}</Text>
                    </View>
                  </View>

                  {request.requesterMaskedLabel ? (
                    <InfoRow label={t.requester} value={request.requesterMaskedLabel} rtl={rtl} />
                  ) : null}
                  {request.requestedScopeLabel ? <InfoRow label={t.scope} value={request.requestedScopeLabel} rtl={rtl} /> : null}
                  {request.receivedAtLabel ? <InfoRow label={t.received} value={request.receivedAtLabel} rtl={rtl} /> : null}
                  {request.lastUpdatedAtLabel ? <InfoRow label={t.updatedAt} value={request.lastUpdatedAtLabel} rtl={rtl} /> : null}

                  <Text style={[styles.subheading, { textAlign: rtl ? 'right' : 'left' }]}>{t.review}</Text>
                  {request.identityCheckStatusLabel ? <InfoRow label={t.identityCheck} value={request.identityCheckStatusLabel} rtl={rtl} /> : null}
                  {request.reviewDecisionLabel ? <InfoRow label={t.decision} value={request.reviewDecisionLabel} rtl={rtl} /> : null}
                  {request.decisionReasonLabel ? <InfoRow label={t.reason} value={request.decisionReasonLabel} rtl={rtl} /> : null}

                  <Text style={[styles.subheading, { textAlign: rtl ? 'right' : 'left' }]}>{t.execution}</Text>
                  {request.targetDateLabel ? <InfoRow label={t.targetDate} value={request.targetDateLabel} rtl={rtl} /> : null}
                  {request.completionDateLabel ? <InfoRow label={t.completionDate} value={request.completionDateLabel} rtl={rtl} /> : null}
                  {request.outcomeLabel ? <InfoRow label={t.outcome} value={request.outcomeLabel} rtl={rtl} /> : null}

                  {(request.retainedDataCategoryLabels?.length ?? 0) > 0 ? (
                    <>
                      <Text style={[styles.subheading, { textAlign: rtl ? 'right' : 'left' }]}>{t.retainedCategories}</Text>
                      <View style={styles.chips}>
                        {request.retainedDataCategoryLabels!.map((category, index) => (
                          <View key={request.id + '-retained-' + index} style={styles.chip}>
                            <Text style={styles.chipText}>{category}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}
                  {request.retentionBasisLabel ? <InfoRow label={t.retentionBasis} value={request.retentionBasisLabel} rtl={rtl} /> : null}
                  {request.auditReferenceLabel ? <InfoRow label={t.auditReference} value={request.auditReferenceLabel} rtl={rtl} /> : null}
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
        </View>
      )}

      <View style={styles.warning}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noInventedPeriods}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
  );
}

function InfoRow({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>{value}</Text>
    </View>
  );
}

const copy = {
  ar: {
    heading: 'طلبات حذف الحساب والبيانات الشخصية',
    subtitle: 'متابعة الطلبات والتحقق والمراجعة والنتائج المسجلة من مصدر إداري موثوق',
    trusted: 'بيانات الطلبات واردة من مصدر إداري موثوق.',
    untrusted: 'مصدر الطلبات غير مؤكد؛ تم إخفاء التفاصيل.',
    staging: 'تنبيه: بيانات بيئة الاختبار قد تكون تجريبية ولا تمثل طلبات حقيقية.',
    updated: 'آخر تحديث للسجل',
    total: 'إجمالي الطلبات في المصدر',
    search: 'ابحث بنوع الطلب أو حالته أو الحساب المقنّع أو النتيجة',
    requester: 'صاحب الطلب',
    scope: 'نطاق الطلب',
    received: 'تاريخ الاستلام',
    updatedAt: 'آخر تحديث',
    review: 'التحقق والمراجعة',
    identityCheck: 'حالة التحقق من الهوية',
    decision: 'قرار المراجعة',
    reason: 'سبب القرار',
    execution: 'التنفيذ والنتيجة',
    targetDate: 'التاريخ المستهدف المسجل',
    completionDate: 'تاريخ الإكمال المسجل',
    outcome: 'النتيجة المسجلة',
    retainedCategories: 'فئات البيانات المحتفظ بها',
    retentionBasis: 'أساس الاحتفاظ المسجل',
    auditReference: 'مرجع التدقيق',
    empty: 'لا توجد طلبات متاحة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    noInventedPeriods: 'لا توجد مدة احتفاظ افتراضية في هذه اللوحة. اعرض المواعيد وأساس الاحتفاظ فقط إذا وفرها مصدر موثوق وسياسة معتمدة. لا يعني تاريخ مستهدف أن الحذف نُفّذ، ولا يعني إغلاق الطلب أن جميع البيانات حُذفت.',
    readOnly: 'عرض فقط: لا تحذف حساباً أو بيانات، ولا تغيّر حالة الطلب أو موعده، ولا ترسل إشعاراً أو تنفذ إجراءً. يجب التحقق من هوية صاحب الطلب ومراجعة الالتزامات القانونية والتشغيلية عبر الإجراء المعتمد قبل أي تنفيذ.',
  },
  fr: {
    heading: 'Demandes de suppression de compte et de données personnelles',
    subtitle: 'Suivi des demandes, vérifications, examens et résultats enregistrés depuis une source administrative fiable',
    trusted: 'Les données des demandes proviennent d’une source administrative fiable.',
    untrusted: 'La source des demandes n’est pas confirmée ; les détails sont masqués.',
    staging: 'Attention : les données de test peuvent être simulées et ne représentent pas de véritables demandes.',
    updated: 'Dernière mise à jour de l’historique',
    total: 'Nombre total de demandes dans la source',
    search: 'Rechercher par type, état, compte masqué ou résultat',
    requester: 'Demandeur',
    scope: 'Portée de la demande',
    received: 'Date de réception',
    updatedAt: 'Dernière mise à jour',
    review: 'Vérification et examen',
    identityCheck: 'État de la vérification d’identité',
    decision: 'Décision de l’examen',
    reason: 'Motif de la décision',
    execution: 'Exécution et résultat',
    targetDate: 'Date cible enregistrée',
    completionDate: 'Date d’achèvement enregistrée',
    outcome: 'Résultat enregistré',
    retainedCategories: 'Catégories de données conservées',
    retentionBasis: 'Fondement de conservation enregistré',
    auditReference: 'Référence d’audit',
    empty: 'Aucune demande disponible.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    noInventedPeriods: 'Aucune durée de conservation par défaut n’est définie dans ce panneau. Les dates et le fondement de conservation ne doivent être affichés que s’ils proviennent d’une source fiable et d’une politique approuvée. Une date cible ne prouve pas que la suppression a été exécutée, et la clôture d’une demande ne signifie pas que toutes les données ont été supprimées.',
    readOnly: 'Consultation uniquement : aucun compte ni aucune donnée n’est supprimé, aucun état ou délai n’est modifié, aucune notification n’est envoyée et aucune action n’est exécutée. L’identité du demandeur et les obligations légales et opérationnelles doivent être vérifiées selon la procédure approuvée avant toute exécution.',
  },
};

const styles = StyleSheet.create({
  scroll: { width: '100%' },
  container: { gap: 14, paddingBottom: 20, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#123B5D', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F8F5EF', borderColor: '#E9DCC4', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  summary: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 12, borderWidth: 1, gap: 10, padding: 12 },
  summaryNumber: { color: '#123B5D', fontSize: 20, fontWeight: '800' },
  summaryLabel: { color: '#667085', flex: 1, fontSize: 12 },
  meta: { color: '#667085', fontSize: 11, lineHeight: 17 },
  searchInput: { backgroundColor: '#FFFFFF', borderColor: '#D0D5DD', borderRadius: 11, borderWidth: 1, color: '#344054', fontSize: 13, minHeight: 46, paddingHorizontal: 13 },
  list: { gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 10, padding: 14 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: '#123B5D', flex: 1, fontSize: 13, fontWeight: '800' },
  statusPill: { backgroundColor: '#EEF3F8', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#344054', fontSize: 10, fontWeight: '700' },
  subheading: { color: '#344054', fontSize: 11, fontWeight: '800' },
  infoRow: { alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11, lineHeight: 17 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#EEF3F8', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  chipText: { color: '#344054', fontSize: 10, fontWeight: '600' },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  warning: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
