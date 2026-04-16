import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../application/use-cases/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InputTextModule, ButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  error = '';
  mostrarPassword = false;
  aceptoPoliticasUso = false;
  aceptoPrivacidad = false;

  /** Permite enviar el formulario solo con usuario, contraseña y ambas políticas aceptadas. */
  get puedeIniciarSesion(): boolean {
    return (
      !!this.username?.trim() &&
      !!this.password &&
      this.aceptoPoliticasUso &&
      this.aceptoPrivacidad
    );
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  iniciarSesion(): void {
    this.error = '';
    if (!this.username.trim() || !this.password) {
      this.error = 'Usuario y contraseña son obligatorios';
      return;
    }
    if (!this.aceptoPoliticasUso || !this.aceptoPrivacidad) {
      this.error = 'Debes aceptar las políticas de uso y la privacidad para continuar';
      return;
    }
    if (!this.auth.login(this.username.trim(), this.password)) {
      this.error = 'Usuario o contraseña incorrectos';
      return;
    }
    const raw = this.route.snapshot.queryParamMap.get('returnUrl');
    const dest = raw?.trim() ? raw : '/inicio';
    void this.router.navigateByUrl(dest);
  }
}
