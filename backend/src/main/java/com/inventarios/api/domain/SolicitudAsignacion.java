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
@Table(name = "solicitudes_asignacion")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SolicitudAsignacion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_solicitud")
  private Long idSolicitud;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "id_activo", nullable = false)
  private Activo activo;

  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "id_empleado", nullable = false)
  private Empleado empleado;

  @Column(nullable = false, length = 30)
  private String estadoSolicitud;

  @Column(length = 500)
  private String motivo;

  @Column(name = "fecha_solicitud", nullable = false)
  private Instant fechaSolicitud;

  @Column(name = "fecha_respuesta")
  private Instant fechaRespuesta;

  @Column(name = "comentario_admin", length = 500)
  private String comentarioAdmin;

  public Long getIdSolicitud() {
    return idSolicitud;
  }

  public void setIdSolicitud(Long idSolicitud) {
    this.idSolicitud = idSolicitud;
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

  public String getEstadoSolicitud() {
    return estadoSolicitud;
  }

  public void setEstadoSolicitud(String estadoSolicitud) {
    this.estadoSolicitud = estadoSolicitud;
  }

  public String getMotivo() {
    return motivo;
  }

  public void setMotivo(String motivo) {
    this.motivo = motivo;
  }

  public Instant getFechaSolicitud() {
    return fechaSolicitud;
  }

  public void setFechaSolicitud(Instant fechaSolicitud) {
    this.fechaSolicitud = fechaSolicitud;
  }

  public Instant getFechaRespuesta() {
    return fechaRespuesta;
  }

  public void setFechaRespuesta(Instant fechaRespuesta) {
    this.fechaRespuesta = fechaRespuesta;
  }

  public String getComentarioAdmin() {
    return comentarioAdmin;
  }

  public void setComentarioAdmin(String comentarioAdmin) {
    this.comentarioAdmin = comentarioAdmin;
  }
}
