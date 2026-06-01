/**
 * Generación del PDF de presupuesto / orden de reparación (formato físico Martínez).
 */

import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

import type { PresupuestoOrdenData, PresupuestoSeccionPdf } from './presupuesto-orden.types';

const MARGIN = 40;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y_MIN = PAGE_H - MARGIN - 120;

const COLOR_ROJO = '#C8102E';
const COLOR_GRIS = '#4B5563';
const COLOR_BORDE = '#D1D5DB';

const COL_ITEM_W = CONTENT_W * 0.42;
const COL_CANT_W = 48;
const COL_PRECIO_W = 72;
const COL_SUB_W = 72;

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

function boolTxt(v: boolean | null | undefined): string {
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  return '—';
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed <= FOOTER_Y_MIN) return y;
  doc.addPage();
  return MARGIN;
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
    .text(data.empresa.direccion, textX, y + 18, { width: 260 })
    .text(`Tel.: ${data.empresa.telefono}`, textX, y + 30);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111827')
    .text('PRESUPUESTO INTERNO', PAGE_W - MARGIN - 180, y, { width: 180, align: 'right' });

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
  y = ensureSpace(doc, y, 90);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_ROJO).text('DATOS DEL CLIENTE', MARGIN, y);
  y += 14;

  const filas: [string, string][] = [
    ['Nombre', `${data.cliente.nombre} ${data.cliente.apellido}`.trim()],
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

function drawGomero(doc: PDFKit.PDFDocument, data: PresupuestoOrdenData, y: number): number {
  y = ensureSpace(doc, y, 100);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_ROJO).text('GOMERO', MARGIN, y);
  y += 14;

  const g = data.gomero;
  const filas: [string, string][] = [
    ['Marca del neumático', g.marca || '—'],
    ['Medida', g.medida || '—'],
    ['Presión', g.presionBar || '—'],
    ['Km actual', g.kilometraje || '—'],
    [
      'Neumáticos cambiados',
      g.neumaticosCambiados === true ? 'Sí' : g.neumaticosCambiados === false ? 'No' : '—',
    ],
  ];

  doc.font('Helvetica').fontSize(9);
  for (const [label, valor] of filas) {
    doc.fillColor(COLOR_GRIS).text(`${label}:`, MARGIN, y, { width: 120 });
    doc.fillColor('#111827').text(valor, MARGIN + 124, y, { width: CONTENT_W - 124 });
    y += 14;
  }

  y += 4;
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(COLOR_BORDE).lineWidth(0.5).stroke();
  return y + 14;
}

function drawTablaEncabezado(doc: PDFKit.PDFDocument, y: number): number {
  const xCant = MARGIN + COL_ITEM_W + 8;
  const xPrecio = xCant + COL_CANT_W;
  const xSub = xPrecio + COL_PRECIO_W;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_GRIS);
  doc.text('Ítem', MARGIN + 4, y + 4, { width: COL_ITEM_W });
  doc.text('Cant.', xCant, y + 4, { width: COL_CANT_W, align: 'center' });
  doc.text('P. unit.', xPrecio, y + 4, { width: COL_PRECIO_W, align: 'right' });
  doc.text('Subtotal', xSub, y + 4, { width: COL_SUB_W, align: 'right' });
  return y + 18;
}

function drawTablaFila(
  doc: PDFKit.PDFDocument,
  etiqueta: string,
  cantidad: number,
  precioUnit: number,
  subtotal: number,
  y: number,
): number {
  const xCant = MARGIN + COL_ITEM_W + 8;
  const xPrecio = xCant + COL_CANT_W;
  const xSub = xPrecio + COL_PRECIO_W;
  const rowH = 16;

  doc.rect(MARGIN, y, CONTENT_W, rowH).fillColor('#FAFAFA').fill();

  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  doc.text(etiqueta, MARGIN + 4, y + 4, { width: COL_ITEM_W - 4, lineBreak: false, ellipsis: true });
  doc.text(String(cantidad), xCant, y + 4, { width: COL_CANT_W, align: 'center' });
  doc.text(fmtMoney(precioUnit), xPrecio, y + 4, { width: COL_PRECIO_W, align: 'right' });
  doc.text(fmtMoney(subtotal), xSub, y + 4, { width: COL_SUB_W, align: 'right' });

  doc
    .moveTo(MARGIN, y + rowH)
    .lineTo(PAGE_W - MARGIN, y + rowH)
    .strokeColor('#E5E7EB')
    .lineWidth(0.5)
    .stroke();

  return y + rowH;
}

function drawSeccionMecanico(
  doc: PDFKit.PDFDocument,
  seccion: PresupuestoSeccionPdf,
  y: number,
): number {
  const needed = 36 + seccion.lineas.length * 16 + 24;
  y = ensureSpace(doc, y, Math.min(needed, 120));

  doc.roundedRect(MARGIN, y, CONTENT_W, 20, 4).fillColor('#1F1F1F').fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#FFFFFF')
    .text(seccion.titulo, MARGIN + 10, y + 6, { width: CONTENT_W - 20 });
  y += 26;

  y = drawTablaEncabezado(doc, y);
  for (const linea of seccion.lineas) {
    y = ensureSpace(doc, y, 20);
    y = drawTablaFila(doc, linea.etiqueta, linea.cantidad, linea.precioUnitario, linea.subtotal, y);
  }

  y += 4;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827');
  doc.text('Subtotal sección', MARGIN, y, { width: CONTENT_W - COL_SUB_W - 8, align: 'right' });
  doc.text(fmtMoney(seccion.subtotal), PAGE_W - MARGIN - COL_SUB_W, y, {
    width: COL_SUB_W,
    align: 'right',
  });

  return y + 22;
}

function drawLegacyMecanico(doc: PDFKit.PDFDocument, data: PresupuestoOrdenData, y: number): number {
  const leg = data.legacy;
  if (!leg) return y;

  y = ensureSpace(doc, y, 120);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_ROJO).text('MECÁNICO (formato anterior)', MARGIN, y);
  y += 14;

  const filas: [string, string][] = [
    ['Tren delantero', leg.trenDelantero],
    ['Alineado', boolTxt(leg.alineado)],
    ['Balanceo', boolTxt(leg.balanceo)],
    ['Amortiguadores revisados', boolTxt(leg.amortiguadores)],
    ['Auxilio revisado', boolTxt(leg.auxilio)],
  ];

  doc.font('Helvetica').fontSize(9);
  for (const [label, valor] of filas) {
    doc.fillColor(COLOR_GRIS).text(`${label}:`, MARGIN, y, { width: 140 });
    doc.fillColor('#111827').text(valor, MARGIN + 144, y, { width: CONTENT_W - 144 });
    y += 14;
  }

  if (leg.presupuestoTexto) {
    y += 4;
    doc.fillColor(COLOR_GRIS).text('Presupuesto:', MARGIN, y);
    y += 12;
    doc.fillColor('#111827').text(leg.presupuestoTexto, MARGIN, y, { width: CONTENT_W });
    y += doc.heightOfString(leg.presupuestoTexto, { width: CONTENT_W }) + 8;
  }

  return y + 8;
}

function drawTotalGeneral(doc: PDFKit.PDFDocument, total: number, y: number): number {
  y = ensureSpace(doc, y, 48);
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
  y = ensureSpace(doc, y, 130);

  if (data.operarioResponsable) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text('OPERARIO RESPONSABLE', MARGIN, y);
    y += 12;
    doc.font('Helvetica').fontSize(9).fillColor('#111827').text(data.operarioResponsable, MARGIN, y);
    y += 20;
  }

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text('OBSERVACIONES', MARGIN, y);
  y += 12;

  doc.roundedRect(MARGIN, y, CONTENT_W, 48, 4).strokeColor(COLOR_BORDE).lineWidth(0.5).stroke();

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#111827')
    .text(data.observaciones?.trim() || '—', MARGIN + 8, y + 8, {
      width: CONTENT_W - 16,
      height: 40,
    });

  y += 58;

  const firmaY = y;
  doc
    .moveTo(MARGIN, firmaY)
    .lineTo(MARGIN + 220, firmaY)
    .strokeColor(COLOR_GRIS)
    .lineWidth(0.5)
    .stroke();

  doc.font('Helvetica').fontSize(8).fillColor(COLOR_GRIS).text('Firma', MARGIN, firmaY + 4);

  if (data.firmaMecanico) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#111827')
      .text(data.firmaMecanico, MARGIN, firmaY - 12, { width: 220 });
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
    y = drawGomero(doc, data, y);

    if (data.usaChecklistNuevo) {
      for (const seccion of data.secciones) {
        y = drawSeccionMecanico(doc, seccion, y);
      }
    } else {
      y = drawLegacyMecanico(doc, data, y);
    }

    y = drawTotalGeneral(doc, data.totalGeneral, y);
    drawFooter(doc, data, y);

    doc.end();
  });
}
