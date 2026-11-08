import { HttpErrorResponse } from '@angular/common/http';

/** Only render server messages, never the request or its sensitive payload. */
export function recoveryError(error: HttpErrorResponse): string {
  if (error.status === 0) return 'No se pudo conectar. Revisa tu conexión e intenta nuevamente.';
  if (error.status === 429) return 'Demasiadas solicitudes. Espera unos minutos antes de intentar nuevamente.';
  if (error.status >= 500) return 'El servicio no está disponible. Intenta nuevamente en unos minutos.';
  const body = error.error;
  const fields = body?.data;
  const messages = fields && typeof fields === 'object'
    ? Object.values(fields).reduce<string[]>((all, value) =>
        all.concat(Array.isArray(value) ? value.filter(item => typeof item === 'string') : []), [])
    : [];
  return messages.length ? messages.join(' ') :
    (typeof body?.message === 'string' ? body.message : 'No se pudo completar la solicitud. Intenta nuevamente.');
}
