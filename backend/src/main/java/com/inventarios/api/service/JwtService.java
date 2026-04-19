package com.inventarios.api.service;

import com.inventarios.api.domain.CuentaUsuario;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.RolCuenta;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final SecretKey key;
  private final long expirationMillis;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-minutes:480}") long expirationMinutes) {
    if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
      throw new IllegalStateException("app.jwt.secret debe tener al menos 32 bytes (UTF-8)");
    }
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMillis = Math.max(5L, expirationMinutes) * 60_000L;
  }

  public String generarToken(CuentaUsuario cuenta, Empleado empleado) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("rol", cuenta.getRol().name());
    if (empleado != null) {
      claims.put("nombre", empleado.getNombre());
      claims.put("idEmpleado", empleado.getIdEmpleado());
      claims.put("cargo", empleado.getCargo());
      claims.put("area", empleado.getArea());
    } else {
      claims.put("nombre", "Administrador");
    }
    Instant now = Instant.now();
    return Jwts.builder()
        .claims(claims)
        .subject(cuenta.getUsername())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusMillis(expirationMillis)))
        .signWith(key)
        .compact();
  }

  public Claims parsearClaims(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }

  public long getExpirationMillis() {
    return expirationMillis;
  }

  public static String rolAuthority(RolCuenta rol) {
    return "ROLE_" + rol.name();
  }
}
