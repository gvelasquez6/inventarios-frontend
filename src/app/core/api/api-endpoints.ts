/**
 * Contrato REST del inventario (rutas relativas a `environment.apiBaseUrl`).
 *
 * | Recurso      | Método | Ruta                 | Uso                          |
 * |--------------|--------|----------------------|------------------------------|
 * | Salud        | GET    | /api/health          | Comprobar que el API responde |
 * | Activos      | GET    | /api/activos         | Listar activos               |
 * | Activos      | POST   | /api/activos         | Crear activo                 |
 * | Empleados    | GET    | /api/empleados       | Listar empleados             |
 * | Empleados    | POST   | /api/empleados       | Crear empleado               |
 * | Asignaciones | GET    | /api/asignaciones    | Listar asignaciones          |
 * | Asignaciones | POST   | /api/asignaciones    | Crear asignación             |
 */

export const API_PATHS = {
  health: '/api/health',
  activos: '/api/activos',
  empleados: '/api/empleados',
  asignaciones: '/api/asignaciones',
} as const;

export type ApiResourceKey = keyof typeof API_PATHS;

/**
 * Une la URL base del entorno con una ruta del API (evita dobles barras).
 */
export function resolveApiUrl(apiBaseUrl: string, path: string): string {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${base}${rel}`;
}
