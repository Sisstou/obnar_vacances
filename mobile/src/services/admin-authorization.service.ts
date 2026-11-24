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

  return (
    error.name === 'AuthSessionMissingError' ||
    error.code === 'session_not_found' ||
    error.code === 'refresh_token_not_found' ||
    error.code === 'refresh_token_already_used'
  );
}

/**
 * Verifies the current identity with Supabase Auth, then asks the database
 * function is_main_admin() to authorize that authenticated identity.
 *
 * No locally stored role, user metadata, or UI boolean is trusted here.
 * Any unexpected response or infrastructure failure denies access.
 */
export async function verifyAdminAuthorization(): Promise<AdminGateState> {
  if (!supabaseConfigured) {
    return { status: 'unavailable', retryable: false };
  }

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      return isExpiredAuthError(sessionError)
        ? { status: 'session_expired' }
        : { status: 'unavailable', retryable: true };
    }

    if (!sessionData.session) {
      return { status: 'unauthenticated' };
    }

    // getUser() validates the access token with the Auth server. A persisted
    // session alone is not treated as proof of the current identity.
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) {
      return isExpiredAuthError(userError)
        ? { status: 'session_expired' }
        : { status: 'unavailable', retryable: true };
    }

    const userId = userData.user?.id;
    if (!userId) {
      return { status: 'unauthenticated' };
    }

    const { data: isMainAdmin, error: authorizationError } =
      await supabase.rpc('is_main_admin');

    if (authorizationError) {
      return isExpiredAuthError(authorizationError)
        ? { status: 'session_expired' }
        : { status: 'unavailable', retryable: true };
    }

    if (isMainAdmin === true) {
      return {
        status: 'authorized',
        userId,
        checkedAt: Date.now(),
      };
    }

    if (isMainAdmin === false) {
      return { status: 'forbidden' };
    }

    // Null, undefined, or any non-boolean response is not authorization.
    return { status: 'unavailable', retryable: false };
  } catch {
    // Network failures and unexpected runtime errors fail closed.
    return { status: 'unavailable', retryable: true };
  }
}
