package com.inventarios.api.web;

import com.inventarios.api.domain.Activo;
import com.inventarios.api.domain.EstadoActivo;
import com.inventarios.api.repository.ActivoRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/activos")
public class ActivoController {

  @Autowired private ActivoRepository repo;

  @GetMapping
  public List<Activo> listar() {
    return repo.findAll();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Activo guardar(@RequestBody Activo activo) {
    activo.setIdActivo(null);
    if (activo.getEstado() == null) {
      activo.setEstado(EstadoActivo.DISPONIBLE);
    }
    return repo.save(activo);
  }

  @PutMapping("/{id}")
  public Activo actualizar(@PathVariable Long id, @RequestBody Activo activo) {
    if (!repo.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Activo no encontrado");
    }
    activo.setIdActivo(id);
    return repo.save(activo);
  }
}
