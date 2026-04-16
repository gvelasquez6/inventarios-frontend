package com.inventarios.api.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

  @Bean
  public CorsFilter corsFilter(
      @Value("${app.cors.allowed-origins:http://localhost:4200}") String allowedOrigins) {
    CorsConfiguration config = new CorsConfiguration();
    // Angular no envía cookies al API; así evitamos reglas estrictas de credenciales en CORS.
    config.setAllowCredentials(false);
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");

    List<String> patterns = new ArrayList<>();
    patterns.add("http://localhost:*");
    patterns.add("http://127.0.0.1:*");
    for (String o : allowedOrigins.split(",")) {
      String t = o.trim();
      if (!t.isEmpty()) {
        patterns.add(t);
      }
    }
    config.setAllowedOriginPatterns(patterns);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
  }
}
