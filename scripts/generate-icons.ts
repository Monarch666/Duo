import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to write a basic uncompressed/deflated RGBA PNG
function createPng(width: number, height: number, pixelFn: (x: number, y: number) => [number, number, number, number]): Buffer {
  // Each scanline begins with a filter byte (0 = None), followed by width * 4 bytes (RGBA)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation for PNG chunks
function crc32(buf: Buffer): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

// Generate Duo Icon
// Clean Rosewood background (#B93844 -> [185, 56, 68])
// Warm Ivory interconnected circles (#FAF6EF -> [250, 246, 239])
function renderDuoIcon(size: number): Buffer {
  const bg = [185, 56, 68, 255]; // Rosewood
  const fg = [250, 246, 239, 255]; // Warm Ivory
  const border = [148, 44, 53, 255]; // Darker Rosewood border

  const center = size / 2;
  const radius = size * 0.44;
  const ringRadius = size * 0.17;
  const ringThickness = size * 0.045;
  const offset = size * 0.11;

  return createPng(size, size, (x, y) => {
    // Distance from center for rounded container
    const dx = x - center;
    const dy = y - center;
    const distSq = dx * dx + dy * dy;

    // Outer circle container
    if (distSq > radius * radius) {
      return [0, 0, 0, 0]; // Transparent outside
    }

    // Outer subtle border
    if (distSq > (radius - 2) * (radius - 2)) {
      return border as [number, number, number, number];
    }

    // Left ring center: (center - offset, center)
    const dLeft = Math.hypot(x - (center - offset), y - center);
    const inLeftRing = Math.abs(dLeft - ringRadius) <= ringThickness;

    // Right ring center: (center + offset, center)
    const dRight = Math.hypot(x - (center + offset), y - center);
    const inRightRing = Math.abs(dRight - ringRadius) <= ringThickness;

    if (inLeftRing || inRightRing) {
      return fg as [number, number, number, number];
    }

    return bg as [number, number, number, number];
  });
}

function generateSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#B93844"/>
  <!-- Two intertwined minimal rings representing two partners -->
  <circle cx="210" cy="256" r="85" fill="none" stroke="#FAF6EF" stroke-width="24"/>
  <circle cx="302" cy="256" r="85" fill="none" stroke="#FAF6EF" stroke-width="24"/>
</svg>`;
}

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  const iconsDir = path.join(publicDir, 'icons');

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  // 1. Generate SVG
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), generateSvg(), 'utf-8');
  console.log('[Icons] Generated public/icons/icon.svg');

  // 2. Generate PNG 192x192
  const png192 = renderDuoIcon(192);
  fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);
  console.log('[Icons] Generated public/icons/icon-192x192.png');

  // 3. Generate PNG 512x512
  const png512 = renderDuoIcon(512);
  fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);
  console.log('[Icons] Generated public/icons/icon-512x512.png');

  // 4. Generate Favicon (32x32 PNG as favicon.ico)
  const favicon = renderDuoIcon(32);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);
  console.log('[Icons] Generated public/favicon.ico');

  // 5. Generate manifest.json
  const manifest = {
    name: 'Duo — Private Space for Two',
    short_name: 'Duo',
    description: 'An intimate, private sanctuary designed exclusively for you and your partner.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6EF',
    theme_color: '#FAF6EF',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };

  fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('[Icons] Generated public/manifest.json');
}

main().catch(console.error);
