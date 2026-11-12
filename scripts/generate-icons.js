import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate an uncompressed PNG buffer
function createPng(width, height, getPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression method 0
  ihdrData.writeUInt8(0, 11); // filter method 0
  ihdrData.writeUInt8(0, 12); // interlace method 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData.writeUInt8(0, rowOffset); // filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData.writeUInt8(r, pixelOffset);
      rawData.writeUInt8(g, pixelOffset + 1);
      rawData.writeUInt8(b, pixelOffset + 2);
      rawData.writeUInt8(a, pixelOffset + 3);
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(length + 12);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, length + 8));
  chunk.writeUInt32BE(crc >>> 0, length + 8);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Pixel generator creating the sleek White Orbita Icon
function orbitaWhitePixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);

  // Rounded Squircle Outer boundary
  const rx = Math.abs(dx);
  const ry = Math.abs(dy);
  const radius = w * 0.46;
  const cornerRadius = w * 0.28;
  const isInside = (rx <= radius && ry <= radius - cornerRadius) ||
                   (ry <= radius && rx <= radius - cornerRadius) ||
                   (Math.hypot(rx - (radius - cornerRadius), ry - (radius - cornerRadius)) <= cornerRadius);

  if (!isInside) {
    return [0, 0, 0, 0];
  }

  // Border of the white container
  const isBorder = (rx > radius - 1 || ry > radius - 1);
  if (isBorder && w >= 32) {
    return [226, 232, 240, 255]; // Soft slate border #E2E8F0
  }

  // Central Core Circle (Electric Blue #3B82F6)
  const coreRadius = w * 0.14;
  if (dist <= coreRadius) {
    if (dist <= coreRadius * 0.45) {
      return [255, 255, 255, 255]; // Inner white star highlight
    }
    return [59, 130, 246, 255];
  }

  // Orbiting Ring (Cyan #0EA5E9 to Violet #A855F7)
  const ringRadius = w * 0.31;
  const ringThickness = Math.max(1.5, w * 0.055);
  const distFromRing = Math.abs(dist - ringRadius);

  // Orbit nodes
  const node1Dist = Math.hypot(x - (cx - ringRadius * 0.85), y - (cy - ringRadius * 0.35));
  if (node1Dist <= Math.max(1.5, w * 0.065)) {
    return [14, 165, 233, 255]; // Cyan node
  }

  const node2Dist = Math.hypot(x - (cx + ringRadius * 0.85), y - (cy + ringRadius * 0.35));
  if (node2Dist <= Math.max(1.5, w * 0.065)) {
    return [168, 85, 247, 255]; // Violet node
  }

  if (distFromRing <= ringThickness) {
    // Gradient along ring
    const angle = Math.atan2(dy, dx);
    const t = (angle + Math.PI) / (2 * Math.PI);
    const r = Math.round(14 * (1 - t) + 168 * t);
    const g = Math.round(165 * (1 - t) + 85 * t);
    const b = Math.round(233 * (1 - t) + 247 * t);
    return [r, g, b, 255];
  }

  // Pure White Background container
  return [255, 255, 255, 255];
}

const iconsDir = path.resolve('./public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const distIconsDir = path.resolve('./dist/icons');
if (!fs.existsSync(distIconsDir)) {
  try {
    fs.mkdirSync(distIconsDir, { recursive: true });
  } catch (e) {}
}

[16, 48, 128].forEach((size) => {
  const buf = createPng(size, size, orbitaWhitePixel);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated ${filePath}`);

  if (fs.existsSync(distIconsDir)) {
    const distPath = path.join(distIconsDir, `icon${size}.png`);
    fs.writeFileSync(distPath, buf);
  }
});
