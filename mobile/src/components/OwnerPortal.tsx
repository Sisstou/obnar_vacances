import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import OwnerListingCreationFlow from './OwnerListingCreationFlow';
import OwnerDashboardPanel from './OwnerDashboardPanel';
import OwnerListingsPanel, { type OwnerListingItem } from './OwnerListingsPanel';
import OwnerListingRequestsPanel, { type OwnerListingRequest } from './OwnerListingRequestsPanel';
import OwnerBookingsPanel, { type OwnerBookingItem } from './OwnerBookingsPanel';
import OwnerNotificationsPanel, { type OwnerNotification } from './OwnerNotificationsPanel';

type Language = 'ar' | 'fr';
type OwnerView = 'dashboard' | 'listings' | 'requests' | 'bookings' | 'notifications';

const labels = {
  ar: {
    dashboard: 'الرئيسية',
    listings: 'إقاماتي',
    requests: 'طلبات الإقامات',
    bookings: 'الحجوزات',
    notifications: 'الإشعارات',
    create: 'إضافة إقامة',
    back: 'العودة إلى لوحة المالك',
    source: 'هذه الواجهة متصلة بالمكوّنات فقط. لا توجد حالياً بيانات مالك موثقة متصلة بها؛ لذلك تظهر القوائم فارغة.',
  },
  fr: {
    dashboard: 'Accueil',
    listings: 'Mes logements',
    requests: 'Demandes',
    bookings: 'Réservations',
    notifications: 'Notifications',
    create: 'Ajouter un logement',
    back: 'Retour au tableau',
    source: 'Les composants sont intégrés, mais aucune donnée propriétaire vérifiée n’est connectée. Les listes restent donc vides.',
  },
} as const;

/**
 * Owner UI composition only.
 * Empty collections are intentional until a verified owner-scoped data source
 * and server-side authorization are implemented. No Supabase calls or writes.
 */
export default function OwnerPortal({ language }: { language: Language }) {
  const [view, setView] = useState<OwnerView>('dashboard');
  const [creating, setCreating] = useState(false);
  const t = labels[language];

  const listings: OwnerListingItem[] = [];
  const requests: OwnerListingRequest[] = [];
  const bookings: OwnerBookingItem[] = [];
  const notifications: OwnerNotification[] = [];

  const navItems: { key: OwnerView; label: string }[] = [
    { key: 'dashboard', label: t.dashboard },
    { key: 'listings', label: t.listings },
    { key: 'requests', label: t.requests },
    { key: 'bookings', label: t.bookings },
    { key: 'notifications', label: t.notifications },
  ];

  return (
    <View style={styles.container}>
      {creating ? (
        <>
          <Pressable accessibilityRole="button" onPress={() => setCreating(false)} style={styles.backButton}>
            <Text style={styles.backText}>{t.back}</Text>
          </Pressable>
          <OwnerListingCreationFlow language={language} />
        </>
      ) : (
        <>
          <View style={styles.nav}>
            {navItems.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected: view === item.key }}
                onPress={() => setView(item.key)}
                style={[styles.navItem, view === item.key && styles.navItemActive]}
              >
                <Text style={[styles.navText, view === item.key && styles.navTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sourceNotice}>
            <Text style={styles.sourceText}>{t.source}</Text>
          </View>

          {view === 'dashboard' ? (
            <OwnerDashboardPanel
              listings={listings}
              requests={requests}
              notifications={notifications}
              language={language}
              onOpenListings={() => setView('listings')}
              onOpenRequests={() => setView('requests')}
              onOpenNotifications={() => setView('notifications')}
              onAddListing={() => setCreating(true)}
            />
          ) : null}

          {view === 'listings' ? (
            <OwnerListingsPanel
              listings={listings}
              language={language}
              onAddListing={() => setCreating(true)}
            />
          ) : null}

          {view === 'requests' ? (
            <OwnerListingRequestsPanel requests={requests} language={language} />
          ) : null}

          {view === 'bookings' ? (
            <OwnerBookingsPanel bookings={bookings} language={language} />
          ) : null}

          {view === 'notifications' ? (
            <OwnerNotificationsPanel notifications={notifications} language={language} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, width: '100%' },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navItem: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
  },
  navItemActive: { backgroundColor: '#12345A' },
  navText: { color: '#344054', fontSize: 12, fontWeight: '700' },
  navTextActive: { color: '#FFFFFF' },
  sourceNotice: {
    backgroundColor: '#F2F6FA',
    borderColor: '#DCE6EF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  sourceText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
  },
  backText: { color: '#12345A', fontSize: 13, fontWeight: '800' },
});
