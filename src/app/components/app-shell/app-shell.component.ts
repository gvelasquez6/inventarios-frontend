import { Component, DestroyRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, filter, startWith, take } from 'rxjs/operators';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../application/use-cases/auth.service';
import { InventarioService } from '../../application/use-cases/inventario.service';
import {
  NotificacionCentro,
  NotificacionesCentroService,
} from '../../core/services/notificaciones-centro.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterModule, Menu],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  private readonly inventario = inject(InventarioService);
  private readonly notificacionesService = inject(NotificacionesCentroService);

  /** Solo fuera de la pantalla de selección de módulos (`/inicio`). */
  protected readonly mostrarRegresoModulo = signal(false);

  /** Sidebar oculto únicamente en la pantalla de módulos (`/inicio`). */
  protected readonly mostrarSidebar = signal(!this.enPantallaModulos());
  /** Estado colapsado del sidebar: solo íconos de módulos. */
  protected readonly sidebarColapsado = signal(false);

  @ViewChild('userMenu') userMenu!: Menu;

  userMenuItems: MenuItem[] = [];
  totalNotificaciones = 0;
  notificacionesAbiertas = false;
  notificaciones: NotificacionCentro[] = [];
  private notificacionesLeidas = new Set<string>();
  /** IDs ocultados por el usuario desde la papelera (persistido por sesión de usuario). */
  private notificacionesEliminadas = new Set<string>();

  get esAdministrador(): boolean {
    return this.auth.session()?.rol === 'Administrador';
  }

  get esFuncionario(): boolean {
    return this.auth.session()?.rol === 'Funcionario';
  }

  get subtituloUsuario(): string {
    const sesion = this.auth.session();
    if (!sesion) {
      return '—';
    }
    if (sesion.rol === 'Funcionario') {
      const cargo = sesion.cargo?.trim();
      const area = sesion.area?.trim();
      if (cargo && area) {
        return `${area} · ${cargo}`;
      }
      return area || cargo || 'Funcionario';
    }
    return sesion.rol;
  }

  ngOnInit(): void {
    this.cargarNotificacionesLeidas();
    this.cargarNotificacionesEliminadas();
    this.iniciarAutoRefrescoNotificaciones();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.actualizarVisibilidadRegresoModulo();
        this.cargarNotificaciones();
        this.notificacionesAbiertas = false;
      });
    this.actualizarVisibilidadRegresoModulo();
    this.sincronizarCargoFuncionario();

    this.userMenuItems = [
      {
        label: 'Mi perfil',
        icon: 'pi pi-user',
        command: () => this.irPerfil(),
      },
      { separator: true },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.cerrarSesion(),
      },
    ];
  }

  private sincronizarCargoFuncionario(): void {
    const sesion = this.auth.session();
    if (!sesion || sesion.rol !== 'Funcionario') {
      return;
    }
    this.inventario.getEmpleados().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((list) => {
      const idSesion = sesion.idEmpleado == null ? null : Number(sesion.idEmpleado);
      const encontrado = idSesion != null
        ? list.find((e) => Number(e.idEmpleado) === idSesion)
        : list.find((e) => e.nombre.toLowerCase().trim() === sesion.nombre.toLowerCase().trim());
      if (encontrado?.cargo) {
        this.auth.actualizarDatosSesionFuncionario(encontrado.cargo, encontrado.area);
      }
    });
  }

  private cargarNotificaciones(): void {
    this.notificacionesService
      .obtenerNotificaciones()
      .pipe(
        take(1),
        catchError(() => of([] as NotificacionCentro[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => {
        this.notificaciones = list.filter((n) => !this.notificacionesEliminadas.has(n.id));
        this.actualizarTotalNoLeidas();
      });
  }

  /**
   * Refresco periódico para que la campana refleje nuevas solicitudes sin recargar la app.
   */
  private iniciarAutoRefrescoNotificaciones(): void {
    interval(15000)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarNotificaciones());
  }

  toggleNotificaciones(event: Event): void {
    event.stopPropagation();
    this.notificacionesAbiertas = !this.notificacionesAbiertas;
    if (this.notificacionesAbiertas) {
      this.cargarNotificaciones();
    }
  }

  marcarNotificacionesComoLeidas(event?: Event): void {
    event?.stopPropagation();
    if (this.notificaciones.length === 0) {
      return;
    }
    for (const n of this.notificaciones) {
      this.notificacionesLeidas.add(n.id);
    }
    this.guardarNotificacionesLeidas();
    this.actualizarTotalNoLeidas();
  }

  marcarNotificacionComoLeida(item: NotificacionCentro, event: Event): void {
    event.stopPropagation();
    if (this.notificacionesLeidas.has(item.id)) {
      return;
    }
    this.notificacionesLeidas.add(item.id);
    this.guardarNotificacionesLeidas();
    this.actualizarTotalNoLeidas();
  }

  eliminarNotificacion(item: NotificacionCentro, event: Event): void {
    event.stopPropagation();
    this.notificacionesEliminadas.add(item.id);
    this.guardarNotificacionesEliminadas();
    this.notificaciones = this.notificaciones.filter((n) => n.id !== item.id);
    this.actualizarTotalNoLeidas();
  }

  abrirNotificacion(item: NotificacionCentro): void {
    this.notificacionesLeidas.add(item.id);
    this.guardarNotificacionesLeidas();
    this.actualizarTotalNoLeidas();
    this.notificacionesAbiertas = false;
    void this.router.navigate([item.rutaDestino]);
  }

  esNoLeida(item: NotificacionCentro): boolean {
    return !this.notificacionesLeidas.has(item.id);
  }

  formatearFechaNotificacion(fecha: Date): string {
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    if (target.closest('.notificaciones-dropdown')) {
      return;
    }
    this.notificacionesAbiertas = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.notificacionesAbiertas = false;
  }

  private actualizarTotalNoLeidas(): void {
    this.totalNotificaciones = this.notificaciones.filter((n) => !this.notificacionesLeidas.has(n.id)).length;
  }

  private storageLeidasKey(): string | null {
    const usuario = this.auth.session()?.username?.trim();
    return usuario ? `inventario_notificaciones_leidas_${usuario}` : null;
  }

  private cargarNotificacionesLeidas(): void {
    const key = this.storageLeidasKey();
    if (!key || typeof localStorage === 'undefined') {
      this.notificacionesLeidas.clear();
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      this.notificacionesLeidas = new Set((arr ?? []).filter((x) => typeof x === 'string'));
    } catch {
      this.notificacionesLeidas.clear();
    }
  }

  private guardarNotificacionesLeidas(): void {
    const key = this.storageLeidasKey();
    if (!key || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, JSON.stringify(Array.from(this.notificacionesLeidas)));
  }

  private storageEliminadasKey(): string | null {
    const usuario = this.auth.session()?.username?.trim();
    return usuario ? `inventario_notificaciones_eliminadas_${usuario}` : null;
  }

  private cargarNotificacionesEliminadas(): void {
    const key = this.storageEliminadasKey();
    if (!key || typeof localStorage === 'undefined') {
      this.notificacionesEliminadas.clear();
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      this.notificacionesEliminadas = new Set((arr ?? []).filter((x) => typeof x === 'string'));
    } catch {
      this.notificacionesEliminadas.clear();
    }
  }

  private guardarNotificacionesEliminadas(): void {
    const key = this.storageEliminadasKey();
    if (!key || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, JSON.stringify(Array.from(this.notificacionesEliminadas)));
  }

  private actualizarVisibilidadRegresoModulo(): void {
    const enPantallaModulos = this.enPantallaModulos();
    this.mostrarRegresoModulo.set(!enPantallaModulos);
    this.mostrarSidebar.set(!enPantallaModulos);
  }

  private enPantallaModulos(): boolean {
    const path = this.normalizarRuta(this.router.url);
    return path === '/inicio' || path === '/';
  }

  private normalizarRuta(url: string): string {
    let p = url.split('?')[0].split('#')[0];
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }
    return p || '/';
  }

  toggleUserMenu(event: Event): void {
    this.userMenu.toggle(event);
  }

  toggleSidebarColapsado(event: Event): void {
    event.stopPropagation();
    this.sidebarColapsado.update((estado) => !estado);
  }

  irPerfil(): void {
    void this.router.navigate(['/perfil']);
  }

  cerrarSesion(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
