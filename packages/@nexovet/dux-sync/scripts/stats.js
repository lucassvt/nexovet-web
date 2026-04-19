#!/usr/bin/env node
// @nexovet/dux-sync — stats.js
// Cuenta productos disponibles por franquicia en items_franquicia + matching con scraping

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DUX_URL = process.env.DUX_INTEGRADA_URL || 'postgresql://dux_user:lamascotera@localhost:5432/dux_integrada';

// Mapeo franquicia -> id_deposito DUX (copiado de setup-regions-argentina.md)
const FRANQUICIAS = [
  { name: 'Catamarca',        dux_deposito_id: 18353 },
  { name: 'Chaco',            dux_deposito_id: 20585 },
  { name: 'Jujuy',            dux_deposito_id: 18311 },
  { name: 'Godoy Cruz',       dux_deposito_id: 20329 },
  { name: 'Las Heras',        dux_deposito_id: 19144 },
  { name: 'Leguizamon',       dux_deposito_id: 18498 },
  { name: 'Oran',             dux_deposito_id: 18321 },
  { name: 'Rumipet Cordoba',  dux_deposito_id: 18313 },
  { name: 'Zapala',           dux_deposito_id: 17719 },
];

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function main() {
  const client = new Client({ connectionString: DUX_URL });
  await client.connect();

  console.log('='.repeat(70));
  console.log('DUX-SYNC STATS  —  ' + new Date().toISOString());
  console.log('='.repeat(70));

  console.log('\n1. STOCK POR FRANQUICIA (items con stock>0 en el depósito indicado)\n');
  console.log('  Franquicia             dep_id   habilitados  con_stock>0');
  console.log('  ' + '-'.repeat(64));

  for (const f of FRANQUICIAS) {
    const sql = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements(stock::jsonb) s
          WHERE (s->>'id')::int = $1
            AND (s->>'stock_disponible')::numeric > 0
        ) THEN 1 ELSE 0 END) AS con_stock
      FROM items_franquicia
      WHERE habilitado = 'S'
    `;
    const r = await client.query(sql, [f.dux_deposito_id]);
    const row = r.rows[0];
    console.log(`  ${f.name.padEnd(22)} ${String(f.dux_deposito_id).padStart(6)}  ${String(row.total).padStart(11)}  ${String(row.con_stock).padStart(11)}`);
  }

  console.log('\n2. LISTAS DE PRECIO DISPONIBLES\n');
  const lists = await client.query(`
    SELECT id_lista_precio_venta, lista_precio_venta, incluye_iva
    FROM lista_precio_venta_franquicia WHERE habilitado = 'S'
    ORDER BY id_lista_precio_venta
  `);
  for (const row of lists.rows) {
    console.log(`  ${String(row.id_lista_precio_venta).padStart(6)}  ${row.lista_precio_venta.padEnd(35)} IVA=${row.incluye_iva}`);
  }

  console.log('\n3. MATCHING CON SCRAPING TN NOA (780 productos JSON)\n');
  const scrapingPath = '/var/www/nexovet-shop/data-sources/catalogo_completo.json';
  if (fs.existsSync(scrapingPath)) {
    const scraping = JSON.parse(fs.readFileSync(scrapingPath, 'utf-8'));
    const scrapingByNormName = new Map();
    for (const p of scraping) {
      const key = normalize(p.name);
      if (key) scrapingByNormName.set(key, p);
    }
    console.log(`  Productos scrapeados: ${scraping.length}`);
    console.log(`  Keys normalizadas: ${scrapingByNormName.size}`);

    // Tomar muestra de items_franquicia con stock en Catamarca y probar match
    const sample = await client.query(`
      SELECT cod_item, item, marca_nombre
      FROM items_franquicia
      WHERE habilitado = 'S'
        AND EXISTS (SELECT 1 FROM jsonb_array_elements(stock::jsonb) s
                    WHERE (s->>'id')::int = 18353 AND (s->>'stock_disponible')::numeric > 0)
      LIMIT 50
    `);
    let matches = 0;
    const misses = [];
    for (const item of sample.rows) {
      const key = normalize(item.item);
      if (scrapingByNormName.has(key)) matches++;
      else misses.push(item.item);
    }
    console.log(`  Muestra Catamarca (50 items DUX): ${matches}/${sample.rows.length} matchean con scraping por nombre`);
    if (misses.length > 0) {
      console.log(`  Ejemplos NO matcheados:`);
      for (const m of misses.slice(0, 5)) console.log(`    · ${m}`);
    }
  } else {
    console.log(`  (catalogo_completo.json no encontrado en ${scrapingPath})`);
  }

  console.log('\n4. PRODUCTO EJEMPLO (primer item con stock en Catamarca)\n');
  const ex = await client.query(`
    SELECT cod_item, item, marca_nombre, costo,
           jsonb_path_query_first(stock::jsonb, '$[*] ? (@.id == 18353)') AS stock_info,
           jsonb_path_query_first(precios::jsonb, '$[*]') AS primer_precio
    FROM items_franquicia
    WHERE habilitado = 'S'
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(stock::jsonb) s
                  WHERE (s->>'id')::int = 18353 AND (s->>'stock_disponible')::numeric > 0)
    LIMIT 1
  `);
  if (ex.rows.length > 0) {
    const r = ex.rows[0];
    console.log(`  cod_item:       ${r.cod_item}`);
    console.log(`  item:           ${r.item}`);
    console.log(`  marca_nombre:   ${r.marca_nombre}`);
    console.log(`  costo:          ${r.costo}`);
    console.log(`  stock_info:     ${JSON.stringify(r.stock_info)}`);
    console.log(`  primer_precio:  ${JSON.stringify(r.primer_precio)}`);
  }

  await client.end();
  console.log('\n' + '='.repeat(70));
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
