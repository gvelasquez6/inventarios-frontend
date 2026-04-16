package com.inventarios.api.web;

import com.inventarios.api.domain.Empleado;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.web.dto.NuevoEmpleadoRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {

  private final EmpleadoRepository empleadoRepository;

  public EmpleadoController(EmpleadoRepository empleadoRepository) {
    this.empleadoRepository = empleadoRepository;
  }

  @GetMapping
  public List<Empleado> listar() {
    return empleadoRepository.findAll(Sort.by(Sort.Direction.ASC, "idEmpleado"));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Empleado crear(@Valid @RequestBody NuevoEmpleadoRequest body) {
    Empleado e = new Empleado();
    e.setNombre(body.getNombre().trim());
    e.setCargo(body.getCargo().trim());
    e.setArea(body.getArea().trim());
    e.setActivo(body.getActivo() != null ? body.getActivo() : Boolean.TRUE);
    return empleadoRepository.save(e);
  }

  @PutMapping("/{id}")
  public Empleado actualizar(
      @PathVariable Long id, @Valid @RequestBody NuevoEmpleadoRequest body) {
    Empleado e =
        empleadoRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
    e.setNombre(body.getNombre().trim());
    e.setCargo(body.getCargo().trim());
    e.setArea(body.getArea().trim());
    if (body.getActivo() != null) {
      e.setActivo(body.getActivo());
    }
    return empleadoRepository.save(e);
  }
}
