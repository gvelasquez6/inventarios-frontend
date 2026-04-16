package com.inventarios.api.service;

import com.inventarios.api.domain.Activo;
import com.inventarios.api.domain.Asignacion;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.EstadoActivo;
import com.inventarios.api.repository.ActivoRepository;
import com.inventarios.api.repository.AsignacionRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AsignacionService {

  private final ActivoRepository activoRepository;
  private final EmpleadoRepository empleadoRepository;
  private final AsignacionRepository asignacionRepository;
  private final SolicitudAsignacionService solicitudAsignacionService;

  public AsignacionService(
      ActivoRepository activoRepository,
      EmpleadoRepository empleadoRepository,
      AsignacionRepository asignacionRepository,
      SolicitudAsignacionService solicitudAsignacionService) {
    this.activoRepository = activoRepository;
    this.empleadoRepository = empleadoRepository;
    this.asignacionRepository = asignacionRepository;
    this.solicitudAsignacionService = solicitudAsignacionService;
  }

  @Transactional
  public Asignacion crear(Long idActivo, Long idEmpleado, Instant fechaAsignacion) {
    Activo activo =
        activoRepository
            .findById(idActivo)
            .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));

    if (activo.getEstado() != EstadoActivo.DISPONIBLE) {
      throw new IllegalArgumentException("El activo ya está asignado o no está disponible");
    }

    Empleado empleado =
        empleadoRepository
            .findById(idEmpleado)
            .orElseThrow(() -> new IllegalArgumentException("El empleado no existe"));

    activo.setEstado(EstadoActivo.ASIGNADO);
    activoRepository.save(activo);

    Asignacion nueva = new Asignacion();
    nueva.setFechaAsignacion(fechaAsignacion != null ? fechaAsignacion : Instant.now());
    nueva.setEstado("ACTIVA");
    nueva.setActivo(activo);
    nueva.setEmpleado(empleado);

    Asignacion guardada = asignacionRepository.save(nueva);
    // Asegura que la fila de asignación sea visible para las consultas de marcar solicitudes.
    asignacionRepository.flush();
    solicitudAsignacionService.marcarAprobadasComoAsignadas(idEmpleado, idActivo);
    return guardada;
  }

  /**
   * Actualiza empleado, fecha y/o activo. Si cambia el activo, el anterior pasa a DISPONIBLE y el
   * nuevo debe estar DISPONIBLE y pasa a ASIGNADO.
   */
  @Transactional
  public Asignacion actualizar(
      Long idAsignacion, Long idActivoNuevo, Long idEmpleado, Instant fechaAsignacion) {
    Asignacion asig =
        asignacionRepository
            .findById(idAsignacion)
            .orElseThrow(() -> new IllegalArgumentException("Asignación no encontrada"));
    if (!"ACTIVA".equalsIgnoreCase(asig.getEstado())) {
      throw new IllegalArgumentException("Solo se pueden editar asignaciones activas");
    }

    Empleado empleado =
        empleadoRepository
            .findById(idEmpleado)
            .orElseThrow(() -> new IllegalArgumentException("El empleado no existe"));

    Activo activoActual = asig.getActivo();
    Long idActual = activoActual.getIdActivo();

    if (!idActual.equals(idActivoNuevo)) {
      Activo nuevo =
          activoRepository
              .findById(idActivoNuevo)
              .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));
      if (nuevo.getEstado() != EstadoActivo.DISPONIBLE) {
        throw new IllegalArgumentException("El activo destino no está disponible");
      }
      activoActual.setEstado(EstadoActivo.DISPONIBLE);
      activoRepository.save(activoActual);
      nuevo.setEstado(EstadoActivo.ASIGNADO);
      activoRepository.save(nuevo);
      asig.setActivo(nuevo);
    }

    asig.setEmpleado(empleado);
    if (fechaAsignacion != null) {
      asig.setFechaAsignacion(fechaAsignacion);
    }
    return asignacionRepository.save(asig);
  }

  @Transactional
  public void eliminar(Long idAsignacion) {
    Asignacion asig =
        asignacionRepository
            .findById(idAsignacion)
            .orElseThrow(() -> new IllegalArgumentException("Asignación no encontrada"));
    if ("ACTIVA".equalsIgnoreCase(asig.getEstado()) && asig.getActivo() != null) {
      Activo activo = asig.getActivo();
      activo.setEstado(EstadoActivo.DISPONIBLE);
      activoRepository.save(activo);
    }
    asignacionRepository.delete(asig);
  }
}
