import { Routes } from '@angular/router';
import { ActivoComponent } from './components/activo/activo.component';
import { AsignacionComponent } from './components/asignacion/asignacion.component';
import { EmpleadoComponent } from './components/empleado/empleado.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { AppShellComponent } from './components/app-shell/app-shell.component';
import { LoginComponent } from './components/login/login.component';
import { RecuperarContrasenaComponent } from './components/recuperar-contrasena/recuperar-contrasena.component';
import { InicioModulosComponent } from './components/inicio-modulos/inicio-modulos.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { roleGuard } from './core/guards/role.guard';
import { MisAsignacionesComponent } from './components/mis-asignaciones/mis-asignaciones.component';
import { SolicitarAsignacionComponent } from './components/solicitar-asignacion/solicitar-asignacion.component';
import { SolicitudesPendientesComponent } from './components/solicitudes-pendientes/solicitudes-pendientes.component';
import { ReportarNovedadComponent } from './components/reportar-novedad/reportar-novedad.component';
import { NovedadesActivoAdminComponent } from './components/novedades-activo-admin/novedades-activo-admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'recuperar-contrasena', component: RecuperarContrasenaComponent, canActivate: [loginGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: InicioModulosComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'activos', component: ActivoComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'empleados', component: EmpleadoComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'asignaciones', component: AsignacionComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'solicitudes-pendientes', component: SolicitudesPendientesComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'novedades-activo', component: NovedadesActivoAdminComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'mis-asignaciones', component: MisAsignacionesComponent, canActivate: [roleGuard], data: { roles: ['Funcionario'] } },
      { path: 'solicitar-asignacion', component: SolicitarAsignacionComponent, canActivate: [roleGuard], data: { roles: ['Funcionario'] } },
      { path: 'reportar-novedad', component: ReportarNovedadComponent, canActivate: [roleGuard], data: { roles: ['Funcionario'] } },
      { path: 'perfil', component: PerfilComponent },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
