import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../application/use-cases/auth.service';

@Component({
  selector: 'app-inicio-modulos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inicio-modulos.component.html',
  styleUrls: ['./inicio-modulos.component.scss'],
})
export class InicioModulosComponent {
  private readonly auth = inject(AuthService);

  get esAdministrador(): boolean {
    return this.auth.session()?.rol === 'Administrador';
  }

  get esFuncionario(): boolean {
    return this.auth.session()?.rol === 'Funcionario';
  }
}
