package com.inventarios.api.web;

import com.inventarios.api.service.AutenticacionService;
import com.inventarios.api.web.dto.CambioPasswordRequest;
import com.inventarios.api.web.dto.LoginRequest;
import com.inventarios.api.web.dto.LoginResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AutenticacionService autenticacionService;

  public AuthController(AutenticacionService autenticacionService) {
    this.autenticacionService = autenticacionService;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest body) {
    return autenticacionService
        .login(body.getUsername(), body.getPassword())
        .<ResponseEntity<?>>map(ResponseEntity::ok)
        .orElse(
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Usuario o contraseña incorrectos")));
  }

  @GetMapping("/me")
  public LoginResponse me(Authentication authentication) {
    return autenticacionService.refrescarSesionDesdeToken(authentication.getName());
  }

  @PostMapping("/cambiar-contrasena")
  public ResponseEntity<Map<String, String>> cambiarContrasena(
      Authentication authentication, @Valid @RequestBody CambioPasswordRequest body) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    autenticacionService.cambiarPassword(authentication.getName(), body);
    return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada"));
  }
}
