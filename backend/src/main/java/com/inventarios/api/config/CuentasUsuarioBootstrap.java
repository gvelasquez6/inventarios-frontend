package com.inventarios.api.config;

import com.inventarios.api.domain.CuentaUsuario;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.RolCuenta;
import com.inventarios.api.repository.CuentaUsuarioRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.service.AutenticacionService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea la cuenta administrador por defecto y cuentas para empleados existentes sin acceso al
 * sistema.
 */
@Component
@Order(50)
public class CuentasUsuarioBootstrap implements ApplicationRunner {

  private final CuentaUsuarioRepository cuentaUsuarioRepository;
  private final EmpleadoRepository empleadoRepository;
  private final PasswordEncoder passwordEncoder;
  private final AutenticacionService autenticacionService;

  public CuentasUsuarioBootstrap(
      CuentaUsuarioRepository cuentaUsuarioRepository,
      EmpleadoRepository empleadoRepository,
      PasswordEncoder passwordEncoder,
      AutenticacionService autenticacionService) {
    this.cuentaUsuarioRepository = cuentaUsuarioRepository;
    this.empleadoRepository = empleadoRepository;
    this.passwordEncoder = passwordEncoder;
    this.autenticacionService = autenticacionService;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (cuentaUsuarioRepository.count() == 0) {
      CuentaUsuario admin = new CuentaUsuario();
      admin.setUsername("admin");
      admin.setPasswordHash(passwordEncoder.encode("admin"));
      admin.setRol(RolCuenta.ADMIN);
      admin.setIdEmpleado(null);
      cuentaUsuarioRepository.save(admin);
    }
    for (Empleado e : empleadoRepository.findAll()) {
      if (e.getIdEmpleado() == null) {
        continue;
      }
      if (cuentaUsuarioRepository.existsByIdEmpleado(e.getIdEmpleado())) {
        continue;
      }
      String base = autenticacionService.generarUsernameBase(e.getNombre());
      String username = autenticacionService.asegurarUsernameUnico(base);
      String plain = autenticacionService.passwordInicialFuncionario(e.getIdEmpleado());
      CuentaUsuario c = new CuentaUsuario();
      c.setUsername(username);
      c.setPasswordHash(passwordEncoder.encode(plain));
      c.setRol(RolCuenta.FUNCIONARIO);
      c.setIdEmpleado(e.getIdEmpleado());
      cuentaUsuarioRepository.save(c);
    }
  }
}
