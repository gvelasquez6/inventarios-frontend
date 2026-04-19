package com.inventarios.api.web.dto;

import com.inventarios.api.domain.Empleado;

public class EmpleadoCreadoResponse {

  private Empleado empleado;
  private String credencialUsuario;
  private String credencialPassword;
  private boolean credencialGenerada;

  public Empleado getEmpleado() {
    return empleado;
  }

  public void setEmpleado(Empleado empleado) {
    this.empleado = empleado;
  }

  public String getCredencialUsuario() {
    return credencialUsuario;
  }

  public void setCredencialUsuario(String credencialUsuario) {
    this.credencialUsuario = credencialUsuario;
  }

  public String getCredencialPassword() {
    return credencialPassword;
  }

  public void setCredencialPassword(String credencialPassword) {
    this.credencialPassword = credencialPassword;
  }

  public boolean isCredencialGenerada() {
    return credencialGenerada;
  }

  public void setCredencialGenerada(boolean credencialGenerada) {
    this.credencialGenerada = credencialGenerada;
  }
}
