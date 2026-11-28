import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Language = 'ar' | 'fr';

export type AdminReleaseEntry = {
  id: string;
  version: string;
  releaseDateLabel?: string;
  platformLabel?: string;
  statusLabel?: string;
  title: string;
  notes: string[];
};

type Props = {
  language: Language;
  currentVersion?: string;
  currentVersionStatusLabel?: string;
  releases: AdminReleaseEntry[];
  trustedAdminSource?: boolean;
  lastUpdatedLabel?: string;
};

const copy = {
  ar: {
    heading: 'سجل الإصدارات والتحديثات',
    subtitle: 'عرض نسخ التطبيق وملاحظات التغييرات التي يوفرها مصدر إداري موثوق',
    current: 'الإصدار الحالي المسجل',
    currentStatus: 'حالة الإصدار',
    history: 'سجل الإصدارات',
    version: 'الإصدار',
    date: 'تاريخ الإصدار',
    platform: 'المنصة',
    status: 'الحالة المسجلة',
    changes: 'ملاحظات التحديث',
    trusted: 'سجل الإصدارات وارد من مصدر إداري موثوق.',
    untrusted: 'مصدر سجل الإصدارات غير مؤكد؛ تم إخفاء تفاصيل الإصدارات.',
    emptyTitle: 'لا توجد إصدارات مسجلة للعرض',
    emptyBody: 'ستظهر هنا الإصدارات وملاحظات التغيير التي يوفرها المصدر الموثوق.',
    noCurrent: 'لم تُحدد نسخة حالية موثقة.',
    noNotes: 'لا توجد ملاحظات تغيير مرفقة بهذا الإصدار.',
    staging: 'تنبيه: سجل بيئة الاختبار لا يثبت أن إصداراً ما نُشر فعلياً في المتاجر.',
    readOnly: 'عرض فقط: لا ينشئ هذا القسم إصداراً ولا يرفع ملفات ولا يرسل تحديثات أو يثبتها تلقائياً.',
    updated: 'آخر تحديث للسجل',
    privacy: 'لا تمرّر مفاتيح التوقيع أو كلمات المرور أو رموز الوصول أو أسرار النشر إلى هذه الشاشة.',
  },
  fr: {
    heading: 'Historique des versions et mises à jour',
    subtitle: 'Consultation des versions et notes de changement fournies par une source administrative fiable',
    current: 'Version actuelle enregistrée',
    currentStatus: 'État de la version',
    history: 'Historique des versions',
    version: 'Version',
    date: 'Date de publication',
    platform: 'Plateforme',
    status: 'État enregistré',
    changes: 'Notes de mise à jour',
    trusted: 'L’historique des versions provient d’une source administrative fiable.',
    untrusted: 'La source de l’historique n’est pas confirmée ; les détails des versions sont masqués.',
    emptyTitle: 'Aucune version enregistrée à afficher',
    emptyBody: 'Les versions et notes de changement fournies par la source fiable apparaîtront ici.',
    noCurrent: 'Aucune version actuelle vérifiée n’a été fournie.',
    noNotes: 'Aucune note de changement n’est associée à cette version.',
    staging: 'Attention : un historique de test ne prouve pas qu’une version a réellement été publiée dans les stores.',
    readOnly: 'Consultation uniquement : cette section ne crée aucune version, ne téléverse aucun fichier et ne distribue ni n’installe de mise à jour.',
    updated: 'Dernière mise à jour de l’historique',
    privacy: 'Ne transmettez aucune clé de signature, mot de passe, jeton d’accès ou secret de publication à cet écran.',
  },
};

/**
 * Read-only release history panel. All release records and labels come from
 * the parent; the component does not infer store publication or update status.
 * Never pass signing credentials, access tokens, or deployment secrets.
 */
export default function AdminReleaseHistoryPanel({
  language,
  currentVersion,
  currentVersionStatusLabel,
  releases,
  trustedAdminSource = false,
  lastUpdatedLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const visibleReleases = trustedAdminSource ? releases : [];

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
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.subtitle}
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedAdminSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {trustedAdminSource ? (
        <>
          <View style={styles.currentCard}>
            <Text style={[styles.currentLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.current}</Text>
            <Text style={[styles.currentVersion, { textAlign: rtl ? 'right' : 'left' }]}>
              {currentVersion?.trim() || t.noCurrent}
            </Text>
            {currentVersionStatusLabel ? (
              <Text style={[styles.currentStatus, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.currentStatus}: {currentVersionStatusLabel}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.history}</Text>
          {visibleReleases.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.emptyTitle}</Text>
              <Text style={[styles.emptyBody, { textAlign: rtl ? 'right' : 'left' }]}>{t.emptyBody}</Text>
            </View>
          ) : (
            <View style={styles.releaseList}>
              {visibleReleases.map((release) => (
                <View key={release.id} style={styles.releaseCard}>
                  <Text style={[styles.releaseTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                    {release.title}
                  </Text>
                  <View style={styles.metadata}>
                    <Text style={[styles.metadataText, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.version}: {release.version}
                    </Text>
                    {release.releaseDateLabel ? (
                      <Text style={[styles.metadataText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.date}: {release.releaseDateLabel}
                      </Text>
                    ) : null}
                    {release.platformLabel ? (
                      <Text style={[styles.metadataText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.platform}: {release.platformLabel}
                      </Text>
                    ) : null}
                    {release.statusLabel ? (
                      <Text style={[styles.metadataText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.status}: {release.statusLabel}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.notesHeading, { textAlign: rtl ? 'right' : 'left' }]}>{t.changes}</Text>
                  {release.notes.length === 0 ? (
                    <Text style={[styles.note, { textAlign: rtl ? 'right' : 'left' }]}>{t.noNotes}</Text>
                  ) : (
                    release.notes.map((note, index) => (
                      <Text key={index} style={[styles.note, { textAlign: rtl ? 'right' : 'left' }]}>
                        • {note}
                      </Text>
                    ))
                  )}
                </View>
              ))}
            </View>
          )}

          {lastUpdatedLabel ? (
            <Text style={[styles.updated, { textAlign: rtl ? 'right' : 'left' }]}>
              {t.updated}: {lastUpdatedLabel}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
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
  scroll: {
    width: '100%',
  },
  container: {
    gap: 13,
    paddingBottom: 20,
    width: '100%',
  },
  header: {
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
    fontSize: 11,
    lineHeight: 18,
  },
  currentCard: {
    backgroundColor: '#102D46',
    borderRadius: 15,
    gap: 8,
    padding: 16,
  },
  currentLabel: {
    color: '#D5E3EF',
    fontSize: 11,
    fontWeight: '700',
  },
  currentVersion: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  currentStatus: {
    color: '#D5E3EF',
    fontSize: 11,
  },
  sectionTitle: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
  },
  releaseList: {
    gap: 10,
  },
  releaseCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 14,
  },
  releaseTitle: {
    color: '#123B5D',
    fontSize: 14,
    fontWeight: '800',
  },
  metadata: {
    backgroundColor: '#F8F5EF',
    borderRadius: 10,
    gap: 5,
    padding: 10,
  },
  metadataText: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  notesHeading: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '800',
  },
  note: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 17,
  },
  emptyTitle: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyBody: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
  },
  updated: {
    color: '#667085',
    fontSize: 11,
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
});
