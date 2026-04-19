import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../application/use-cases/auth.service';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent {
  protected readonly auth = inject(AuthService);

  avatarError = '';
  avatarOk = '';
  passError = '';
  passOk = '';

  passActual = '';
  passNueva = '';
  passConfirmar = '';

  mostrarPassActual = false;
  mostrarPassNueva = false;
  mostrarPassConfirmar = false;

  onAvatarSelected(event: Event): void {
    this.avatarError = '';
    this.avatarOk = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.avatarError = 'El archivo debe ser una imagen (JPG, PNG, etc.).';
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      this.avatarError = 'La imagen no puede superar 2 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.auth.updateAvatar(dataUrl);
      this.avatarOk = 'Foto de perfil actualizada.';
    };
    reader.onerror = () => {
      this.avatarError = 'No se pudo leer el archivo.';
    };
    reader.readAsDataURL(file);
  }

  quitarAvatar(): void {
    this.avatarError = '';
    this.avatarOk = '';
    this.auth.updateAvatar(null);
    this.avatarOk = 'Se quitó la foto de perfil.';
  }

  togglePass(campo: 'actual' | 'nueva' | 'confirmar'): void {
    if (campo === 'actual') {
      this.mostrarPassActual = !this.mostrarPassActual;
    } else if (campo === 'nueva') {
      this.mostrarPassNueva = !this.mostrarPassNueva;
    } else {
      this.mostrarPassConfirmar = !this.mostrarPassConfirmar;
    }
  }

  guardarContrasena(): void {
    this.passError = '';
    this.passOk = '';
    if (!this.passActual || !this.passNueva || !this.passConfirmar) {
      this.passError = 'Completa todos los campos.';
      return;
    }
    if (this.passNueva !== this.passConfirmar) {
      this.passError = 'La confirmación no coincide con la nueva contraseña.';
      return;
    }
    this.auth.changePassword(this.passActual, this.passNueva).subscribe({
      next: (result) => {
        if (!result.ok) {
          this.passError = result.error ?? 'No se pudo cambiar la contraseña.';
          return;
        }
        this.passOk = 'Contraseña actualizada correctamente.';
        this.passActual = '';
        this.passNueva = '';
        this.passConfirmar = '';
      },
    });
  }
}
