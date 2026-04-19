import type { Empleado } from '../empleado/empleado.entity';

/** Respuesta de `POST /api/auth/login` y `GET /api/auth/me`. */
export interface LoginResultDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  nombre: string;
  rol: string;
  idEmpleado?: number | null;
  cargo?: string | null;
  area?: string | null;
}

/** Respuesta de `POST /api/empleados` (alta con cuenta). */
export interface EmpleadoAltaResultado {
  empleado: Empleado;
  credencialUsuario?: string | null;
  credencialPassword?: string | null;
  credencialGenerada?: boolean;
}
