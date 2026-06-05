/**
 * Genera icon.png (1024) con esquinas redondeadas desde logo.png
 */
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const LOGO = path.join(ROOT, 'assets/images/logo.png');
const ICON = path.join(ROOT, 'assets/images/icon.png');

async function crearIconoRedondeado(salida, tamano, radioRatio = 0.22) {
  const radio = Math.round(tamano * radioRatio);
  const mascara = Buffer.from(
    `<svg width="${tamano}" height="${tamano}">
      <rect width="${tamano}" height="${tamano}" rx="${radio}" ry="${radio}" fill="white"/>
    </svg>`,
  );

  const imagen = await sharp(LOGO)
    .resize(tamano, tamano, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .toBuffer();

  await sharp(imagen)
    .composite([{ input: mascara, blend: 'dest-in' }])
    .png()
    .toFile(salida);

  console.log(`✓ ${path.relative(ROOT, salida)} (${tamano}px)`);
}

async function main() {
  await crearIconoRedondeado(ICON, 1024);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
