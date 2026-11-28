import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminUserActivityItem = {
  id: string;
  actorDisplayName?: string;
  actorRoleLabel?: string;
  actionLabel: string;
  targetLabel?: string;
  occurredAtLabel: string;
  resultLabel?: string;
  summary?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  activities: AdminUserActivityItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
};

const copy = {
  ar: {
    heading: 'سجل نشاطات المستخدمين',
    subtitle: 'متابعة الأنشطة المهمة المسجلة داخل المنصة من مصدر إداري موثوق',
    trusted: 'سجل النشاطات معروض من مصدر إداري موثوق.',
    untrusted: 'مصدر سجل النشاطات غير مؤكد؛ تم إخفاء جميع التفاصيل.',
    period: 'الفترة',
    total: 'النشاطات المسجلة',
    search: 'ابحث باسم المستخدم أو نوع النشاط أو العنصر المرتبط',
    empty: 'لا توجد نشاطات مسجلة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    actor: 'المستخدم',
    role: 'نوع الحساب',
    action: 'النشاط',
    target: 'العنصر المرتبط',
    occurred: 'التاريخ والوقت',
    result: 'النتيجة المسجلة',
    details: 'ملخص',
    staging: 'تنبيه: قد تتضمن بيئة الاختبار نشاطات تجريبية لا تمثل نشاطات المستخدمين الحقيقيين.',
    privacy: 'اعرض الحد الأدنى الضروري فقط. لا تمرّر كلمات المرور أو رموز التحقق أو مفاتيح API أو عناوين IP أو بيانات الاتصال أو الموقع الدقيق أو تفاصيل الجلسات.',
    readOnly: 'عرض فقط: لا تنفذ هذه الشاشة إجراءات نيابة عن المستخدمين ولا تعدّل الحسابات أو السجلات.',
  },
  fr: {
    heading: 'Journal des activités des utilisateurs',
    subtitle: 'Suivi des activités importantes enregistrées sur la plateforme depuis une source administrative fiable',
    trusted: 'Le journal provient d’une source administrative fiable.',
    untrusted: 'La source du journal n’est pas confirmée ; tous les détails sont masqués.',
    period: 'Période',
    total: 'Activités enregistrées',
    search: 'Rechercher par utilisateur, activité ou élément associé',
    empty: 'Aucune activité enregistrée à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    actor: 'Utilisateur',
    role: 'Type de compte',
    action: 'Activité',
    target: 'Élément associé',
    occurred: 'Date et heure',
    result: 'Résultat enregistré',
    details: 'Résumé',
    staging: 'Attention : l’environnement de test peut contenir des activités simulées qui ne représentent pas celles de vrais utilisateurs.',
    privacy: 'N’affichez que les données strictement nécessaires. Ne transmettez pas de mots de passe, codes de vérification, clés API, adresses IP, coordonnées, localisation précise ou détails de session.',
    readOnly: 'Consultation uniquement : cet écran n’effectue aucune action au nom des utilisateurs et ne modifie ni comptes ni journaux.',
  },
};

/** Read-only activity log. Parent must provide sanitized, policy-compliant records. */
export default function AdminUserActivityLogPanel({
  activities,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [search, setSearch] = useState('');
  const visibleActivities = trustedAdminSource ? activities : [];

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleActivities;
    return visibleActivities.filter((item) =>
      [
        item.actorDisplayName ?? '',
        item.actorRoleLabel ?? '',
        item.actionLabel,
        item.targetLabel ?? '',
        item.resultLabel ?? '',
        item.summary ?? '',
      ].some((part) => part.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleActivities]);

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
            <Text style={styles.summaryValue}>{visibleActivities.length}</Text>
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

          {filteredActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleActivities.length === 0 ? t.empty : t.noResults}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredActivities.map((item) => (
                <View key={item.id} style={styles.activityCard}>
                  <Text style={[styles.actionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                    {item.actionLabel}
                  </Text>
                  {item.actorDisplayName ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.actor}: {item.actorDisplayName}
                    </Text>
                  ) : null}
                  {item.actorRoleLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.role}: {item.actorRoleLabel}
                    </Text>
                  ) : null}
                  {item.targetLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.target}: {item.targetLabel}
                    </Text>
                  ) : null}
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.occurred}: {item.occurredAtLabel}
                  </Text>
                  {item.resultLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.result}: {item.resultLabel}
                    </Text>
                  ) : null}
                  {item.summary ? (
                    <View style={styles.summaryBox}>
                      <Text style={[styles.summaryLabelText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.details}
                      </Text>
                      <Text style={[styles.summaryText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {item.summary}
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
  activityCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 7, padding: 14 },
  actionTitle: { color: '#123B5D', fontSize: 14, fontWeight: '800' },
  summaryBox: { backgroundColor: '#F8F5EF', borderRadius: 10, gap: 5, padding: 10 },
  summaryLabelText: { color: '#344054', fontSize: 11, fontWeight: '800' },
  summaryText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, padding: 17 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
