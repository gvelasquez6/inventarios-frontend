package com.inventarios.api.config;

import com.inventarios.api.domain.Activo;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.EstadoActivo;
import com.inventarios.api.repository.ActivoRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements ApplicationRunner {

  private final ActivoRepository activoRepository;
  private final EmpleadoRepository empleadoRepository;

  public DataInitializer(ActivoRepository activoRepository, EmpleadoRepository empleadoRepository) {
    this.activoRepository = activoRepository;
    this.empleadoRepository = empleadoRepository;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (activoRepository.count() == 0) {
      Activo a = new Activo();
      a.setTipo("Laptop");
      a.setMarca("Dell");
      a.setModelo("XPS 15");
      a.setSerial("123ABC");
      a.setEstado(EstadoActivo.DISPONIBLE);
      activoRepository.save(a);
    }
    if (empleadoRepository.count() == 0) {
      Empleado e = new Empleado();
      e.setNombre("Juan Perez");
      e.setCargo("Analista");
      e.setArea("TI");
      empleadoRepository.save(e);
    }
  }
}
