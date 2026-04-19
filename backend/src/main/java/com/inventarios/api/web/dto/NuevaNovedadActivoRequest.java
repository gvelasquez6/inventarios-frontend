package com.inventarios.api.web.dto;

public class NuevaNovedadActivoRequest {

  private Long idActivo;
  private Long idEmpleado;
  /** Opcional: referencia a la asignación activa desde la que se reporta. */
  private Long idAsignacion;

  private String tipo;
  private String descripcion;

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

  public Long getIdAsignacion() {
    return idAsignacion;
  }

  public void setIdAsignacion(Long idAsignacion) {
    this.idAsignacion = idAsignacion;
  }

  public String getTipo() {
    return tipo;
  }

  public void setTipo(String tipo) {
    this.tipo = tipo;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public void setDescripcion(String descripcion) {
    this.descripcion = descripcion;
  }
}
