#!/usr/bin/env node
// Generate favicon assets from public/new-logo.jpg (for all sizes) and public/favicon-mark.svg (for mask icon)
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const toIco = require('to-ico')

const ROOT = path.resolve(__dirname, '..')
const IN_RASTER = path.join(ROOT, 'public', 'new-logo.jpg')
const IN_MARK_SVG = path.join(ROOT, 'public', 'favicon-mark.svg')
const OUT_ICO = path.join(ROOT, 'public', 'favicon.ico')
const OUT_16 = path.join(ROOT, 'public', 'favicon-16x16.png')
const OUT_32 = path.join(ROOT, 'public', 'favicon-32x32.png')
const OUT_APPLE = path.join(ROOT, 'public', 'apple-touch-icon.png')

const ICO_SIZES = [16, 32, 48, 64, 128, 256]

if (!fs.existsSync(IN_RASTER) || !fs.existsSync(IN_MARK_SVG)) {
  console.error('Required input not found:', IN_RASTER, IN_MARK_SVG)
  process.exit(2)
}

async function makePngFromRaster(size, outPath) {
  // center-crop to a square then resize with sharpening for crisp small icons
  await sharp(IN_RASTER)
    .resize({
      width: Math.max(size, 256),
      height: Math.max(size, 256),
      fit: sharp.fit.cover,
      position: sharp.strategy.attention,
      kernel: sharp.kernel.lanczos3
    })
    .resize(size, size)
    .sharpen()
    .png({ compressionLevel: 9 })
    .toFile(outPath)
}

async function makePngFromSvg(size, outPath) {
  await sharp(IN_MARK_SVG)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(outPath)
}

async function run() {
  try {
    // Create small PNGs from the raster new-logo.jpg so the favicon resembles the logo
    await makePngFromRaster(16, OUT_16)
    await makePngFromRaster(32, OUT_32)

    // Apple touch from raster source (keeps detail)
    await makePngFromRaster(180, OUT_APPLE)

    // Prepare buffers for ICO using raster for all sizes (ensures consistency with logo)
    const buffers = []
    for (const s of ICO_SIZES) {
      const buf = await sharp(IN_RASTER)
        .resize({ width: s, height: s, fit: sharp.fit.cover, position: sharp.strategy.attention, kernel: sharp.kernel.lanczos3 })
        .sharpen()
        .png()
        .toBuffer()
      buffers.push(buf)
    }

    const ico = await toIco(buffers)
    fs.writeFileSync(OUT_ICO, ico)
    console.log('Wrote', OUT_ICO)
    console.log('Wrote', OUT_16)
    console.log('Wrote', OUT_32)
    console.log('Wrote', OUT_APPLE)
  } catch (err) {
    console.error('Failed:', err)
    process.exit(1)
  }
}

run()
