import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminNotificationItem = {
  id: string;
  title: string;
  message: string;
  typeLabel?: string;
  statusLabel?: string;
  createdAtLabel: string;
  recipientLabel?: string;
  relatedItemLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  notifications: AdminNotificationItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
  onOpenNotification?: (notification: AdminNotificationItem) => void;
};

const copy = {
  ar: {
    heading: 'إشعارات الإدارة',
    subtitle: 'متابعة الإشعارات الإدارية المسجلة والاطلاع على تفاصيلها',
    search: 'ابحث في العنوان أو المحتوى أو النوع أو الحالة أو الجهة المرتبطة',
    total: 'عدد الإشعارات',
    period: 'الفترة',
    type: 'النوع',
    status: 'الحالة المسجلة',
    createdAt: 'تاريخ الإنشاء',
    recipient: 'الجهة المعنية',
    related: 'العنصر المرتبط',
    open: 'عرض التفاصيل',
    emptyTitle: 'لا توجد إشعارات للعرض',
    emptyBody: 'ستظهر هنا الإشعارات التي يمررها مصدر إداري موثوق.',
    trusted: 'الإشعارات مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر الإشعارات غير مؤكد؛ تم إخفاء التفاصيل.',
    privacy: 'الخصوصية: لا تمرّر كلمات المرور أو رموز التحقق أو بيانات البطاقات أو مستندات الهوية أو بيانات الاتصال الخاصة. استخدم أقل قدر لازم من المعلومات.',
    staging: 'إشعارات الاختبار لا تمثل بالضرورة إشعارات إنتاجية حقيقية.',
    readOnly: 'عرض فقط: لا ترسل الإشعارات أو تعيد إرسالها أو تحذفها أو تغيّر حالتها أو تحفظ أي تعديل من هذه الواجهة.',
    noType: 'غير محدد',
    noStatus: 'غير محددة',
  },
  fr: {
    heading: 'Notifications administratives',
    subtitle: 'Suivi des notifications administratives enregistrées et consultation de leurs détails',
    search: 'Rechercher dans le titre, le contenu, le type, le statut ou l’élément associé',
    total: 'Nombre de notifications',
    period: 'Période',
    type: 'Type',
    status: 'Statut enregistré',
    createdAt: 'Date de création',
    recipient: 'Destinataire concerné',
    related: 'Élément associé',
    open: 'Voir les détails',
    emptyTitle: 'Aucune notification à afficher',
    emptyBody: 'Les notifications fournies par une source administrative fiable apparaîtront ici.',
    trusted: 'Les notifications proviennent d’une source administrative fiable.',
    untrusted: 'La source des notifications n’est pas confirmée ; les détails sont masqués.',
    privacy: 'Confidentialité : ne transmettez ni mots de passe, ni codes de vérification, ni données de carte, ni pièces d’identité, ni coordonnées privées. Limitez-vous aux informations nécessaires.',
    staging: 'Les notifications de test ne représentent pas nécessairement de vraies notifications en production.',
    readOnly: 'Consultation uniquement : cette interface n’envoie, ne renvoie, ne supprime et ne modifie aucune notification et n’enregistre aucun changement.',
    noType: 'Non précisé',
    noStatus: 'Non précisé',
  },
};

/**
 * Read-only presentation of administrative notifications.
 * Type and status are labels supplied by the parent; this component does not
 * define a notification taxonomy or database schema.
 * No network access, persistence, delivery, read-state changes, or mutations.
 */
export default function AdminNotificationsPanel({
  notifications,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
  onOpenNotification,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [search, setSearch] = useState('');

  const visibleNotifications = trustedAdminSource ? notifications : [];
  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleNotifications;

    return visibleNotifications.filter((notification) =>
      [
        notification.title,
        notification.message,
        notification.typeLabel ?? '',
        notification.statusLabel ?? '',
        notification.recipientLabel ?? '',
        notification.relatedItemLabel ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleNotifications]);

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
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
          {trustedAdminSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {trustedAdminSource ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{visibleNotifications.length}</Text>
            <Text style={styles.summaryLabel}>{t.total}</Text>
          </View>

          {reportingPeriodLabel ? (
            <Text style={[styles.period, { textAlign: rtl ? 'right' : 'left' }]}>
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

          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyTitle}
              </Text>
              <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyBody}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {filteredNotifications.map((notification) => (
                <View key={notification.id} style={styles.notificationCard}>
                  <View style={[styles.cardTop, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
                      {notification.title}
                    </Text>
                    {notification.typeLabel ? (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{notification.typeLabel}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.timestamp, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.createdAt}: {notification.createdAtLabel}
                  </Text>

                  {notification.statusLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.status}: {notification.statusLabel}
                    </Text>
                  ) : null}

                  <Text style={[styles.message, { textAlign: rtl ? 'right' : 'left' }]}>
                    {notification.message}
                  </Text>

                  {notification.recipientLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.recipient}: {notification.recipientLabel}
                    </Text>
                  ) : null}

                  {notification.relatedItemLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.related}: {notification.relatedItemLabel}
                    </Text>
                  ) : null}

                  {onOpenNotification ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.open + ': ' + notification.title}
                      onPress={() => onOpenNotification(notification)}
                      style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.openButtonText}>{t.open}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.untrusted}
          </Text>
        </View>
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.privacy}
        </Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.readOnly}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 13,
    borderWidth: 1,
    gap: 5,
    padding: 13,
  },
  summaryValue: {
    color: '#123B5D',
    fontSize: 23,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  period: {
    color: '#667085',
    fontSize: 11,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 11,
    borderWidth: 1,
    color: '#344054',
    fontSize: 13,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 9,
    padding: 14,
  },
  cardTop: {
    alignItems: 'flex-start',
    gap: 9,
    justifyContent: 'space-between',
  },
  title: {
    color: '#123B5D',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
  typeBadge: {
    backgroundColor: '#EEF4FA',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  typeText: {
    color: '#315B7D',
    fontSize: 10,
    fontWeight: '700',
  },
  timestamp: {
    color: '#805B00',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  meta: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  message: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 11,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  emptyTitle: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
  },
  bodyText: {
    color: '#475467',
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
});
