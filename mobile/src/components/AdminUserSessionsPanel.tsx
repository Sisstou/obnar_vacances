import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminUserSessionItem = {
  id: string;
  accountDisplayName?: string;
  accountRoleLabel?: string;
  sessionReferenceLabel?: string;
  statusLabel: string;
  startedAtLabel?: string;
  lastActivityAtLabel?: string;
  expiresAtLabel?: string;
  endedAtLabel?: string;
  accessChannelLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  sessions: AdminUserSessionItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
};

/**
 * Read-only session overview. Supply only sanitized, non-secret display labels
 * from an authorized source; this component does not inspect or manage auth tokens.
 */
export default function AdminUserSessionsPanel({
  sessions,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const [search, setSearch] = useState('');
  const visibleSessions = trustedAdminSource ? sessions : [];

  const filteredSessions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleSessions;
    return visibleSessions.filter((session) =>
      [
        session.accountDisplayName ?? '',
        session.accountRoleLabel ?? '',
        session.sessionReferenceLabel ?? '',
        session.statusLabel,
        session.accessChannelLabel ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleSessions]);

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
            <Text style={styles.summaryValue}>{visibleSessions.length}</Text>
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

          {filteredSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleSessions.length === 0 ? t.empty : t.noResults}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredSessions.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.accountName, { textAlign: rtl ? 'right' : 'left' }]}>
                      {session.accountDisplayName || t.unknownAccount}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{session.statusLabel}</Text>
                    </View>
                  </View>
                  {session.accountRoleLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.role}: {session.accountRoleLabel}
                    </Text>
                  ) : null}
                  {session.sessionReferenceLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.reference}: {session.sessionReferenceLabel}
                    </Text>
                  ) : null}
                  {session.accessChannelLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.channel}: {session.accessChannelLabel}
                    </Text>
                  ) : null}
                  <View style={styles.divider} />
                  {session.startedAtLabel ? <InfoRow label={t.started} value={session.startedAtLabel} rtl={rtl} /> : null}
                  {session.lastActivityAtLabel ? <InfoRow label={t.lastActivity} value={session.lastActivityAtLabel} rtl={rtl} /> : null}
                  {session.expiresAtLabel ? <InfoRow label={t.expires} value={session.expiresAtLabel} rtl={rtl} /> : null}
                  {session.endedAtLabel ? <InfoRow label={t.ended} value={session.endedAtLabel} rtl={rtl} /> : null}
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
    heading: 'جلسات المستخدمين',
    subtitle: 'عرض معلومات عامة عن الجلسات التي يوفرها مصدر إداري موثوق',
    trusted: 'بيانات الجلسات مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر بيانات الجلسات غير مؤكد؛ تم إخفاء التفاصيل.',
    total: 'الجلسات المسجلة',
    period: 'الفترة',
    search: 'ابحث باسم الحساب أو نوعه أو حالة الجلسة أو قناة الوصول',
    empty: 'لا توجد جلسات مسجلة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    unknownAccount: 'حساب غير محدد',
    role: 'نوع الحساب',
    reference: 'مرجع مقنّع',
    channel: 'قناة الوصول',
    started: 'بداية الجلسة',
    lastActivity: 'آخر نشاط مسجل',
    expires: 'تاريخ الانتهاء',
    ended: 'تاريخ الإنهاء',
    privacy: 'الخصوصية: لا تمرّر رموز الجلسات أو مفاتيح الوصول أو كلمات المرور أو عناوين IP أو بيانات الموقع الدقيق أو بصمات الأجهزة. استخدم مرجعاً مقنّعاً وتسميات عامة فقط.',
    staging: 'تنبيه: قد تحتوي بيئة الاختبار على جلسات تجريبية لا تمثل جلسات مستخدمين حقيقيين.',
    readOnly: 'عرض فقط: لا تنهي الجلسات ولا تسجل الخروج ولا تغيّر حالة أي حساب أو جلسة.',
  },
  fr: {
    heading: 'Sessions des utilisateurs',
    subtitle: 'Consultation des informations générales de session fournies par une source administrative fiable',
    trusted: 'Les données de session proviennent d’une source administrative fiable.',
    untrusted: 'La source des données de session n’est pas confirmée ; les détails sont masqués.',
    total: 'Sessions enregistrées',
    period: 'Période',
    search: 'Rechercher par compte, rôle, état de session ou canal d’accès',
    empty: 'Aucune session enregistrée à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    unknownAccount: 'Compte non identifié',
    role: 'Type de compte',
    reference: 'Référence masquée',
    channel: 'Canal d’accès',
    started: 'Début de session',
    lastActivity: 'Dernière activité enregistrée',
    expires: 'Date d’expiration',
    ended: 'Date de fin',
    privacy: 'Confidentialité : ne transmettez pas de jetons de session, clés d’accès, mots de passe, adresses IP, localisation précise ou empreintes d’appareil. Utilisez uniquement une référence masquée et des libellés généraux.',
    staging: 'Attention : l’environnement de test peut contenir des sessions simulées qui ne représentent pas celles de vrais utilisateurs.',
    readOnly: 'Consultation uniquement : aucune session n’est révoquée, aucune déconnexion n’est déclenchée et aucun compte ou état de session n’est modifié.',
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
  sessionCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 9, padding: 14 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  accountName: { color: '#123B5D', flex: 1, fontSize: 14, fontWeight: '800' },
  statusPill: { backgroundColor: '#EEF3F8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { color: '#344054', fontSize: 10, fontWeight: '700' },
  divider: { backgroundColor: '#E9DCC4', height: 1, marginVertical: 2 },
  infoRow: { alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11, lineHeight: 17 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, lineHeight: 17 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, padding: 17 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
