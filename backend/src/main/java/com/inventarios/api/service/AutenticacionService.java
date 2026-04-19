package com.inventarios.api.service;

import com.inventarios.api.domain.CuentaUsuario;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.RolCuenta;
import com.inventarios.api.repository.CuentaUsuarioRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.web.dto.CambioPasswordRequest;
import com.inventarios.api.web.dto.LoginResponse;
import java.util.Locale;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutenticacionService {

  private final CuentaUsuarioRepository cuentaUsuarioRepository;
  private final EmpleadoRepository empleadoRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AutenticacionService(
      CuentaUsuarioRepository cuentaUsuarioRepository,
      EmpleadoRepository empleadoRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService) {
    this.cuentaUsuarioRepository = cuentaUsuarioRepository;
    this.empleadoRepository = empleadoRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public Optional<LoginResponse> login(String username, String password) {
    if (username == null || username.isBlank() || password == null) {
      return Optional.empty();
    }
    Optional<CuentaUsuario> opt =
        cuentaUsuarioRepository.findByUsernameIgnoreCase(username.trim());
    if (opt.isEmpty()) {
      return Optional.empty();
    }
    CuentaUsuario c = opt.get();
    if (!passwordEncoder.matches(password, c.getPasswordHash())) {
      return Optional.empty();
    }
    Empleado empleado = null;
    if (c.getIdEmpleado() != null) {
      empleado = empleadoRepository.findById(c.getIdEmpleado()).orElse(null);
    }
    String nombre =
        empleado != null && empleado.getNombre() != null
            ? empleado.getNombre()
            : "Administrador";
    String token = jwtService.generarToken(c, empleado);
    return Optional.of(
        new LoginResponse(
            token,
            "Bearer",
            jwtService.getExpirationMillis() / 1000,
            c.getUsername(),
            nombre,
            c.getRol().name(),
            c.getIdEmpleado(),
            empleado != null ? empleado.getCargo() : null,
            empleado != null ? empleado.getArea() : null));
  }

  @Transactional
  public void cambiarPassword(String username, CambioPasswordRequest body) {
    if (body == null
        || body.getPasswordActual() == null
        || body.getPasswordNueva() == null) {
      throw new IllegalArgumentException("passwordActual y passwordNueva son obligatorias");
    }
    String actual = body.getPasswordActual().trim();
    String nueva = body.getPasswordNueva().trim();
    if (actual.isEmpty() || nueva.isEmpty()) {
      throw new IllegalArgumentException("Las contraseñas no pueden estar vacías");
    }
    if (nueva.length() < 4) {
      throw new IllegalArgumentException("La nueva contraseña debe tener al menos 4 caracteres");
    }
    if (nueva.equals(actual)) {
      throw new IllegalArgumentException("La nueva contraseña debe ser distinta a la actual");
    }
    CuentaUsuario c =
        cuentaUsuarioRepository
            .findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    if (!passwordEncoder.matches(actual, c.getPasswordHash())) {
      throw new IllegalArgumentException("La contraseña actual no es correcta");
    }
    c.setPasswordHash(passwordEncoder.encode(nueva));
    cuentaUsuarioRepository.save(c);
  }

  public LoginResponse refrescarSesionDesdeToken(String username) {
    CuentaUsuario c =
        cuentaUsuarioRepository
            .findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    Empleado empleado = null;
    if (c.getIdEmpleado() != null) {
      empleado = empleadoRepository.findById(c.getIdEmpleado()).orElse(null);
    }
    String nombre =
        empleado != null && empleado.getNombre() != null
            ? empleado.getNombre()
            : "Administrador";
    String token = jwtService.generarToken(c, empleado);
    return new LoginResponse(
        token,
        "Bearer",
        jwtService.getExpirationMillis() / 1000,
        c.getUsername(),
        nombre,
        c.getRol().name(),
        c.getIdEmpleado(),
        empleado != null ? empleado.getCargo() : null,
        empleado != null ? empleado.getArea() : null);
  }

  /** Genera nombre de usuario tipo slug a partir del nombre completo. */
  public String generarUsernameBase(String nombreCompleto) {
    if (nombreCompleto == null) {
      return "funcionario";
    }
    String raw =
        nombreCompleto
            .toLowerCase(Locale.ROOT)
            .replaceAll("\\p{M}+", "")
            .trim()
            .replaceAll("[^a-z0-9]+", ".")
            .replaceAll("^\\.+|\\.+$", "");
    return raw.isEmpty() ? "funcionario" : raw;
  }

  public String asegurarUsernameUnico(String base) {
    String candidato = base;
    int n = 2;
    while (cuentaUsuarioRepository.existsByUsernameIgnoreCase(candidato)) {
      candidato = base + n;
      n++;
    }
    return candidato;
  }

  public String passwordInicialFuncionario(long idEmpleado) {
    return "Func-" + String.format("%04d", idEmpleado);
  }
}
