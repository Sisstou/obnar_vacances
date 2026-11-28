import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AdminNotificationHistoryEntry = {
  dateLabel: string;
  eventLabel: string;
  note?: string;
};

export type AdminNotificationDetail = {
  id: string;
  title: string;
  message: string;
  typeLabel?: string;
  statusLabel?: string;
  createdAtLabel: string;
  recipientLabel?: string;
  relatedItemLabel?: string;
  history?: AdminNotificationHistoryEntry[];
};

type Language = 'ar' | 'fr';

type Props = {
  notification: AdminNotificationDetail;
  language: Language;
  trustedAdminSource?: boolean;
  onBack?: () => void;
};

const copy = {
  ar: {
    heading: 'تفاصيل الإشعار الإداري',
    subtitle: 'عرض بيانات الإشعار وسجل المتابعة الممرر من المصدر',
    back: 'العودة',
    title: 'عنوان الإشعار',
    message: 'محتوى الإشعار',
    type: 'النوع',
    status: 'الحالة المسجلة',
    createdAt: 'تاريخ الإنشاء',
    recipient: 'الجهة المعنية',
    related: 'العنصر المرتبط',
    history: 'سجل المتابعة',
    noHistory: 'لا يوجد سجل متابعة مرفق بهذا الإشعار.',
    trusted: 'التفاصيل مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر الإشعار غير مؤكد؛ تم إخفاء التفاصيل.',
    staging: 'بيانات الاختبار لا تمثل بالضرورة إشعارات إدارية حقيقية.',
    privacy: 'الخصوصية: لا تعرض أو تمرّر كلمات المرور أو رموز التحقق أو بيانات البطاقات أو مستندات الهوية أو بيانات الاتصال الخاصة.',
    readOnly: 'هذه الشاشة للعرض فقط؛ لا تغيّر حالة الإشعار أو تؤكّد قراءته أو ترسله أو تحذفه أو تحفظ تعديلات.',
    noType: 'غير محدد',
    noStatus: 'غير محددة',
  },
  fr: {
    heading: 'Détails de la notification administrative',
    subtitle: 'Consultation des informations et de l’historique fournis par la source',
    back: 'Retour',
    title: 'Titre de la notification',
    message: 'Contenu de la notification',
    type: 'Type',
    status: 'Statut enregistré',
    createdAt: 'Date de création',
    recipient: 'Destinataire concerné',
    related: 'Élément associé',
    history: 'Historique de suivi',
    noHistory: 'Aucun historique de suivi n’est fourni pour cette notification.',
    trusted: 'Les détails proviennent d’une source administrative fiable.',
    untrusted: 'La source de la notification n’est pas confirmée ; les détails sont masqués.',
    staging: 'Les données de test ne représentent pas nécessairement de vraies notifications administratives.',
    privacy: 'Confidentialité : n’affichez et ne transmettez ni mots de passe, ni codes de vérification, ni données de carte, ni pièces d’identité, ni coordonnées privées.',
    readOnly: 'Consultation uniquement : cet écran ne modifie pas le statut, ne confirme pas la lecture, n’envoie ni ne supprime la notification et n’enregistre aucun changement.',
    noType: 'Non précisé',
    noStatus: 'Non précisé',
  },
};

/**
 * Read-only details for one administrative notification.
 * All labels and history entries are supplied by the parent; no database
 * schema or notification workflow is assumed.
 */
export default function AdminNotificationDetails({
  notification,
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
        <View style={styles.notice}>
          <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.untrusted}
          </Text>
        </View>
        <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backButtonText}>{t.back}</Text>
          </Pressable>
        ) : null}
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
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.subtitle}
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.trusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.title}
        </Text>
        <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
          {notification.title}
        </Text>

        <View style={styles.divider} />

        <Text style={[styles.sectionLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.message}
        </Text>
        <Text style={[styles.message, { textAlign: rtl ? 'right' : 'left' }]}>
          {notification.message}
        </Text>
      </View>

      <View style={styles.card}>
        {notification.typeLabel ? (
          <InfoRow label={t.type} value={notification.typeLabel} rtl={rtl} />
        ) : null}
        {notification.statusLabel ? (
          <InfoRow label={t.status} value={notification.statusLabel} rtl={rtl} />
        ) : null}
        <InfoRow label={t.createdAt} value={notification.createdAtLabel} rtl={rtl} />
        {notification.recipientLabel ? (
          <InfoRow label={t.recipient} value={notification.recipientLabel} rtl={rtl} />
        ) : null}
        {notification.relatedItemLabel ? (
          <InfoRow label={t.related} value={notification.relatedItemLabel} rtl={rtl} />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionHeading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.history}
        </Text>
        {notification.history && notification.history.length > 0 ? (
          <View style={styles.historyList}>
            {notification.history.map((entry, index) => (
              <View key={String(index) + entry.dateLabel} style={styles.historyItem}>
                <View style={[styles.historyTop, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.historyEvent, { textAlign: rtl ? 'right' : 'left' }]}>
                    {entry.eventLabel}
                  </Text>
                  <Text style={styles.historyDate}>{entry.dateLabel}</Text>
                </View>
                {entry.note ? (
                  <Text style={[styles.historyNote, { textAlign: rtl ? 'right' : 'left' }]}>
                    {entry.note}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.mutedText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.noHistory}
          </Text>
        )}
      </View>

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.privacy}
        </Text>
      </View>

      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.readOnly}
      </Text>

      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>{t.back}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  rtl,
}: {
  label: string;
  value: string;
  rtl: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'right' : 'left' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  container: {
    gap: 14,
    paddingBottom: 20,
    width: '100%',
  },
  headingBlock: {
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
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 15,
    borderWidth: 1,
    gap: 10,
    padding: 15,
  },
  sectionLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#123B5D',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 25,
  },
  message: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 22,
  },
  divider: {
    backgroundColor: '#EAECF0',
    height: 1,
    marginVertical: 3,
  },
  infoRow: {
    gap: 5,
  },
  infoLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 20,
  },
  sectionHeading: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
  },
  historyList: {
    gap: 11,
  },
  historyItem: {
    borderLeftColor: '#C8D7E6',
    borderLeftWidth: 2,
    gap: 6,
    paddingLeft: 11,
  },
  historyTop: {
    alignItems: 'flex-start',
    gap: 8,
    justifyContent: 'space-between',
  },
  historyEvent: {
    color: '#344054',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  historyDate: {
    color: '#805B00',
    fontSize: 10,
  },
  historyNote: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
  },
  mutedText: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
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
  backButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 11,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
