import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { NovedadActivoUseCase } from '../../application/use-cases/novedad-activo.use-case';
import { NotificacionService } from '../../core/services/notificacion.service';
import { NovedadActivo } from '../../domain';

@Component({
  selector: 'app-novedades-activo-admin',
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
  templateUrl: './novedades-activo-admin.component.html',
  styleUrls: ['./novedades-activo-admin.component.scss'],
})
export class NovedadesActivoAdminComponent implements OnInit {
  private readonly novedades = inject(NovedadActivoUseCase);
  private readonly notificacion = inject(NotificacionService);

  lista: NovedadActivo[] = [];
  cargando = false;

  mostrarGestion = false;
  seleccionada: NovedadActivo | null = null;
  nuevoEstado: 'ENVIADO_MANTENIMIENTO' | 'CERRADO' = 'ENVIADO_MANTENIMIENTO';
  comentarioAdmin = '';
  procesando = false;

  opcionesEstadoPendiente: { label: string; value: 'ENVIADO_MANTENIMIENTO' | 'CERRADO' }[] = [
    {
      label: 'Enviar a mantenimiento',
      value: 'ENVIADO_MANTENIMIENTO',
    },
    { label: 'Cerrar sin enviar a mantenimiento', value: 'CERRADO' },
  ];

  opcionesEstadoEnviado: { label: string; value: 'CERRADO' }[] = [
    {
      label: 'Activo reparado — notificar al funcionario para recoger',
      value: 'CERRADO',
    },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.novedades.getNovedades().subscribe({
      next: (list) => {
        this.lista = list;
        this.cargando = false;
      },
      error: (err: Error) => {
        this.lista = [];
        this.cargando = false;
        this.notificacion.error(err?.message ?? 'No se pudieron cargar las novedades.');
      },
    });
  }

  etiquetaTipo(t: string): string {
    const u = (t ?? '').toUpperCase();
    if (u === 'DANO') return 'Daño';
    if (u === 'PERDIDA') return 'Pérdida';
    if (u === 'OTRO') return 'Otro';
    return t;
  }

  etiquetaEstado(e: string | undefined): string {
    const u = (e ?? '').toUpperCase();
    if (u === 'PENDIENTE') return 'Pendiente';
    if (u === 'ENVIADO_MANTENIMIENTO') return 'Enviado a mantenimiento';
    if (u === 'CERRADO') return 'Cerrado';
    return e ?? '—';
  }

  claseEstado(e: string | undefined): string {
    const u = (e ?? '').toUpperCase();
    if (u === 'PENDIENTE') return 'estado-novedad--pendiente';
    if (u === 'ENVIADO_MANTENIMIENTO') return 'estado-novedad--enviado';
    if (u === 'CERRADO') return 'estado-novedad--cerrado';
    return '';
  }

  abrirGestion(n: NovedadActivo): void {
    const estado = (n.estado ?? '').toUpperCase();
    if (estado === 'CERRADO') return;
    this.seleccionada = n;
    this.comentarioAdmin = '';
    if (estado === 'PENDIENTE') {
      this.nuevoEstado = 'ENVIADO_MANTENIMIENTO';
    } else {
      this.nuevoEstado = 'CERRADO';
    }
    this.mostrarGestion = true;
  }

  cerrarGestion(): void {
    if (this.procesando) return;
    this.mostrarGestion = false;
    this.seleccionada = null;
  }

  confirmarGestion(): void {
    const n = this.seleccionada;
    if (!n || this.procesando) return;
    this.procesando = true;
    this.novedades
      .actualizarEstado(n.idNovedad, {
        estado: this.nuevoEstado,
        comentarioAdmin: this.comentarioAdmin.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.notificacion.novedadEstadoActualizado();
          this.procesando = false;
          this.cerrarGestion();
          this.cargar();
        },
        error: (err: Error) => {
          this.notificacion.error(err?.message ?? 'No se pudo actualizar.');
          this.procesando = false;
        },
      });
  }

  puedeGestionar(n: NovedadActivo): boolean {
    const e = (n.estado ?? '').toUpperCase();
    return e === 'PENDIENTE' || e === 'ENVIADO_MANTENIMIENTO';
  }
}
