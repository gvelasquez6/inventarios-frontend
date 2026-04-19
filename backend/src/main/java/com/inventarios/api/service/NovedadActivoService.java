package com.inventarios.api.service;

import com.inventarios.api.domain.Activo;
import com.inventarios.api.domain.Asignacion;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.EstadoActivo;
import com.inventarios.api.domain.NovedadActivo;
import com.inventarios.api.repository.ActivoRepository;
import com.inventarios.api.repository.AsignacionRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.repository.NovedadActivoRepository;
import com.inventarios.api.web.dto.ActualizarEstadoNovedadRequest;
import com.inventarios.api.web.dto.NuevaNovedadActivoRequest;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NovedadActivoService {

  private static final Set<String> TIPOS_VALIDOS = Set.of("DANO", "PERDIDA", "OTRO");
  private static final Set<String> ESTADOS_FINALES = Set.of("PENDIENTE", "ENVIADO_MANTENIMIENTO", "CERRADO");

  private final NovedadActivoRepository novedadActivoRepository;
  private final ActivoRepository activoRepository;
  private final EmpleadoRepository empleadoRepository;
  private final AsignacionRepository asignacionRepository;

  public NovedadActivoService(
      NovedadActivoRepository novedadActivoRepository,
      ActivoRepository activoRepository,
      EmpleadoRepository empleadoRepository,
      AsignacionRepository asignacionRepository) {
    this.novedadActivoRepository = novedadActivoRepository;
    this.activoRepository = activoRepository;
    this.empleadoRepository = empleadoRepository;
    this.asignacionRepository = asignacionRepository;
  }

  public List<NovedadActivo> listarTodas() {
    return novedadActivoRepository.findAllByOrderByFechaReporteDesc();
  }

  public List<NovedadActivo> listarPorEmpleado(Long idEmpleado) {
    if (idEmpleado == null) {
      throw new IllegalArgumentException("idEmpleado es obligatorio");
    }
    return novedadActivoRepository.findByEmpleado_IdEmpleadoOrderByFechaReporteDesc(idEmpleado);
  }

  @Transactional
  public NovedadActivo crear(NuevaNovedadActivoRequest body) {
    if (body == null
        || body.getIdActivo() == null
        || body.getIdEmpleado() == null
        || body.getTipo() == null
        || body.getDescripcion() == null) {
      throw new IllegalArgumentException("idActivo, idEmpleado, tipo y descripción son obligatorios");
    }
    String tipo = body.getTipo().trim().toUpperCase(Locale.ROOT);
    if (!TIPOS_VALIDOS.contains(tipo)) {
      throw new IllegalArgumentException("tipo debe ser DANO, PERDIDA u OTRO");
    }
    String descripcion = body.getDescripcion().trim();
    if (descripcion.length() < 8) {
      throw new IllegalArgumentException("La descripción debe tener al menos 8 caracteres");
    }

    boolean asignacionActiva =
        asignacionRepository.existsActivaPorEmpleadoYActivo(
            body.getIdEmpleado(), body.getIdActivo(), "ACTIVA");
    if (!asignacionActiva) {
      throw new IllegalArgumentException(
          "Solo puedes reportar novedades sobre activos que tienes asignados actualmente");
    }

    if (body.getIdAsignacion() != null) {
      Asignacion asig =
          asignacionRepository
              .findById(body.getIdAsignacion())
              .orElseThrow(() -> new IllegalArgumentException("La asignación indicada no existe"));
      if (!asig.getEmpleado().getIdEmpleado().equals(body.getIdEmpleado())
          || !asig.getActivo().getIdActivo().equals(body.getIdActivo())) {
        throw new IllegalArgumentException("La asignación no corresponde al empleado y activo indicados");
      }
      if (!"ACTIVA".equalsIgnoreCase(asig.getEstado())) {
        throw new IllegalArgumentException("La asignación no está activa");
      }
    }

    Activo activo =
        activoRepository
            .findById(body.getIdActivo())
            .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));
    if (activo.getEstado() == EstadoActivo.MANTENIMIENTO) {
      throw new IllegalArgumentException(
          "Este activo está en mantenimiento. Espera la notificación de que ya fue reparado para volver a reportar.");
    }
    Empleado empleado =
        empleadoRepository
            .findById(body.getIdEmpleado())
            .orElseThrow(() -> new IllegalArgumentException("El empleado no existe"));

    NovedadActivo n = new NovedadActivo();
    n.setActivo(activo);
    n.setEmpleado(empleado);
    n.setIdAsignacion(body.getIdAsignacion());
    n.setTipo(tipo);
    n.setDescripcion(descripcion);
    n.setFechaReporte(Instant.now());
    n.setEstado("PENDIENTE");
    n.setCerradaTrasMantenimiento(false);
    return novedadActivoRepository.save(n);
  }

  @Transactional
  public NovedadActivo actualizarEstado(Long id, ActualizarEstadoNovedadRequest body) {
    if (body == null || body.getEstado() == null || body.getEstado().isBlank()) {
      throw new IllegalArgumentException("estado es obligatorio");
    }
    String nuevo = body.getEstado().trim().toUpperCase(Locale.ROOT);
    if (!ESTADOS_FINALES.contains(nuevo)) {
      throw new IllegalArgumentException("estado inválido");
    }
    NovedadActivo n =
        novedadActivoRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Novedad no encontrada"));
    String actual = n.getEstado() != null ? n.getEstado().trim().toUpperCase(Locale.ROOT) : "";
    validarTransicion(actual, nuevo);

    Activo activo = n.getActivo();
    if (activo == null || activo.getIdActivo() == null) {
      throw new IllegalStateException("La novedad no tiene activo asociado");
    }
    Activo activoManaged =
        activoRepository
            .findById(activo.getIdActivo())
            .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));

    if ("ENVIADO_MANTENIMIENTO".equals(nuevo)) {
      activoManaged.setEstado(EstadoActivo.MANTENIMIENTO);
      activoRepository.saveAndFlush(activoManaged);
      n.setCerradaTrasMantenimiento(false);
    } else if ("CERRADO".equals(nuevo)) {
      if ("ENVIADO_MANTENIMIENTO".equals(actual)) {
        n.setCerradaTrasMantenimiento(true);
        activoManaged.setEstado(EstadoActivo.ASIGNADO);
        activoRepository.saveAndFlush(activoManaged);
      } else {
        n.setCerradaTrasMantenimiento(false);
      }
    }

    n.setActivo(activoManaged);
    n.setEstado(nuevo);
    if (body.getComentarioAdmin() != null && !body.getComentarioAdmin().isBlank()) {
      n.setComentarioAdmin(body.getComentarioAdmin().trim());
    }
    n.setFechaRespuesta(Instant.now());
    return novedadActivoRepository.save(n);
  }

  private void validarTransicion(String actual, String nuevo) {
    if ("PENDIENTE".equals(actual)) {
      if (!"ENVIADO_MANTENIMIENTO".equals(nuevo) && !"CERRADO".equals(nuevo)) {
        throw new IllegalArgumentException("Desde PENDIENTE solo se puede pasar a ENVIADO_MANTENIMIENTO o CERRADO");
      }
      return;
    }
    if ("ENVIADO_MANTENIMIENTO".equals(actual)) {
      if (!"CERRADO".equals(nuevo)) {
        throw new IllegalArgumentException("Desde ENVIADO_MANTENIMIENTO solo se puede pasar a CERRADO");
      }
      return;
    }
    if ("CERRADO".equals(actual)) {
      throw new IllegalArgumentException("La novedad ya está cerrada");
    }
    throw new IllegalArgumentException("Estado actual no reconocido");
  }
}
