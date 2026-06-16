#!/usr/bin/env node
/**
 * Erzeugt PNG/ICO-Favicons aus assets/img/favicon.svg
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG = path.join(__dirname, '..', 'assets', 'img');
const svg = fs.readFileSync(path.join(IMG, 'favicon.svg'));

async function main() {
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  const pngBuffers = [];
  for (const { name, size } of sizes) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(IMG, name), buf);
    if (size <= 32) pngBuffers.push({ size, buf });
    console.log('Wrote', name);
  }

  const ico = await buildIco(pngBuffers);
  fs.writeFileSync(path.join(IMG, 'favicon.ico'), ico);
  console.log('Wrote favicon.ico');
}

function buildIco(images) {
  const sorted = [...images].sort((a, b) => a.size - b.size);
  const count = sorted.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = sorted.map(({ size, buf }) => {
    const entry = {
      width: size === 256 ? 0 : size,
      height: size === 256 ? 0 : size,
      buf,
      offset,
    };
    offset += buf.length;
    return entry;
  });

  const total = offset;
  const out = Buffer.alloc(total);
  let pos = 0;
  out.writeUInt16LE(0, pos);
  pos += 2;
  out.writeUInt16LE(1, pos);
  pos += 2;
  out.writeUInt16LE(count, pos);
  pos += 2;

  for (const e of entries) {
    out.writeUInt8(e.width, pos);
    pos += 1;
    out.writeUInt8(e.height, pos);
    pos += 1;
    out.writeUInt8(0, pos);
    pos += 1;
    out.writeUInt8(0, pos);
    pos += 1;
    out.writeUInt16LE(1, pos);
    pos += 2;
    out.writeUInt16LE(32, pos);
    pos += 2;
    out.writeUInt32LE(e.buf.length, pos);
    pos += 4;
    out.writeUInt32LE(e.offset, pos);
    pos += 4;
  }

  for (const e of entries) {
    e.buf.copy(out, e.offset);
  }

  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
