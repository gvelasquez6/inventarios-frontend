import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ChartModule } from 'primeng/chart';
import { InventarioService } from '../../application/use-cases/inventario.service';
import { AuthService } from '../../application/use-cases/auth.service';
import { SolicitudAsignacionUseCase } from '../../application/use-cases/solicitud-asignacion.use-case';
import { EstadoActivo } from '../../domain';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private readonly inventario = inject(InventarioService);
  private readonly auth = inject(AuthService);
  private readonly solicitudesService = inject(SolicitudAsignacionUseCase);

  cargando = true;
  errorCarga: string | null = null;
  totalActivos = 0;
  activosDisponibles = 0;
  activosAsignados = 0;
  activosMantenimiento = 0;
  activosBaja = 0;
  totalEmpleados = 0;
  totalAsignaciones = 0;
  solicitudesPendientes = 0;
  solicitudesAprobadas = 0;
  solicitudesRechazadas = 0;
  solicitudesAsignadas = 0;
  tasaAsignacion = 0;

  /** Datos para el pastel «Uso del inventario» (distribución por estado del activo). */
  usoInventarioChartData: {
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[]; borderColor: string; borderWidth: number }[];
  } | null = null;
  gestionAdminChartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderRadius: number;
      categoryPercentage: number;
      barPercentage: number;
      maxBarThickness: number;
    }[];
  } | null = null;

  readonly usoInventarioChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 6,
          font: { size: 10 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label?: string; raw?: unknown; dataset?: { data?: unknown[] } }) => {
            const label = ctx.label ?? '';
            const value = Number(ctx.raw ?? 0);
            const data = (ctx.dataset?.data ?? []) as number[];
            const total = data.reduce((acc, n) => acc + Number(n), 0);
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return ` ${label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  readonly gestionAdminChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#334155',
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: '#e2e8f0',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: { raw?: unknown }) => ` ${Number(ctx.raw ?? 0)} registros`,
        },
      },
    },
  };

  /** Primera palabra del nombre de la sesión (p. ej. "Juan" de "Juan Pérez"). */
  get primerNombre(): string {
    const nombre = this.auth.session()?.nombre?.trim();
    if (!nombre) {
      return 'Usuario';
    }
    return nombre.split(/\s+/)[0];
  }

  ngOnInit(): void {
    this.errorCarga = null;
    forkJoin({
      activos: this.inventario.getActivos(),
      empleados: this.inventario.getEmpleados(),
      asignaciones: this.inventario.getAsignaciones(),
      solicitudes: this.solicitudesService.getSolicitudes(),
    })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: ({ activos, empleados, asignaciones, solicitudes }) => {
          this.totalActivos = activos.length;
          this.activosDisponibles = activos.filter(a => a.estado === EstadoActivo.DISPONIBLE).length;
          this.activosAsignados = activos.filter(a => a.estado === EstadoActivo.ASIGNADO).length;
          this.activosMantenimiento = activos.filter(a => a.estado === EstadoActivo.MANTENIMIENTO).length;
          this.activosBaja = activos.filter(a => a.estado === EstadoActivo.BAJA).length;
          this.totalEmpleados = empleados.length;
          this.totalAsignaciones = asignaciones.length;
          this.solicitudesPendientes = solicitudes.filter((s) => this.estadoSolicitud(s) === 'PENDIENTE').length;
          this.solicitudesAprobadas = solicitudes.filter((s) =>
            ['APROBADA', 'APROBADO'].includes(this.estadoSolicitud(s)),
          ).length;
          this.solicitudesRechazadas = solicitudes.filter((s) =>
            ['RECHAZADA', 'RECHAZADO'].includes(this.estadoSolicitud(s)),
          ).length;
          this.solicitudesAsignadas = solicitudes.filter((s) =>
            ['ASIGNADA', 'ASIGNADO'].includes(this.estadoSolicitud(s)),
          ).length;
          this.tasaAsignacion =
            this.totalActivos > 0 ? Math.round((this.activosAsignados / this.totalActivos) * 100) : 0;
          this.actualizarUsoInventarioChart();
          this.actualizarGestionAdminChart();
          this.errorCarga = null;
        },
        error: () => {
          this.errorCarga =
            'No se pudieron cargar los indicadores. Comprueba que el API esté en marcha y que la URL en environment coincida (por defecto http://localhost:3000).';
        },
      });
  }

  private actualizarUsoInventarioChart(): void {
    const d = this.activosDisponibles;
    const a = this.activosAsignados;
    const m = this.activosMantenimiento;
    const b = this.activosBaja;
    const sum = d + a + m + b;
    if (sum === 0) {
      this.usoInventarioChartData = null;
      return;
    }
    this.usoInventarioChartData = {
      labels: ['Disponibles', 'Asignados', 'Mantenimiento', 'Baja'],
      datasets: [
        {
          data: [d, a, m, b],
          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#94a3b8'],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }

  private actualizarGestionAdminChart(): void {
    const pendientes = this.solicitudesPendientes;
    const aprobadas = this.solicitudesAprobadas;
    const rechazadas = this.solicitudesRechazadas;
    const asignadas = this.solicitudesAsignadas;
    const sum = pendientes + aprobadas + rechazadas + asignadas;

    if (sum === 0) {
      this.gestionAdminChartData = null;
      return;
    }

    this.gestionAdminChartData = {
      labels: ['Pendientes', 'Aprobadas', 'Rechazadas', 'Asignadas'],
      datasets: [
        {
          label: 'Total',
          data: [pendientes, aprobadas, rechazadas, asignadas],
          backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#3b82f6'],
          borderRadius: 8,
          categoryPercentage: 0.6,
          barPercentage: 0.55,
          maxBarThickness: 26,
        },
      ],
    };
  }

  private estadoSolicitud(s: { estadoSolicitud?: string }): string {
    return (s.estadoSolicitud ?? '').trim().toUpperCase();
  }
}
