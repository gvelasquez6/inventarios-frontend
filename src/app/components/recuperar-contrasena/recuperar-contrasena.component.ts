import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InputTextModule, ButtonModule],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrls: ['./recuperar-contrasena.component.scss'],
})
export class RecuperarContrasenaComponent {
  email = '';
  error = '';
  enviado = false;

  get emailValido(): boolean {
    const e = this.email?.trim() ?? '';
    return e.length > 3 && e.includes('@');
  }

  enviar(): void {
    this.error = '';
    if (!this.emailValido) {
      this.error = 'Introduzca un correo electrónico válido';
      return;
    }
    this.enviado = true;
  }
}
