package com.inventarios.api.web.dto;

public class ActualizarEstadoNovedadRequest {

  private String estado;
  private String comentarioAdmin;

  public String getEstado() {
    return estado;
  }

  public void setEstado(String estado) {
    this.estado = estado;
  }

  public String getComentarioAdmin() {
    return comentarioAdmin;
  }

  public void setComentarioAdmin(String comentarioAdmin) {
    this.comentarioAdmin = comentarioAdmin;
  }
}
