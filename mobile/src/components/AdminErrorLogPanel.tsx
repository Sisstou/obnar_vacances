import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminTechnicalErrorItem = {
  id: string;
  title: string;
  messagePreview?: string;
  errorCode?: string;
  serviceLabel?: string;
  severityLabel?: string;
  statusLabel?: string;
  environmentLabel?: string;
  occurrenceCount?: number;
  firstSeenLabel?: string;
  lastSeenLabel: string;
  resolutionNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  errors: AdminTechnicalErrorItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
};

const copy = {
  ar: {
    heading: 'سجل الأخطاء التقنية',
    subtitle: 'عرض الأخطاء المسجلة وتصنيفها ومتابعة حالتها من مصدر إداري موثوق',
    trusted: 'سجل الأخطاء معروض من مصدر إداري موثوق.',
    untrusted: 'مصدر سجل الأخطاء غير مؤكد؛ تم إخفاء جميع التفاصيل.',
    period: 'الفترة',
    total: 'الأخطاء المسجلة',
    search: 'ابحث في عنوان الخطأ أو الرسالة أو الخدمة أو الرمز',
    empty: 'لا توجد أخطاء تقنية للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    code: 'رمز الخطأ',
    service: 'الخدمة',
    severity: 'الخطورة',
    status: 'الحالة المسجلة',
    environment: 'البيئة',
    occurrences: 'عدد مرات الظهور',
    firstSeen: 'أول ظهور',
    lastSeen: 'آخر ظهور',
    resolution: 'ملاحظة المعالجة',
    staging: 'تنبيه: بيانات الاختبار قد تتضمن أخطاء تجريبية ولا تمثل بالضرورة أخطاء الإنتاج.',
    privacy: 'لا تمرّر كلمات المرور أو رموز الوصول أو مفاتيح API أو بيانات المستخدمين الشخصية أو سجلات الطلبات التي تحتوي على أسرار. تجنب عرض Stack Trace أو تفاصيل البنية الداخلية الحساسة.',
    readOnly: 'عرض فقط: لا يمكن حذف الأخطاء أو تغيير حالتها أو إعادة المحاولة أو تنفيذ إصلاح من هذه الشاشة.',
  },
  fr: {
    heading: 'Journal des erreurs techniques',
    subtitle: 'Consultation et suivi des erreurs enregistrées depuis une source administrative fiable',
    trusted: 'Le journal provient d’une source administrative fiable.',
    untrusted: 'La source du journal n’est pas confirmée ; tous les détails sont masqués.',
    period: 'Période',
    total: 'Erreurs enregistrées',
    search: 'Rechercher par titre, message, service ou code',
    empty: 'Aucune erreur technique à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    code: 'Code erreur',
    service: 'Service',
    severity: 'Gravité',
    status: 'État enregistré',
    environment: 'Environnement',
    occurrences: 'Nombre d’occurrences',
    firstSeen: 'Première apparition',
    lastSeen: 'Dernière apparition',
    resolution: 'Note de résolution',
    staging: 'Attention : les données de test peuvent inclure des erreurs simulées et ne représentent pas nécessairement la production.',
    privacy: 'Ne transmettez pas de mots de passe, jetons d’accès, clés API, données personnelles ou journaux contenant des secrets. Évitez les traces de pile et les détails sensibles de l’architecture interne.',
    readOnly: 'Consultation uniquement : cet écran ne permet ni de supprimer, ni de modifier l’état, ni de relancer ou corriger une erreur.',
  },
};

/** Read-only error log presentation. Supply sanitized records from a trusted parent source. */
export default function AdminErrorLogPanel({
  errors,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [search, setSearch] = useState('');
  const visibleErrors = trustedAdminSource ? errors : [];

  const filteredErrors = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleErrors;
    return visibleErrors.filter((item) =>
      [
        item.title,
        item.messagePreview ?? '',
        item.errorCode ?? '',
        item.serviceLabel ?? '',
        item.severityLabel ?? '',
        item.statusLabel ?? '',
      ].some((part) => part.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleErrors]);

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
            <Text style={styles.summaryValue}>{visibleErrors.length}</Text>
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

          {filteredErrors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleErrors.length === 0 ? t.empty : t.noResults}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredErrors.map((item) => (
                <View key={item.id} style={styles.errorCard}>
                  <Text style={[styles.itemTitle, { textAlign: rtl ? 'right' : 'left' }]}>{item.title}</Text>
                  {item.messagePreview ? (
                    <Text style={[styles.message, { textAlign: rtl ? 'right' : 'left' }]}>{item.messagePreview}</Text>
                  ) : null}
                  {item.errorCode ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.code}: {item.errorCode}</Text>
                  ) : null}
                  {item.serviceLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.service}: {item.serviceLabel}</Text>
                  ) : null}
                  {item.severityLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.severity}: {item.severityLabel}</Text>
                  ) : null}
                  {item.statusLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.status}: {item.statusLabel}</Text>
                  ) : null}
                  {item.environmentLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.environment}: {item.environmentLabel}</Text>
                  ) : null}
                  {typeof item.occurrenceCount === 'number' ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.occurrences}: {item.occurrenceCount}</Text>
                  ) : null}
                  {item.firstSeenLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.firstSeen}: {item.firstSeenLabel}</Text>
                  ) : null}
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.lastSeen}: {item.lastSeenLabel}</Text>
                  {item.resolutionNote ? (
                    <View style={styles.resolutionBox}>
                      <Text style={[styles.resolutionLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.resolution}</Text>
                      <Text style={[styles.message, { textAlign: rtl ? 'right' : 'left' }]}>{item.resolutionNote}</Text>
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
  errorCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 7, padding: 14 },
  itemTitle: { color: '#123B5D', fontSize: 14, fontWeight: '800' },
  message: { color: '#475467', fontSize: 12, lineHeight: 19 },
  resolutionBox: { backgroundColor: '#F8F5EF', borderRadius: 10, gap: 5, padding: 10 },
  resolutionLabel: { color: '#344054', fontSize: 11, fontWeight: '800' },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, padding: 17 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
