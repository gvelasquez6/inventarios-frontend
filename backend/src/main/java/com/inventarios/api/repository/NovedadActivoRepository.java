package com.inventarios.api.repository;

import com.inventarios.api.domain.NovedadActivo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NovedadActivoRepository extends JpaRepository<NovedadActivo, Long> {

  List<NovedadActivo> findAllByOrderByFechaReporteDesc();

  List<NovedadActivo> findByEmpleado_IdEmpleadoOrderByFechaReporteDesc(Long idEmpleado);
}
