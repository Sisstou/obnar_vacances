import type {
  AuthChangeEvent,
  Session,
  User,
} from '@supabase/supabase-js';

import { supabase, supabaseConfigured } from '../lib/supabase';
import { toAppError } from '../lib/errors';
import { err, ok, type AppResult } from '../lib/result';

export interface EmailCredentials {
  email: string;
  password: string;
}

export interface AuthUserSession {
  user: User;
  session: Session;
}

function configurationError<T>(): AppResult<T> {
  return err({
    code: 'supabase_not_configured',
    message: 'إعدادات الاتصال بالخدمة غير مكتملة.',
    retryable: false,
  });
}

export async function signInWithEmail(
  credentials: EmailCredentials,
): Promise<AppResult<AuthUserSession>> {
  if (!supabaseConfigured) return configurationError();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  if (error) return err(toAppError(error, 'تعذر تسجيل الدخول.'));
  if (!data.user || !data.session) {
    return err({
      code: 'auth_session_missing',
      message: 'لم يتم إنشاء جلسة تسجيل دخول صالحة.',
      retryable: false,
    });
  }

  return ok({ user: data.user, session: data.session });
}

export async function signUpWithEmail(
  credentials: EmailCredentials,
): Promise<AppResult<{ user: User | null; session: Session | null }>> {
  if (!supabaseConfigured) return configurationError();

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
    options: {
      emailRedirectTo: 'dz.obnarvacances.app://auth/callback',
    },
  });

  if (error) return err(toAppError(error, 'تعذر إنشاء الحساب.'));
  return ok({ user: data.user, session: data.session });
}

export async function getCurrentSession(): Promise<
  AppResult<Session | null>
> {
  if (!supabaseConfigured) return configurationError();

  const { data, error } = await supabase.auth.getSession();
  if (error) return err(toAppError(error, 'تعذر استرجاع جلسة المستخدم.'));
  return ok(data.session);
}

export async function signOut(): Promise<AppResult<null>> {
  if (!supabaseConfigured) return configurationError();

  const { error } = await supabase.auth.signOut();
  if (error) return err(toAppError(error, 'تعذر تسجيل الخروج.'));
  return ok(null);
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): { unsubscribe: () => void } {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
