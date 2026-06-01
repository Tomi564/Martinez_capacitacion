/**
 * Datos para el PDF de presupuesto / orden de reparación (formato físico Martínez).
 */

export interface EmpresaPresupuesto {
  nombre: string;
  direccion: string;
  telefono: string;
  logoPath?: string;
}

export interface OrdenPresupuestoMeta {
  numero: string;
  fecha: Date;
}

export interface ClientePresupuesto {
  nombre: string;
  apellido: string;
  telefono: string;
}

export interface VehiculoPresupuesto {
  patente: string;
  marca: string;
  modelo: string;
}

export interface GomeroPresupuesto {
  marca: string;
  medida: string;
  presionBar: string;
  kilometraje: string;
  neumaticosCambiados: boolean | null;
}

export interface PresupuestoLineaPdf {
  etiqueta: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PresupuestoSeccionPdf {
  titulo: string;
  lineas: PresupuestoLineaPdf[];
  subtotal: number;
}

/** Campos del mecánico en visitas anteriores al checklist por ítems. */
export interface PresupuestoLegacyMecanico {
  trenDelantero: string;
  alineado: boolean | null;
  balanceo: boolean | null;
  amortiguadores: boolean | null;
  auxilio: boolean | null;
  presupuestoTexto: string | null;
}

export interface PresupuestoOrdenData {
  empresa: EmpresaPresupuesto;
  orden: OrdenPresupuestoMeta;
  cliente: ClientePresupuesto;
  vehiculo: VehiculoPresupuesto;
  gomero: GomeroPresupuesto;
  /** true si hay ítems marcados en visita_presupuesto_lineas */
  usaChecklistNuevo: boolean;
  secciones: PresupuestoSeccionPdf[];
  legacy?: PresupuestoLegacyMecanico;
  totalGeneral: number;
  operarioResponsable: string;
  observaciones: string;
  firmaMecanico?: string;
}
