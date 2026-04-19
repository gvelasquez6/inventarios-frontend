package com.inventarios.api.repository;

import com.inventarios.api.domain.CuentaUsuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CuentaUsuarioRepository extends JpaRepository<CuentaUsuario, Long> {

  Optional<CuentaUsuario> findByUsernameIgnoreCase(String username);

  boolean existsByUsernameIgnoreCase(String username);

  Optional<CuentaUsuario> findByIdEmpleado(Long idEmpleado);

  boolean existsByIdEmpleado(Long idEmpleado);
}
