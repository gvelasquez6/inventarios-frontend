package com.inventarios.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public class NuevoEmpleadoRequest {

  @NotBlank private String nombre;
  @NotBlank private String cargo;
  @NotBlank private String area;
  private Boolean activo;

  /** Opcional en alta: si se omite usuario y contraseña, el servidor los genera. */
  private String username;

  private String password;

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

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
