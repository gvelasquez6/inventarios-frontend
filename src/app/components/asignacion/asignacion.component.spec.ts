import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AsignacionComponent } from './asignacion.component';
import { InventarioService } from '../../application/use-cases/inventario.service';
import {
  ACTIVO_REPOSITORY,
  ASIGNACION_REPOSITORY,
  EMPLEADO_REPOSITORY,
} from '../../application/ports/injection-tokens';
import { ActivoService } from '../../core/services/activo.service';
import { EmpleadoService } from '../../core/services/empleado.service';
import { AsignacionService } from '../../core/services/asignacion.service';
import { Activo, Asignacion, Empleado, EstadoActivo } from '../../domain';

describe('AsignacionComponent', () => {
  let component: AsignacionComponent;
  let fixture: ComponentFixture<AsignacionComponent>;

  const dummyActivo: Activo = {
    idActivo: 1,
    tipo: 't',
    marca: 'm',
    modelo: 'm',
    serial: 's',
    estado: EstadoActivo.DISPONIBLE,
  };

  const dummyEmpleado: Empleado = {
    idEmpleado: 1,
    nombre: 'n',
    cargo: 'c',
    area: 'a',
  };

  const dummyAsignacion: Asignacion = {
    idAsignacion: 1,
    fechaAsignacion: new Date(),
    estado: 'ACTIVA',
    activo: dummyActivo,
    empleado: dummyEmpleado,
  };

  const mockRepository = {
    getActivos: () => of([]),
    addActivo: () => of(dummyActivo),
    updateActivo: () => of(dummyActivo),
    getEmpleados: () => of([]),
    addEmpleado: () => of(dummyEmpleado),
    updateEmpleado: () => of(dummyEmpleado),
    getAsignaciones: () => of([]),
    addAsignacion: () => of(dummyAsignacion),
    updateAsignacion: () => of(dummyAsignacion),
    deleteAsignacion: () => of(void 0),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionComponent],
      providers: [
        { provide: ACTIVO_REPOSITORY, useValue: mockRepository },
        { provide: EMPLEADO_REPOSITORY, useValue: mockRepository },
        { provide: ASIGNACION_REPOSITORY, useValue: mockRepository },
        ActivoService,
        EmpleadoService,
        AsignacionService,
        InventarioService,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
