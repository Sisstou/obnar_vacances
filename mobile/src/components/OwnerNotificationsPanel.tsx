import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type OwnerNotificationType =
  | 'listing_approved'
  | 'changes_requested'
  | 'listing_under_review'
  | 'listing_updated'
  | 'general';

export type OwnerNotification = {
  id: string;
  type: OwnerNotificationType;
  title: string;
  message: string;
  createdAtLabel: string;
  listingTitle?: string;
  isRead: boolean;
};

type Language = 'ar' | 'fr';

type Props = {
  notifications: OwnerNotification[];
  language: Language;
  onOpenNotification?: (notification: OwnerNotification) => void;
  trustedNotificationSource?: boolean;
};

const copy = {
  ar: {
    heading: 'إشعارات المالك',
    subtitle: 'آخر المستجدات المتعلقة بطلبات وإقاماتك',
    emptyTitle: 'لا توجد إشعارات',
    emptyBody: 'ستظهر هنا الإشعارات التي يمررها مصدر البيانات إلى هذه الشاشة.',
    unread: 'جديد',
    read: 'مقروء',
    open: 'عرض التفاصيل',
    approved: 'تم قبول الإقامة',
    changes: 'مطلوب إجراء تعديلات',
    reviewing: 'الإقامة قيد المراجعة',
    updated: 'تم تحديث الإقامة',
    general: 'إشعار',
    relatedListing: 'الإقامة',
    trusted: 'الإشعارات مقدمة من مصدر موثوق.',
    untrusted: 'لا يمكن تأكيد صحة الإشعارات قبل التحقق من مصدرها.',
    staging: 'بيانات الاختبار ليست إشعارات حقيقية ولا تعني أن إقامة منشورة أو متاحة للحجز.',
    demo: 'واجهة عرض فقط؛ لا ترسل إشعارات ولا تغيّر حالة القراءة أو تحفظ بيانات.',
  },
  fr: {
    heading: 'Notifications du propriétaire',
    subtitle: 'Actualités concernant vos demandes et logements',
    emptyTitle: 'Aucune notification',
    emptyBody: 'Les notifications fournies par la source de données apparaîtront ici.',
    unread: 'Nouveau',
    read: 'Lue',
    open: 'Voir les détails',
    approved: 'Logement approuvé',
    changes: 'Modifications demandées',
    reviewing: 'Logement en cours de vérification',
    updated: 'Logement mis à jour',
    general: 'Notification',
    relatedListing: 'Logement',
    trusted: 'Les notifications proviennent d’une source fiable.',
    untrusted: 'Les notifications ne peuvent pas être confirmées sans vérifier leur source.',
    staging: 'Les données de test ne sont pas de vraies notifications et ne prouvent ni publication ni disponibilité à la réservation.',
    demo: 'Affichage uniquement ; cette interface n’envoie aucune notification, ne modifie pas le statut de lecture et n’enregistre aucune donnée.',
  },
} as const;

const typeStyles: Record<
  OwnerNotificationType,
  { backgroundColor: string; color: string }
> = {
  listing_approved: { backgroundColor: '#E4F5EC', color: '#176B42' },
  changes_requested: { backgroundColor: '#FDECEC', color: '#A12B2B' },
  listing_under_review: { backgroundColor: '#FFF4D6', color: '#805B00' },
  listing_updated: { backgroundColor: '#EAF2FB', color: '#245B91' },
  general: { backgroundColor: '#EEF2F7', color: '#344054' },
};

const typeLabels = {
  ar: {
    listing_approved: copy.ar.approved,
    changes_requested: copy.ar.changes,
    listing_under_review: copy.ar.reviewing,
    listing_updated: copy.ar.updated,
    general: copy.ar.general,
  },
  fr: {
    listing_approved: copy.fr.approved,
    changes_requested: copy.fr.changes,
    listing_under_review: copy.fr.reviewing,
    listing_updated: copy.fr.updated,
    general: copy.fr.general,
  },
} as const;

/**
 * Read-only owner notifications panel.
 * Notifications are supplied by the parent; no push, fetch, read-state update,
 * persistence, or backend integration is performed here.
 */
export default function OwnerNotificationsPanel({
  notifications,
  language,
  onOpenNotification,
  trustedNotificationSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';

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
          {trustedNotificationSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={styles.emptyBody}>{t.emptyBody}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {notifications.map((notification) => {
            const typeStyle = typeStyles[notification.type];
            const content = (
              <View style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
                <View style={[styles.cardHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.typeBadge, { backgroundColor: typeStyle.backgroundColor }]}>
                    <Text style={[styles.typeText, { color: typeStyle.color }]}>
                      {typeLabels[language][notification.type]}
                    </Text>
                  </View>
                  <Text style={[styles.readState, { textAlign: rtl ? 'left' : 'right' }]}>
                    {notification.isRead ? t.read : t.unread}
                  </Text>
                </View>

                <Text style={[styles.notificationTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                  {notification.title}
                </Text>
                <Text style={[styles.message, { textAlign: rtl ? 'right' : 'left' }]}>
                  {notification.message}
                </Text>

                {notification.listingTitle ? (
                  <Text style={[styles.relatedListing, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.relatedListing}: {notification.listingTitle}
                  </Text>
                ) : null}

                <Text style={[styles.date, { textAlign: rtl ? 'right' : 'left' }]}>
                  {notification.createdAtLabel}
                </Text>

                {onOpenNotification ? (
                  <Text style={[styles.openLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.open}
                  </Text>
                ) : null}
              </View>
            );

            return onOpenNotification ? (
              <Pressable
                key={notification.id}
                accessibilityRole="button"
                accessibilityLabel={t.open + ': ' + notification.title}
                onPress={() => onOpenNotification(notification)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                {content}
              </Pressable>
            ) : (
              <View key={notification.id}>{content}</View>
            );
          })}
        </ScrollView>
      )}

      <Text style={[styles.footerNote, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.demo}
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
    gap: 4,
  },
  heading: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
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
    fontSize: 12,
    lineHeight: 18,
  },
  listContent: {
    gap: 11,
    paddingBottom: 4,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 15,
    borderWidth: 1,
    gap: 9,
    padding: 14,
  },
  unreadCard: {
    borderColor: '#9CB9D6',
    borderLeftWidth: 3,
  },
  cardHeader: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  readState: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '600',
  },
  notificationTitle: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },
  message: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 20,
  },
  relatedListing: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: '#667085',
    fontSize: 11,
  },
  openLabel: {
    color: '#123B5D',
    fontSize: 12,
    fontWeight: '800',
    paddingTop: 3,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 22,
  },
  emptyTitle: {
    color: '#123B5D',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerNote: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
  },
});
