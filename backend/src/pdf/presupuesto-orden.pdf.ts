/**
 * Generación del PDF de presupuesto / orden de reparación (formato físico Martínez).
 */

import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

import type {
  PresupuestoOrdenData,
  ItemTrenPresupuesto,
  TrenDelanteroPresupuesto,
} from './presupuesto-orden.types';

const MARGIN = 40;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;
const COL_GAP = 16;
const COL_W = (CONTENT_W - COL_GAP) / 2;
const COL_LEFT = MARGIN;
const COL_RIGHT = MARGIN + COL_W + COL_GAP;

const COLOR_ROJO = '#C8102E';
const COLOR_GRIS = '#4B5563';
const COLOR_BORDE = '#D1D5DB';

function fmtMoney(n: number): string {
  return `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtFecha(d: Date): string {
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function alcanceTrenTxt(alcance: TrenDelanteroPresupuesto['alcance']): string {
  if (alcance === 'x2') return '2 ruedas';
  if (alcance === 'x4') return '4 ruedas';
  if (alcance === 'no') return 'No aplica';
  return '—';
}

function itemLinea(doc: PDFKit.PDFDocument, item: ItemTrenPresupuesto, y: number): number {
  const marca = item.aplica ? '☑' : '☐';
  const precio =
    item.aplica && item.precio != null && item.precio > 0
      ? fmtMoney(item.precio)
      : item.aplica
        ? 'Incl.'
        : '—';

  doc.font('Helvetica').fontSize(9).fillColor('#111827');
  doc.text(`${marca}  ${item.etiqueta}`, COL_LEFT, y, { width: COL_W - 70 });
  doc.text(precio, COL_LEFT + COL_W - 68, y, { width: 66, align: 'right' });
  return y + 16;
}

function drawHeader(doc: PDFKit.PDFDocument, data: PresupuestoOrdenData): number {
  let y = MARGIN;

  const logoPath = data.empresa.logoPath;
  const logoExt = logoPath ? path.extname(logoPath).toLowerCase() : '';
  const logoSoportado = ['.png', '.jpg', '.jpeg'].includes(logoExt);
  const tieneLogo = !!(logoPath && logoSoportado && fs.existsSync(logoPath));

  if (tieneLogo) {
    doc.image(logoPath!, MARGIN, y, { width: 56 });
  }

  const textX = tieneLogo ? MARGIN + 64 : MARGIN;
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLOR_ROJO)
    .text(data.empresa.nombre.toUpperCase(), textX, y, { width: CONTENT_W - 140 });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLOR_GRIS)
    .text(data.empresa.direccion, textX, y + 18, { width: 220 })
    .text(`Tel.: ${data.empresa.telefono}`, textX, y + 30);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111827')
    .text('ORDEN DE REPARACIÓN / PRESUPUESTO', PAGE_W - MARGIN - 180, y, {
      width: 180,
      align: 'right',
    });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLOR_GRIS)
    .text(`N.º ${data.orden.numero}`, PAGE_W - MARGIN - 180, y + 14, { width: 180, align: 'right' })
    .text(`Fecha: ${fmtFecha(data.orden.fecha)}`, PAGE_W - MARGIN - 180, y + 26, {
      width: 180,
      align: 'right',
    });

  y += 52;
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(COLOR_BORDE).lineWidth(1).stroke();
  return y + 12;
}

function drawClienteVehiculo(doc: PDFKit.PDFDocument, data: PresupuestoOrdenData, y: number): number {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_ROJO).text('DATOS DEL CLIENTE', MARGIN, y);
  y += 14;

  const filas: [string, string][] = [
    ['Nombre', `${data.cliente.nombre} ${data.cliente.apellido}`.trim()],
    ['Domicilio', data.cliente.domicilio || '—'],
    ['Teléfono', data.cliente.telefono || '—'],
    ['Patente', data.vehiculo.patente],
    ['Vehículo', `${data.vehiculo.marca} ${data.vehiculo.modelo}`.trim()],
  ];

  doc.font('Helvetica').fontSize(9).fillColor('#111827');
  for (const [label, valor] of filas) {
    doc.fillColor(COLOR_GRIS).text(`${label}:`, MARGIN, y, { width: 72 });
    doc.fillColor('#111827').text(valor, MARGIN + 76, y, { width: CONTENT_W - 76 });
    y += 14;
  }

  y += 4;
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(COLOR_BORDE).lineWidth(0.5).stroke();
  return y + 14;
}

function drawColumnaTitulo(
  doc: PDFKit.PDFDocument,
  titulo: string,
  x: number,
  y: number,
  w: number
): number {
  doc.roundedRect(x, y, w, 20, 4).fillColor('#F3F4F6').fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#111827')
    .text(titulo, x + 8, y + 6, { width: w - 16 });
  return y + 28;
}

function drawCuerpoDosColumnas(doc: PDFKit.PDFDocument, data: PresupuestoOrdenData, startY: number): number {
  let yLeft = drawColumnaTitulo(doc, 'TREN DELANTERO', COL_LEFT, startY, COL_W);
  let yRight = drawColumnaTitulo(doc, 'CUBIERTAS', COL_RIGHT, startY, COL_W);

  doc.font('Helvetica').fontSize(8).fillColor(COLOR_GRIS);
  doc.text(`Alcance: ${alcanceTrenTxt(data.trenDelantero.alcance)}`, COL_LEFT, yLeft, { width: COL_W });
  yLeft += 14;

  yLeft = itemLinea(doc, data.trenDelantero.alineado, yLeft);
  yLeft = itemLinea(doc, data.trenDelantero.balanceo, yLeft);
  yLeft = itemLinea(doc, data.trenDelantero.amortiguadores, yLeft);
  yLeft = itemLinea(doc, data.trenDelantero.auxilio, yLeft);

  const cub = data.cubiertas;
  const lineasCubiertas: [string, string][] = [
    ['Marca', cub.marca || '—'],
    ['Medida', cub.medida || '—'],
    ['Presión', cub.presionBar || '—'],
    ['Km', cub.kilometraje || '—'],
    [
      'Neumáticos',
      cub.neumaticosCambiados === true
        ? 'Cambiados'
        : cub.neumaticosCambiados === false
          ? 'Sin cambio'
          : '—',
    ],
  ];

  doc.font('Helvetica').fontSize(9).fillColor('#111827');
  for (const [label, valor] of lineasCubiertas) {
    doc.fillColor(COLOR_GRIS).text(`${label}:`, COL_RIGHT, yRight, { width: 56 });
    doc.fillColor('#111827').text(valor, COL_RIGHT + 60, yRight, { width: COL_W - 64 });
    yRight += 16;
  }

  return Math.max(yLeft, yRight) + 8;
}

function drawTotalGeneral(doc: PDFKit.PDFDocument, total: number, y: number): number {
  const boxH = 36;
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 6).fillColor(COLOR_ROJO).fill();

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#FFFFFF')
    .text('TOTAL GENERAL', MARGIN + 14, y + 11);

  const totalTxt = total > 0 ? fmtMoney(total) : 'A confirmar';
  doc
    .font('Helvetica-Bold')
    .fontSize(total > 0 ? 14 : 11)
    .fillColor('#FFFFFF')
    .text(totalTxt, MARGIN, y + 8, { width: CONTENT_W - 14, align: 'right' });

  return y + boxH + 16;
}

function drawFooter(doc: PDFKit.PDFDocument, data: PresupuestoOrdenData, y: number): void {
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text('OBSERVACIONES', MARGIN, y);
  y += 12;

  doc
    .roundedRect(MARGIN, y, CONTENT_W, 52, 4)
    .strokeColor(COLOR_BORDE)
    .lineWidth(0.5)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#111827')
    .text(data.observaciones?.trim() || '—', MARGIN + 8, y + 8, {
      width: CONTENT_W - 16,
      height: 40,
    });

  y += 64;

  const firmaY = y;
  doc
    .moveTo(MARGIN, firmaY)
    .lineTo(MARGIN + 200, firmaY)
    .strokeColor(COLOR_GRIS)
    .lineWidth(0.5)
    .stroke();

  doc.font('Helvetica').fontSize(8).fillColor(COLOR_GRIS).text('Firma del mecánico', MARGIN, firmaY + 4);

  if (data.firmaMecanico) {
    doc.font('Helvetica').fontSize(9).fillColor('#111827').text(data.firmaMecanico, MARGIN, firmaY - 12);
  }

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLOR_GRIS)
    .text(`Documento generado el ${fmtFecha(new Date())}`, PAGE_W - MARGIN - 160, firmaY + 4, {
      width: 160,
      align: 'right',
    });
}

export function generarPresupuestoOrdenPdf(data: PresupuestoOrdenData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = drawHeader(doc, data);
    y = drawClienteVehiculo(doc, data, y);
    y = drawCuerpoDosColumnas(doc, data, y);
    y = drawTotalGeneral(doc, data.totalGeneral, y);
    drawFooter(doc, data, y);

    doc.end();
  });
}
