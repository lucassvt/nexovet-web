#!/usr/bin/env node
// Sincroniza visibilidad de productos basado en stock real en Medusa inventory_level.
//
// Reglas:
//   - Producto PUBLISHED con total_stock <= 0 en TODAS sus variantes/locations → draft + metadata.hidden_reason='no-stock'
//   - Producto DRAFT con hidden_reason='no-stock' y total_stock > 0 → published (republica)
//   - Productos con hidden_reason='administrative-service' u otro motivo: NO TOCAR (mantiene el reason)
//
// Idempotente: se puede correr en cron cada hora/día sin daño.
// Uso: node sync-stock-visibility.js [--dry]

const { Client } = require('pg');

const PG_URL = process.env.NEXOVET_SHOP_DB || 'postgresql://medusa:medusa_nexovet_2026@localhost:5435/nexovet_shop';
const DRY = process.argv.includes('--dry');

async function main() {
  console.log('=== SYNC STOCK VISIBILITY ===');
  console.log('DRY:', DRY);

  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  // 1. Compute total stock per product
  const { rows: stockRows } = await pg.query(`
    SELECT pv.product_id AS product_id,
      COALESCE(SUM(il.stocked_quantity), 0) AS total_stock,
      BOOL_OR(pv.manage_inventory = false) AS has_untracked,
      BOOL_OR(pv.allow_backorder = true) AS has_backorder
    FROM product_variant pv
    LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
    LEFT JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
    GROUP BY pv.product_id
  `);
  const stockMap = new Map();
  for (const r of stockRows) {
    stockMap.set(r.product_id, {
      total: parseInt(r.total_stock) || 0,
      untracked: r.has_untracked,
      backorder: r.has_backorder,
    });
  }

  // 2. Get all products with current status + hidden_reason
  const { rows: products } = await pg.query(`
    SELECT id, handle, title, status, metadata
    FROM product
    ORDER BY handle
  `);

  let toHide = 0;
  let toRepublish = 0;
  let skippedOtherReason = 0;
  let untouchedHidden = 0;
  let untouchedOk = 0;

  for (const p of products) {
    const s = stockMap.get(p.id) || { total: 0, untracked: false, backorder: false };
    const hasStock = s.untracked || s.backorder || s.total > 0;
    const reason = p.metadata?.hidden_reason || null;

    // Case 1: published but no stock → hide
    if (p.status === 'published' && !hasStock) {
      if (DRY) {
        if (toHide < 10) console.log(`  HIDE  ${p.handle.slice(0, 50)}  (stock=0)`);
      } else {
        const newMeta = { ...(p.metadata || {}), hidden_reason: 'no-stock', hidden_at: new Date().toISOString() };
        await pg.query(
          `UPDATE product SET status = 'draft', metadata = $1, updated_at = NOW() WHERE id = $2`,
          [newMeta, p.id]
        );
      }
      toHide++;
      continue;
    }

    // Case 2: draft with reason='no-stock' but has stock now → republish
    if (p.status === 'draft' && reason === 'no-stock' && hasStock) {
      if (DRY) {
        if (toRepublish < 10) console.log(`  SHOW  ${p.handle.slice(0, 50)}  (stock=${s.total})`);
      } else {
        const newMeta = { ...(p.metadata || {}) };
        delete newMeta.hidden_reason;
        delete newMeta.hidden_at;
        newMeta.republished_at = new Date().toISOString();
        await pg.query(
          `UPDATE product SET status = 'published', metadata = $1, updated_at = NOW() WHERE id = $2`,
          [newMeta, p.id]
        );
      }
      toRepublish++;
      continue;
    }

    // Case 3: draft with OTHER reason (e.g., administrative-service) → leave as is
    if (p.status === 'draft' && reason && reason !== 'no-stock') {
      skippedOtherReason++;
      continue;
    }

    // Case 4: draft without reason → leave (legacy, not managed by us)
    if (p.status === 'draft') {
      untouchedHidden++;
      continue;
    }

    // Case 5: published with stock → OK
    untouchedOk++;
  }

  console.log('\n=== RESUMEN ===');
  console.log(`  Productos escaneados:         ${products.length}`);
  console.log(`  → Hidden (sin stock):         ${toHide}`);
  console.log(`  → Republished (stock OK):     ${toRepublish}`);
  console.log(`  Draft con otro motivo:        ${skippedOtherReason}`);
  console.log(`  Draft sin motivo (legacy):    ${untouchedHidden}`);
  console.log(`  Published con stock:          ${untouchedOk}`);

  await pg.end();
}

main().catch((e) => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
