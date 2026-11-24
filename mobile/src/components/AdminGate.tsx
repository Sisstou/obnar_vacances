import React, { type ReactNode } from 'react';

import type { AdminGateState } from '../types/admin-gate';

export type AdminGateProps = {
  readonly state: AdminGateState;
  readonly children: ReactNode;
  /** Optional non-sensitive status UI supplied by the caller. */
  readonly fallback?: ReactNode;
};

/**
 * Renders administrative content only for an explicitly authorized state.
 * This component does not perform authentication or data fetching; callers
 * must obtain state from verifyAdminAuthorization() and clear it immediately
 * on sign-out, account changes, or detected session expiry.
 */
export function AdminGate({
  state,
  children,
  fallback = null,
}: AdminGateProps): React.ReactElement | null {
  if (state.status !== 'authorized') {
    return fallback as React.ReactElement | null;
  }

  return children as React.ReactElement | null;
}

export default AdminGate;
