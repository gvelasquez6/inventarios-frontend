import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  ACTIVO_REPOSITORY,
  ASIGNACION_REPOSITORY,
  EMPLEADO_REPOSITORY,
  SESSION_STORE,
  SOLICITUD_ASIGNACION_REPOSITORY,
} from './application/ports/injection-tokens';
import { InventarioService } from './application/use-cases/inventario.service';
import { ActivoService } from './core/services/activo.service';
import { EmpleadoService } from './core/services/empleado.service';
import { AsignacionService } from './core/services/asignacion.service';
import { InMemoryInventarioRepository } from './infrastructure/adapters/in-memory/in-memory-inventario.repository';
import { ApiActivoRepository } from './infrastructure/adapters/http/api-activo.repository';
import { ApiEmpleadoRepository } from './infrastructure/adapters/http/api-empleado.repository';
import { ApiAsignacionRepository } from './infrastructure/adapters/http/api-asignacion.repository';
import { ApiSolicitudAsignacionRepository } from './infrastructure/adapters/http/api-solicitud-asignacion.repository';
import { BrowserSessionStoreAdapter } from './infrastructure/adapters/storage/browser-session-store.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    importProvidersFrom(FormsModule),
    InMemoryInventarioRepository,
    ApiActivoRepository,
    ApiEmpleadoRepository,
    ApiAsignacionRepository,
    ApiSolicitudAsignacionRepository,
    BrowserSessionStoreAdapter,
    { provide: ACTIVO_REPOSITORY, useExisting: ApiActivoRepository },
    { provide: EMPLEADO_REPOSITORY, useExisting: ApiEmpleadoRepository },
    { provide: ASIGNACION_REPOSITORY, useExisting: ApiAsignacionRepository },
    { provide: SOLICITUD_ASIGNACION_REPOSITORY, useExisting: ApiSolicitudAsignacionRepository },
    { provide: SESSION_STORE, useExisting: BrowserSessionStoreAdapter },
    ActivoService,
    EmpleadoService,
    AsignacionService,
    InventarioService,
    MessageService,
  ]
};
