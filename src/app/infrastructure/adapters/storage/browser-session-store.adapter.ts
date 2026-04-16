import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SessionStorePort } from '../../../application/ports/session-store.port';

@Injectable()
export class BrowserSessionStoreAdapter implements SessionStorePort {
  private readonly platformId = inject(PLATFORM_ID);

  getLocalItem(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setLocalItem(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // noop: mantener comportamiento tolerante a errores de storage
    }
  }

  removeLocalItem(key: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // noop
    }
  }

  getSessionItem(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setSessionItem(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // noop
    }
  }

  removeSessionItem(key: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      // noop
    }
  }
}
