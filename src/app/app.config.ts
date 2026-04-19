import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
  NOVEDAD_ACTIVO_REPOSITORY,
  AUTH_REPOSITORY,
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
import { ApiNovedadActivoRepository } from './infrastructure/adapters/http/api-novedad-activo.repository';
import { ApiAuthRepository } from './infrastructure/adapters/http/api-auth.repository';
import { BrowserSessionStoreAdapter } from './infrastructure/adapters/storage/browser-session-store.adapter';
import { authBearerInterceptor } from './core/auth/auth-bearer.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authBearerInterceptor])),
    importProvidersFrom(FormsModule),
    InMemoryInventarioRepository,
    ApiActivoRepository,
    ApiEmpleadoRepository,
    ApiAsignacionRepository,
    ApiSolicitudAsignacionRepository,
    ApiNovedadActivoRepository,
    ApiAuthRepository,
    BrowserSessionStoreAdapter,
    { provide: ACTIVO_REPOSITORY, useExisting: ApiActivoRepository },
    { provide: EMPLEADO_REPOSITORY, useExisting: ApiEmpleadoRepository },
    { provide: ASIGNACION_REPOSITORY, useExisting: ApiAsignacionRepository },
    { provide: SOLICITUD_ASIGNACION_REPOSITORY, useExisting: ApiSolicitudAsignacionRepository },
    { provide: NOVEDAD_ACTIVO_REPOSITORY, useExisting: ApiNovedadActivoRepository },
    { provide: AUTH_REPOSITORY, useExisting: ApiAuthRepository },
    { provide: SESSION_STORE, useExisting: BrowserSessionStoreAdapter },
    ActivoService,
    EmpleadoService,
    AsignacionService,
    InventarioService,
    MessageService,
  ]
};
