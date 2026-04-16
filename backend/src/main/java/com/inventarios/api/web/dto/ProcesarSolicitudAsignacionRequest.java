package com.inventarios.api.web.dto;

import jakarta.validation.constraints.Size;

public class ProcesarSolicitudAsignacionRequest {

  @Size(max = 500)
  private String comentarioAdmin;

  public String getComentarioAdmin() {
    return comentarioAdmin;
  }

  public void setComentarioAdmin(String comentarioAdmin) {
    this.comentarioAdmin = comentarioAdmin;
  }
}
