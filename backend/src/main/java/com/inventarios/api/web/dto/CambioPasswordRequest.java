package com.inventarios.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public class CambioPasswordRequest {

  @NotBlank private String passwordActual;
  @NotBlank private String passwordNueva;

  public String getPasswordActual() {
    return passwordActual;
  }

  public void setPasswordActual(String passwordActual) {
    this.passwordActual = passwordActual;
  }

  public String getPasswordNueva() {
    return passwordNueva;
  }

  public void setPasswordNueva(String passwordNueva) {
    this.passwordNueva = passwordNueva;
  }
}
