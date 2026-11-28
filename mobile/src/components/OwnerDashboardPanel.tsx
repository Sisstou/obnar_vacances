import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { OwnerListingItem } from './OwnerListingsPanel';
import type { OwnerListingRequest } from './OwnerListingRequestsPanel';
import type { OwnerNotification } from './OwnerNotificationsPanel';

type Language = 'ar' | 'fr';

type Props = {
  listings: OwnerListingItem[];
  requests: OwnerListingRequest[];
  notifications: OwnerNotification[];
  language: Language;
  onOpenListings?: () => void;
  onOpenRequests?: () => void;
  onOpenNotifications?: () => void;
  onAddListing?: () => void;
  onOpenNotification?: (notification: OwnerNotification) => void;
  trustedStatusSource?: boolean;
  trustedNotificationSource?: boolean;
};

const copy = {
  ar: {
    heading: 'لوحة المالك',
    subtitle: 'ملخص إقاماتك وطلباتك وآخر الإشعارات',
    listings: 'إجمالي الإقامات',
    published: 'إقامات منشورة',
    requests: 'طلبات الإقامة',
    pending: 'قيد المراجعة',
    changes: 'تحتاج تعديلات',
    unread: 'إشعارات جديدة',
    quickActions: 'اختصارات',
    viewListings: 'عرض إقاماتي',
    viewRequests: 'متابعة الطلبات',
    viewNotifications: 'عرض الإشعارات',
    addListing: 'إضافة إقامة',
    recent: 'أحدث الإشعارات',
    noNotifications: 'لا توجد إشعارات لعرضها حالياً.',
    open: 'فتح',
    statusTrusted: 'حالات الإقامات والطلبات واردة من مصدر موثوق.',
    statusUntrusted: 'ملخص الحالات غير مؤكد قبل التحقق من مصدر البيانات.',
    notificationTrusted: 'مصدر الإشعارات موثوق.',
    notificationUntrusted: 'مصدر الإشعارات غير مؤكد.',
    staging: 'تنبيه: بيانات الاختبار ليست عروضاً أو حجوزات حقيقية، ولا تثبت أن أي إقامة منشورة أو متاحة للحجز.',
    demo: 'لوحة عرض فقط؛ الأرقام محسوبة من البيانات الممررة ولا يتم تعديلها أو حفظها هنا.',
  },
  fr: {
    heading: 'Tableau du propriétaire',
    subtitle: 'Résumé de vos logements, demandes et notifications récentes',
    listings: 'Total des logements',
    published: 'Logements publiés',
    requests: 'Demandes de logement',
    pending: 'En vérification',
    changes: 'Modifications requises',
    unread: 'Nouvelles notifications',
    quickActions: 'Raccourcis',
    viewListings: 'Voir mes logements',
    viewRequests: 'Suivre les demandes',
    viewNotifications: 'Voir les notifications',
    addListing: 'Ajouter un logement',
    recent: 'Notifications récentes',
    noNotifications: 'Aucune notification à afficher pour le moment.',
    open: 'Ouvrir',
    statusTrusted: 'Les statuts des logements et demandes proviennent d’une source fiable.',
    statusUntrusted: 'Le résumé des statuts n’est pas confirmé tant que la source n’est pas vérifiée.',
    notificationTrusted: 'La source des notifications est fiable.',
    notificationUntrusted: 'La source des notifications n’est pas confirmée.',
    staging: 'Attention : les données de test ne sont pas de vraies offres ou réservations et ne prouvent ni publication ni disponibilité.',
    demo: 'Tableau de consultation uniquement ; les chiffres sont calculés à partir des données reçues et ne sont ni modifiés ni enregistrés ici.',
  },
} as const;

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, accent ? { color: accent } : null]}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

/**
 * Read-only owner dashboard summary.
 * All records and status values are supplied by the parent component.
 * No API calls, persistence, mutations, or booking actions are performed.
 */
export default function OwnerDashboardPanel({
  listings,
  requests,
  notifications,
  language,
  onOpenListings,
  onOpenRequests,
  onOpenNotifications,
  onAddListing,
  onOpenNotification,
  trustedStatusSource = false,
  trustedNotificationSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const publishedCount = listings.filter((item) => item.status === 'published').length;
  const pendingCount =
    listings.filter((item) => item.status === 'under_review').length +
    requests.filter((item) => item.status === 'under_review').length;
  const changesCount =
    listings.filter((item) => item.status === 'needs_changes').length +
    requests.filter((item) => item.status === 'needs_changes').length;
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const recentNotifications = notifications.slice(0, 3);

  const action = (
    label: string,
    onPress?: () => void,
    secondary = false,
  ) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary ? styles.secondaryAction : styles.primaryAction,
        !onPress && styles.disabledAction,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, secondary && styles.secondaryActionText]}>
        {label}
      </Text>
    </Pressable>
  );

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
          {trustedStatusSource ? t.statusTrusted : t.statusUntrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedNotificationSource ? t.notificationTrusted : t.notificationUntrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <Metric label={t.listings} value={listings.length} />
        <Metric label={t.published} value={trustedStatusSource ? publishedCount : 0} accent="#176B42" />
        <Metric label={t.requests} value={requests.length} />
        <Metric label={t.pending} value={trustedStatusSource ? pendingCount : 0} accent="#805B00" />
        <Metric label={t.changes} value={trustedStatusSource ? changesCount : 0} accent="#A12B2B" />
        <Metric label={t.unread} value={trustedNotificationSource ? unreadCount : 0} accent="#245B91" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.quickActions}
        </Text>
        <View style={styles.actions}>
          {action(t.viewListings, onOpenListings)}
          {action(t.viewRequests, onOpenRequests, true)}
          {action(t.viewNotifications, onOpenNotifications, true)}
          {action(t.addListing, onAddListing, true)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.recent}
        </Text>
        {recentNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.noNotifications}</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentNotifications.map((notification) => (
              <Pressable
                key={notification.id}
                accessibilityRole={onOpenNotification ? 'button' : undefined}
                disabled={!onOpenNotification}
                onPress={() => onOpenNotification?.(notification)}
                style={({ pressed }) => [styles.recentItem, pressed && styles.pressed]}
              >
                <View style={styles.recentCopy}>
                  <Text numberOfLines={2} style={[styles.recentTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.recentDate, { textAlign: rtl ? 'right' : 'left' }]}>
                    {notification.createdAtLabel}
                  </Text>
                </View>
                {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                {onOpenNotification ? <Text style={styles.openText}>{t.open}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.demo}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  container: {
    gap: 16,
    paddingBottom: 18,
    width: '100%',
  },
  header: {
    gap: 5,
  },
  heading: {
    color: '#123B5D',
    fontSize: 23,
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
    borderRadius: 13,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  noticeText: {
    color: '#475467',
    fontSize: 11,
    lineHeight: 17,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    gap: 5,
    minWidth: 96,
    paddingHorizontal: 11,
    paddingVertical: 13,
  },
  metricValue: {
    color: '#123B5D',
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#123B5D',
    fontSize: 16,
    fontWeight: '800',
  },
  actions: {
    gap: 8,
  },
  action: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  primaryAction: {
    backgroundColor: '#123B5D',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderWidth: 1,
  },
  disabledAction: {
    opacity: 0.55,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionText: {
    color: '#123B5D',
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  recentCopy: {
    flex: 1,
    gap: 4,
  },
  recentTitle: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  recentDate: {
    color: '#667085',
    fontSize: 11,
  },
  unreadDot: {
    backgroundColor: '#245B91',
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  openText: {
    color: '#123B5D',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  emptyText: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
  },
});
