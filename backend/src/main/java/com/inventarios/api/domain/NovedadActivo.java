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
@Table(name = "novedades_activo")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class NovedadActivo {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_novedad")
  private Long idNovedad;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "id_activo", nullable = false)
  private Activo activo;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "id_empleado", nullable = false)
  private Empleado empleado;

  @Column(name = "id_asignacion")
  private Long idAsignacion;

  @Column(nullable = false, length = 32)
  private String tipo;

  @Column(nullable = false, length = 4000)
  private String descripcion;

  @Column(name = "fecha_reporte", nullable = false)
  private Instant fechaReporte;

  @Column(nullable = false, length = 40)
  private String estado;

  @Column(name = "comentario_admin", length = 2000)
  private String comentarioAdmin;

  @Column(name = "fecha_respuesta")
  private Instant fechaRespuesta;

  /**
   * {@code true} si el cierre fue después de {@code ENVIADO_MANTENIMIENTO} (activo reparado, listo para
   * recogida). Sirve para notificaciones al funcionario sin ambigüedad con otros cierres.
   */
  @Column(name = "cerrada_tras_mantenimiento", nullable = false)
  private boolean cerradaTrasMantenimiento = false;

  public Long getIdNovedad() {
    return idNovedad;
  }

  public void setIdNovedad(Long idNovedad) {
    this.idNovedad = idNovedad;
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

  public Instant getFechaReporte() {
    return fechaReporte;
  }

  public void setFechaReporte(Instant fechaReporte) {
    this.fechaReporte = fechaReporte;
  }

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

  public Instant getFechaRespuesta() {
    return fechaRespuesta;
  }

  public void setFechaRespuesta(Instant fechaRespuesta) {
    this.fechaRespuesta = fechaRespuesta;
  }

  public boolean isCerradaTrasMantenimiento() {
    return cerradaTrasMantenimiento;
  }

  public void setCerradaTrasMantenimiento(boolean cerradaTrasMantenimiento) {
    this.cerradaTrasMantenimiento = cerradaTrasMantenimiento;
  }
}
