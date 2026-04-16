package com.inventarios.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public class NuevoEmpleadoRequest {

  @NotBlank private String nombre;
  @NotBlank private String cargo;
  @NotBlank private String area;
  private Boolean activo;

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getCargo() {
    return cargo;
  }

  public void setCargo(String cargo) {
    this.cargo = cargo;
  }

  public String getArea() {
    return area;
  }

  public void setArea(String area) {
    this.area = area;
  }

  public Boolean getActivo() {
    return activo;
  }

  public void setActivo(Boolean activo) {
    this.activo = activo;
  }
}
