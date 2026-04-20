#!/usr/bin/env node
// Enrich Medusa products with descriptions + metadata from TN NOA export.
// Input: /tmp/tn-products.json (1182 base-slugs) produced from the CSV.
// For each Medusa product, derive base-slug from handle (same rule as photo script).
// If base-slug exists in TN data, UPDATE product.description + metadata (tn_slug, tn_marca,
// tn_categorias, tn_tags, tn_sku, tn_nombre_original).
// Also sets `subtitle` to a short teaser (first 140 chars of description).
// Idempotent: only UPDATE when description is empty or starts with the old pattern `marca — nombre`.

const fs = require('fs');
const { Client } = require('pg');

const PG_URL =
  process.env.NEXOVET_SHOP_DB ||
  'postgresql://medusa:medusa_nexovet_2026@localhost:5435/nexovet_shop';
const TN_PATH = process.env.TN_PATH || '/tmp/tn-products.json';
const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force'); // re-apply even if desc looks rich
const LIMIT = parseInt(
  (process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0'
);

const FRANQ = new Set(['cat', 'cor', 'res', 'ora', 'her', 'god', 'juj', 'zap', 'ros', 'taf']);

function deriveBaseSlug(handle) {
  const parts = handle.split('-');
  if (parts[parts.length - 1] === 'leg') parts.pop();
  if (parts.length > 1) parts.pop();
  if (parts.length > 0 && FRANQ.has(parts[parts.length - 1])) parts.pop();
  return parts.join('-');
}

function isThinDescription(d) {
  if (!d) return true;
  const trimmed = d.trim();
  if (trimmed.length < 40) return true;
  // Old fallback from sync-products.js: "<marca> — <nombre>" or just " — <nombre>"
  if (/^[\w\s-]{0,60}— /.test(trimmed) && trimmed.length < 120) return true;
  return false;
}

function buildSubtitle(text) {
  if (!text) return null;
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= 140) return oneLine;
  return oneLine.slice(0, 137) + '...';
}

async function main() {
  console.log('=== APPLY TN DESCRIPTIONS ===');
  console.log('DRY:', DRY, 'FORCE:', FORCE, 'LIMIT:', LIMIT || 'ALL');

  const tn = JSON.parse(fs.readFileSync(TN_PATH, 'utf-8'));
  const tnSlugCount = Object.keys(tn).length;
  console.log(`TN data: ${tnSlugCount} base_slugs`);

  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  const { rows: products } = await pg.query(
    `SELECT id, handle, description, subtitle, metadata FROM product ORDER BY handle`
  );
  console.log(`Medusa products: ${products.length}`);

  let matched = 0;
  let updated = 0;
  let skippedRich = 0;
  let noSlugMatch = 0;

  const targets = LIMIT > 0 ? products.slice(0, LIMIT) : products;

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const base = deriveBaseSlug(p.handle);
    const rec = tn[base];
    if (!rec) {
      noSlugMatch++;
      continue;
    }
    matched++;

    const needsUpdate = FORCE || isThinDescription(p.description);
    if (!needsUpdate) {
      skippedRich++;
      continue;
    }

    const newDescription = rec.description_text || p.description || '';
    const newSubtitle = buildSubtitle(newDescription);
    const mergedMeta = {
      ...(p.metadata || {}),
      tn_slug: rec.tn_slug,
      tn_nombre: rec.nombre,
      tn_marca: rec.marca || (p.metadata || {}).dux_marca_nombre || null,
      tn_categorias: rec.categorias || null,
      tn_tags: rec.tags && rec.tags.length ? rec.tags : null,
      tn_sku: rec.sku || null,
      tn_source: 'tiendanube-noa-export-2026-04-19',
      tn_applied_at: new Date().toISOString(),
    };

    if (DRY) {
      if (i < 20) {
        console.log(
          `  DRY ${p.handle.slice(0, 50)}  <- ${base}  desc(${newDescription.length}) marca=${rec.marca}`
        );
      }
      updated++;
      continue;
    }

    await pg.query(
      `UPDATE product SET description = $1, subtitle = $2, metadata = $3, updated_at = NOW() WHERE id = $4`,
      [newDescription, newSubtitle, mergedMeta, p.id]
    );
    updated++;

    if (i % 25 === 0) {
      process.stdout.write(
        `\r  [${i + 1}/${targets.length}] matched=${matched} upd=${updated} skipRich=${skippedRich} noMatch=${noSlugMatch}  ${p.handle.slice(0, 30)}   `
      );
    }
  }
  process.stdout.write('\n');

  console.log('\n=== RESUMEN ===');
  console.log(`  Products iterados:     ${targets.length}`);
  console.log(`  Match por base_slug:   ${matched}`);
  console.log(`  Actualizados:          ${updated}`);
  console.log(`  Saltados (ya ricos):   ${skippedRich}`);
  console.log(`  Sin match TN:          ${noSlugMatch}`);

  await pg.end();
}

main().catch((e) => {
  console.error('FATAL:', e.message, e.stack);
  process.exit(1);
});
