import { InjectionToken } from '@angular/core';
import { ActivoRepositoryPort } from './activo.repository.port';
import { AsignacionRepositoryPort } from './asignacion.repository.port';
import { EmpleadoRepositoryPort } from './empleado.repository.port';
import { SolicitudAsignacionRepositoryPort } from './solicitud-asignacion.repository.port';
import { SessionStorePort } from './session-store.port';

export const ACTIVO_REPOSITORY = new InjectionToken<ActivoRepositoryPort>('ACTIVO_REPOSITORY');

export const EMPLEADO_REPOSITORY = new InjectionToken<EmpleadoRepositoryPort>('EMPLEADO_REPOSITORY');

export const ASIGNACION_REPOSITORY = new InjectionToken<AsignacionRepositoryPort>(
  'ASIGNACION_REPOSITORY'
);

export const SOLICITUD_ASIGNACION_REPOSITORY =
  new InjectionToken<SolicitudAsignacionRepositoryPort>('SOLICITUD_ASIGNACION_REPOSITORY');

export const SESSION_STORE = new InjectionToken<SessionStorePort>('SESSION_STORE');
