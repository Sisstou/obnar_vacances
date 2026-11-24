import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Language = 'ar' | 'fr';

export type AdminBackupRecord = {
  id: string;
  backupTypeLabel: string;
  scopeLabel: string;
  createdAtLabel: string;
  statusLabel: string;
  initiatedByLabel?: string;
  sizeLabel?: string;
  resultNote?: string;
};

type Props = {
  backups: AdminBackupRecord[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
  lastUpdatedLabel?: string;
};

/**
 * Read-only backup activity panel.
 * Backup types, statuses, scope and outcomes are supplied by the parent.
 * This component does not create, download, delete, or restore backups.
 */
export default function AdminBackupHistoryPanel({
  backups,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
  lastUpdatedLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = language === 'ar' ? {
    title: 'سجل النسخ الاحتياطي',
    subtitle: 'متابعة عمليات النسخ المسجلة ونتائجها من مصدر إداري موثوق',
    period: 'الفترة',
    count: 'عدد السجلات',
    type: 'نوع النسخة',
    scope: 'النطاق',
    date: 'تاريخ العملية',
    status: 'الحالة المسجلة',
    actor: 'بدأ العملية',
    size: 'الحجم المسجل',
    result: 'ملاحظات النتيجة',
    trusted: 'سجلات النسخ واردة من مصدر إداري موثوق.',
    untrusted: 'مصدر سجلات النسخ غير مؤكد؛ تم إخفاء التفاصيل.',
    emptyTitle: 'لا توجد عمليات نسخ مسجلة',
    emptyBody: 'ستظهر هنا العمليات التي يوفرها المصدر الموثوق عند توفرها.',
    staging: 'تنبيه: سجلات الاختبار لا تثبت وجود نسخة احتياطية فعلية أو صلاحيتها للاستعادة.',
    readOnly: 'عرض فقط: لا ينفذ هذا القسم نسخاً احتياطياً أو تنزيلًا أو حذفاً أو استعادة للبيانات.',
    privacy: 'لا تعرض أو تمرّر كلمات المرور أو مفاتيح API أو رموز الوصول أو روابط التخزين الخاصة أو أسرار النسخ الاحتياطي.',
    updated: 'آخر تحديث للسجل',
    noRecords: 'لا توجد سجلات متاحة من المصدر.',
  } : {
    title: 'Historique des sauvegardes',
    subtitle: 'Suivi des opérations de sauvegarde enregistrées depuis une source administrative fiable',
    period: 'Période',
    count: 'Nombre d’enregistrements',
    type: 'Type de sauvegarde',
    scope: 'Périmètre',
    date: 'Date de l’opération',
    status: 'État enregistré',
    actor: 'Opération lancée par',
    size: 'Taille enregistrée',
    result: 'Notes sur le résultat',
    trusted: 'Les journaux de sauvegarde proviennent d’une source administrative fiable.',
    untrusted: 'La source des journaux n’est pas confirmée ; les détails sont masqués.',
    emptyTitle: 'Aucune opération de sauvegarde enregistrée',
    emptyBody: 'Les opérations fournies par la source fiable apparaîtront ici lorsqu’elles seront disponibles.',
    staging: 'Attention : les journaux de test ne prouvent pas qu’une sauvegarde réelle existe ni qu’elle peut être restaurée.',
    readOnly: 'Consultation uniquement : cette section ne crée, ne télécharge, ne supprime et ne restaure aucune sauvegarde.',
    privacy: 'N’affichez et ne transmettez aucun mot de passe, clé API, jeton d’accès, lien de stockage privé ou secret de sauvegarde.',
    updated: 'Dernière mise à jour du journal',
    noRecords: 'Aucun enregistrement disponible depuis la source.',
  };

  const visibleBackups = trustedAdminSource ? backups : [];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.title}
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
            <Text style={[styles.summaryLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.count}</Text>
            <Text style={[styles.summaryValue, { textAlign: rtl ? 'right' : 'left' }]}>
              {visibleBackups.length}
            </Text>
            {reportingPeriodLabel ? (
              <Text style={[styles.summaryMeta, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.period}: {reportingPeriodLabel}
              </Text>
            ) : null}
          </View>

          {visibleBackups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.emptyTitle}</Text>
              <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.emptyBody}</Text>
              <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noRecords}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {visibleBackups.map((backup) => (
                <View key={backup.id} style={styles.card}>
                  <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                    {backup.backupTypeLabel}
                  </Text>
                  <View style={styles.details}>
                    <Text style={[styles.detail, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.scope}: {backup.scopeLabel}
                    </Text>
                    <Text style={[styles.detail, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.date}: {backup.createdAtLabel}
                    </Text>
                    <Text style={[styles.detail, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.status}: {backup.statusLabel}
                    </Text>
                    {backup.initiatedByLabel ? (
                      <Text style={[styles.detail, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.actor}: {backup.initiatedByLabel}
                      </Text>
                    ) : null}
                    {backup.sizeLabel ? (
                      <Text style={[styles.detail, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.size}: {backup.sizeLabel}
                      </Text>
                    ) : null}
                  </View>
                  {backup.resultNote ? (
                    <View style={styles.resultBox}>
                      <Text style={[styles.resultLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.result}</Text>
                      <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {backup.resultNote}
                      </Text>
                    </View>
                  ) : null}
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
  scroll: { width: '100%' },
  container: { gap: 13, paddingBottom: 20, width: '100%' },
  header: { gap: 5 },
  title: { color: '#12243A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: {
    backgroundColor: '#F2F6FA',
    borderColor: '#DCE6EF',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  summaryCard: { backgroundColor: '#102D46', borderRadius: 15, gap: 7, padding: 16 },
  summaryLabel: { color: '#D5E3EF', fontSize: 11, fontWeight: '700' },
  summaryValue: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  summaryMeta: { color: '#D5E3EF', fontSize: 11 },
  list: { gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { color: '#12345A', fontSize: 14, fontWeight: '800' },
  details: { backgroundColor: '#F8FAFC', borderRadius: 10, gap: 6, padding: 10 },
  detail: { color: '#667085', fontSize: 11, lineHeight: 17 },
  resultBox: { borderTopColor: '#E5EAF0', borderTopWidth: 1, gap: 5, paddingTop: 9 },
  resultLabel: { color: '#344054', fontSize: 12, fontWeight: '800' },
  bodyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 17,
  },
  emptyTitle: { color: '#344054', fontSize: 14, fontWeight: '800' },
  updated: { color: '#667085', fontSize: 11 },
  privacyNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
