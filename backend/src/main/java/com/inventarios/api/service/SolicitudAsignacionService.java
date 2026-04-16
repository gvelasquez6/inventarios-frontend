package com.inventarios.api.service;

import com.inventarios.api.domain.Activo;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.SolicitudAsignacion;
import com.inventarios.api.repository.ActivoRepository;
import com.inventarios.api.repository.AsignacionRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.repository.SolicitudAsignacionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SolicitudAsignacionService {

  private final SolicitudAsignacionRepository solicitudRepository;
  private final ActivoRepository activoRepository;
  private final EmpleadoRepository empleadoRepository;
  private final AsignacionRepository asignacionRepository;

  public SolicitudAsignacionService(
      SolicitudAsignacionRepository solicitudRepository,
      ActivoRepository activoRepository,
      EmpleadoRepository empleadoRepository,
      AsignacionRepository asignacionRepository) {
    this.solicitudRepository = solicitudRepository;
    this.activoRepository = activoRepository;
    this.empleadoRepository = empleadoRepository;
    this.asignacionRepository = asignacionRepository;
  }

  @Transactional
  public List<SolicitudAsignacion> listar(Long idEmpleado) {
    if (idEmpleado != null) {
      return solicitudRepository.findByEmpleado_IdEmpleadoOrderByFechaSolicitudDesc(idEmpleado);
    }
    sincronizarAprobadasConAsignacionActiva();
    return solicitudRepository.findAll(Sort.by(Sort.Direction.DESC, "fechaSolicitud"));
  }

  /**
   * Si ya existe asignación ACTIVA para el mismo empleado y activo, la solicitud aprobada debe
   * figurar como ASIGNADO (corrige datos anteriores o desincronizaciones).
   */
  private void sincronizarAprobadasConAsignacionActiva() {
    List<SolicitudAsignacion> aprobadas =
        solicitudRepository.findByEstadoSolicitudIgnoreCase("APROBADA");
    List<SolicitudAsignacion> actualizar = new ArrayList<>();
    for (SolicitudAsignacion s : aprobadas) {
      Long idE = s.getEmpleado().getIdEmpleado();
      Long idA = s.getActivo().getIdActivo();
      if (asignacionRepository.existsActivaPorEmpleadoYActivo(idE, idA, "ACTIVA")) {
        s.setEstadoSolicitud("ASIGNADO");
        actualizar.add(s);
      }
    }
    if (!actualizar.isEmpty()) {
      solicitudRepository.saveAll(actualizar);
    }
  }

  @Transactional
  public SolicitudAsignacion crear(Long idActivo, Long idEmpleado, String motivo) {
    Activo activo =
        activoRepository
            .findById(idActivo)
            .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));

    Empleado empleado =
        empleadoRepository
            .findById(idEmpleado)
            .orElseThrow(() -> new IllegalArgumentException("El empleado no existe"));

    SolicitudAsignacion s = new SolicitudAsignacion();
    s.setActivo(activo);
    s.setEmpleado(empleado);
    s.setEstadoSolicitud("PENDIENTE");
    s.setMotivo(motivo == null ? null : motivo.trim());
    s.setFechaSolicitud(Instant.now());
    return solicitudRepository.save(s);
  }

  @Transactional
  public SolicitudAsignacion actualizar(
      Long idSolicitud, Long idEmpleado, Long idActivo, String motivo) {
    SolicitudAsignacion s =
        solicitudRepository
            .findById(idSolicitud)
            .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe"));
    if (!Objects.equals(s.getEmpleado().getIdEmpleado(), idEmpleado)) {
      throw new IllegalArgumentException("No puedes modificar esta solicitud");
    }
    if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes modificar solicitudes pendientes");
    }
    Activo activo =
        activoRepository
            .findById(idActivo)
            .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));
    s.setActivo(activo);
    s.setMotivo(motivo == null ? null : motivo.trim());
    return solicitudRepository.save(s);
  }

  @Transactional
  public void eliminar(Long idSolicitud, Long idEmpleado) {
    SolicitudAsignacion s =
        solicitudRepository
            .findById(idSolicitud)
            .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe"));
    if (!Objects.equals(s.getEmpleado().getIdEmpleado(), idEmpleado)) {
      throw new IllegalArgumentException("No puedes eliminar esta solicitud");
    }
    if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes eliminar solicitudes pendientes");
    }
    solicitudRepository.delete(s);
  }

  @Transactional
  public SolicitudAsignacion aprobar(Long idSolicitud, String comentarioAdmin) {
    return procesarAdmin(idSolicitud, "APROBADA", comentarioAdmin);
  }

  @Transactional
  public SolicitudAsignacion rechazar(Long idSolicitud, String comentarioAdmin) {
    return procesarAdmin(idSolicitud, "RECHAZADA", comentarioAdmin);
  }

  /**
   * Tras registrar la asignación en inventario: las solicitudes aprobadas para el mismo empleado y
   * activo pasan a ASIGNADO.
   */
  @Transactional
  public void marcarAprobadasComoAsignadas(Long idEmpleado, Long idActivo) {
    List<SolicitudAsignacion> list =
        solicitudRepository.findPorEmpleadoActivoYEstado(idEmpleado, idActivo, "APROBADA");
    for (SolicitudAsignacion s : list) {
      s.setEstadoSolicitud("ASIGNADO");
    }
    solicitudRepository.saveAll(list);
  }

  private SolicitudAsignacion procesarAdmin(
      Long idSolicitud, String nuevoEstado, String comentarioAdmin) {
    SolicitudAsignacion s =
        solicitudRepository
            .findById(idSolicitud)
            .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe"));
    if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes procesar solicitudes pendientes");
    }
    s.setEstadoSolicitud(nuevoEstado);
    s.setFechaRespuesta(Instant.now());
    s.setComentarioAdmin(comentarioAdmin == null ? null : comentarioAdmin.trim());
    return solicitudRepository.save(s);
  }
}
