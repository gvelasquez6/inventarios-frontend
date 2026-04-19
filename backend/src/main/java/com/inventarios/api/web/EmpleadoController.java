package com.inventarios.api.web;

import com.inventarios.api.domain.Empleado;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.service.EmpleadoService;
import com.inventarios.api.web.dto.EmpleadoCreadoResponse;
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
  private final EmpleadoService empleadoService;

  public EmpleadoController(EmpleadoRepository empleadoRepository, EmpleadoService empleadoService) {
    this.empleadoRepository = empleadoRepository;
    this.empleadoService = empleadoService;
  }

  @GetMapping
  public List<Empleado> listar() {
    return empleadoRepository.findAll(Sort.by(Sort.Direction.ASC, "idEmpleado"));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public EmpleadoCreadoResponse crear(@Valid @RequestBody NuevoEmpleadoRequest body) {
    return empleadoService.crearConCuenta(body);
  }

  @PutMapping("/{id}")
  public Empleado actualizar(@PathVariable Long id, @Valid @RequestBody NuevoEmpleadoRequest body) {
    return empleadoService.actualizar(id, body);
  }
}
