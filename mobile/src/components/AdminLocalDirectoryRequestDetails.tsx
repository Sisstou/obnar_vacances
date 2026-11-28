import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AdminLocalDirectoryRequestHistoryEntry = {
  dateLabel: string;
  statusLabel: string;
  note?: string;
};

export type AdminLocalDirectoryRequestDetail = {
  id: string;
  activityName: string;
  categoryLabel?: string;
  applicantDisplayName?: string;
  publicArea?: string;
  description?: string;
  statusLabel: string;
  submittedAtLabel?: string;
  updatedAtLabel?: string;
  adminNote?: string;
  history?: AdminLocalDirectoryRequestHistoryEntry[];
};

type Language = 'ar' | 'fr';

type Props = {
  request: AdminLocalDirectoryRequestDetail;
  language: Language;
  trustedAdminSource?: boolean;
  onBack?: () => void;
};

const copy = {
  ar: {
    heading: 'تفاصيل طلب إدراج نشاط أو خدمة',
    subtitle: 'مراجعة المعلومات المقدمة وسجل متابعة الطلب',
    untrusted: 'مصدر البيانات غير مؤكد؛ تم إخفاء تفاصيل الطلب.',
    staging: 'قد تكون هذه البيانات تجريبية ولا تمثل طلباً حقيقياً أو إدراجاً منشوراً.',
    activity: 'اسم النشاط أو الخدمة',
    category: 'التصنيف',
    applicant: 'مقدم الطلب',
    area: 'المنطقة العامة',
    description: 'وصف النشاط',
    status: 'الحالة المسجلة',
    submitted: 'تاريخ التقديم',
    updated: 'آخر تحديث',
    note: 'ملاحظة الإدارة',
    history: 'سجل متابعة الطلب',
    noHistory: 'لا يوجد سجل متابعة متاح.',
    noValue: 'غير متوفر',
    back: 'العودة إلى الطلبات',
    privacy: 'لا تعرض هذه الشاشة أرقام الهواتف أو البريد الإلكتروني أو العناوين الخاصة أو وثائق الهوية والمرفقات الحساسة.',
    readOnly: 'عرض فقط: لا تغيّر حالة الطلب ولا تقبله أو ترفضه ولا تطلب تعديلات ولا تنشر الإدراج. لا يتم إرسال إشعارات أو حفظ تغييرات.',
  },
  fr: {
    heading: 'Détails de la demande d’inscription',
    subtitle: 'Consultation des informations soumises et de l’historique de suivi',
    untrusted: 'La source des données n’est pas confirmée ; les détails de la demande sont masqués.',
    staging: 'Ces données peuvent être des données de test et ne représentent pas nécessairement une demande réelle ou une fiche publiée.',
    activity: 'Nom de l’activité ou du service',
    category: 'Catégorie',
    applicant: 'Demandeur',
    area: 'Zone générale',
    description: 'Description de l’activité',
    status: 'Statut enregistré',
    submitted: 'Date de soumission',
    updated: 'Dernière mise à jour',
    note: 'Note de l’administration',
    history: 'Historique de suivi',
    noHistory: 'Aucun historique disponible.',
    noValue: 'Non disponible',
    back: 'Retour aux demandes',
    privacy: 'Cet écran n’affiche aucun téléphone, e-mail, adresse privée, pièce d’identité ni pièce jointe sensible.',
    readOnly: 'Consultation uniquement : aucun changement de statut, approbation, refus, demande de correction ou publication. Aucune notification ni sauvegarde.',
  },
};

export default function AdminLocalDirectoryRequestDetails({
  request,
  language,
  trustedAdminSource = false,
  onBack,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';

  if (!trustedAdminSource) {
    return (
      <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <View style={styles.warningCard}>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
        </View>
        {onBack ? <BackButton label={t.back} onPress={onBack} /> : null}
        <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.activityName, { textAlign: rtl ? 'right' : 'left' }]}>
          {request.activityName || t.noValue}
        </Text>
        <Info label={t.status} value={request.statusLabel || t.noValue} rtl={rtl} prominent />
        <Info label={t.category} value={request.categoryLabel || t.noValue} rtl={rtl} />
        <Info label={t.applicant} value={request.applicantDisplayName || t.noValue} rtl={rtl} />
        <Info label={t.area} value={request.publicArea || t.noValue} rtl={rtl} />
        <Info label={t.submitted} value={request.submittedAtLabel || t.noValue} rtl={rtl} />
        <Info label={t.updated} value={request.updatedAtLabel || t.noValue} rtl={rtl} />
      </View>

      <Section title={t.description} rtl={rtl}>
        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
          {request.description || t.noValue}
        </Text>
      </Section>

      <Section title={t.note} rtl={rtl} tone="note">
        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
          {request.adminNote || t.noValue}
        </Text>
      </Section>

      <View style={styles.historyCard}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.history}</Text>
        {request.history && request.history.length > 0 ? (
          request.history.map((entry, index) => (
            <View key={String(index) + entry.dateLabel} style={styles.historyEntry}>
              <View style={[styles.historyHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.historyStatus, { textAlign: rtl ? 'right' : 'left' }]}>
                  {entry.statusLabel}
                </Text>
                <Text style={styles.historyDate}>{entry.dateLabel}</Text>
              </View>
              {entry.note ? (
                <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>{entry.note}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.mutedText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noHistory}</Text>
        )}
      </View>

      <View style={styles.privacyCard}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
      </View>
      {onBack ? <BackButton label={t.back} onPress={onBack} /> : null}
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
  );
}

function Info({
  label,
  value,
  rtl,
  prominent = false,
}: {
  label: string;
  value: string;
  rtl: boolean;
  prominent?: boolean;
}) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[prominent ? styles.prominentValue : styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>
        {value}
      </Text>
    </View>
  );
}

function Section({
  title,
  rtl,
  tone,
  children,
}: {
  title: string;
  rtl: boolean;
  tone?: 'note';
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, tone === 'note' && styles.noteCard]}>
      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{title}</Text>
      {children}
    </View>
  );
}

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <Text style={styles.backButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  container: { gap: 14, padding: 16, paddingBottom: 28 },
  headingBlock: { gap: 5 },
  heading: { color: '#123B5D', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  warningCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F1DCA8',
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 13,
  },
  warningText: { color: '#77520A', fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 15,
    borderWidth: 1,
    gap: 13,
    padding: 14,
  },
  activityName: { color: '#123B5D', fontSize: 19, fontWeight: '800', lineHeight: 27 },
  infoRow: { alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 12 },
  infoValue: { color: '#344054', flex: 1, fontSize: 13, fontWeight: '600' },
  prominentValue: { color: '#123B5D', flex: 1, fontSize: 13, fontWeight: '800' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 13,
    borderWidth: 1,
    gap: 8,
    padding: 13,
  },
  noteCard: { backgroundColor: '#FFF9ED', borderColor: '#F0DDAE' },
  sectionTitle: { color: '#123B5D', fontSize: 15, fontWeight: '800' },
  bodyText: { color: '#475467', fontSize: 13, lineHeight: 21 },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 13,
    borderWidth: 1,
    gap: 12,
    padding: 13,
  },
  historyEntry: { borderTopColor: '#E9DCC4', borderTopWidth: 1, gap: 6, paddingTop: 11 },
  historyHeader: { alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' },
  historyStatus: { color: '#123B5D', flex: 1, fontSize: 13, fontWeight: '800' },
  historyDate: { color: '#667085', fontSize: 11 },
  mutedText: { color: '#667085', fontSize: 12 },
  privacyCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  backButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
  pressed: { opacity: 0.78 },
});
