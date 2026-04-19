import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly messages = inject(MessageService);

  /** Mensaje estándar tras crear un activo desde el formulario. */
  activoCreado(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Activo creado',
      detail: 'Se ha creado correctamente el activo.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  activoActualizado(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Activo actualizado',
      detail: 'Los cambios se guardaron correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  empleadoCreado(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Empleado registrado',
      detail: 'Se ha creado correctamente el empleado.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  empleadoActualizado(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Empleado actualizado',
      detail: 'Los cambios se guardaron correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  empleadoActivado(nombre: string): void {
    this.messages.add({
      severity: 'success',
      summary: 'Empleado activado',
      detail: `${nombre} fue activado correctamente.`,
      life: 3500,
      styleClass: 'toast-msg-exito',
    });
  }

  empleadoDesactivado(nombre: string): void {
    this.messages.add({
      severity: 'error',
      summary: 'Empleado desactivado',
      detail: `${nombre} fue desactivado correctamente.`,
      life: 3500,
      styleClass: 'toast-msg-error',
    });
  }

  credencialesFuncionario(username: string, password: string, creado: boolean): void {
    this.messages.add({
      severity: 'info',
      summary: creado ? 'Cuenta de funcionario creada' : 'Cuenta de funcionario existente',
      detail: `Usuario: ${username} | Contraseña: ${password}`,
      life: 7000,
      styleClass: 'toast-msg-exito',
    });
  }

  asignacionCreada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Asignación registrada',
      detail: 'La asignación se creó correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  asignacionActualizada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Asignación actualizada',
      detail: 'Los cambios se guardaron correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  asignacionEliminada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Asignación eliminada',
      detail: 'La asignación se eliminó correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudAsignacionCreada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Solicitud enviada',
      detail: 'Tu solicitud de asignación fue enviada correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudAsignacionActualizada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Solicitud actualizada',
      detail: 'Los cambios se guardaron correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudAsignacionEliminada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Solicitud eliminada',
      detail: 'La solicitud se eliminó correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudAsignacionAprobada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Solicitud aprobada',
      detail: 'La solicitud fue aprobada correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudAsignacionRechazada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Solicitud rechazada',
      detail: 'La solicitud fue rechazada correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudPendienteFirma(): void {
    this.messages.add({
      severity: 'success',
      summary: 'PDF generado',
      detail: 'La solicitud quedó en estado pendiente de firma.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudPdfFirmadoSubido(): void {
    this.messages.add({
      severity: 'success',
      summary: 'PDF firmado recibido',
      detail: 'El documento firmado se cargó correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudFirmaAprobadaFinal(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Solicitud completada',
      detail: 'La revisión final de firma fue aprobada.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  solicitudFirmaRechazadaFinal(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Firma rechazada',
      detail: 'La firma fue rechazada por administración.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  novedadReportada(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Reporte enviado',
      detail: 'Tu novedad fue registrada. El administrador podrá gestionarla.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  novedadEstadoActualizado(): void {
    this.messages.add({
      severity: 'success',
      summary: 'Novedad actualizada',
      detail: 'El estado del reporte se guardó correctamente.',
      life: 4500,
      styleClass: 'toast-msg-exito',
    });
  }

  /**
   * Mensaje de error (toast rojo, mismo estilo que el de éxito).
   * @param detalle Texto principal del mensaje
   * @param resumen Título corto (opcional)
   */
  error(detalle: string, resumen = 'Error'): void {
    this.messages.add({
      severity: 'error',
      summary: resumen,
      detail: detalle,
      life: 5500,
      styleClass: 'toast-msg-error',
    });
  }
}
