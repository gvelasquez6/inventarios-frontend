import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SolicitudAsignacion } from '../../../../domain';

@Component({
  selector: 'app-solicitud-detalle-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './solicitud-detalle-dialog.component.html',
  styleUrls: ['./solicitud-detalle-dialog.component.scss'],
})
export class SolicitudDetalleDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() solicitudDetalle: SolicitudAsignacion | null = null;

  esSolicitudRechazada(s: SolicitudAsignacion | null): boolean {
    const estado = (s?.estadoSolicitud ?? '').trim().toUpperCase();
    return estado === 'RECHAZADA' || estado === 'RECHAZADO_FIRMA';
  }

  tituloMotivoRechazo(s: SolicitudAsignacion | null): string {
    const estado = (s?.estadoSolicitud ?? '').trim().toUpperCase();
    if (estado === 'RECHAZADO_FIRMA') {
      return 'Motivo rechazo de firma';
    }
    return 'Motivo rechazo';
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }
}

