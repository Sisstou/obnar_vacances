export interface AppError {
  code: string;
  message: string;
  retryable: boolean;
}

export type AppResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export function ok<T>(data: T): AppResult<T> {
  return { ok: true, data };
}

export function err<T = never>(error: AppError): AppResult<T> {
  return { ok: false, error };
}
