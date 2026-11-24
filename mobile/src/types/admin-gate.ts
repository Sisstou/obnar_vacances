/**
 * Closed-by-default states for the mobile administrative access gate.
 * These states describe UI authorization checks; backend operations must
 * continue enforcing authorization independently.
 */
export type AdminGateState =
  | { readonly status: 'checking' }
  | {
      readonly status: 'authorized';
      readonly userId: string;
      readonly checkedAt: number;
    }
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'forbidden' }
  | { readonly status: 'session_expired' }
  | {
      readonly status: 'unavailable';
      readonly retryable: boolean;
    };

export function isAdminGateAuthorized(
  state: AdminGateState,
): state is Extract<AdminGateState, { status: 'authorized' }> {
  return state.status === 'authorized';
}
