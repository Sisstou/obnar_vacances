import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminPrivacyPolicyItem = {
  id: string;
  title: string;
  categoryLabel?: string;
  policyValue?: string;
  statusLabel?: string;
  description?: string;
  effectiveDateLabel?: string;
  reviewedAtLabel?: string;
  nextReviewLabel?: string;
};

export type AdminRetentionRuleItem = {
  id: string;
  dataCategoryLabel: string;
  retentionPeriodLabel?: string;
  triggerEventLabel?: string;
  dispositionLabel?: string;
  statusLabel?: string;
  rationale?: string;
  reviewedAtLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  policies: AdminPrivacyPolicyItem[];
  retentionRules: AdminRetentionRuleItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
};

/**
 * Read-only policy and retention overview. All policy wording, durations,
 * trigger events and statuses must be supplied by an approved parent source.
 */
export default function AdminPrivacyRetentionPanel({
  policies,
  retentionRules,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const [search, setSearch] = useState('');
  const visiblePolicies = trustedAdminSource ? policies : [];
  const visibleRules = trustedAdminSource ? retentionRules : [];

  const filteredPolicies = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visiblePolicies;
    return visiblePolicies.filter((item) =>
      [
        item.title,
        item.categoryLabel ?? '',
        item.policyValue ?? '',
        item.statusLabel ?? '',
        item.description ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visiblePolicies]);

  const filteredRules = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleRules;
    return visibleRules.filter((item) =>
      [
        item.dataCategoryLabel,
        item.retentionPeriodLabel ?? '',
        item.triggerEventLabel ?? '',
        item.dispositionLabel ?? '',
        item.statusLabel ?? '',
        item.rationale ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleRules]);

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

          <SectionHeader title={t.policies} count={filteredPolicies.length} rtl={rtl} />
          {filteredPolicies.length === 0 ? (
            <EmptyState text={visiblePolicies.length === 0 ? t.noPolicies : t.noResults} rtl={rtl} />
          ) : (
            <View style={styles.list}>
              {filteredPolicies.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>{item.title}</Text>
                  {item.categoryLabel ? <InfoRow label={t.category} value={item.categoryLabel} rtl={rtl} /> : null}
                  {item.policyValue ? <InfoRow label={t.policyValue} value={item.policyValue} rtl={rtl} /> : null}
                  {item.statusLabel ? <InfoRow label={t.status} value={item.statusLabel} rtl={rtl} /> : null}
                  {item.effectiveDateLabel ? <InfoRow label={t.effective} value={item.effectiveDateLabel} rtl={rtl} /> : null}
                  {item.reviewedAtLabel ? <InfoRow label={t.reviewed} value={item.reviewedAtLabel} rtl={rtl} /> : null}
                  {item.nextReviewLabel ? <InfoRow label={t.nextReview} value={item.nextReviewLabel} rtl={rtl} /> : null}
                  {item.description ? <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>{item.description}</Text> : null}
                </View>
              ))}
            </View>
          )}

          <SectionHeader title={t.retention} count={filteredRules.length} rtl={rtl} />
          {filteredRules.length === 0 ? (
            <EmptyState text={visibleRules.length === 0 ? t.noRules : t.noResults} rtl={rtl} />
          ) : (
            <View style={styles.list}>
              {filteredRules.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>{item.dataCategoryLabel}</Text>
                  {item.retentionPeriodLabel ? <InfoRow label={t.duration} value={item.retentionPeriodLabel} rtl={rtl} /> : null}
                  {item.triggerEventLabel ? <InfoRow label={t.trigger} value={item.triggerEventLabel} rtl={rtl} /> : null}
                  {item.dispositionLabel ? <InfoRow label={t.disposition} value={item.dispositionLabel} rtl={rtl} /> : null}
                  {item.statusLabel ? <InfoRow label={t.status} value={item.statusLabel} rtl={rtl} /> : null}
                  {item.reviewedAtLabel ? <InfoRow label={t.reviewed} value={item.reviewedAtLabel} rtl={rtl} /> : null}
                  {item.rationale ? <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>{item.rationale}</Text> : null}
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
    heading: 'سياسات الخصوصية والاحتفاظ بالبيانات',
    subtitle: 'عرض السياسات المعتمدة ومدد الاحتفاظ ومواعيد مراجعتها من مصدر موثوق',
    trusted: 'السياسات معروضة من مصدر إداري موثوق.',
    untrusted: 'مصدر السياسات غير مؤكد؛ تم إخفاء التفاصيل.',
    period: 'الفترة',
    search: 'ابحث في السياسات أو فئات البيانات أو المدد',
    policies: 'سياسات الخصوصية',
    retention: 'قواعد الاحتفاظ بالبيانات',
    category: 'التصنيف',
    policyValue: 'نص السياسة أو القيمة',
    status: 'الحالة المسجلة',
    effective: 'تاريخ السريان',
    reviewed: 'آخر مراجعة',
    nextReview: 'المراجعة القادمة',
    duration: 'مدة الاحتفاظ',
    trigger: 'بداية احتساب المدة',
    disposition: 'الإجراء عند انتهاء المدة',
    noPolicies: 'لا توجد سياسات متاحة للعرض.',
    noRules: 'لا توجد قواعد احتفاظ متاحة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    staging: 'تنبيه: قد تكون بيانات بيئة الاختبار تجريبية، ولا تمثل بالضرورة السياسات المعتمدة للإنتاج.',
    privacy: 'الخصوصية: لا تمرّر كلمات المرور أو رموز التحقق أو مفاتيح API أو أسرار المصادقة أو بيانات شخصية خاماً إلى هذه اللوحة. استخدم نصوص السياسات المعتمدة فقط.',
    readOnly: 'عرض فقط: لا تعدّل السياسات أو مدد الاحتفاظ، ولا تحذف أو تؤرشف البيانات. لا تعتبر المدة غير المحددة صفراً أو مدة افتراضية؛ يجب اعتمادها رسمياً قبل التنفيذ.',
  },
  fr: {
    heading: 'Politiques de confidentialité et conservation des données',
    subtitle: 'Consultation des politiques approuvées, durées de conservation et dates de révision depuis une source fiable',
    trusted: 'Les politiques proviennent d’une source administrative fiable.',
    untrusted: 'La source des politiques n’est pas confirmée ; les détails sont masqués.',
    period: 'Période',
    search: 'Rechercher dans les politiques, catégories de données ou durées',
    policies: 'Politiques de confidentialité',
    retention: 'Règles de conservation des données',
    category: 'Catégorie',
    policyValue: 'Texte ou valeur de la politique',
    status: 'État enregistré',
    effective: 'Date d’entrée en vigueur',
    reviewed: 'Dernière révision',
    nextReview: 'Prochaine révision',
    duration: 'Durée de conservation',
    trigger: 'Événement déclencheur',
    disposition: 'Traitement à l’échéance',
    noPolicies: 'Aucune politique à afficher.',
    noRules: 'Aucune règle de conservation à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    staging: 'Attention : les données de test peuvent être simulées et ne représentent pas nécessairement les politiques approuvées en production.',
    privacy: 'Confidentialité : ne transmettez pas de mots de passe, codes de vérification, clés API, secrets d’authentification ou données personnelles brutes. Utilisez uniquement les textes de politiques approuvés.',
    readOnly: 'Consultation uniquement : aucune politique ou durée n’est modifiée et aucune donnée n’est supprimée ou archivée. Une durée non définie ne doit pas être interprétée comme zéro ou comme une valeur par défaut ; elle doit être approuvée formellement avant application.',
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
  cardTitle: { color: '#12243A', fontSize: 13, fontWeight: '800' },
  infoRow: { alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11, lineHeight: 17 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, lineHeight: 17 },
  description: { color: '#475467', fontSize: 12, lineHeight: 19 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
