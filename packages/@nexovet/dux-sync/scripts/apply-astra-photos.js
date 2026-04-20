#!/usr/bin/env node
// Apply ASTRA photos to Medusa products that still have NO thumbnail.
// Match rule: Medusa product.handle ends with -<sku> or -<sku>-leg; SKU taken from
// astra dump.productos.sku (which is the "cod_item" number from DUX).
// Copies from /tmp/astra-extract/imagenes/productos/<prod_<id>_*.ext> to
// /var/www/nexovet-shop/backend-storefront/public/images/products/<handle>/.
// Idempotent: skips products that already have a thumbnail.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PG_URL = process.env.NEXOVET_SHOP_DB || 'postgresql://medusa:medusa_nexovet_2026@localhost:5435/nexovet_shop';
const ASTRA_JSON = process.env.ASTRA_JSON || '/tmp/astra-sku-images.json';
const ASTRA_IMG_DIR = process.env.ASTRA_IMG_DIR || '/tmp/astra-extract/imagenes/productos';
const PUBLIC_DIR = process.env.PUBLIC_DIR || '/var/www/nexovet-shop/backend-storefront/public/images/products';
const DRY = process.argv.includes('--dry');
const LIMIT = parseInt((process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1] || '0');

const FRANQ = new Set(['cat', 'cor', 'res', 'ora', 'her', 'god', 'juj', 'zap', 'ros', 'taf']);

function extractSkuFromHandle(handle) {
  // Examples:
  //   aca-no-liquido-x-450-ml-res-598 -> 598
  //   royal-hypoallergenic-x2kg-ros-00751 -> 00751
  //   jaspe-cachorro-x-15-kg-900921-leg -> 900921
  //   7-vidas-carne-y-pollo-x-100-grs-ora-900291x100grs -> 900291x100grs
  const parts = handle.split('-');
  if (parts[parts.length - 1] === 'leg') parts.pop();
  const last = parts[parts.length - 1];
  if (!last) return null;
  return last;
}

function fileFromPath(astraRelPath) {
  // astraRelPath: "imagenes/productos/prod_46_c61b0d3e.webp"
  const filename = path.basename(astraRelPath);
  return path.join(ASTRA_IMG_DIR, filename);
}

function isSafeMainImage(relPath) {
  // Skip variant/color images (prod_X_color_rojo_HASH.webp) — we want the main one
  const base = path.basename(relPath);
  return !/prod_\d+_(color|add)_/.test(base);
}

function copyImages(sources, handle) {
  const destDir = path.join(PUBLIC_DIR, handle);
  fs.mkdirSync(destDir, { recursive: true });
  const copied = [];
  sources.forEach((src, i) => {
    const ext = path.extname(src).toLowerCase() || '.webp';
    const destName = `${i + 1}${ext}`;
    const destPath = path.join(destDir, destName);
    if (!fs.existsSync(destPath) && fs.existsSync(src)) {
      fs.copyFileSync(src, destPath);
    }
    if (fs.existsSync(destPath)) {
      copied.push(`/images/products/${handle}/${destName}`);
    }
  });
  return copied;
}

async function main() {
  console.log('=== APPLY ASTRA PHOTOS ===');
  console.log('DRY:', DRY, 'LIMIT:', LIMIT || 'ALL');

  if (!fs.existsSync(ASTRA_JSON)) throw new Error(`missing ${ASTRA_JSON}`);
  if (!fs.existsSync(ASTRA_IMG_DIR)) throw new Error(`missing ${ASTRA_IMG_DIR}`);

  const astraMap = JSON.parse(fs.readFileSync(ASTRA_JSON, 'utf-8'));
  console.log(`ASTRA SKUs with images: ${Object.keys(astraMap).length}`);

  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  const { rows: products } = await pg.query(
    `SELECT id, handle, thumbnail FROM product WHERE thumbnail IS NULL OR thumbnail = '' ORDER BY handle`
  );
  console.log(`Medusa products without thumbnail: ${products.length}`);

  const targets = LIMIT > 0 ? products.slice(0, LIMIT) : products;
  let matched = 0;
  let copied = 0;
  let noSkuMatch = 0;
  let missingSource = 0;

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const sku = extractSkuFromHandle(p.handle);
    if (!sku) { noSkuMatch++; continue; }
    const rec = astraMap[sku];
    if (!rec) { noSkuMatch++; continue; }

    // Filter and map images
    const mainImages = rec.imagenes.filter(isSafeMainImage);
    if (!mainImages.length) { noSkuMatch++; continue; }

    const sources = mainImages.map(fileFromPath).filter(s => fs.existsSync(s));
    if (!sources.length) { missingSource++; continue; }

    matched++;

    if (DRY) {
      if (i < 20) {
        console.log(`  DRY ${p.handle.slice(0, 50)}  <- sku ${sku} / ${sources.length} imgs (${rec.nombre})`);
      }
      continue;
    }

    const urls = copyImages(sources, p.handle);
    if (!urls.length) { missingSource++; continue; }

    const thumbUrl = urls[0];
    await pg.query(
      `UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2`,
      [thumbUrl, p.id]
    );

    // Insert image rows
    for (const u of urls) {
      try {
        const { rows: existing } = await pg.query(
          `SELECT i.id FROM image i JOIN product_image pi ON pi.image_id = i.id WHERE pi.product_id = $1 AND i.url = $2`,
          [p.id, u]
        );
        if (existing.length) continue;
        const imgId = 'img_' + Math.random().toString(36).slice(2, 12).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-4);
        await pg.query(`INSERT INTO image (id, url, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING`, [imgId, u]);
        await pg.query(`INSERT INTO product_image (product_id, image_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [p.id, imgId]);
      } catch (e) {}
    }
    copied++;

    if (i % 25 === 0) {
      process.stdout.write(`\r  [${i + 1}/${targets.length}] matched=${matched} copied=${copied} noSku=${noSkuMatch}  ${p.handle.slice(0, 30)}   `);
    }
  }
  process.stdout.write('\n');

  console.log('\n=== RESUMEN ===');
  console.log(`  Products sin thumb:     ${targets.length}`);
  console.log(`  Match SKU en ASTRA:     ${matched}`);
  console.log(`  Foto copiada + DB upd:  ${copied}`);
  console.log(`  Sin match SKU:          ${noSkuMatch}`);
  console.log(`  Archivo no existe:      ${missingSource}`);

  await pg.end();
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
