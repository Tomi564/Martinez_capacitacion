/**
 * Datos para el PDF de presupuesto / orden de reparación (formato físico Martínez).
 * El endpoint final mapeará visitas_taller + clientes + vehículos a esta estructura.
 */

export interface EmpresaPresupuesto {
  nombre: string;
  direccion: string;
  telefono: string;
  /** Ruta opcional a logo PNG/JPG (pdfkit no embebe SVG directamente). */
  logoPath?: string;
}

export interface OrdenPresupuestoMeta {
  numero: string;
  fecha: Date;
}

export interface ClientePresupuesto {
  nombre: string;
  apellido: string;
  domicilio: string;
  telefono: string;
}

export interface VehiculoPresupuesto {
  patente: string;
  marca: string;
  modelo: string;
}

/** Ítem del tren delantero con precio solo si aplica al presupuesto. */
export interface ItemTrenPresupuesto {
  etiqueta: string;
  /** Si el servicio/revisión aplica en esta orden. */
  aplica: boolean;
  /** Precio en pesos; omitir o null si no se cotiza. */
  precio?: number | null;
}

export interface TrenDelanteroPresupuesto {
  /** x2 | x4 | no — alcance del tren según mecánico. */
  alcance: 'x2' | 'x4' | 'no' | null;
  alineado: ItemTrenPresupuesto;
  balanceo: ItemTrenPresupuesto;
  amortiguadores: ItemTrenPresupuesto;
  auxilio: ItemTrenPresupuesto;
}

export interface CubiertasPresupuesto {
  marca: string;
  medida: string;
  /** Presión en BAR (el gomero registra PSI en DB; convertir al mapear). */
  presionBar: string;
  kilometraje: string;
  neumaticosCambiados: boolean | null;
}

export interface PresupuestoOrdenData {
  empresa: EmpresaPresupuesto;
  orden: OrdenPresupuestoMeta;
  cliente: ClientePresupuesto;
  vehiculo: VehiculoPresupuesto;
  trenDelantero: TrenDelanteroPresupuesto;
  cubiertas: CubiertasPresupuesto;
  /** Total destacado del mecánico (texto libre hoy → número al parsear o ingresar). */
  totalGeneral: number;
  observaciones: string;
  firmaMecanico?: string;
}
