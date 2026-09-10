import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'icon.svg'));
  const maskableSvgBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'icon-maskable.svg'));

  console.log('Generating PNG icons from SVG...');

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 512x512 Maskable PNG
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 32x32 Favicon PNG
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon.png'));
  console.log('Created favicon.png');

  console.log('All PWA and mobile app icons generated successfully!');
}

generate().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
