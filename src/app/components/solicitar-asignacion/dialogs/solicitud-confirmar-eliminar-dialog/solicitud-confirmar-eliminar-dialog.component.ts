import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SolicitudAsignacion } from '../../../../domain';

@Component({
  selector: 'app-solicitud-confirmar-eliminar-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './solicitud-confirmar-eliminar-dialog.component.html',
  styleUrls: ['./solicitud-confirmar-eliminar-dialog.component.scss'],
})
export class SolicitudConfirmarEliminarDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() solicitud: SolicitudAsignacion | null = null;
  @Input() eliminando = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  cancelarDialogo(): void {
    this.cancelar.emit();
    this.visibleChange.emit(false);
  }
}

