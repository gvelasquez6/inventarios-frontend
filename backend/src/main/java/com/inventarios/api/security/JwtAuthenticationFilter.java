package com.inventarios.api.security;

import com.inventarios.api.domain.RolCuenta;
import com.inventarios.api.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String header = request.getHeader(HttpHeaders.AUTHORIZATION);
      if (header != null && header.startsWith("Bearer ")) {
        String token = header.substring(7).trim();
        if (!token.isEmpty()) {
          Claims claims = jwtService.parsearClaims(token);
          String username = claims.getSubject();
          String rolStr = claims.get("rol", String.class);
          RolCuenta rol;
          try {
            rol = rolStr != null ? RolCuenta.valueOf(rolStr) : RolCuenta.FUNCIONARIO;
          } catch (IllegalArgumentException ex) {
            rol = RolCuenta.FUNCIONARIO;
          }
          var authorities =
              List.of(new SimpleGrantedAuthority(JwtService.rolAuthority(rol)));
          var auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      }
    } catch (JwtException | IllegalArgumentException ex) {
      SecurityContextHolder.clearContext();
    }
    filterChain.doFilter(request, response);
  }
}
