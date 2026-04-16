package com.inventarios.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "asignaciones")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Asignacion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_asignacion")
  private Long idAsignacion;

  @Column(name = "fecha_asignacion", nullable = false)
  private Instant fechaAsignacion;

  @Column(name = "fecha_devolucion")
  private Instant fechaDevolucion;

  @Column(nullable = false)
  private String estado;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "id_activo", nullable = false)
  private Activo activo;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "id_empleado", nullable = false)
  private Empleado empleado;

  public Long getIdAsignacion() {
    return idAsignacion;
  }

  public void setIdAsignacion(Long idAsignacion) {
    this.idAsignacion = idAsignacion;
  }

  public Instant getFechaAsignacion() {
    return fechaAsignacion;
  }

  public void setFechaAsignacion(Instant fechaAsignacion) {
    this.fechaAsignacion = fechaAsignacion;
  }

  public Instant getFechaDevolucion() {
    return fechaDevolucion;
  }

  public void setFechaDevolucion(Instant fechaDevolucion) {
    this.fechaDevolucion = fechaDevolucion;
  }

  public String getEstado() {
    return estado;
  }

  public void setEstado(String estado) {
    this.estado = estado;
  }

  public Activo getActivo() {
    return activo;
  }

  public void setActivo(Activo activo) {
    this.activo = activo;
  }

  public Empleado getEmpleado() {
    return empleado;
  }

  public void setEmpleado(Empleado empleado) {
    this.empleado = empleado;
  }
}
