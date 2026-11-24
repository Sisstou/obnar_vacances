/**
 * Typed render adapter for the existing top-level admin panels.
 *
 * This is a presentation-only registry. It does not authorize access, fetch
 * records, validate data provenance, or perform administrative actions.
 * Callers must gate the entire admin workspace with server-side authorization
 * and provide only sanitized, production-approved props.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type {
  AdminPanelDataState,
  AdminPanelDataStateMap,
} from '../adminPanelDataProvider';
import type {
  AdminPanelProps,
  ImplementedAdminPanelId,
} from '../adminPanelContracts';
import type { AdminLanguage, AdminPanelId } from './AdminNavigationShell';

import AdminUsersPanel from './AdminUsersPanel';
import AdminOwnerVerificationPanel from './AdminOwnerVerificationPanel';
import AdminListingReviewPanel from './AdminListingReviewPanel';
import AdminLocationsPanel from './AdminLocationsPanel';
import AdminLocalDirectoryPanel from './AdminLocalDirectoryPanel';
import AdminLocalDirectoryRequestsPanel from './AdminLocalDirectoryRequestsPanel';
import AdminComplaintsPanel from './AdminComplaintsPanel';
import AdminReviewsPanel from './AdminReviewsPanel';
import AdminNotificationsPanel from './AdminNotificationsPanel';
import AdminFinancialOverviewPanel from './AdminFinancialOverviewPanel';
import AdminActivityLogPanel from './AdminActivityLogPanel';
import AdminUserActivityLogPanel from './AdminUserActivityLogPanel';
import AdminBackupHistoryPanel from './AdminBackupHistoryPanel';
import AdminReleaseHistoryPanel from './AdminReleaseHistoryPanel';
import AdminDataRequestsPanel from './AdminDataRequestsPanel';
import AdminPrivacyRequestsPanel from './AdminPrivacyRequestsPanel';
import AdminPrivacyRetentionPanel from './AdminPrivacyRetentionPanel';
import AdminConsentHistoryPanel from './AdminConsentHistoryPanel';
import AdminLegalChangesPanel from './AdminLegalChangesPanel';
import AdminPublicInfoPanel from './AdminPublicInfoPanel';
import AdminPlatformSettingsPanel from './AdminPlatformSettingsPanel';
import AdminSecurityOverviewPanel from './AdminSecurityOverviewPanel';
import AdminSystemHealthPanel from './AdminSystemHealthPanel';
import AdminErrorLogPanel from './AdminErrorLogPanel';
import AdminUserSessionsPanel from './AdminUserSessionsPanel';

/**
 * A keyed registry preserves the relationship between a panel id and that
 * component's exact props contract.
 */
type AdminPanelComponentMap = {
  readonly [K in ImplementedAdminPanelId]: React.ComponentType<AdminPanelProps<K>>;
};

const panelComponents: AdminPanelComponentMap = {
  users: AdminUsersPanel,
  'owner-verification': AdminOwnerVerificationPanel,
  'listing-review': AdminListingReviewPanel,
  locations: AdminLocationsPanel,
  'local-directory': AdminLocalDirectoryPanel,
  'local-directory-requests': AdminLocalDirectoryRequestsPanel,
  complaints: AdminComplaintsPanel,
  reviews: AdminReviewsPanel,
  notifications: AdminNotificationsPanel,
  'financial-overview': AdminFinancialOverviewPanel,
  'activity-log': AdminActivityLogPanel,
  'user-activity-log': AdminUserActivityLogPanel,
  'backup-history': AdminBackupHistoryPanel,
  'release-history': AdminReleaseHistoryPanel,
  'data-requests': AdminDataRequestsPanel,
  'privacy-requests': AdminPrivacyRequestsPanel,
  'privacy-retention': AdminPrivacyRetentionPanel,
  'consent-history': AdminConsentHistoryPanel,
  'legal-changes': AdminLegalChangesPanel,
  'public-info': AdminPublicInfoPanel,
  'platform-settings': AdminPlatformSettingsPanel,
  'security-overview': AdminSecurityOverviewPanel,
  'system-health': AdminSystemHealthPanel,
  'error-log': AdminErrorLogPanel,
  'user-sessions': AdminUserSessionsPanel,
};

const messages = {
  ar: {
    loading: 'جارٍ تحميل بيانات لوحة الإدارة…',
    idle: 'لا تتوفر بيانات لهذه اللوحة حالياً.',
    bookings: 'لوحة الحجوزات غير منفذة بعد. لن يتم عرض حجوزات الاختبار أو اعتبارها بيانات إنتاجية.',
  },
  fr: {
    loading: 'Chargement des données du panneau…',
    idle: 'Aucune donnée disponible pour ce panneau.',
    bookings: 'Le panneau des réservations n’est pas encore implémenté. Les réservations de test ne seront pas affichées comme des données de production.',
  },
} as const;

function StatusView({
  language,
  status,
  message,
}: {
  language: AdminLanguage;
  status: 'idle' | 'loading' | 'error' | 'bookings';
  message?: string;
}) {
  const rtl = language === 'ar';
  const text = status === 'loading'
    ? messages[language].loading
    : status === 'bookings'
      ? messages[language].bookings
      : status === 'error'
        ? message ?? messages[language].idle
        : messages[language].idle;

  return (
    <View
      accessibilityLiveRegion={status === 'loading' ? 'polite' : 'none'}
      style={[styles.status, { direction: rtl ? 'rtl' : 'ltr' }]}
    >
      {status === 'loading' ? <ActivityIndicator /> : null}
      <Text style={[styles.statusText, { textAlign: rtl ? 'right' : 'left' }]}>
        {text}
      </Text>
    </View>
  );
}

/**
 * Render the selected panel using the exact props associated with its id.
 *
 * For a successful state, props must already contain the panel's language
 * and any required trusted-source presentation flag. This adapter deliberately
 * does not set trustedAdminSource or infer it from the state.
 */
export function renderAdminPanel<K extends ImplementedAdminPanelId>(
  panelId: K,
  state: AdminPanelDataState<K> | undefined,
  language: AdminLanguage,
): React.ReactNode {
  if (!state || state.status === 'idle') {
    return <StatusView language={language} status="idle" />;
  }

  if (state.status === 'loading') {
    return <StatusView language={language} status="loading" />;
  }

  if (state.status === 'error') {
    return <StatusView language={language} status="error" message={state.message} />;
  }

  const Panel = panelComponents[panelId] as React.ComponentType<AdminPanelProps<K>>;
  return React.createElement(Panel, state.props);
}

/**
 * Adapter matching AdminWorkspace's (panelId, language) callback signature.
 * The map may omit a panel; omitted entries render the safe idle state.
 * The bookings placeholder is handled explicitly and has no data contract.
 */
export function createAdminPanelRenderer(
  states: AdminPanelDataStateMap,
): (panelId: AdminPanelId, language: AdminLanguage) => React.ReactNode {
  return (panelId, language) => {
    if (panelId === 'bookings') {
      return <StatusView language={language} status="bookings" />;
    }

    return renderAdminPanel(
      panelId,
      states[panelId] as AdminPanelDataState<typeof panelId> | undefined,
      language,
    );
  };
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 88,
    padding: 16,
  },
  statusText: {
    color: '#475467',
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
