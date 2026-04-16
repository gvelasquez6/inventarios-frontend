package com.inventarios.api.repository;

import com.inventarios.api.domain.SolicitudAsignacion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SolicitudAsignacionRepository extends JpaRepository<SolicitudAsignacion, Long> {
  List<SolicitudAsignacion> findByEmpleado_IdEmpleadoOrderByFechaSolicitudDesc(Long idEmpleado);

  boolean existsByEmpleado_IdEmpleadoAndActivo_IdActivoAndEstadoSolicitud(
      Long idEmpleado, Long idActivo, String estadoSolicitud);

  @Query(
      "SELECT s FROM SolicitudAsignacion s WHERE s.empleado.idEmpleado = :idEmpleado "
          + "AND s.activo.idActivo = :idActivo AND LOWER(s.estadoSolicitud) = LOWER(:estado)")
  List<SolicitudAsignacion> findPorEmpleadoActivoYEstado(
      @Param("idEmpleado") Long idEmpleado,
      @Param("idActivo") Long idActivo,
      @Param("estado") String estado);

  List<SolicitudAsignacion> findByEstadoSolicitudIgnoreCase(String estadoSolicitud);
}
