import { Inject, Injectable, signal } from '@angular/core';
import { SESSION_STORE } from '../ports/injection-tokens';
import { SessionStorePort } from '../ports/session-store.port';

export type RolUsuario = 'Administrador' | 'Funcionario';

export interface UsuarioSesion {
  /** Identificador de cuenta (necesario para cambiar contraseña en demo). */
  username: string;
  nombre: string;
  rol: RolUsuario;
  /** Para funcionarios, enlaza con su registro de empleado. */
  idEmpleado?: number;
  /** Para funcionarios, refleja el cargo configurado por el administrador. */
  cargo?: string;
  /** Para funcionarios, refleja el área configurada por el administrador. */
  area?: string;
  /** Data URL de la imagen de perfil (solo cliente). */
  avatarUrl?: string;
}

interface UsuarioAuth {
  username: string;
  password: string;
  nombre: string;
  rol: RolUsuario;
  idEmpleado?: number;
  cargo?: string;
  area?: string;
}

/** Credenciales demo (sin backend). Misma idea que el repositorio en memoria. */
const USUARIOS_DEMO: ReadonlyArray<UsuarioAuth> = [
  { username: 'admin', password: 'admin', nombre: 'Administrador', rol: 'Administrador' },
];

const STORAGE_KEY = 'inventario_auth_session';
const PASSWORDS_KEY = 'inventario_auth_passwords';
const USERS_KEY = 'inventario_auth_users';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<UsuarioSesion | null>(null);

  /** Solo lectura para plantillas (signal). */
  readonly session = this._session.asReadonly();

  constructor(@Inject(SESSION_STORE) private readonly store: SessionStorePort) {
    this.restaurarSesion();
  }

  isLoggedIn(): boolean {
    return this._session() !== null;
  }

  login(username: string, password: string): boolean {
    const user = this.getAllUsers().find(x => x.username === username.trim());
    if (!user) {
      return false;
    }
    const expected = this.getPasswordForUser(user.username);
    if (password !== expected) {
      return false;
    }
    const sesion: UsuarioSesion = {
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      idEmpleado: user.idEmpleado,
      cargo: user.cargo,
      area: user.area,
      avatarUrl: this.leerAvatarGuardado(user.username),
    };
    this._session.set(sesion);
    this.persistirSesion(sesion);
    return true;
  }

  logout(): void {
    this._session.set(null);
    this.store.removeSessionItem(STORAGE_KEY);
  }

  /**
   * Actualiza cargo/área de la sesión actual y de la cuenta demo persistida del funcionario.
   */
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
    const existentes = this.readStoredUsers();
    const idx = existentes.findIndex((u) => u.username === sesion.username);
    if (idx >= 0) {
      existentes[idx] = { ...existentes[idx], cargo: cargoNormalizado, area: areaNormalizada };
      this.writeStoredUsers(existentes);
    }
  }

  /** Sustituye o quita la foto de perfil (data URL o null). */
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

  /**
   * Crea (si no existe) una cuenta de rol Funcionario para el empleado indicado.
   * Devuelve credenciales para comunicación al administrador.
   */
  ensureFuncionarioAccount(
    empleado: { idEmpleado?: number; nombre?: string; cargo?: string; area?: string },
  ): { username: string; password: string; creado: boolean } | null {
    const idEmpleado = empleado.idEmpleado == null ? NaN : Number(empleado.idEmpleado);
    if (!Number.isFinite(idEmpleado) || idEmpleado <= 0) {
      return null;
    }
    const existentes = this.readStoredUsers();
    const yaExiste = existentes.find(
      u => u.rol === 'Funcionario' && Number(u.idEmpleado) === idEmpleado,
    );
    if (yaExiste) {
      const cargoNormalizado = empleado.cargo?.trim();
      const areaNormalizada = empleado.area?.trim();
      if (
        (cargoNormalizado && cargoNormalizado !== yaExiste.cargo) ||
        (areaNormalizada && areaNormalizada !== yaExiste.area)
      ) {
        yaExiste.cargo = cargoNormalizado;
        yaExiste.area = areaNormalizada;
        this.writeStoredUsers(existentes);
      }
      return {
        username: yaExiste.username,
        password: this.getPasswordForUser(yaExiste.username),
        creado: false,
      };
    }
    const usernameBase = this.buildUsernameBase(empleado.nombre ?? `funcionario${idEmpleado}`);
    const username = this.ensureUniqueUsername(usernameBase, [...USUARIOS_DEMO, ...existentes]);
    const password = `Func-${String(idEmpleado).padStart(4, '0')}`;
    const nuevo: UsuarioAuth = {
      username,
      password,
      nombre: empleado.nombre?.trim() || `Funcionario ${idEmpleado}`,
      rol: 'Funcionario',
      idEmpleado,
      cargo: empleado.cargo?.trim() || undefined,
      area: empleado.area?.trim() || undefined,
    };
    existentes.push(nuevo);
    this.writeStoredUsers(existentes);
    // La contraseña inicial también en PASSWORDS_KEY: así sigue siendo válida aunque el JSON
    // de usuarios se regenere o pierda el campo `password` (p. ej. otra pestaña o migración).
    this.setPasswordOverrideForUsername(nuevo.username, nuevo.password);
    return { username: nuevo.username, password: nuevo.password, creado: true };
  }

  /** Cambia la contraseña del usuario actual (demo: se guarda en localStorage). */
  changePassword(
    currentPassword: string,
    newPassword: string
  ): { ok: boolean; error?: string } {
    const s = this._session();
    if (!s) {
      return { ok: false, error: 'No hay sesión activa' };
    }
    const expected = this.getPasswordForUser(s.username);
    if (currentPassword !== expected) {
      return { ok: false, error: 'La contraseña actual no es correcta' };
    }
    const trimmed = newPassword.trim();
    if (trimmed.length < 4) {
      return { ok: false, error: 'La nueva contraseña debe tener al menos 4 caracteres' };
    }
    if (trimmed === currentPassword) {
      return { ok: false, error: 'La nueva contraseña debe ser distinta a la actual' };
    }
    const overrides = this.readPasswordOverrides();
    overrides[s.username] = trimmed;
    this.writePasswordOverrides(overrides);
    return { ok: true };
  }

  private getPasswordForUser(username: string): string {
    const overrides = this.readPasswordOverrides();
    if (overrides[username] != null && overrides[username] !== '') {
      return overrides[username];
    }
    const user = this.getAllUsers().find((u) => u.username === username);
    const stored = user?.password?.trim();
    if (stored) {
      return stored;
    }
    // Respaldo: contraseña por defecto demo por id de empleado (sigue válida hasta cambio en perfil).
    if (user?.rol === 'Funcionario' && user.idEmpleado != null && Number.isFinite(Number(user.idEmpleado))) {
      return `Func-${String(Number(user.idEmpleado)).padStart(4, '0')}`;
    }
    return '';
  }

  /** Guarda la contraseña actual de una cuenta (p. ej. alta de funcionario). */
  private setPasswordOverrideForUsername(username: string, password: string): void {
    const overrides = this.readPasswordOverrides();
    overrides[username] = password;
    this.writePasswordOverrides(overrides);
  }

  private readPasswordOverrides(): Record<string, string> {
    try {
      const raw = this.store.getLocalItem(PASSWORDS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  private writePasswordOverrides(map: Record<string, string>): void {
    this.store.setLocalItem(PASSWORDS_KEY, JSON.stringify(map));
  }

  private getAllUsers(): UsuarioAuth[] {
    return [...USUARIOS_DEMO, ...this.readStoredUsers()];
  }

  private readStoredUsers(): UsuarioAuth[] {
    try {
      const raw = this.store.getLocalItem(USERS_KEY);
      const parsed = raw ? (JSON.parse(raw) as UsuarioAuth[]) : [];
      return parsed.filter((u) => !!u?.username && !!u?.nombre && !!u?.rol);
    } catch {
      return [];
    }
  }

  private writeStoredUsers(list: UsuarioAuth[]): void {
    this.store.setLocalItem(USERS_KEY, JSON.stringify(list));
  }

  private buildUsernameBase(nombre: string): string {
    const raw = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    return raw || 'funcionario';
  }

  private ensureUniqueUsername(base: string, users: UsuarioAuth[]): string {
    const usados = new Set(users.map(u => u.username));
    if (!usados.has(base)) {
      return base;
    }
    let n = 2;
    while (usados.has(`${base}${n}`)) {
      n += 1;
    }
    return `${base}${n}`;
  }

  private avatarStorageKey(username: string): string {
    return `inventario_avatar_${username}`;
  }

  private leerAvatarGuardado(username: string): string | undefined {
    const raw = this.store.getLocalItem(this.avatarStorageKey(username));
    return raw || undefined;
  }

  /** Sin avatar en JSON: la foto vive en localStorage (evita límite de sessionStorage). */
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

  private restaurarSesion(): void {
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
      if (!parsed?.nombre || !parsed?.rol) {
        return;
      }
      const username = parsed.username ?? 'admin';
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
}
