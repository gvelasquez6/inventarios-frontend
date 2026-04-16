package com.inventarios.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "activos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Activo {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_activo")
  private Long idActivo;

  private String tipo;
  private String marca;
  private String modelo;

  /** Columna física distinta: en PostgreSQL el nombre `serial` es problemático (tipo SERIAL). */
  @Column(name = "numero_serie")
  private String serial;

  @Enumerated(EnumType.STRING)
  private EstadoActivo estado = EstadoActivo.DISPONIBLE;

  public Long getIdActivo() {
    return idActivo;
  }

  public void setIdActivo(Long idActivo) {
    this.idActivo = idActivo;
  }

  public String getTipo() {
    return tipo;
  }

  public void setTipo(String tipo) {
    this.tipo = tipo;
  }

  public String getMarca() {
    return marca;
  }

  public void setMarca(String marca) {
    this.marca = marca;
  }

  public String getModelo() {
    return modelo;
  }

  public void setModelo(String modelo) {
    this.modelo = modelo;
  }

  public String getSerial() {
    return serial;
  }

  public void setSerial(String serial) {
    this.serial = serial;
  }

  public EstadoActivo getEstado() {
    return estado;
  }

  public void setEstado(EstadoActivo estado) {
    this.estado = estado;
  }
}
