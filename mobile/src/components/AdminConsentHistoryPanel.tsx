import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminConsentRecord = {
  id: string;
  accountDisplayName?: string;
  documentLabel: string;
  documentVersionLabel: string;
  decisionLabel: string;
  recordedAtLabel?: string;
  documentLanguageLabel?: string;
  captureMethodLabel?: string;
  sourceLabel?: string;
  note?: string;
};

export type AdminLegalDocumentVersion = {
  id: string;
  documentLabel: string;
  versionLabel: string;
  publicationStatusLabel?: string;
  publishedAtLabel?: string;
  effectiveAtLabel?: string;
  languageLabel?: string;
  changeSummary?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  records: AdminConsentRecord[];
  documentVersions: AdminLegalDocumentVersion[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
};

/**
 * Read-only view of consent evidence and legal document versions.
 * The parent must supply verified records; this component never creates consent.
 */
export default function AdminConsentHistoryPanel({
  records,
  documentVersions,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const [search, setSearch] = useState('');
  const visibleRecords = trustedAdminSource ? records : [];
  const visibleVersions = trustedAdminSource ? documentVersions : [];

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleRecords;
    return visibleRecords.filter((record) =>
      [
        record.accountDisplayName ?? '',
        record.documentLabel,
        record.documentVersionLabel,
        record.decisionLabel,
        record.documentLanguageLabel ?? '',
        record.captureMethodLabel ?? '',
        record.sourceLabel ?? '',
        record.note ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleRecords]);

  const filteredVersions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleVersions;
    return visibleVersions.filter((version) =>
      [
        version.documentLabel,
        version.versionLabel,
        version.publicationStatusLabel ?? '',
        version.languageLabel ?? '',
        version.changeSummary ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleVersions]);

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

          <SectionHeader title={t.records} count={filteredRecords.length} rtl={rtl} />
          {filteredRecords.length === 0 ? (
            <EmptyState text={visibleRecords.length === 0 ? t.noRecords : t.noResults} rtl={rtl} />
          ) : (
            <View style={styles.list}>
              {filteredRecords.map((record) => (
                <View key={record.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {record.documentLabel}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{record.decisionLabel}</Text>
                    </View>
                  </View>
                  <InfoRow label={t.version} value={record.documentVersionLabel} rtl={rtl} />
                  {record.accountDisplayName ? <InfoRow label={t.account} value={record.accountDisplayName} rtl={rtl} /> : null}
                  {record.recordedAtLabel ? <InfoRow label={t.recordedAt} value={record.recordedAtLabel} rtl={rtl} /> : null}
                  {record.documentLanguageLabel ? <InfoRow label={t.language} value={record.documentLanguageLabel} rtl={rtl} /> : null}
                  {record.captureMethodLabel ? <InfoRow label={t.method} value={record.captureMethodLabel} rtl={rtl} /> : null}
                  {record.sourceLabel ? <InfoRow label={t.source} value={record.sourceLabel} rtl={rtl} /> : null}
                  {record.note ? <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>{record.note}</Text> : null}
                </View>
              ))}
            </View>
          )}

          <SectionHeader title={t.versions} count={filteredVersions.length} rtl={rtl} />
          {filteredVersions.length === 0 ? (
            <EmptyState text={visibleVersions.length === 0 ? t.noVersions : t.noResults} rtl={rtl} />
          ) : (
            <View style={styles.list}>
              {filteredVersions.map((version) => (
                <View key={version.id} style={styles.card}>
                  <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>{version.documentLabel}</Text>
                  <InfoRow label={t.version} value={version.versionLabel} rtl={rtl} />
                  {version.publicationStatusLabel ? <InfoRow label={t.publicationStatus} value={version.publicationStatusLabel} rtl={rtl} /> : null}
                  {version.publishedAtLabel ? <InfoRow label={t.publishedAt} value={version.publishedAtLabel} rtl={rtl} /> : null}
                  {version.effectiveAtLabel ? <InfoRow label={t.effectiveAt} value={version.effectiveAtLabel} rtl={rtl} /> : null}
                  {version.languageLabel ? <InfoRow label={t.language} value={version.languageLabel} rtl={rtl} /> : null}
                  {version.changeSummary ? <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>{version.changeSummary}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <EmptyState text={t.untrusted} rtl={rtl} />
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
  );
}

function SectionHeader({ title, count, rtl }: { title: string; count: number; rtl: boolean }) {
  return (
    <View style={[styles.sectionHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

function EmptyState({ text, rtl }: { text: string; rtl: boolean }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>{text}</Text>
    </View>
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
    heading: 'سجل الموافقات وقبول الشروط',
    subtitle: 'متابعة أدلة الموافقة ونسخ الوثائق القانونية المنشورة من مصدر موثوق',
    trusted: 'السجلات معروضة من مصدر إداري موثوق.',
    untrusted: 'مصدر السجلات غير مؤكد؛ تم إخفاء التفاصيل.',
    period: 'الفترة',
    search: 'ابحث في الحسابات أو الوثائق أو الإصدارات أو الحالات',
    records: 'سجل موافقات المستخدمين',
    versions: 'إصدارات الوثائق القانونية',
    account: 'الحساب',
    version: 'الإصدار',
    recordedAt: 'تاريخ التسجيل',
    language: 'اللغة',
    method: 'طريقة التسجيل',
    source: 'المصدر',
    publicationStatus: 'حالة النشر',
    publishedAt: 'تاريخ النشر',
    effectiveAt: 'تاريخ السريان',
    noRecords: 'لا توجد سجلات موافقة متاحة للعرض.',
    noVersions: 'لا توجد إصدارات وثائق متاحة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    staging: 'تنبيه: قد تكون بيانات بيئة الاختبار تجريبية ولا تمثل موافقات مستخدمين حقيقية.',
    privacy: 'الخصوصية: لا تعرض عناوين IP أو بيانات الجهاز التفصيلية أو رموز الجلسات أو كلمات المرور أو رموز التحقق أو بيانات اتصال غير لازمة. اعرض الحد الأدنى اللازم لإثبات السجل.',
    readOnly: 'عرض فقط: لا تنشئ موافقة ولا تسجل قبولاً نيابة عن المستخدم ولا تعدّل السجلات أو تنشر نسخة قانونية. وجود سجل معروض لا يثبت وحده صحة الموافقة ما لم يكن مصدره موثوقاً وقابلاً للتدقيق.',
  },
  fr: {
    heading: 'Historique des consentements et acceptation des conditions',
    subtitle: 'Suivi des preuves de consentement et des versions publiées des documents juridiques depuis une source fiable',
    trusted: 'Les enregistrements proviennent d’une source administrative fiable.',
    untrusted: 'La source des enregistrements n’est pas confirmée ; les détails sont masqués.',
    period: 'Période',
    search: 'Rechercher par compte, document, version ou état',
    records: 'Historique des consentements utilisateurs',
    versions: 'Versions des documents juridiques',
    account: 'Compte',
    version: 'Version',
    recordedAt: 'Date d’enregistrement',
    language: 'Langue',
    method: 'Méthode d’enregistrement',
    source: 'Source',
    publicationStatus: 'État de publication',
    publishedAt: 'Date de publication',
    effectiveAt: 'Date d’entrée en vigueur',
    noRecords: 'Aucun enregistrement de consentement à afficher.',
    noVersions: 'Aucune version de document à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    staging: 'Attention : les données de test peuvent être simulées et ne représentent pas de véritables consentements utilisateurs.',
    privacy: 'Confidentialité : n’affichez pas les adresses IP, détails techniques de l’appareil, jetons de session, mots de passe, codes de vérification ou coordonnées inutiles. Affichez uniquement les éléments nécessaires à la preuve.',
    readOnly: 'Consultation uniquement : aucun consentement n’est créé, aucune acceptation n’est enregistrée au nom d’un utilisateur, aucun enregistrement n’est modifié et aucune version juridique n’est publiée. Un enregistrement affiché ne prouve pas à lui seul la validité du consentement sans source fiable et vérifiable.',
  },
};

const styles = StyleSheet.create({
  scroll: { width: '100%' },
  container: { gap: 14, paddingBottom: 20, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#12243A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F2F6FA', borderColor: '#DCE6EF', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  sectionHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 },
  sectionTitle: { color: '#12345A', fontSize: 15, fontWeight: '800' },
  count: { backgroundColor: '#EEF3F8', borderRadius: 20, color: '#344054', fontSize: 11, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4 },
  meta: { color: '#667085', fontSize: 11, lineHeight: 17 },
  searchInput: { backgroundColor: '#FFFFFF', borderColor: '#D0D5DD', borderRadius: 11, borderWidth: 1, color: '#344054', fontSize: 13, minHeight: 46, paddingHorizontal: 13 },
  list: { gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, gap: 9, padding: 14 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: '#12243A', flex: 1, fontSize: 13, fontWeight: '800' },
  statusPill: { backgroundColor: '#EEF3F8', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#344054', fontSize: 10, fontWeight: '700' },
  infoRow: { alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11, lineHeight: 17 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, lineHeight: 17 },
  description: { color: '#475467', fontSize: 12, lineHeight: 19 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
