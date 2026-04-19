package com.inventarios.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cuentas_usuario")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CuentaUsuario {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_cuenta")
  private Long idCuenta;

  @Column(nullable = false, unique = true, length = 120)
  private String username;

  @JsonIgnore
  @Column(name = "password_hash", nullable = false, length = 120)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private RolCuenta rol;

  /** Solo funcionarios; el administrador no tiene fila de empleado. */
  @Column(name = "id_empleado", unique = true)
  private Long idEmpleado;

  public Long getIdCuenta() {
    return idCuenta;
  }

  public void setIdCuenta(Long idCuenta) {
    this.idCuenta = idCuenta;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public RolCuenta getRol() {
    return rol;
  }

  public void setRol(RolCuenta rol) {
    this.rol = rol;
  }

  public Long getIdEmpleado() {
    return idEmpleado;
  }

  public void setIdEmpleado(Long idEmpleado) {
    this.idEmpleado = idEmpleado;
  }
}
