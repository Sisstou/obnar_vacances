import React, { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { verifyAdminAuthorization } from '../services/admin-authorization.service';
import type { AdminGateState } from '../types/admin-gate';
import { supabase, supabaseConfigured } from '../lib/supabase';

export type AdminGateProps = {
  readonly children: ReactNode;
  readonly language?: 'ar' | 'fr';
  /** Recheck while the admin area is open. Defaults to 60 seconds. */
  readonly refreshIntervalMs?: number;
  /** Optional non-sensitive status UI; protected children are never passed to it. */
  readonly fallback?: ReactNode;
};

/** Pure fail-closed selector, also used by the gate's rendering path. */
export function getAdminGateContent(
  state: AdminGateState,
  children: ReactNode,
  fallback: ReactNode = null,
): ReactNode {
  return state.status === 'authorized' ? children : fallback;
}

const labels = {
  ar: {
    checking: 'جارٍ التحقق من صلاحيات المدير…',
    unauthenticated: 'يجب تسجيل الدخول للوصول إلى الإدارة.',
    forbidden: 'هذا الحساب غير مخوّل للوصول إلى لوحة الإدارة.',
    expired: 'انتهت جلسة الدخول. سجّل الدخول مجدداً.',
    unavailable: 'تعذر التحقق من صلاحيات الإدارة حالياً.',
    retry: 'إعادة التحقق',
  },
  fr: {
    checking: 'Vérification des autorisations administrateur…',
    unauthenticated: 'Connectez-vous pour accéder à l’administration.',
    forbidden: 'Ce compte n’est pas autorisé à accéder à l’administration.',
    expired: 'La session a expiré. Veuillez vous reconnecter.',
    unavailable: 'Impossible de vérifier les autorisations pour le moment.',
    retry: 'Réessayer',
  },
} as const;

/**
 * Closed-by-default gate. It verifies Auth identity and the server-side admin
 * predicate, reacts to auth/session changes, rechecks on foreground, and
 * periodically revalidates so a revoked admin does not keep a stale UI grant.
 *
 * This is a UI gate only. Every protected database operation must still
 * enforce authorization on the server.
 */
export default function AdminGate({
  children,
  language = 'ar',
  refreshIntervalMs = 60_000,
  fallback,
}: AdminGateProps) {
  const [state, setState] = useState<AdminGateState>({ status: 'checking' });
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let mounted = true;
    let requestNumber = 0;
    let authCheckTimer: ReturnType<typeof setTimeout> | null = null;

    const check = (showChecking: boolean) => {
      const currentRequest = ++requestNumber;
      if (showChecking && mounted) setState({ status: 'checking' });

      void verifyAdminAuthorization().then((nextState) => {
        if (mounted && currentRequest === requestNumber) setState(nextState);
      }).catch(() => {
        if (mounted && currentRequest === requestNumber) {
          setState({ status: 'unavailable', retryable: true });
        }
      });
    };

    check(true);

    const authSubscription = supabaseConfigured
      ? supabase.auth.onAuthStateChange((_event, session) => {
          // Invalidate every in-flight result immediately when Auth changes.
          // Do not call Supabase Auth methods inside this callback: its internal
          // lock is still held until the callback returns.
          requestNumber += 1;
          if (authCheckTimer) {
            clearTimeout(authCheckTimer);
            authCheckTimer = null;
          }

          if (!session) {
            if (mounted) setState({ status: 'unauthenticated' });
            return;
          }

          // Hide protected content immediately, then verify after the callback
          // releases Supabase's internal Auth lock.
          if (mounted) setState({ status: 'checking' });
          authCheckTimer = setTimeout(() => {
            authCheckTimer = null;
            check(true);
          }, 0);
        }).data.subscription
      : null;

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') check(true);
    });

    const safeInterval = Number.isFinite(refreshIntervalMs) && refreshIntervalMs >= 1_000
      ? refreshIntervalMs
      : 60_000;
    const interval = setInterval(() => check(true), safeInterval);

    return () => {
      mounted = false;
      requestNumber += 1;
      authSubscription?.unsubscribe();
      if (authCheckTimer) clearTimeout(authCheckTimer);
      appStateSubscription.remove();
      clearInterval(interval);
    };
  }, [refreshIntervalMs, retryNonce]);

  const retryCheck = () => {
    setState({ status: 'checking' });
    setRetryNonce((value) => value + 1);
  };

  if (state.status === 'authorized') {
    return getAdminGateContent(state, children);
  }

  if (fallback !== undefined) return fallback;

  const text = labels[language];
  const message = state.status === 'checking'
    ? text.checking
    : state.status === 'unauthenticated'
      ? text.unauthenticated
      : state.status === 'forbidden'
        ? text.forbidden
        : state.status === 'session_expired'
          ? text.expired
          : text.unavailable;

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {state.status === 'checking' ? <ActivityIndicator /> : null}
      <Text style={styles.message}>{message}</Text>
      {state.status === 'unavailable' && state.retryable ? (
        <Pressable
          accessibilityRole="button"
          onPress={retryCheck}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>{text.retry}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: '#344054',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    borderColor: '#12345A',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 16,
  },
  retryText: {
    color: '#12345A',
    fontSize: 14,
    fontWeight: '700',
  },
});
