#!/usr/bin/env node
// @nexovet/dux-sync — sync-dry-run.js
// Dry-run: muestra qué productos se sincronizarían a Medusa SIN tocar la DB.
// Lee items_franquicia, deduplica por (item normalizado, marca), calcula inventory por sucursal.

const { Client } = require('pg');

const DUX_URL = process.env.DUX_INTEGRADA_URL || 'postgresql://dux_user:lamascotera@localhost:5432/dux_integrada';

// Mapeo franquicia (ecommerce region key) -> id_deposito DUX
const DEPOSITS = [
  { key: 'Catamarca',        dux_deposito_id: 18353, sloc_name: 'Deposito Julio Monti Catamarca' },
  { key: 'Chaco',            dux_deposito_id: 20585, sloc_name: 'Deposito Chaco Fernando' },
  { key: 'Jujuy',            dux_deposito_id: 18311, sloc_name: 'Deposito Masjujuy Lamadrid' },
  { key: 'Mendoza-GC',       dux_deposito_id: 20329, sloc_name: 'Deposito Godoy Cruz' },
  { key: 'Mendoza-LH',       dux_deposito_id: 19144, sloc_name: 'Deposito Las Heras Mendoza' },
  { key: 'Leguizamon',       dux_deposito_id: 18498, sloc_name: 'Deposito Leguizamon Salta' },
  { key: 'Oran',             dux_deposito_id: 18321, sloc_name: 'Deposito Mascotera Oran' },
  { key: 'Cordoba',          dux_deposito_id: 18313, sloc_name: 'Deposito Rumipet Cordoba' },
  { key: 'Zapala',           dux_deposito_id: 17719, sloc_name: 'Deposito Zapala' },
];
const PVP_LIST_ID = 56755; // LISTA DE PRECIOS 1 F

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractStock(stockJson, dexId) {
  if (!stockJson) return 0;
  const arr = typeof stockJson === 'string' ? JSON.parse(stockJson) : stockJson;
  const entry = arr.find(s => s.id === dexId);
  if (!entry) return 0;
  return parseFloat(entry.stock_disponible || 0);
}

function extractPrice(preciosJson, listId) {
  if (!preciosJson) return 0;
  const arr = typeof preciosJson === 'string' ? JSON.parse(preciosJson) : preciosJson;
  const entry = arr.find(p => p.id === listId);
  if (!entry) return 0;
  return parseFloat(entry.precio || 0);
}

async function main() {
  const client = new Client({ connectionString: DUX_URL });
  await client.connect();

  console.log('=== DUX-SYNC DRY RUN ===');
  console.log('Fecha:', new Date().toISOString());
  console.log('Lista PVP:', PVP_LIST_ID, '(LISTA DE PRECIOS 1 F)');
  console.log('');

  // Traer items con stock > 0 en al menos 1 depósito de las 9 regiones + precio en lista 56755 > 0
  const depositIds = DEPOSITS.map(d => d.dux_deposito_id);
  const sql = `
    SELECT cod_item, item, marca_nombre, codigos_barra, imagen_url, unidad_medida, proveedor_nombre,
           stock::jsonb AS stock_json,
           precios::jsonb AS precios_json
    FROM items_franquicia
    WHERE habilitado = 'S'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(stock::jsonb) s
        WHERE (s->>'id')::int = ANY($1::int[])
          AND (s->>'stock_disponible')::numeric > 0
      )
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(precios::jsonb) p
        WHERE (p->>'id')::int = $2 AND (p->>'precio')::numeric > 0
      )
  `;
  const r = await client.query(sql, [depositIds, PVP_LIST_ID]);
  console.log(`Items candidatos (con stock en al menos 1 region + PVP en lista 56755): ${r.rows.length}`);

  // Agrupar por (item normalizado, marca_nombre) para deduplicar
  const groups = new Map();
  for (const row of r.rows) {
    const groupKey = `${normalize(row.item)}|${normalize(row.marca_nombre || '')}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        name: row.item,
        brand: row.marca_nombre || '',
        items: [],
      });
    }
    groups.get(groupKey).items.push(row);
  }
  console.log(`Productos únicos (dedupe por nombre+marca): ${groups.size}`);
  console.log('');

  // Por cada grupo, armar el "producto Medusa preview"
  const preview = [];
  const inventoryByDeposit = Object.fromEntries(DEPOSITS.map(d => [d.key, 0]));

  for (const [key, grp] of groups) {
    const stockPerDep = {};
    let maxPvp = 0;
    let skus = new Set();

    for (const item of grp.items) {
      skus.add(item.cod_item);
      const pvp = extractPrice(item.precios_json, PVP_LIST_ID);
      if (pvp > maxPvp) maxPvp = pvp;

      for (const dep of DEPOSITS) {
        const stock = extractStock(item.stock_json, dep.dux_deposito_id);
        if (stock > 0) {
          stockPerDep[dep.key] = (stockPerDep[dep.key] || 0) + stock;
          inventoryByDeposit[dep.key] += stock;
        }
      }
    }

    preview.push({
      name: grp.name,
      brand: grp.brand,
      pvp_ars: maxPvp,
      variant_skus: [...skus],
      variant_count: skus.size,
      stock_per_region: stockPerDep,
      total_stock: Object.values(stockPerDep).reduce((a, b) => a + b, 0),
    });
  }

  // Ordenar por total_stock DESC
  preview.sort((a, b) => b.total_stock - a.total_stock);

  console.log('=== TOP 10 productos por stock total (suma de todas las regiones) ===');
  for (let i = 0; i < Math.min(10, preview.length); i++) {
    const p = preview[i];
    console.log(`${String(i + 1).padStart(2)}. ${p.name.slice(0, 45).padEnd(45)} ${p.brand.slice(0, 15).padEnd(15)} PVP=$${String(p.pvp_ars).padStart(8)} stock=${p.total_stock} (${p.variant_count} skus)`);
  }

  console.log('\n=== STOCK CONSOLIDADO POR REGION ===');
  for (const [regionKey, totalStock] of Object.entries(inventoryByDeposit)) {
    console.log(`  ${regionKey.padEnd(15)} ${totalStock} unidades totales`);
  }

  console.log('\n=== RESUMEN ===');
  console.log(`  Items DUX únicos (cod_item):  ${r.rows.length}`);
  console.log(`  Productos Medusa a crear:     ${groups.size}`);
  console.log(`  Stock unidades totales:       ${Object.values(inventoryByDeposit).reduce((a,b)=>a+b,0)}`);
  console.log(`  Mercaderia valorizada (PVP):  $${preview.reduce((sum,p)=>sum + p.pvp_ars*p.total_stock, 0).toLocaleString('es-AR')}`);

  await client.end();
}

main().catch(err => { console.error('ERROR:', err.message, err.stack); process.exit(1); });
