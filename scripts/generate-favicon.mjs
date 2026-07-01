// One-off script: renders src/app/icon.svg into a multi-size favicon.ico
// (PNG-encoded ICO entries, supported by all modern browsers).
// Run with: node scripts/generate-favicon.mjs
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const sizes = [16, 32, 48];
const svg = await readFile(new URL("../src/app/icon.svg", import.meta.url));

const pngs = await Promise.all(
  sizes.map((size) =>
    sharp(svg, { density: 300 }).resize(size, size).png().toBuffer(),
  ),
);

const headerSize = 6;
const entrySize = 16;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);

const entries = [];
let offset = headerSize + entrySize * sizes.length;

for (const [index, png] of pngs.entries()) {
  const size = sizes[index];
  const entry = Buffer.alloc(entrySize);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  offset += png.length;
}

const ico = Buffer.concat([header, ...entries, ...pngs]);
await writeFile(new URL("../src/app/favicon.ico", import.meta.url), ico);
console.log(`Wrote favicon.ico (${ico.length} bytes, sizes: ${sizes.join(", ")})`);
