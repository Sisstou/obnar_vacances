import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export type AdminLegalChangeItem = {
  id: string;
  documentLabel: string;
  previousVersionLabel?: string;
  currentVersionLabel: string;
  changeDateLabel?: string;
  effectiveDateLabel?: string;
  reviewStatusLabel?: string;
  changeTypeLabel?: string;
  changeSummary: string;
  changedSections: string[];
  sourceReferenceLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  changes: AdminLegalChangeItem[];
  language: Language;
  trustedAdminSource?: boolean;
  lastUpdatedLabel?: string;
};

/**
 * Read-only legal-document change log.
 * The parent supplies verified version metadata and change descriptions.
 * This component does not calculate diffs or determine legal validity.
 */
export default function AdminLegalChangesPanel({
  changes,
  language,
  trustedAdminSource = false,
  lastUpdatedLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const [search, setSearch] = useState('');
  const visibleChanges = trustedAdminSource ? changes : [];

  const filteredChanges = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleChanges;
    return visibleChanges.filter((item) =>
      [
        item.documentLabel,
        item.previousVersionLabel ?? '',
        item.currentVersionLabel,
        item.changeDateLabel ?? '',
        item.effectiveDateLabel ?? '',
        item.reviewStatusLabel ?? '',
        item.changeTypeLabel ?? '',
        item.changeSummary,
        item.sourceReferenceLabel ?? '',
        ...item.changedSections,
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleChanges]);

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

          <View style={[styles.sectionHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>{t.history}</Text>
            <Text style={styles.count}>{filteredChanges.length}</Text>
          </View>

          {filteredChanges.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleChanges.length === 0 ? t.empty : t.noResults}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredChanges.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {item.documentLabel}
                    </Text>
                    {item.reviewStatusLabel ? (
                      <View style={styles.statusPill}>
                        <Text style={styles.statusText}>{item.reviewStatusLabel}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.versionTrack}>
                    <View style={styles.versionCell}>
                      <Text style={styles.versionLabel}>{t.previous}</Text>
                      <Text style={styles.versionValue}>{item.previousVersionLabel ?? t.notProvided}</Text>
                    </View>
                    <Text style={styles.arrow}>{rtl ? '←' : '→'}</Text>
                    <View style={styles.versionCell}>
                      <Text style={styles.versionLabel}>{t.current}</Text>
                      <Text style={styles.versionValue}>{item.currentVersionLabel}</Text>
                    </View>
                  </View>

                  {item.changeTypeLabel ? <InfoRow label={t.changeType} value={item.changeTypeLabel} rtl={rtl} /> : null}
                  {item.changeDateLabel ? <InfoRow label={t.changeDate} value={item.changeDateLabel} rtl={rtl} /> : null}
                  {item.effectiveDateLabel ? <InfoRow label={t.effectiveDate} value={item.effectiveDateLabel} rtl={rtl} /> : null}

                  <Text style={[styles.subheading, { textAlign: rtl ? 'right' : 'left' }]}>{t.summary}</Text>
                  <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>{item.changeSummary}</Text>

                  {item.changedSections.length > 0 ? (
                    <>
                      <Text style={[styles.subheading, { textAlign: rtl ? 'right' : 'left' }]}>{t.sections}</Text>
                      <View style={styles.chipWrap}>
                        {item.changedSections.map((section, index) => (
                          <View key={item.id + '-section-' + index} style={styles.sectionChip}>
                            <Text style={styles.sectionChipText}>{section}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  {item.sourceReferenceLabel ? <InfoRow label={t.reference} value={item.sourceReferenceLabel} rtl={rtl} /> : null}
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
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noInventedDiff}</Text>
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
    heading: 'سجل تغييرات السياسات والوثائق القانونية',
    subtitle: 'مقارنة الإصدارات وعرض التغييرات المسجلة من مصدر إداري موثوق',
    trusted: 'بيانات سجل التغييرات واردة من مصدر إداري موثوق.',
    untrusted: 'مصدر سجل التغييرات غير مؤكد؛ تم إخفاء التفاصيل.',
    staging: 'تنبيه: بيانات بيئة الاختبار لا تثبت نشر الوثائق أو اعتمادها في الإنتاج.',
    updated: 'آخر تحديث للسجل',
    search: 'ابحث باسم الوثيقة أو الإصدار أو القسم أو نوع التغيير',
    history: 'سجل التغييرات',
    previous: 'الإصدار السابق',
    current: 'الإصدار الحالي',
    notProvided: 'غير متوفر',
    changeType: 'نوع التغيير',
    changeDate: 'تاريخ التغيير',
    effectiveDate: 'تاريخ السريان',
    summary: 'ملخص التغيير',
    sections: 'الأقسام المتأثرة',
    reference: 'مرجع المصدر',
    empty: 'لا توجد تغييرات موثقة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    noInventedDiff: 'لا تُنشئ هذه اللوحة مقارنة آلية لمحتوى الملفات. يجب أن يزوّد المصدر الموثوق بملخص التغييرات والأقسام المتأثرة وبيانات الإصدارات؛ لا يُستنتج اعتماد قانوني أو تاريخ سريان من مجرد وجود ملف أو Commit.',
    readOnly: 'عرض فقط: لا تعدّل السياسات أو الوثائق، ولا تعتمد إصداراً أو تنشره، ولا تنشئ سجل تغيير. راجع النص القانوني الكامل ومسار الاعتماد قبل اتخاذ أي إجراء.',
  },
  fr: {
    heading: 'Historique des modifications des politiques et documents juridiques',
    subtitle: 'Comparaison des versions et consultation des changements enregistrés par une source administrative fiable',
    trusted: 'Les données de modification proviennent d’une source administrative fiable.',
    untrusted: 'La source de l’historique n’est pas confirmée ; les détails sont masqués.',
    staging: 'Attention : les données de test ne prouvent ni la publication ni l’approbation en production.',
    updated: 'Dernière mise à jour de l’historique',
    search: 'Rechercher par document, version, section ou type de changement',
    history: 'Historique des modifications',
    previous: 'Version précédente',
    current: 'Version actuelle',
    notProvided: 'Non fourni',
    changeType: 'Type de changement',
    changeDate: 'Date du changement',
    effectiveDate: 'Date d’entrée en vigueur',
    summary: 'Résumé du changement',
    sections: 'Sections concernées',
    reference: 'Référence de la source',
    empty: 'Aucune modification documentée à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    noInventedDiff: 'Ce panneau ne génère pas de comparaison automatique du contenu des fichiers. La source fiable doit fournir le résumé des changements, les sections concernées et les métadonnées des versions ; l’approbation juridique ou la date d’effet ne peuvent pas être déduites de la seule présence d’un fichier ou d’un commit.',
    readOnly: 'Consultation uniquement : aucune politique ni aucun document n’est modifié, aucune version n’est approuvée ou publiée et aucun changement n’est créé. Consultez le texte juridique complet et le processus d’approbation avant toute action.',
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
  meta: { color: '#667085', fontSize: 11, lineHeight: 17 },
  searchInput: { backgroundColor: '#FFFFFF', borderColor: '#D0D5DD', borderRadius: 11, borderWidth: 1, color: '#344054', fontSize: 13, minHeight: 46, paddingHorizontal: 13 },
  sectionHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { color: '#123B5D', fontSize: 15, fontWeight: '800' },
  count: { backgroundColor: '#EEF3F8', borderRadius: 20, color: '#344054', fontSize: 11, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4 },
  list: { gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 10, padding: 14 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: '#123B5D', flex: 1, fontSize: 13, fontWeight: '800' },
  statusPill: { backgroundColor: '#EEF3F8', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#344054', fontSize: 10, fontWeight: '700' },
  versionTrack: { alignItems: 'center', backgroundColor: '#F8F5EF', borderRadius: 10, flexDirection: 'row', gap: 8, padding: 10 },
  versionCell: { flex: 1, gap: 4 },
  versionLabel: { color: '#667085', fontSize: 10 },
  versionValue: { color: '#123B5D', fontSize: 12, fontWeight: '800' },
  arrow: { color: '#667085', fontSize: 16, fontWeight: '700' },
  subheading: { color: '#344054', fontSize: 11, fontWeight: '800' },
  bodyText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sectionChip: { backgroundColor: '#EEF3F8', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  sectionChipText: { color: '#344054', fontSize: 10, fontWeight: '600' },
  infoRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11, lineHeight: 17 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, lineHeight: 17 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  warning: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
