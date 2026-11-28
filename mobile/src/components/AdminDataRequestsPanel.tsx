import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminDataRequestItem = {
  id: string;
  requesterDisplayName?: string;
  requestTypeLabel: string;
  statusLabel: string;
  submittedAtLabel?: string;
  updatedAtLabel?: string;
  scopeLabel?: string;
  reviewNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  requests: AdminDataRequestItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
};

/**
 * Read-only overview of data/account requests. Request types and statuses are
 * display labels supplied by the parent; no workflow or deletion is performed.
 */
export default function AdminDataRequestsPanel({
  requests,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
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
        request.requesterDisplayName ?? '',
        request.requestTypeLabel,
        request.statusLabel,
        request.scopeLabel ?? '',
        request.reviewNote ?? '',
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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{visibleRequests.length}</Text>
            <Text style={styles.summaryLabel}>{t.total}</Text>
          </View>
          {reportingPeriodLabel ? (
            <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
              {t.period}: {reportingPeriodLabel}
            </Text>
          ) : null}
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
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.requestType, { textAlign: rtl ? 'right' : 'left' }]}>
                      {request.requestTypeLabel}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{request.statusLabel}</Text>
                    </View>
                  </View>
                  {request.requesterDisplayName ? (
                    <InfoRow label={t.requester} value={request.requesterDisplayName} rtl={rtl} />
                  ) : null}
                  {request.scopeLabel ? (
                    <InfoRow label={t.scope} value={request.scopeLabel} rtl={rtl} />
                  ) : null}
                  {request.submittedAtLabel ? (
                    <InfoRow label={t.submitted} value={request.submittedAtLabel} rtl={rtl} />
                  ) : null}
                  {request.updatedAtLabel ? (
                    <InfoRow label={t.updated} value={request.updatedAtLabel} rtl={rtl} />
                  ) : null}
                  {request.reviewNote ? (
                    <View style={styles.noteBox}>
                      <Text style={[styles.noteLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.note}</Text>
                      <Text style={[styles.noteText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {request.reviewNote}
                      </Text>
                    </View>
                  ) : null}
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

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
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
    heading: 'طلبات حذف الحسابات والبيانات',
    subtitle: 'مراجعة الطلبات المسجلة ومتابعة حالاتها من مصدر إداري موثوق',
    trusted: 'الطلبات معروضة من مصدر إداري موثوق.',
    untrusted: 'مصدر الطلبات غير مؤكد؛ تم إخفاء جميع التفاصيل.',
    total: 'الطلبات المسجلة',
    period: 'الفترة',
    search: 'ابحث باسم مقدم الطلب أو نوع الطلب أو الحالة أو النطاق',
    requester: 'مقدم الطلب',
    scope: 'نطاق الطلب',
    submitted: 'تاريخ الإرسال',
    updated: 'آخر تحديث',
    note: 'ملاحظة المراجعة',
    empty: 'لا توجد طلبات متاحة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    staging: 'تنبيه: قد تحتوي بيئة الاختبار على طلبات تجريبية لا تمثل طلبات حقيقية.',
    privacy: 'الخصوصية: لا تعرض كلمات المرور أو رموز التحقق أو مفاتيح الوصول أو أرقام الهوية أو المستندات أو بيانات الاتصال الخاصة. استخدم معرفات داخلية غير كاشفة عند الحاجة.',
    readOnly: 'عرض فقط: لا تنفذ حذفاً أو تصديراً أو تعديلاً للبيانات، ولا تغيّر حالة الطلب أو الحساب. يجب مراجعة الطلب والتحقق من هوية صاحبه ونطاقه والالتزامات القانونية قبل أي إجراء منفصل.',
  },
  fr: {
    heading: 'Demandes de suppression de comptes et de données',
    subtitle: 'Consultation des demandes enregistrées et suivi de leurs états depuis une source administrative fiable',
    trusted: 'Les demandes proviennent d’une source administrative fiable.',
    untrusted: 'La source des demandes n’est pas confirmée ; tous les détails sont masqués.',
    total: 'Demandes enregistrées',
    period: 'Période',
    search: 'Rechercher par demandeur, type de demande, état ou périmètre',
    requester: 'Demandeur',
    scope: 'Périmètre de la demande',
    submitted: 'Date de soumission',
    updated: 'Dernière mise à jour',
    note: 'Note de révision',
    empty: 'Aucune demande à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    staging: 'Attention : l’environnement de test peut contenir des demandes simulées qui ne représentent pas de vraies demandes.',
    privacy: 'Confidentialité : n’affichez pas de mots de passe, codes de vérification, clés d’accès, numéros ou documents d’identité, ni coordonnées privées. Utilisez des identifiants internes non révélateurs si nécessaire.',
    readOnly: 'Consultation uniquement : aucune suppression, exportation ou modification de données n’est effectuée ; aucun état de demande ou de compte n’est modifié. Toute action distincte exige une vérification de l’identité, du périmètre et des obligations légales.',
  },
};

const styles = StyleSheet.create({
  scroll: { width: '100%' },
  container: { gap: 14, paddingBottom: 20, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#123B5D', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F8F5EF', borderColor: '#E9DCC4', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  summaryCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 13, borderWidth: 1, gap: 5, padding: 13 },
  summaryValue: { color: '#123B5D', fontSize: 23, fontWeight: '800' },
  summaryLabel: { color: '#667085', fontSize: 11, fontWeight: '700' },
  meta: { color: '#667085', fontSize: 11, lineHeight: 17 },
  searchInput: { backgroundColor: '#FFFFFF', borderColor: '#D0D5DD', borderRadius: 11, borderWidth: 1, color: '#344054', fontSize: 13, minHeight: 46, paddingHorizontal: 13 },
  list: { gap: 11 },
  requestCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 9, padding: 14 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  requestType: { color: '#123B5D', flex: 1, fontSize: 14, fontWeight: '800' },
  statusPill: { backgroundColor: '#EEF3F8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { color: '#344054', fontSize: 10, fontWeight: '700' },
  infoRow: { alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11, lineHeight: 17 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, lineHeight: 17 },
  noteBox: { backgroundColor: '#F8F5EF', borderRadius: 10, gap: 5, padding: 10 },
  noteLabel: { color: '#344054', fontSize: 11, fontWeight: '800' },
  noteText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, padding: 17 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
