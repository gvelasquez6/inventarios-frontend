export enum EstadoActivo {
  DISPONIBLE = 'DISPONIBLE',
  ASIGNADO = 'ASIGNADO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  BAJA = 'BAJA',
}

export interface Activo {
  idActivo: number;
  tipo: string;
  marca: string;
  modelo: string;
  serial: string;
  estado: EstadoActivo;
}
