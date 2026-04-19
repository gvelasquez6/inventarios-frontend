import { Inject, Injectable } from '@angular/core';
import { SESSION_STORE } from '../../application/ports/injection-tokens';
import { SessionStorePort } from '../../application/ports/session-store.port';

const ACCESS_TOKEN_KEY = 'inventario_access_token';

@Injectable({ providedIn: 'root' })
export class AuthTokenStore {
  constructor(@Inject(SESSION_STORE) private readonly store: SessionStorePort) {}

  getAccessToken(): string | null {
    return this.store.getSessionItem(ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string | null): void {
    if (token == null || token === '') {
      this.store.removeSessionItem(ACCESS_TOKEN_KEY);
      return;
    }
    this.store.setSessionItem(ACCESS_TOKEN_KEY, token);
  }
}
