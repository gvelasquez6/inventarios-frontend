package com.inventarios.api.repository;

import com.inventarios.api.domain.Asignacion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {

  @Query(
      "SELECT a FROM Asignacion a JOIN FETCH a.activo JOIN FETCH a.empleado ORDER BY a.idAsignacion ASC")
  List<Asignacion> findAllOrdenadasConActivoYEmpleado();

  @Query(
      "SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Asignacion a "
          + "WHERE a.empleado.idEmpleado = :idEmpleado AND a.activo.idActivo = :idActivo "
          + "AND LOWER(a.estado) = LOWER(:estado)")
  boolean existsActivaPorEmpleadoYActivo(
      @Param("idEmpleado") Long idEmpleado,
      @Param("idActivo") Long idActivo,
      @Param("estado") String estado);
}
