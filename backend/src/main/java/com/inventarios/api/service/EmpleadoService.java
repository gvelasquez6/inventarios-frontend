package com.inventarios.api.service;

import com.inventarios.api.domain.CuentaUsuario;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.RolCuenta;
import com.inventarios.api.repository.CuentaUsuarioRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.web.dto.EmpleadoCreadoResponse;
import com.inventarios.api.web.dto.NuevoEmpleadoRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmpleadoService {

  private final EmpleadoRepository empleadoRepository;
  private final CuentaUsuarioRepository cuentaUsuarioRepository;
  private final PasswordEncoder passwordEncoder;
  private final AutenticacionService autenticacionService;

  public EmpleadoService(
      EmpleadoRepository empleadoRepository,
      CuentaUsuarioRepository cuentaUsuarioRepository,
      PasswordEncoder passwordEncoder,
      AutenticacionService autenticacionService) {
    this.empleadoRepository = empleadoRepository;
    this.cuentaUsuarioRepository = cuentaUsuarioRepository;
    this.passwordEncoder = passwordEncoder;
    this.autenticacionService = autenticacionService;
  }

  @Transactional
  public EmpleadoCreadoResponse crearConCuenta(NuevoEmpleadoRequest body) {
    if (body == null) {
      throw new IllegalArgumentException("Cuerpo de solicitud vacío");
    }
    String nombre = body.getNombre() != null ? body.getNombre().trim() : "";
    if (nombre.isEmpty()) {
      throw new IllegalArgumentException("El nombre es obligatorio");
    }
    String uRaw = body.getUsername() == null ? "" : body.getUsername().trim();
    String pRaw = body.getPassword() == null ? "" : body.getPassword().trim();
    boolean indicoUsuario = !uRaw.isEmpty();
    boolean indicoPassword = !pRaw.isEmpty();
    if (indicoUsuario != indicoPassword) {
      throw new IllegalArgumentException(
          "Indique usuario y contraseña juntos, o deje ambos vacíos para generación automática");
    }
    if (indicoUsuario) {
      if (uRaw.length() < 3) {
        throw new IllegalArgumentException("El usuario debe tener al menos 3 caracteres");
      }
      if (pRaw.length() < 4) {
        throw new IllegalArgumentException("La contraseña debe tener al menos 4 caracteres");
      }
      if (cuentaUsuarioRepository.existsByUsernameIgnoreCase(uRaw)) {
        throw new IllegalArgumentException("Ya existe una cuenta con ese nombre de usuario");
      }
    }

    Empleado e = new Empleado();
    e.setNombre(nombre);
    e.setCargo(body.getCargo().trim());
    e.setArea(body.getArea().trim());
    e.setActivo(body.getActivo() != null ? body.getActivo() : Boolean.TRUE);
    e = empleadoRepository.save(e);
    Long idEmpleado = e.getIdEmpleado();

    String usernameFinal;
    String passwordPlano;
    boolean generada;
    if (indicoUsuario) {
      usernameFinal = uRaw;
      passwordPlano = pRaw;
      generada = false;
    } else {
      String base = autenticacionService.generarUsernameBase(e.getNombre());
      usernameFinal = autenticacionService.asegurarUsernameUnico(base);
      passwordPlano = autenticacionService.passwordInicialFuncionario(idEmpleado);
      generada = true;
    }

    CuentaUsuario cuenta = new CuentaUsuario();
    cuenta.setUsername(usernameFinal);
    cuenta.setPasswordHash(passwordEncoder.encode(passwordPlano));
    cuenta.setRol(RolCuenta.FUNCIONARIO);
    cuenta.setIdEmpleado(idEmpleado);
    cuentaUsuarioRepository.save(cuenta);

    EmpleadoCreadoResponse resp = new EmpleadoCreadoResponse();
    resp.setEmpleado(e);
    resp.setCredencialUsuario(usernameFinal);
    resp.setCredencialPassword(generada ? passwordPlano : null);
    resp.setCredencialGenerada(generada);
    return resp;
  }

  @Transactional
  public Empleado actualizar(Long id, NuevoEmpleadoRequest body) {
    Empleado e =
        empleadoRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
    e.setNombre(body.getNombre().trim());
    e.setCargo(body.getCargo().trim());
    e.setArea(body.getArea().trim());
    if (body.getActivo() != null) {
      e.setActivo(body.getActivo());
    }
    return empleadoRepository.save(e);
  }
}
