package com.inventarios.api.web;

import com.inventarios.api.domain.SolicitudAsignacion;
import com.inventarios.api.service.SolicitudAsignacionService;
import com.inventarios.api.web.dto.NuevaSolicitudAsignacionRequest;
import com.inventarios.api.web.dto.ProcesarSolicitudAsignacionRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/solicitudes-asignacion")
public class SolicitudAsignacionController {

  private final SolicitudAsignacionService solicitudService;

  public SolicitudAsignacionController(SolicitudAsignacionService solicitudService) {
    this.solicitudService = solicitudService;
  }

  @GetMapping
  public List<SolicitudAsignacion> listar(
      @RequestParam(name = "idEmpleado", required = false) Long idEmpleado) {
    return solicitudService.listar(idEmpleado);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SolicitudAsignacion crear(@Valid @RequestBody NuevaSolicitudAsignacionRequest body) {
    return solicitudService.crear(body.getIdActivo(), body.getIdEmpleado(), body.getMotivo());
  }

  @PutMapping("/{id}")
  public SolicitudAsignacion actualizar(
      @PathVariable Long id, @Valid @RequestBody NuevaSolicitudAsignacionRequest body) {
    return solicitudService.actualizar(
        id, body.getIdEmpleado(), body.getIdActivo(), body.getMotivo());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable Long id, @RequestParam(name = "idEmpleado") Long idEmpleado) {
    solicitudService.eliminar(id, idEmpleado);
  }

  /**
   * Eliminación vía POST para entornos donde DELETE no llega al controlador (proxies, despliegues
   * antiguos). Misma regla de negocio que {@link #eliminar}.
   */
  @PostMapping("/{id}/eliminar")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminarPorPost(
      @PathVariable Long id, @RequestParam(name = "idEmpleado") Long idEmpleado) {
    solicitudService.eliminar(id, idEmpleado);
  }

  @PutMapping("/{id}/aprobar")
  public SolicitudAsignacion aprobar(
      @PathVariable Long id,
      @Valid @RequestBody(required = false) ProcesarSolicitudAsignacionRequest body) {
    return solicitudService.aprobar(id, body == null ? null : body.getComentarioAdmin());
  }

  @PutMapping("/{id}/rechazar")
  public SolicitudAsignacion rechazar(
      @PathVariable Long id,
      @Valid @RequestBody(required = false) ProcesarSolicitudAsignacionRequest body) {
    return solicitudService.rechazar(id, body == null ? null : body.getComentarioAdmin());
  }
}
