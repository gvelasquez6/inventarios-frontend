import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SolicitudAsignacion } from '../../../../domain';

@Component({
  selector: 'app-solicitud-firmado-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './solicitud-firmado-dialog.component.html',
  styleUrls: ['./solicitud-firmado-dialog.component.scss'],
})
export class SolicitudFirmadoDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() solicitudParaFirma: SolicitudAsignacion | null = null;
  @Input() subiendoFirmado = false;
  @Input() stagedPdfFirmado: File | null = null;

  @Output() seleccionarPdf = new EventEmitter<{ files?: File[] }>();
  @Output() quitarPdf = new EventEmitter<void>();
  @Output() subirPdf = new EventEmitter<void>();

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  get selectorDeshabilitado(): boolean {
    return this.subiendoFirmado || !!this.stagedPdfFirmado;
  }

  abrirSelector(input: HTMLInputElement): void {
    if (this.selectorDeshabilitado) return;
    input.click();
  }

  onFileInputChange(event: Event): void {
    if (this.selectorDeshabilitado) return;
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) return;
    this.seleccionarPdf.emit({ files: [file] });
    if (target) {
      target.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    if (this.selectorDeshabilitado) return;
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    if (this.selectorDeshabilitado) return;
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.seleccionarPdf.emit({ files: [file] });
  }

  formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let idx = 0;
    while (size >= 1024 && idx < units.length - 1) {
      size /= 1024;
      idx += 1;
    }
    const digits = idx === 0 ? 0 : 1;
    return `${size.toFixed(digits)} ${units[idx]}`;
  }
}

