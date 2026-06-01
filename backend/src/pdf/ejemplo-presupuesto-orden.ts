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
      telefono: '11 5555-1234',
    },
    vehiculo: {
      patente: 'AB 123 CD',
      marca: 'Toyota',
      modelo: 'Corolla',
    },
    gomero: {
      marca: 'Pirelli',
      medida: '195/55 R16',
      presionBar: '2,2 BAR',
      kilometraje: '48.500 km',
      neumaticosCambiados: true,
    },
    usaChecklistNuevo: true,
    secciones: [
      {
        titulo: 'TREN DELANTERO',
        subtotal: 45000,
        lineas: [
          { etiqueta: 'Rótulas', cantidad: 2, precioUnitario: 15000, subtotal: 30000 },
          { etiqueta: 'Extremos de Dirección', cantidad: 2, precioUnitario: 7500, subtotal: 15000 },
        ],
      },
      {
        titulo: 'CUBIERTAS',
        subtotal: 240000,
        lineas: [
          { etiqueta: 'Continental', cantidad: 4, precioUnitario: 55000, subtotal: 220000 },
          { etiqueta: 'Balanceos Autos', cantidad: 1, precioUnitario: 20000, subtotal: 20000 },
        ],
      },
    ],
    totalGeneral: 285000,
    operarioResponsable: 'Carlos Gómez',
    observaciones: 'Cliente solicita presupuesto por cubiertas + tren delantero.',
    firmaMecanico: 'Carlos Gómez',
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
