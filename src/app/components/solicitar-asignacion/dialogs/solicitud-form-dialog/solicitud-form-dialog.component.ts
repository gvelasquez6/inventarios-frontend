import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { OpcionActivoSolicitud } from '../../models/solicitud-asignacion-dialog.models';

@Component({
  selector: 'app-solicitud-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './solicitud-form-dialog.component.html',
  styleUrls: ['./solicitud-form-dialog.component.scss'],
})
export class SolicitudFormDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() tituloDialogo = 'Nueva solicitud de asignacion';
  @Input() etiquetaBotonEnviar = 'Solicitar';
  @Input() enviando = false;
  @Input() opcionesActivos: OpcionActivoSolicitud[] = [];
  @Input() form: { idActivo: number | null; motivo: string } = { idActivo: null, motivo: '' };

  @Output() enviar = new EventEmitter<void>();

  cerrarDialogo(): void {
    this.visibleChange.emit(false);
  }

  enviarSolicitud(): void {
    this.enviar.emit();
  }
}

