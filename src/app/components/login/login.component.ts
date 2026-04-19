import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { finalize, timeout, TimeoutError } from 'rxjs';
import { AuthService } from '../../application/use-cases/auth.service';
import { environment } from '../../../environments/environment';

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

  enviando = false;

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
    this.enviando = true;
    this.auth
      .login(this.username.trim(), this.password)
      .pipe(
        timeout(25000),
        finalize(() => {
          this.enviando = false;
        }),
      )
      .subscribe({
        next: (ok) => {
          if (!ok) {
            this.error = 'Usuario o contraseña incorrectos';
            return;
          }
          const raw = this.route.snapshot.queryParamMap.get('returnUrl');
          const dest = raw?.trim() ? raw : '/inicio';
          void this.router.navigateByUrl(dest);
        },
        error: (err: unknown) => {
          if (err instanceof TimeoutError) {
            this.error = `El servidor no respondió a tiempo. Comprueba que el backend Spring esté en marcha y que la URL del API sea la correcta (${environment.apiBaseUrl}).`;
            return;
          }
          if (err instanceof HttpErrorResponse) {
            if (err.status === 0) {
              this.error = `No hay conexión con el API (${environment.apiBaseUrl}). ¿Está el backend arrancado y el puerto coincide con server.port?`;
              return;
            }
            if (err.status === 404) {
              this.error = `No se encontró el login en ${environment.apiBaseUrl}. Suele indicar otro proceso en ese puerto o un backend distinto; el inventarios-api debe exponer POST /api/auth/login.`;
              return;
            }
          }
          this.error =
            err instanceof Error && err.message
              ? err.message
              : 'No se pudo conectar con el servidor. Comprueba que el API esté en marcha.';
        },
      });
  }
}
