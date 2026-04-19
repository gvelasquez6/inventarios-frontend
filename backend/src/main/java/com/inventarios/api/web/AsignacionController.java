package com.inventarios.api.web;

import com.inventarios.api.domain.Asignacion;
import com.inventarios.api.repository.AsignacionRepository;
import com.inventarios.api.service.AsignacionService;
import com.inventarios.api.web.dto.NuevaAsignacionRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/asignaciones")
public class AsignacionController {

  private final AsignacionRepository asignacionRepository;
  private final AsignacionService asignacionService;

  public AsignacionController(
      AsignacionRepository asignacionRepository, AsignacionService asignacionService) {
    this.asignacionRepository = asignacionRepository;
    this.asignacionService = asignacionService;
  }

  @GetMapping
  public List<Asignacion> listar() {
    return asignacionRepository.findAllOrdenadasConActivoYEmpleado();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Asignacion crear(@RequestBody NuevaAsignacionRequest body) {
    if (body == null
        || body.getActivo() == null
        || body.getEmpleado() == null
        || body.getActivo().getIdActivo() == null
        || body.getEmpleado().getIdEmpleado() == null) {
      throw new IllegalArgumentException("activo.idActivo y empleado.idEmpleado son obligatorios");
    }
    return asignacionService.crear(
        body.getActivo().getIdActivo(),
        body.getEmpleado().getIdEmpleado(),
        body.getFechaAsignacion());
  }

  @PutMapping("/{id}")
  public Asignacion actualizar(@PathVariable Long id, @RequestBody NuevaAsignacionRequest body) {
    if (body == null
        || body.getActivo() == null
        || body.getEmpleado() == null
        || body.getActivo().getIdActivo() == null
        || body.getEmpleado().getIdEmpleado() == null) {
      throw new IllegalArgumentException("activo.idActivo y empleado.idEmpleado son obligatorios");
    }
    return asignacionService.actualizar(
        id,
        body.getActivo().getIdActivo(),
        body.getEmpleado().getIdEmpleado(),
        body.getFechaAsignacion());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable Long id) {
    asignacionService.eliminar(id);
  }
}
