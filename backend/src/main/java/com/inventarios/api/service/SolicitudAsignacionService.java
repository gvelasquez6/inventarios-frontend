package com.inventarios.api.service;

import com.inventarios.api.domain.Activo;
import com.inventarios.api.domain.Empleado;
import com.inventarios.api.domain.SolicitudAsignacion;
import com.inventarios.api.repository.ActivoRepository;
import com.inventarios.api.repository.AsignacionRepository;
import com.inventarios.api.repository.EmpleadoRepository;
import com.inventarios.api.repository.SolicitudAsignacionRepository;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SolicitudAsignacionService {

  private final SolicitudAsignacionRepository solicitudRepository;
  private final ActivoRepository activoRepository;
  private final EmpleadoRepository empleadoRepository;
  private final AsignacionRepository asignacionRepository;
  private final Path storageRoot = Paths.get("storage", "solicitudes");

  public SolicitudAsignacionService(
      SolicitudAsignacionRepository solicitudRepository,
      ActivoRepository activoRepository,
      EmpleadoRepository empleadoRepository,
      AsignacionRepository asignacionRepository) {
    this.solicitudRepository = solicitudRepository;
    this.activoRepository = activoRepository;
    this.empleadoRepository = empleadoRepository;
    this.asignacionRepository = asignacionRepository;
  }

  @Transactional
  public List<SolicitudAsignacion> listar(Long idEmpleado) {
    if (idEmpleado != null) {
      return solicitudRepository.findByEmpleado_IdEmpleadoOrderByFechaSolicitudDesc(idEmpleado);
    }
    sincronizarSolicitudesConAsignacionActiva();
    return solicitudRepository.findAll(Sort.by(Sort.Direction.DESC, "fechaSolicitud"));
  }

  /**
   * Si ya existe asignación ACTIVA para el mismo empleado y activo, la solicitud debe figurar como
   * ASIGNADO (corrige datos anteriores o desincronizaciones).
   */
  private void sincronizarSolicitudesConAsignacionActiva() {
    List<SolicitudAsignacion> candidatas = new ArrayList<>();
    candidatas.addAll(solicitudRepository.findByEstadoSolicitudIgnoreCase("APROBADA"));
    candidatas.addAll(solicitudRepository.findByEstadoSolicitudIgnoreCase("COMPLETADO"));
    List<SolicitudAsignacion> actualizar = new ArrayList<>();
    for (SolicitudAsignacion s : candidatas) {
      Long idE = s.getEmpleado().getIdEmpleado();
      Long idA = s.getActivo().getIdActivo();
      if (asignacionRepository.existsActivaPorEmpleadoYActivo(idE, idA, "ACTIVA")) {
        s.setEstadoSolicitud("ASIGNADO");
        actualizar.add(s);
      }
    }
    if (!actualizar.isEmpty()) {
      solicitudRepository.saveAll(actualizar);
    }
  }

  @Transactional
  public SolicitudAsignacion crear(Long idActivo, Long idEmpleado, String motivo) {
    Activo activo =
        activoRepository
            .findById(idActivo)
            .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));

    Empleado empleado =
        empleadoRepository
            .findById(idEmpleado)
            .orElseThrow(() -> new IllegalArgumentException("El empleado no existe"));

    SolicitudAsignacion s = new SolicitudAsignacion();
    s.setActivo(activo);
    s.setEmpleado(empleado);
    s.setEstadoSolicitud("PENDIENTE");
    s.setMotivo(motivo == null ? null : motivo.trim());
    s.setFechaSolicitud(Instant.now());
    return solicitudRepository.save(s);
  }

  @Transactional
  public SolicitudAsignacion actualizar(
      Long idSolicitud, Long idEmpleado, Long idActivo, String motivo) {
    SolicitudAsignacion s =
        solicitudRepository
            .findById(idSolicitud)
            .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe"));
    if (!Objects.equals(s.getEmpleado().getIdEmpleado(), idEmpleado)) {
      throw new IllegalArgumentException("No puedes modificar esta solicitud");
    }
    if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes modificar solicitudes pendientes");
    }
    Activo activo =
        activoRepository
            .findById(idActivo)
            .orElseThrow(() -> new IllegalArgumentException("El activo no existe"));
    s.setActivo(activo);
    s.setMotivo(motivo == null ? null : motivo.trim());
    return solicitudRepository.save(s);
  }

  @Transactional
  public void eliminar(Long idSolicitud, Long idEmpleado) {
    SolicitudAsignacion s =
        solicitudRepository
            .findById(idSolicitud)
            .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe"));
    if (!Objects.equals(s.getEmpleado().getIdEmpleado(), idEmpleado)) {
      throw new IllegalArgumentException("No puedes eliminar esta solicitud");
    }
    if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes eliminar solicitudes pendientes");
    }
    solicitudRepository.delete(s);
  }

  @Transactional
  public SolicitudAsignacion aprobar(Long idSolicitud, String comentarioAdmin) {
    return procesarAdmin(idSolicitud, "APROBADA", comentarioAdmin);
  }

  @Transactional
  public SolicitudAsignacion rechazar(Long idSolicitud, String comentarioAdmin) {
    return procesarAdmin(idSolicitud, "RECHAZADA", comentarioAdmin);
  }

  @Transactional(readOnly = true)
  public byte[] descargarPdfOriginal(Long idSolicitud) {
    SolicitudAsignacion solicitud = buscarSolicitud(idSolicitud);
    return construirPdfSolicitud(solicitud);
  }

  @Transactional
  public SolicitudAsignacion subirPdfFirmado(Long idSolicitud, MultipartFile archivo) {
    if (archivo == null || archivo.isEmpty()) {
      throw new IllegalArgumentException("Debes adjuntar un archivo PDF.");
    }
    String nombre = archivo.getOriginalFilename() == null ? "" : archivo.getOriginalFilename().toLowerCase();
    String contentType = archivo.getContentType() == null ? "" : archivo.getContentType().toLowerCase();
    if (!contentType.contains("pdf") && !nombre.endsWith(".pdf")) {
      throw new IllegalArgumentException("Solo se permiten archivos PDF.");
    }

    SolicitudAsignacion solicitud = buscarSolicitud(idSolicitud);
    String estado = solicitud.getEstadoSolicitud() == null ? "" : solicitud.getEstadoSolicitud().trim().toUpperCase();
    if (!"APROBADA".equals(estado)
        && !"PENDIENTE_FIRMA".equals(estado)
        && !"RECHAZADO_FIRMA".equals(estado)) {
      throw new IllegalArgumentException("Solo se pueden subir firmas para solicitudes aprobadas.");
    }

    Path folder = storageRoot.resolve(String.valueOf(idSolicitud));
    Path destinoVersion = folder.resolve("firmado-" + Instant.now().toEpochMilli() + ".pdf");
    Path destinoActual = folder.resolve("firmado-latest.pdf");
    try {
      Files.createDirectories(folder);
      Files.copy(archivo.getInputStream(), destinoVersion, StandardCopyOption.REPLACE_EXISTING);
      Files.copy(destinoVersion, destinoActual, StandardCopyOption.REPLACE_EXISTING);
    } catch (IOException ex) {
      throw new UncheckedIOException("No se pudo guardar el PDF firmado.", ex);
    }

    solicitud.setEstadoSolicitud("FIRMADO");
    solicitud.setFechaRespuesta(Instant.now());
    return solicitudRepository.save(solicitud);
  }

  @Transactional(readOnly = true)
  public byte[] descargarPdfFirmado(Long idSolicitud) {
    buscarSolicitud(idSolicitud);
    Path firmado = storageRoot.resolve(String.valueOf(idSolicitud)).resolve("firmado-latest.pdf");
    if (!Files.exists(firmado)) {
      throw new IllegalArgumentException("No hay PDF firmado para esta solicitud.");
    }
    try {
      return Files.readAllBytes(firmado);
    } catch (IOException ex) {
      throw new UncheckedIOException("No se pudo leer el PDF firmado.", ex);
    }
  }

  @Transactional
  public SolicitudAsignacion aprobarFinal(Long idSolicitud, String comentarioAdmin) {
    SolicitudAsignacion solicitud = buscarSolicitud(idSolicitud);
    if (!"FIRMADO".equalsIgnoreCase(solicitud.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes aprobar final solicitudes firmadas.");
    }
    solicitud.setEstadoSolicitud("COMPLETADO");
    solicitud.setComentarioAdmin(comentarioAdmin == null ? null : comentarioAdmin.trim());
    solicitud.setFechaRespuesta(Instant.now());
    return solicitudRepository.save(solicitud);
  }

  @Transactional
  public SolicitudAsignacion rechazarFirma(Long idSolicitud, String comentarioAdmin) {
    SolicitudAsignacion solicitud = buscarSolicitud(idSolicitud);
    if (!"FIRMADO".equalsIgnoreCase(solicitud.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes rechazar firma de solicitudes firmadas.");
    }
    String comentario = comentarioAdmin == null ? "" : comentarioAdmin.trim();
    if (comentario.length() < 8) {
      throw new IllegalArgumentException("El motivo del rechazo debe tener al menos 8 caracteres.");
    }
    solicitud.setEstadoSolicitud("RECHAZADO_FIRMA");
    solicitud.setComentarioAdmin(comentario);
    solicitud.setFechaRespuesta(Instant.now());
    return solicitudRepository.save(solicitud);
  }

  /**
   * Tras registrar la asignación en inventario: las solicitudes en estado APROBADA o COMPLETADO
   * para el mismo empleado y activo pasan a ASIGNADO.
   */
  @Transactional
  public void marcarAprobadasComoAsignadas(Long idEmpleado, Long idActivo) {
    List<SolicitudAsignacion> list = new ArrayList<>();
    list.addAll(solicitudRepository.findPorEmpleadoActivoYEstado(idEmpleado, idActivo, "APROBADA"));
    list.addAll(solicitudRepository.findPorEmpleadoActivoYEstado(idEmpleado, idActivo, "COMPLETADO"));
    for (SolicitudAsignacion s : list) {
      s.setEstadoSolicitud("ASIGNADO");
    }
    solicitudRepository.saveAll(list);
  }

  private SolicitudAsignacion procesarAdmin(
      Long idSolicitud, String nuevoEstado, String comentarioAdmin) {
    SolicitudAsignacion s = buscarSolicitud(idSolicitud);
    if (!"PENDIENTE".equalsIgnoreCase(s.getEstadoSolicitud())) {
      throw new IllegalArgumentException("Solo puedes procesar solicitudes pendientes");
    }
    String comentarioNormalizado = comentarioAdmin == null ? null : comentarioAdmin.trim();
    if ("RECHAZADA".equalsIgnoreCase(nuevoEstado)) {
      if (comentarioNormalizado == null || comentarioNormalizado.length() < 8) {
        throw new IllegalArgumentException("El motivo del rechazo debe tener al menos 8 caracteres.");
      }
    }
    if ("APROBADA".equalsIgnoreCase(nuevoEstado)) {
      // Se conserva APROBADA para compatibilidad con flujos existentes.
      s.setEstadoSolicitud("APROBADA");
    } else {
      s.setEstadoSolicitud(nuevoEstado);
    }
    s.setFechaRespuesta(Instant.now());
    s.setComentarioAdmin(comentarioNormalizado);
    return solicitudRepository.save(s);
  }

  private SolicitudAsignacion buscarSolicitud(Long idSolicitud) {
    return solicitudRepository
        .findById(idSolicitud)
        .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe"));
  }

  private byte[] construirPdfSolicitud(SolicitudAsignacion solicitud) {
    String fecha = solicitud.getFechaSolicitud() == null ? "N/D" : solicitud.getFechaSolicitud().toString();
    List<String> lineas =
        List.of(
            "SOLICITUD DE ASIGNACION DE ACTIVO",
            "Solicitud: " + solicitud.getIdSolicitud(),
            "Funcionario: " + (solicitud.getEmpleado() == null ? "N/D" : solicitud.getEmpleado().getNombre()),
            "Activo: "
                + (solicitud.getActivo() == null
                    ? "N/D"
                    : solicitud.getActivo().getTipo() + " - " + solicitud.getActivo().getMarca()),
            "Serial: " + (solicitud.getActivo() == null ? "N/D" : solicitud.getActivo().getSerial()),
            "Fecha: " + fecha,
            "Espacio para firma:",
            "____________________________");
    return construirPdfSimple(lineas);
  }

  private byte[] construirPdfSimple(List<String> lineas) {
    StringBuilder stream = new StringBuilder();
    stream.append("BT\n/F1 12 Tf\n50 780 Td\n");
    for (int i = 0; i < lineas.size(); i++) {
      if (i > 0) {
        stream.append("0 -18 Td\n");
      }
      stream.append("(").append(escaparPdf(lineas.get(i))).append(") Tj\n");
    }
    stream.append("ET\n");

    String obj1 = "<< /Type /Catalog /Pages 2 0 R >>";
    String obj2 = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
    String obj3 =
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
    String obj4 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    byte[] streamBytes = stream.toString().getBytes(StandardCharsets.UTF_8);
    String obj5 = "<< /Length " + streamBytes.length + " >>\nstream\n" + stream + "endstream";

    List<byte[]> objetos =
        List.of(
            (obj1 + "\n").getBytes(StandardCharsets.UTF_8),
            (obj2 + "\n").getBytes(StandardCharsets.UTF_8),
            (obj3 + "\n").getBytes(StandardCharsets.UTF_8),
            (obj4 + "\n").getBytes(StandardCharsets.UTF_8),
            (obj5 + "\n").getBytes(StandardCharsets.UTF_8));

    StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
    List<Integer> offsets = new ArrayList<>();
    for (int i = 0; i < objetos.size(); i++) {
      offsets.add(pdf.toString().getBytes(StandardCharsets.UTF_8).length);
      pdf.append(i + 1).append(" 0 obj\n").append(new String(objetos.get(i), StandardCharsets.UTF_8)).append("endobj\n");
    }
    int xrefOffset = pdf.toString().getBytes(StandardCharsets.UTF_8).length;
    pdf.append("xref\n0 ").append(objetos.size() + 1).append("\n");
    pdf.append("0000000000 65535 f \n");
    for (Integer offset : offsets) {
      pdf.append(String.format("%010d 00000 n %n", offset));
    }
    pdf.append("trailer\n<< /Size ").append(objetos.size() + 1).append(" /Root 1 0 R >>\n");
    pdf.append("startxref\n").append(xrefOffset).append("\n%%EOF");
    return pdf.toString().getBytes(StandardCharsets.UTF_8);
  }

  private String escaparPdf(String texto) {
    return texto.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
  }
}
