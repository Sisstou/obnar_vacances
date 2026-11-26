import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AdminListingReviewPanel from './AdminListingReviewPanel';
import AdminPlatformSettingsPanel from './AdminPlatformSettingsPanel';
import type { AdminLanguage, AdminPanelId } from './AdminNavigationShell';

type Props = {
  panelId: AdminPanelId;
  language: AdminLanguage;
};

/**
 * Safe presentation router for the admin workspace.
 *
 * This router deliberately supplies no records and marks sensitive panels as
 * untrusted. It does not fetch data, authorize users, or expose admin actions.
 * Panels without a reviewed read-only integration remain explicit placeholders.
 */
export default function AdminPanelSafeRouter({ panelId, language }: Props) {
  if (panelId === 'listing-review') {
    return (
      <AdminListingReviewPanel
        requests={[]}
        language={language}
        trustedAdminSource={false}
      />
    );
  }

  if (panelId === 'platform-settings') {
    return (
      <AdminPlatformSettingsPanel
        settings={[]}
        language={language}
        trustedAdminSource={false}
      />
    );
  }

  const message = language === 'ar'
    ? 'هذه الواجهة لم تُربط بعد بمصدر إداري موثوق. لن تظهر بيانات أو تتاح عمليات إدارية هنا.'
    : 'Cet écran n’est pas encore relié à une source administrative fiable. Aucune donnée ni action administrative ne sera affichée ici.';

  return (
    <View style={[styles.container, { direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
      <Text style={[styles.message, { textAlign: language === 'ar' ? 'right' : 'left' }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 88,
    padding: 16,
  },
  message: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 20,
  },
});
