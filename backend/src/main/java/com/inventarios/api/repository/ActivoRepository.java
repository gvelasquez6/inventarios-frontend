package com.inventarios.api.repository;

import com.inventarios.api.domain.Activo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivoRepository extends JpaRepository<Activo, Long> {}
