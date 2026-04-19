package com.inventarios.api.web;

import com.inventarios.api.domain.NovedadActivo;
import com.inventarios.api.service.NovedadActivoService;
import com.inventarios.api.web.dto.ActualizarEstadoNovedadRequest;
import com.inventarios.api.web.dto.NuevaNovedadActivoRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/novedades-activo")
public class NovedadActivoController {

  private final NovedadActivoService novedadActivoService;

  public NovedadActivoController(NovedadActivoService novedadActivoService) {
    this.novedadActivoService = novedadActivoService;
  }

  @GetMapping
  public List<NovedadActivo> listarTodas() {
    return novedadActivoService.listarTodas();
  }

  @GetMapping("/mias")
  public List<NovedadActivo> listarMias(@RequestParam("idEmpleado") Long idEmpleado) {
    return novedadActivoService.listarPorEmpleado(idEmpleado);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public NovedadActivo crear(@RequestBody NuevaNovedadActivoRequest body) {
    return novedadActivoService.crear(body);
  }

  @PutMapping("/{id}/estado")
  public NovedadActivo actualizarEstado(
      @PathVariable Long id, @RequestBody ActualizarEstadoNovedadRequest body) {
    return novedadActivoService.actualizarEstado(id, body);
  }
}
