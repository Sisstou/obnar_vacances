/**
 * Type-only contracts for the existing administrative presentation panels.
 *
 * These types describe the props accepted by the UI components. They do not
 * authenticate an administrator, authorize access, validate a data source,
 * or make a backend response trustworthy.
 *
 * The parent must obtain sanitized, production-approved data only after
 * server-side authorization. Never pass staging fixtures as production data.
 */

import type { ComponentProps } from 'react';

import type { AdminPanelId } from './components/AdminNavigationShell';

import type AdminUsersPanel from './components/AdminUsersPanel';
import type AdminOwnerVerificationPanel from './components/AdminOwnerVerificationPanel';
import type AdminListingReviewPanel from './components/AdminListingReviewPanel';
import type AdminLocationsPanel from './components/AdminLocationsPanel';
import type AdminLocalDirectoryPanel from './components/AdminLocalDirectoryPanel';
import type AdminLocalDirectoryRequestsPanel from './components/AdminLocalDirectoryRequestsPanel';
import type AdminComplaintsPanel from './components/AdminComplaintsPanel';
import type AdminReviewsPanel from './components/AdminReviewsPanel';
import type AdminNotificationsPanel from './components/AdminNotificationsPanel';
import type AdminFinancialOverviewPanel from './components/AdminFinancialOverviewPanel';
import type AdminActivityLogPanel from './components/AdminActivityLogPanel';
import type AdminUserActivityLogPanel from './components/AdminUserActivityLogPanel';
import type AdminBackupHistoryPanel from './components/AdminBackupHistoryPanel';
import type AdminReleaseHistoryPanel from './components/AdminReleaseHistoryPanel';
import type AdminDataRequestsPanel from './components/AdminDataRequestsPanel';
import type AdminPrivacyRequestsPanel from './components/AdminPrivacyRequestsPanel';
import type AdminPrivacyRetentionPanel from './components/AdminPrivacyRetentionPanel';
import type AdminConsentHistoryPanel from './components/AdminConsentHistoryPanel';
import type AdminLegalChangesPanel from './components/AdminLegalChangesPanel';
import type AdminPublicInfoPanel from './components/AdminPublicInfoPanel';
import type AdminPlatformSettingsPanel from './components/AdminPlatformSettingsPanel';
import type AdminSecurityOverviewPanel from './components/AdminSecurityOverviewPanel';
import type AdminSystemHealthPanel from './components/AdminSystemHealthPanel';
import type AdminErrorLogPanel from './components/AdminErrorLogPanel';
import type AdminUserSessionsPanel from './components/AdminUserSessionsPanel';

import type AdminLocalDirectoryRequestDetails from './components/AdminLocalDirectoryRequestDetails';
import type AdminNotificationDetails from './components/AdminNotificationDetails';

/**
 * 'bookings' is intentionally excluded: AdminNavigationShell currently
 * declares it as a navigation placeholder with no connected component.
 */
export type ImplementedAdminPanelId = Exclude<AdminPanelId, 'bookings'>;

/**
 * Exact component prop contracts, inferred from the existing component
 * declarations. This avoids maintaining a second, potentially divergent
 * copy of each panel's row and callback types.
 */
export interface AdminPanelPropsMap {
  users: ComponentProps<typeof AdminUsersPanel>;
  'owner-verification': ComponentProps<typeof AdminOwnerVerificationPanel>;
  'listing-review': ComponentProps<typeof AdminListingReviewPanel>;
  locations: ComponentProps<typeof AdminLocationsPanel>;
  'local-directory': ComponentProps<typeof AdminLocalDirectoryPanel>;
  'local-directory-requests': ComponentProps<typeof AdminLocalDirectoryRequestsPanel>;
  complaints: ComponentProps<typeof AdminComplaintsPanel>;
  reviews: ComponentProps<typeof AdminReviewsPanel>;
  notifications: ComponentProps<typeof AdminNotificationsPanel>;
  'financial-overview': ComponentProps<typeof AdminFinancialOverviewPanel>;
  'activity-log': ComponentProps<typeof AdminActivityLogPanel>;
  'user-activity-log': ComponentProps<typeof AdminUserActivityLogPanel>;
  'backup-history': ComponentProps<typeof AdminBackupHistoryPanel>;
  'release-history': ComponentProps<typeof AdminReleaseHistoryPanel>;
  'data-requests': ComponentProps<typeof AdminDataRequestsPanel>;
  'privacy-requests': ComponentProps<typeof AdminPrivacyRequestsPanel>;
  'privacy-retention': ComponentProps<typeof AdminPrivacyRetentionPanel>;
  'consent-history': ComponentProps<typeof AdminConsentHistoryPanel>;
  'legal-changes': ComponentProps<typeof AdminLegalChangesPanel>;
  'public-info': ComponentProps<typeof AdminPublicInfoPanel>;
  'platform-settings': ComponentProps<typeof AdminPlatformSettingsPanel>;
  'security-overview': ComponentProps<typeof AdminSecurityOverviewPanel>;
  'system-health': ComponentProps<typeof AdminSystemHealthPanel>;
  'error-log': ComponentProps<typeof AdminErrorLogPanel>;
  'user-sessions': ComponentProps<typeof AdminUserSessionsPanel>;
}

export type AdminPanelProps<K extends ImplementedAdminPanelId> =
  AdminPanelPropsMap[K];

/** Compile-time guard: every implemented navigation panel must have a contract. */
type MissingPanelContracts = Exclude<
  ImplementedAdminPanelId,
  keyof AdminPanelPropsMap
>;
type AssertNever<T extends never> = T;
export type AdminPanelContractCoverage = AssertNever<MissingPanelContracts>;

/** Detail screens are nested flows, not top-level AdminPanelId values. */
export interface AdminPanelDetailPropsMap {
  'local-directory-request': ComponentProps<
    typeof AdminLocalDirectoryRequestDetails
  >;
  notification: ComponentProps<typeof AdminNotificationDetails>;
}

export type AdminPanelDetailProps<
  K extends keyof AdminPanelDetailPropsMap,
> = AdminPanelDetailPropsMap[K];

/**
 * Important integration boundaries:
 * - trustedAdminSource is a presentation guard, not an authorization token.
 * - callbacks such as onOpenUser/onOpenRequest/onOpenNotification are
 *   navigation callbacks; they do not authorize or perform mutations.
 * - keep secrets, private contact data, identity documents, auth/session
 *   tokens, payment credentials, and raw internal traces out of panel props.
 * - do not use this contract to adapt staging fixtures into production data.
 * - no booking props are defined until a real booking admin screen and its
 *   separately reviewed data contract exist.
 */
