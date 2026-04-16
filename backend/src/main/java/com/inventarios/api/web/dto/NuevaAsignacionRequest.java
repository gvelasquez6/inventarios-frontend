package com.inventarios.api.web.dto;

import java.time.Instant;

public class NuevaAsignacionRequest {

  private ActivoRef activo;
  private EmpleadoRef empleado;
  private Instant fechaAsignacion;

  public ActivoRef getActivo() {
    return activo;
  }

  public void setActivo(ActivoRef activo) {
    this.activo = activo;
  }

  public EmpleadoRef getEmpleado() {
    return empleado;
  }

  public void setEmpleado(EmpleadoRef empleado) {
    this.empleado = empleado;
  }

  public Instant getFechaAsignacion() {
    return fechaAsignacion;
  }

  public void setFechaAsignacion(Instant fechaAsignacion) {
    this.fechaAsignacion = fechaAsignacion;
  }

  public static class ActivoRef {
    private Long idActivo;

    public Long getIdActivo() {
      return idActivo;
    }

    public void setIdActivo(Long idActivo) {
      this.idActivo = idActivo;
    }
  }

  public static class EmpleadoRef {
    private Long idEmpleado;

    public Long getIdEmpleado() {
      return idEmpleado;
    }

    public void setIdEmpleado(Long idEmpleado) {
      this.idEmpleado = idEmpleado;
    }
  }
}
