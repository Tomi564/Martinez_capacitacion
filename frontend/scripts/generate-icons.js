/**
 * Genera íconos PWA por defecto (MN sobre fondo oscuro).
 * Si tenés el logo final, reemplazá manualmente:
 *   frontend/public/icons/icon-192.png  (192×192)
 *   frontend/public/icons/icon-512.png  (512×512, puede ser maskable)
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fondo oscuro
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Texto "MN"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MN', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

// Crear carpeta si no existe
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar íconos
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generateIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generateIcon(512));

console.log('✅ Íconos PWA generados correctamente');