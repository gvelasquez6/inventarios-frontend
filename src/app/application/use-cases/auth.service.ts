import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE } from '../ports/injection-tokens';
import { AuthRepositoryPort } from '../ports/auth.repository.port';
import { SessionStorePort } from '../ports/session-store.port';
import { AuthTokenStore } from '../../core/auth/auth-token.store';
import type { LoginResultDto } from '../../domain';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, map, of, tap, throwError } from 'rxjs';

export type RolUsuario = 'Administrador' | 'Funcionario';

export interface UsuarioSesion {
  username: string;
  nombre: string;
  rol: RolUsuario;
  idEmpleado?: number;
  cargo?: string;
  area?: string;
  avatarUrl?: string;
}

const STORAGE_KEY = 'inventario_auth_session';

function mapRolApiASesion(rolApi: string): RolUsuario {
  const u = (rolApi ?? '').toUpperCase();
  if (u === 'ADMIN') {
    return 'Administrador';
  }
  return 'Funcionario';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<UsuarioSesion | null>(null);
  readonly session = this._session.asReadonly();

  constructor(
    @Inject(SESSION_STORE) private readonly store: SessionStorePort,
    @Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepositoryPort,
    private readonly tokenStore: AuthTokenStore,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    this.restaurarSesionDesdeStorage();
    if (isPlatformBrowser(this.platformId)) {
      if (!this.tokenStore.getAccessToken() && this._session() != null) {
        this.limpiarSesionYToken();
      } else if (this.tokenStore.getAccessToken()) {
        void firstValueFrom(
          this.authRepo.me().pipe(
            tap((r) => this.aplicarResultadoLogin(r, false)),
            catchError(() => {
              this.limpiarSesionYToken();
              return of(null);
            }),
          ),
        ).catch(() => {
          this.limpiarSesionYToken();
        });
      }
    }
  }

  isLoggedIn(): boolean {
    return this._session() !== null;
  }

  /**
   * Emite `true` si el login fue correcto, `false` si credenciales inválidas (401).
   * Cualquier otro error (red, 404, 5xx) se propaga para que la UI pueda mostrar un mensaje concreto.
   */
  login(username: string, password: string) {
    const u = username.trim();
    const p = password.trim();
    return this.authRepo.login({ username: u, password: p }).pipe(
      tap((r) => this.aplicarResultadoLogin(r, true)),
      map(() => true),
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return of(false);
        }
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    this.limpiarSesionYToken();
  }

  actualizarDatosSesionFuncionario(cargo: string, area?: string): void {
    const sesion = this._session();
    if (!sesion || sesion.rol !== 'Funcionario') {
      return;
    }
    const cargoNormalizado = cargo.trim();
    const areaNormalizada = area?.trim() || undefined;
    if (
      !cargoNormalizado ||
      (sesion.cargo === cargoNormalizado && sesion.area === areaNormalizada)
    ) {
      return;
    }
    const next: UsuarioSesion = { ...sesion, cargo: cargoNormalizado, area: areaNormalizada };
    this._session.set(next);
    this.persistirSesion(next);
  }

  updateAvatar(dataUrl: string | null): void {
    const s = this._session();
    if (!s) {
      return;
    }
    const next: UsuarioSesion = {
      ...s,
      avatarUrl: dataUrl ?? undefined,
    };
    this._session.set(next);
    this.persistirSesion(next);
    if (dataUrl) {
      this.store.setLocalItem(this.avatarStorageKey(s.username), dataUrl);
    } else {
      this.store.removeLocalItem(this.avatarStorageKey(s.username));
    }
  }

  changePassword(currentPassword: string, newPassword: string) {
    const trimmed = newPassword.trim();
    if (trimmed.length < 4) {
      return of({ ok: false as const, error: 'La nueva contraseña debe tener al menos 4 caracteres' });
    }
    if (trimmed === currentPassword.trim()) {
      return of({ ok: false as const, error: 'La nueva contraseña debe ser distinta a la actual' });
    }
    return this.authRepo
      .cambiarPassword({
        passwordActual: currentPassword.trim(),
        passwordNueva: trimmed,
      })
      .pipe(
        map(() => ({ ok: true as const })),
        catchError((e: unknown) => {
          const msg = e instanceof Error ? e.message : 'No se pudo cambiar la contraseña';
          return of({ ok: false as const, error: msg });
        }),
      );
  }

  private aplicarResultadoLogin(r: LoginResultDto, guardarToken: boolean): void {
    if (guardarToken) {
      this.tokenStore.setAccessToken(r.accessToken);
    }
    const idEmp = r.idEmpleado == null ? undefined : Number(r.idEmpleado);
    const sesion: UsuarioSesion = {
      username: r.username,
      nombre: r.nombre,
      rol: mapRolApiASesion(r.rol),
      idEmpleado: Number.isFinite(idEmp) ? idEmp : undefined,
      cargo: r.cargo ?? undefined,
      area: r.area ?? undefined,
      avatarUrl: this.leerAvatarGuardado(r.username),
    };
    this._session.set(sesion);
    this.persistirSesion(sesion);
  }

  private restaurarSesionDesdeStorage(): void {
    const raw = this.store.getSessionItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        username?: string;
        nombre?: string;
        rol?: RolUsuario;
        idEmpleado?: number;
        cargo?: string;
        area?: string;
      };
      if (!parsed?.nombre || !parsed?.rol || !parsed?.username) {
        return;
      }
      const username = parsed.username;
      this._session.set({
        username,
        nombre: parsed.nombre,
        rol: parsed.rol,
        idEmpleado: parsed.idEmpleado,
        cargo: parsed.cargo,
        area: parsed.area,
        avatarUrl: this.leerAvatarGuardado(username),
      });
    } catch {
      this.store.removeSessionItem(STORAGE_KEY);
    }
  }

  private limpiarSesionYToken(): void {
    this._session.set(null);
    this.store.removeSessionItem(STORAGE_KEY);
    this.tokenStore.setAccessToken(null);
  }

  private avatarStorageKey(username: string): string {
    return `inventario_avatar_${username}`;
  }

  private leerAvatarGuardado(username: string): string | undefined {
    const raw = this.store.getLocalItem(this.avatarStorageKey(username));
    return raw || undefined;
  }

  private persistirSesion(sesion: UsuarioSesion): void {
    const slim = {
      username: sesion.username,
      nombre: sesion.nombre,
      rol: sesion.rol,
      idEmpleado: sesion.idEmpleado,
      cargo: sesion.cargo,
      area: sesion.area,
    };
    this.store.setSessionItem(STORAGE_KEY, JSON.stringify(slim));
  }
}
