import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminSecurityControlItem = {
  id: string;
  controlLabel: string;
  valueLabel?: string;
  statusLabel?: string;
  description?: string;
  updatedAtLabel?: string;
};

export type AdminAccountVerificationItem = {
  id: string;
  accountDisplayName: string;
  verificationTypeLabel?: string;
  statusLabel: string;
  submittedAtLabel?: string;
  reviewedAtLabel?: string;
  reviewNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  controls: AdminSecurityControlItem[];
  verifications: AdminAccountVerificationItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
};

/**
 * Read-only administrative overview. All values and status labels are supplied
 * by the parent from an authorized source; this component does not configure auth.
 */
export default function AdminSecurityOverviewPanel({
  controls,
  verifications,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const [search, setSearch] = useState('');
  const visibleControls = trustedAdminSource ? controls : [];
  const visibleVerifications = trustedAdminSource ? verifications : [];

  const filteredControls = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleControls;
    return visibleControls.filter((item) =>
      [item.controlLabel, item.valueLabel ?? '', item.statusLabel ?? '', item.description ?? '']
        .some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleControls]);

  const filteredVerifications = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleVerifications;
    return visibleVerifications.filter((item) =>
      [
        item.accountDisplayName,
        item.verificationTypeLabel ?? '',
        item.statusLabel,
        item.reviewNote ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleVerifications]);

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

          <SectionHeader title={t.controls} count={filteredControls.length} rtl={rtl} />
          {filteredControls.length === 0 ? (
            <EmptyState text={visibleControls.length === 0 ? t.noControls : t.noResults} rtl={rtl} />
          ) : (
            <View style={styles.list}>
              {filteredControls.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                    {item.controlLabel}
                  </Text>
                  {item.valueLabel ? <InfoRow label={t.value} value={item.valueLabel} rtl={rtl} /> : null}
                  {item.statusLabel ? <InfoRow label={t.status} value={item.statusLabel} rtl={rtl} /> : null}
                  {item.updatedAtLabel ? <InfoRow label={t.updated} value={item.updatedAtLabel} rtl={rtl} /> : null}
                  {item.description ? (
                    <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <SectionHeader title={t.verifications} count={filteredVerifications.length} rtl={rtl} />
          {filteredVerifications.length === 0 ? (
            <EmptyState text={visibleVerifications.length === 0 ? t.noVerifications : t.noResults} rtl={rtl} />
          ) : (
            <View style={styles.list}>
              {filteredVerifications.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {item.accountDisplayName}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{item.statusLabel}</Text>
                    </View>
                  </View>
                  {item.verificationTypeLabel ? <InfoRow label={t.type} value={item.verificationTypeLabel} rtl={rtl} /> : null}
                  {item.submittedAtLabel ? <InfoRow label={t.submitted} value={item.submittedAtLabel} rtl={rtl} /> : null}
                  {item.reviewedAtLabel ? <InfoRow label={t.reviewed} value={item.reviewedAtLabel} rtl={rtl} /> : null}
                  {item.reviewNote ? (
                    <View style={styles.noteBox}>
                      <Text style={[styles.noteText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.note}: {item.reviewNote}
                      </Text>
                    </View>
                  ) : null}
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
    heading: 'أمان المنصة والتحقق من الحسابات',
    subtitle: 'مراجعة معلومات ضوابط الأمان وحالات التحقق التي يوفرها مصدر إداري موثوق',
    trusted: 'البيانات معروضة من مصدر إداري موثوق.',
    untrusted: 'مصدر البيانات غير مؤكد؛ تم إخفاء التفاصيل.',
    period: 'الفترة',
    search: 'ابحث في الضوابط أو الحسابات أو الحالات',
    controls: 'ضوابط الأمان',
    verifications: 'التحقق من الحسابات',
    value: 'القيمة المعروضة',
    status: 'الحالة المسجلة',
    updated: 'آخر تحديث',
    type: 'نوع التحقق',
    submitted: 'تاريخ الإرسال',
    reviewed: 'تاريخ المراجعة',
    note: 'ملاحظة المراجعة',
    noControls: 'لا توجد ضوابط أمان متاحة للعرض.',
    noVerifications: 'لا توجد طلبات تحقق متاحة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    staging: 'تنبيه: بيانات بيئة الاختبار قد تكون تجريبية ولا تمثل إعدادات أو حسابات إنتاجية.',
    privacy: 'الخصوصية: لا تمرّر كلمات المرور أو رموز التحقق أو مفاتيح API أو أسرار المصادقة أو صور وثائق الهوية أو أرقامها. استخدم أسماء عامة وتسميات حالة فقط.',
    readOnly: 'عرض فقط: لا تغيّر إعدادات المصادقة أو كلمات المرور أو وسائل التحقق، ولا تقبل أو ترفض طلبات التحقق من هذه الشاشة.',
  },
  fr: {
    heading: 'Sécurité de la plateforme et vérification des comptes',
    subtitle: 'Consultation des contrôles de sécurité et des états de vérification fournis par une source administrative fiable',
    trusted: 'Les données proviennent d’une source administrative fiable.',
    untrusted: 'La source des données n’est pas confirmée ; les détails sont masqués.',
    period: 'Période',
    search: 'Rechercher dans les contrôles, comptes ou états',
    controls: 'Contrôles de sécurité',
    verifications: 'Vérification des comptes',
    value: 'Valeur affichée',
    status: 'État enregistré',
    updated: 'Dernière mise à jour',
    type: 'Type de vérification',
    submitted: 'Date de soumission',
    reviewed: 'Date de révision',
    note: 'Note de révision',
    noControls: 'Aucun contrôle de sécurité à afficher.',
    noVerifications: 'Aucune demande de vérification à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    staging: 'Attention : les données de test peuvent être simulées et ne représentent pas les paramètres ou comptes de production.',
    privacy: 'Confidentialité : ne transmettez pas de mots de passe, codes de vérification, clés API, secrets d’authentification, images ou numéros de pièces d’identité. Utilisez uniquement des noms génériques et des libellés d’état.',
    readOnly: 'Consultation uniquement : aucun paramètre d’authentification, mot de passe ou moyen de vérification n’est modifié ; aucune demande n’est approuvée ou refusée depuis cet écran.',
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
  noteBox: { backgroundColor: '#F2F6FA', borderRadius: 9, padding: 10 },
  noteText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  meta: { color: '#667085', fontSize: 11, lineHeight: 17 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
