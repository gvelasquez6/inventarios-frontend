import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../application/use-cases/auth.service';
import { InventarioService } from '../../application/use-cases/inventario.service';
import { Asignacion } from '../../domain';
import { CapitalizeFirstDirective } from '../../shared/directives/capitalize-first.directive';

@Component({
  selector: 'app-mis-asignaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, InputTextModule, CapitalizeFirstDirective],
  templateUrl: './mis-asignaciones.component.html',
  styleUrls: ['./mis-asignaciones.component.scss'],
})
export class MisAsignacionesComponent implements OnInit {
  private readonly inventario = inject(InventarioService);
  private readonly auth = inject(AuthService);

  busqueda = '';
  asignaciones: Asignacion[] = [];
  asignacionesFiltradas: Asignacion[] = [];

  ngOnInit(): void {
    const sesion = this.auth.session();
    this.inventario.getAsignaciones().subscribe((list) => {
      const idEmpleado = sesion?.idEmpleado == null ? null : Number(sesion.idEmpleado);
      const nombreSesion = sesion?.nombre?.toLowerCase().trim() ?? '';
      this.asignaciones =
        idEmpleado != null
          ? list.filter((a) => Number(a.empleado?.idEmpleado) === idEmpleado)
          : list.filter((a) => a.empleado?.nombre?.toLowerCase().trim() === nombreSesion);
      this.filtrar();
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) {
      this.asignacionesFiltradas = [...this.asignaciones];
      return;
    }
    this.asignacionesFiltradas = this.asignaciones.filter((a) =>
      `${a.activo.tipo} ${a.activo.marca} ${a.activo.modelo} ${a.activo.serial}`
        .toLowerCase()
        .includes(q),
    );
  }
}

