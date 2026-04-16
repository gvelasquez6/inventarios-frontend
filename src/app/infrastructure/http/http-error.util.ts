import { HttpErrorResponse } from '@angular/common/http';

/** Mensaje legible desde respuestas de error del API Spring (`{ "error": "..." }`). */
export function mensajeErrorHttp(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'error' in body) {
      const msg = (body as { error: unknown }).error;
      if (typeof msg === 'string' && msg.trim()) {
        return msg;
      }
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
