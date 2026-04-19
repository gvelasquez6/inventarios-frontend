package com.inventarios.api.web.dto;

public record LoginResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    String username,
    String nombre,
    String rol,
    Long idEmpleado,
    String cargo,
    String area) {}
