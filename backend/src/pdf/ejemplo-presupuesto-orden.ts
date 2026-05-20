/**
 * EJEMPLO — Datos de muestra y script de prueba del PDF de presupuesto.
 *
 * Uso:
 *   npx ts-node src/pdf/ejemplo-presupuesto-orden.ts
 *   → backend/tmp/presupuesto-ejemplo.pdf
 */

import fs from 'fs';
import path from 'path';

import { generarPresupuestoOrdenPdf } from './presupuesto-orden.pdf';
import type { PresupuestoOrdenData } from './presupuesto-orden.types';

export { generarPresupuestoOrdenPdf } from './presupuesto-orden.pdf';

/** Datos de muestra para previsualizar el layout sin tocar la base. */
export function datosEjemploPresupuestoOrden(): PresupuestoOrdenData {
  return {
    empresa: {
      nombre: 'Martínez Neumáticos',
      direccion: 'Av. Ejemplo 1234 — San Miguel, Buenos Aires',
      telefono: '(011) 4000-0000',
      logoPath: undefined,
    },
    orden: {
      numero: 'OR-2026-0042',
      fecha: new Date(),
    },
    cliente: {
      nombre: 'Juan',
      apellido: 'Pérez',
      domicilio: 'Calle Falsa 123, San Miguel',
      telefono: '11 5555-1234',
    },
    vehiculo: {
      patente: 'AB 123 CD',
      marca: 'Toyota',
      modelo: 'Corolla',
    },
    trenDelantero: {
      alcance: 'x4',
      alineado: { etiqueta: 'Alineación', aplica: true, precio: 18500 },
      balanceo: { etiqueta: 'Balanceo', aplica: true, precio: 12000 },
      amortiguadores: { etiqueta: 'Amortiguadores revisados', aplica: true, precio: null },
      auxilio: { etiqueta: 'Auxilio revisado', aplica: true, precio: null },
    },
    cubiertas: {
      marca: 'Pirelli',
      medida: '195/55 R16',
      presionBar: '2,2 BAR',
      kilometraje: '48.500 km',
      neumaticosCambiados: true,
    },
    totalGeneral: 285000,
    observaciones:
      'Cliente solicita presupuesto por 4 cubiertas + alineación y balanceo. Auxilio con desgaste lateral — recomendar cambio en próxima visita.',
    firmaMecanico: 'Taller Martínez — Mecánico',
  };
}

async function main() {
  const outDir = path.resolve(__dirname, '../../tmp');
  const outFile = path.join(outDir, 'presupuesto-ejemplo.pdf');
  fs.mkdirSync(outDir, { recursive: true });

  const buffer = await generarPresupuestoOrdenPdf(datosEjemploPresupuestoOrden());
  fs.writeFileSync(outFile, buffer);
  console.log(`PDF de ejemplo generado: ${outFile}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
