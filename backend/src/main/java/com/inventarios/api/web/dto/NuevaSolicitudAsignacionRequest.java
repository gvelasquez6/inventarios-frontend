package com.inventarios.api.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class NuevaSolicitudAsignacionRequest {

  @NotNull private Long idActivo;
  @NotNull private Long idEmpleado;

  @Size(max = 500)
  private String motivo;

  public Long getIdActivo() {
    return idActivo;
  }

  public void setIdActivo(Long idActivo) {
    this.idActivo = idActivo;
  }

  public Long getIdEmpleado() {
    return idEmpleado;
  }

  public void setIdEmpleado(Long idEmpleado) {
    this.idEmpleado = idEmpleado;
  }

  public String getMotivo() {
    return motivo;
  }

  public void setMotivo(String motivo) {
    this.motivo = motivo;
  }
}
