/**
 * Generates Play Store / Expo icon + splash PNGs (valid, non-empty).
 * Run: node scripts/generate-store-assets.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')

const BLACK = [0, 0, 0, 255]
const WHITE = [255, 255, 255, 255]
const TEAL = [29, 158, 117, 255]
const TRANSPARENT = [0, 0, 0, 0]

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc(height * (1 + width * 4))
  let o = 0
  let p = 0
  for (let y = 0; y < height; y++) {
    raw[o++] = 0
    raw.set(pixels.subarray(p, p + width * 4), o)
    o += width * 4
    p += width * 4
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function fill(pixels, width, height, color) {
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = color[0]
    pixels[i * 4 + 1] = color[1]
    pixels[i * 4 + 2] = color[2]
    pixels[i * 4 + 3] = color[3]
  }
}

function setPixel(pixels, width, x, y, color) {
  const i = (y * width + x) * 4
  pixels[i] = color[0]
  pixels[i + 1] = color[1]
  pixels[i + 2] = color[2]
  pixels[i + 3] = color[3]
}

function fillRoundedRect(pixels, width, height, x0, y0, w, h, r, color) {
  const x1 = x0 + w
  const y1 = y0 + h
  const r2 = r * r
  const minX = Math.max(0, Math.floor(x0))
  const maxX = Math.min(width - 1, Math.ceil(x1) - 1)
  const minY = Math.max(0, Math.floor(y0))
  const maxY = Math.min(height - 1, Math.ceil(y1) - 1)
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cx = x + 0.5
      const cy = y + 0.5
      let inside = true
      if (cx < x0 + r && cy < y0 + r) {
        const dx = cx - (x0 + r)
        const dy = cy - (y0 + r)
        inside = dx * dx + dy * dy <= r2
      } else if (cx > x1 - r && cy < y0 + r) {
        const dx = cx - (x1 - r)
        const dy = cy - (y0 + r)
        inside = dx * dx + dy * dy <= r2
      } else if (cx < x0 + r && cy > y1 - r) {
        const dx = cx - (x0 + r)
        const dy = cy - (y1 - r)
        inside = dx * dx + dy * dy <= r2
      } else if (cx > x1 - r && cy > y1 - r) {
        const dx = cx - (x1 - r)
        const dy = cy - (y1 - r)
        inside = dx * dx + dy * dy <= r2
      } else if (cx < x0 || cx >= x1 || cy < y0 || cy >= y1) {
        inside = false
      }
      if (inside) setPixel(pixels, width, x, y, color)
    }
  }
}

/** Three rising bars — matches the dark premium UI + account teal accent. */
function paintMark(pixels, width, height, cx, cy, scale) {
  const barW = 72 * scale
  const gap = 36 * scale
  const radius = 22 * scale
  const heights = [160, 260, 380].map((h) => h * scale)
  const colors = [WHITE, WHITE, TEAL]
  const totalW = barW * 3 + gap * 2
  const maxH = heights[2]
  let x = cx - totalW / 2
  for (let i = 0; i < 3; i++) {
    const h = heights[i]
    fillRoundedRect(pixels, width, height, x, cy + maxH / 2 - h, barW, h, radius, colors[i])
    x += barW + gap
  }
}

function writeAsset(name, width, height, paint) {
  const pixels = Buffer.alloc(width * height * 4)
  paint(pixels, width, height)
  const png = encodePng(width, height, pixels)
  const path = join(assetsDir, name)
  writeFileSync(path, png)
  return { path, bytes: png.length }
}

mkdirSync(assetsDir, { recursive: true })

const written = [
  writeAsset('icon.png', 1024, 1024, (pixels, w, h) => {
    fill(pixels, w, h, BLACK)
    paintMark(pixels, w, h, 512, 512, 1)
  }),
  writeAsset('adaptive-icon.png', 1024, 1024, (pixels, w, h) => {
    fill(pixels, w, h, TRANSPARENT)
    // Safe zone is the inner ~66%; keep the mark well inside a circle crop.
    paintMark(pixels, w, h, 512, 530, 0.72)
  }),
  writeAsset('adaptive-icon-background.png', 1024, 1024, (pixels, w, h) => {
    fill(pixels, w, h, BLACK)
  }),
  writeAsset('splash.png', 1024, 1024, (pixels, w, h) => {
    fill(pixels, w, h, BLACK)
    paintMark(pixels, w, h, 512, 512, 0.85)
  }),
]

for (const file of written) {
  console.log(`${file.path} (${file.bytes} bytes)`)
}
