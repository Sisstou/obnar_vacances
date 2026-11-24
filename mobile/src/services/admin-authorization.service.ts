import { supabase, supabaseConfigured } from '../lib/supabase';
import type { AdminGateState } from '../types/admin-gate';

type AuthErrorLike = {
  name?: string;
  status?: number;
  code?: string;
};

function isExpiredAuthError(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.status === 401) return true;

  return [
    'invalid_grant',
    'bad_jwt',
    'jwt_expired',
    'token_expired',
    'refresh_token_not_found',
    'refresh_token_already_used',
  ].includes(error.code ?? '');
}

function isMissingSessionError(error: AuthErrorLike | null | undefined): boolean {
  return error?.name === 'AuthSessionMissingError' ||
    error?.code === 'session_not_found';
}

function authFailureState(error: AuthErrorLike): AdminGateState {
  if (isMissingSessionError(error)) return { status: 'unauthenticated' };
  if (isExpiredAuthError(error)) return { status: 'session_expired' };
  return { status: 'unavailable', retryable: true };
}

/**
 * Verifies the session with Supabase Auth before checking the main-admin
 * record through the authenticated RPC. No local role or UI boolean is trusted.
 *
 * The session identity is checked again after the RPC to avoid authorizing a
 * result that raced with a sign-out or account switch.
 */
export async function verifyAdminAuthorization(): Promise<AdminGateState> {
  if (!supabaseConfigured) {
    return { status: 'unavailable', retryable: false };
  }

  try {
    const { data: initialSessionData, error: initialSessionError } =
      await supabase.auth.getSession();

    if (initialSessionError) return authFailureState(initialSessionError);
    if (!initialSessionData.session) return { status: 'unauthenticated' };

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) return authFailureState(userError);

    const userId = userData.user?.id;
    if (!userId) return { status: 'unauthenticated' };

    const { data: isMainAdmin, error: authorizationError } =
      await supabase.rpc('is_main_admin');

    if (authorizationError) return authFailureState(authorizationError);

    const { data: currentSessionData, error: currentSessionError } =
      await supabase.auth.getSession();

    if (currentSessionError) return authFailureState(currentSessionError);
    if (!currentSessionData.session) return { status: 'unauthenticated' };

    if (currentSessionData.session.user.id !== userId) {
      return { status: 'unauthenticated' };
    }

    if (isMainAdmin === true) {
      return { status: 'authorized', userId, checkedAt: Date.now() };
    }

    if (isMainAdmin === false) return { status: 'forbidden' };

    // Null, undefined, or any non-boolean response is never authorization.
    return { status: 'unavailable', retryable: false };
  } catch {
    // Network failures and unexpected runtime errors fail closed.
    return { status: 'unavailable', retryable: true };
  }
}
