import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../application/use-cases/auth.service';
import { InventarioService } from '../../application/use-cases/inventario.service';
import { NovedadActivoUseCase } from '../../application/use-cases/novedad-activo.use-case';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EstadoActivo, NovedadActivo } from '../../domain';

interface OpcionAsignacionReporte {
  label: string;
  idAsignacion: number;
  idActivo: number;
}

@Component({
  selector: 'app-reportar-novedad',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
  ],
  templateUrl: './reportar-novedad.component.html',
  styleUrls: ['./reportar-novedad.component.scss'],
})
export class ReportarNovedadComponent implements OnInit {
  private readonly inventario = inject(InventarioService);
  private readonly auth = inject(AuthService);
  private readonly novedades = inject(NovedadActivoUseCase);
  private readonly notificacion = inject(NotificacionService);

  opcionesAsignacion: OpcionAsignacionReporte[] = [];
  misNovedades: NovedadActivo[] = [];
  cargandoNovedades = false;
  dialogReporteVisible = false;

  idAsignacionSeleccion: number | null = null;
  tipo: 'DANO' | 'PERDIDA' | 'OTRO' = 'DANO';
  descripcion = '';
  enviando = false;

  tipos: { label: string; value: 'DANO' | 'PERDIDA' | 'OTRO' }[] = [
    { label: 'Daño', value: 'DANO' },
    { label: 'Pérdida', value: 'PERDIDA' },
    { label: 'Otro', value: 'OTRO' },
  ];

  ngOnInit(): void {
    this.cargarAsignacionesParaReporte();
    this.cargarMisNovedades();
  }

  private idEmpleadoSesion(): number | null {
    const sesion = this.auth.session();
    const id = sesion?.idEmpleado == null ? null : Number(sesion.idEmpleado);
    return id != null && Number.isFinite(id) ? id : null;
  }

  cargarAsignacionesParaReporte(): void {
    const idEmpleado = this.idEmpleadoSesion();
    if (idEmpleado == null) {
      this.opcionesAsignacion = [];
      return;
    }
    this.inventario.getAsignaciones().subscribe({
      next: (list) => {
        const activas = list.filter(
          (a) =>
            String(a.estado).toUpperCase() === 'ACTIVA' &&
            Number(a.empleado?.idEmpleado) === idEmpleado &&
            a.activo?.estado !== EstadoActivo.MANTENIMIENTO,
        );
        this.opcionesAsignacion = activas.map((a) => ({
          idAsignacion: a.idAsignacion,
          idActivo: a.activo.idActivo,
          label: `${a.activo.tipo} — ${a.activo.marca} (${a.activo.serial || 'sin serial'})`,
        }));
      },
      error: (err: Error) =>
        this.notificacion.error(err?.message ?? 'No se pudieron cargar tus asignaciones.'),
    });
  }

  cargarMisNovedades(): void {
    const idEmpleado = this.idEmpleadoSesion();
    if (idEmpleado == null) {
      this.misNovedades = [];
      return;
    }
    this.cargandoNovedades = true;
    this.novedades.getMisNovedades(idEmpleado).subscribe({
      next: (list) => {
        this.misNovedades = list;
        this.cargandoNovedades = false;
      },
      error: (err: Error) => {
        this.misNovedades = [];
        this.cargandoNovedades = false;
        this.notificacion.error(err?.message ?? 'No se pudieron cargar tus reportes.');
      },
    });
  }

  abrirDialogoReporte(): void {
    this.dialogReporteVisible = true;
    this.cargarAsignacionesParaReporte();
  }

  cerrarDialogoReporte(): void {
    if (this.enviando) return;
    this.dialogReporteVisible = false;
    this.descripcion = '';
    this.idAsignacionSeleccion = null;
    this.tipo = 'DANO';
  }

  etiquetaTipo(t: string): string {
    const u = (t ?? '').toUpperCase();
    if (u === 'DANO') return 'Daño';
    if (u === 'PERDIDA') return 'Pérdida';
    if (u === 'OTRO') return 'Otro';
    return t;
  }

  etiquetaEstado(estado: string | undefined): string {
    const u = (estado ?? '').toUpperCase();
    if (u === 'PENDIENTE') return 'Pendiente';
    if (u === 'ENVIADO_MANTENIMIENTO') return 'En mantenimiento';
    if (u === 'CERRADO') return 'Cerrado';
    return estado ?? '—';
  }

  claseEstado(estado: string | undefined): string {
    const u = (estado ?? '').toUpperCase();
    if (u === 'PENDIENTE') return 'estado-novedad--pendiente';
    if (u === 'ENVIADO_MANTENIMIENTO') return 'estado-novedad--enviado';
    if (u === 'CERRADO') return 'estado-novedad--cerrado';
    return '';
  }

  textoSeguimiento(n: NovedadActivo): string {
    const u = (n.estado ?? '').toUpperCase();
    if (u === 'PENDIENTE') {
      return 'En revisión por administración.';
    }
    if (u === 'ENVIADO_MANTENIMIENTO') {
      return 'El activo está en taller. Revisa Mis asignaciones (Mantenimiento).';
    }
    if (u === 'CERRADO') {
      const com = n.comentarioAdmin?.trim();
      const tipoU = (n.tipo ?? '').toUpperCase();
      const esPerdida = tipoU === 'PERDIDA';
      const trasTaller = n.cerradaTrasMantenimiento === true;
      /** Cierre con activo listo para el funcionario (taller o resolución sin pérdida). */
      const indicarRecogida = trasTaller || (!esPerdida && Boolean(com));

      if (com && indicarRecogida) {
        return `Cierre: ${com}. Puedes recoger el activo.`;
      }
      if (com) {
        return `Cierre: ${com}`;
      }
      if (indicarRecogida) {
        return 'El administrador indica que el activo ya está reparado; puedes recogerlo.';
      }
      return 'Caso cerrado por administración.';
    }
    return '—';
  }

  enviar(): void {
    const idEmpleado = this.idEmpleadoSesion();
    if (idEmpleado == null) {
      this.notificacion.error('No hay sesión de empleado válida.', 'Reportar novedad');
      return;
    }
    const sel = this.opcionesAsignacion.find((o) => o.idAsignacion === this.idAsignacionSeleccion);
    if (!sel || this.enviando) return;
    const desc = this.descripcion.trim();
    if (desc.length < 8) {
      this.notificacion.error('Describe la novedad con al menos 8 caracteres.', 'Reportar novedad');
      return;
    }
    this.enviando = true;
    this.novedades
      .reportar({
        idActivo: sel.idActivo,
        idEmpleado,
        idAsignacion: sel.idAsignacion,
        tipo: this.tipo,
        descripcion: desc,
      })
      .subscribe({
        next: () => {
          this.notificacion.novedadReportada();
          this.enviando = false;
          this.cerrarDialogoReporte();
          this.cargarMisNovedades();
          this.cargarAsignacionesParaReporte();
        },
        error: (err: Error) => {
          this.notificacion.error(err?.message ?? 'No se pudo enviar el reporte.');
          this.enviando = false;
        },
      });
  }
}
