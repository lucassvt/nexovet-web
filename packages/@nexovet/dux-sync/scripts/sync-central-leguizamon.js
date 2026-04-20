#!/usr/bin/env node
// @nexovet/dux-sync — sync-central-leguizamon.js
// Sync REAL: crea productos en Medusa desde dux_integrada.items_central
// Solo para el deposito Leguizamón (Salta capital franquicia).
// Idempotente: si ya existe (por metadata.dux_group_key), extiende con sales_channel + inventory.

const { Client } = require('pg');

const DUX_URL = process.env.DUX_INTEGRADA_URL || 'postgresql://dux_user:lamascotera@localhost:5432/dux_integrada';
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lamascotera.com.ar';
const ADMIN_PASS = process.env.ADMIN_PASS || 'NexovetAdmin2026!';

const DEPOSITS = [
  { key: 'Leguizamon', dux_deposito_id: 18498, sloc_name: 'Deposito Leguizamon Salta', sales_channel_name: 'Salta-Leguizamon' },
];
const PVP_LIST_ID = 49595;
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || process.env.LIMIT || '0');

function normalize(s) {
  if (!s) return '';
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function handleOf(s) {
  return normalize(s).replace(/ /g, '-').slice(0, 80) || 'product';
}
function extractStock(stockJson, depId) {
  const arr = typeof stockJson === 'string' ? JSON.parse(stockJson) : stockJson;
  const e = arr.find(s => s.id === depId);
  return e ? parseFloat(e.stock_disponible || 0) : 0;
}
function extractPrice(preciosJson, listId) {
  const arr = typeof preciosJson === 'string' ? JSON.parse(preciosJson) : preciosJson;
  const e = arr.find(p => p.id === listId);
  return e ? parseFloat(e.precio || 0) : 0;
}

async function auth() {
  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const json = await res.json();
  if (!json.token) throw new Error('Auth failed: ' + JSON.stringify(json));
  return json.token;
}

async function getMedusaRefs(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const [sc, sl, reg] = await Promise.all([
    fetch(`${MEDUSA_URL}/admin/sales-channels?limit=50`, { headers }).then(r => r.json()),
    fetch(`${MEDUSA_URL}/admin/stock-locations?limit=50`, { headers }).then(r => r.json()),
    fetch(`${MEDUSA_URL}/admin/regions?limit=50`, { headers }).then(r => r.json()),
  ]);
  const scByName = Object.fromEntries(sc.sales_channels.map(x => [x.name, x.id]));
  const slByName = Object.fromEntries(sl.stock_locations.map(x => [x.name, x.id]));
  const argentina = reg.regions.find(r => r.name === 'Argentina');
  if (!argentina) throw new Error('Region Argentina no encontrada');
  return { scByName, slByName, argentinaId: argentina.id };
}

async function existingProductByDuxKey(token, duxKey) {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await fetch(`${MEDUSA_URL}/admin/products?q=${encodeURIComponent(duxKey)}&limit=5`, { headers });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.products || []).find(p => p.metadata?.dux_group_key === duxKey) || null;
}

async function addSalesChannelToExisting(token, product, scId) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const current = (product.sales_channels || []).map(x => x.id);
  if (current.includes(scId)) return false;
  const r = await fetch(`${MEDUSA_URL}/admin/products/${product.id}/sales-channels`, {
    method: 'POST', headers,
    body: JSON.stringify({ add: [scId] }),
  });
  return r.ok;
}

async function addInventoryLevel(token, product, scId, slocId, qty) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const variant = product.variants[0];
  const vRes = await fetch(`${MEDUSA_URL}/admin/products/${product.id}/variants/${variant.id}?fields=inventory_items.*,inventory_items.inventory.*`, { headers });
  const vJson = await vRes.json();
  const invItem = vJson.variant?.inventory_items?.[0];
  const inventoryItemId = invItem?.inventory?.id || invItem?.inventory_item_id;
  if (!inventoryItemId) return false;
  const r = await fetch(`${MEDUSA_URL}/admin/inventory-items/${inventoryItemId}/location-levels`, {
    method: 'POST', headers,
    body: JSON.stringify({ location_id: slocId, stocked_quantity: Math.floor(qty) }),
  });
  return r.ok;
}

async function createProduct(token, refs, group) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const activeSC = new Set();
  for (const item of group.items) {
    for (const d of DEPOSITS) {
      const stock = extractStock(item.stock_json, d.dux_deposito_id);
      if (stock > 0) activeSC.add(d.sales_channel_name);
    }
  }
  let bestPrice = 0;
  for (const item of group.items) {
    const p = extractPrice(item.precios_json, PVP_LIST_ID);
    if (p > bestPrice) bestPrice = p;
  }
  if (bestPrice <= 0) return { skipped: 'no_price', group };
  const skuList = [...new Set(group.items.map(i => i.cod_item))];
  const primarySku = skuList[0];
  const productPayload = {
    title: group.name.slice(0, 200),
    handle: handleOf(group.name + '-' + primarySku + '-leg'),
    status: 'published',
    description: `${group.brand || ''} — ${group.name}`.trim(),
    metadata: {
      dux_group_key: group.key,
      dux_cod_items: skuList,
      dux_brand: group.brand || null,
      dux_marca_nombre: group.brand || null,
      dux_source: 'items_central',
      synced_at: new Date().toISOString(),
    },
    sales_channels: [...activeSC].map(name => ({ id: refs.scByName[name] })).filter(x => x.id),
    options: [{ title: 'Default', values: ['Default'] }],
    variants: [
      {
        title: 'Default', sku: primarySku, manage_inventory: true,
        options: { Default: 'Default' },
        prices: [{ amount: Math.round(bestPrice * 100), currency_code: 'ars' }],
      },
    ],
  };
  const r = await fetch(`${MEDUSA_URL}/admin/products`, { method: 'POST', headers, body: JSON.stringify(productPayload) });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error('create failed: ' + errText.slice(0, 300));
  }
  const json = await r.json();
  return { created: true, product: json.product };
}

async function setInventory(token, refs, product, group) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const variant = product.variants[0];
  const vRes = await fetch(`${MEDUSA_URL}/admin/products/${product.id}/variants/${variant.id}?fields=inventory_items.*,inventory_items.inventory.*`, { headers });
  const vJson = await vRes.json();
  const invItem = vJson.variant?.inventory_items?.[0];
  const inventoryItemId = invItem?.inventory?.id || invItem?.inventory_item_id;
  if (!inventoryItemId) return { inventory: 'no_inventory_item' };
  const levels = [];
  for (const d of DEPOSITS) {
    let stockSum = 0;
    for (const item of group.items) stockSum += extractStock(item.stock_json, d.dux_deposito_id);
    if (stockSum <= 0) continue;
    const slocId = refs.slByName[d.sloc_name];
    if (!slocId) continue;
    const r = await fetch(`${MEDUSA_URL}/admin/inventory-items/${inventoryItemId}/location-levels`, {
      method: 'POST', headers,
      body: JSON.stringify({ location_id: slocId, stocked_quantity: Math.floor(stockSum) }),
    });
    if (r.ok) levels.push({ loc: d.key, qty: Math.floor(stockSum) });
  }
  return { inventory_item_id: inventoryItemId, levels };
}

async function main() {
  console.log('=== DUX-SYNC CENTRAL -> LEGUIZAMON ===');
  console.log('LIMIT:', LIMIT || 'ALL');
  const client = new Client({ connectionString: DUX_URL });
  await client.connect();
  const depositIds = DEPOSITS.map(d => d.dux_deposito_id);
  const sql = `
    SELECT cod_item, item, marca_nombre,
           stock::jsonb AS stock_json, precios::jsonb AS precios_json
    FROM items_central
    WHERE habilitado = 'S'
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(stock::jsonb) s
                  WHERE (s->>'id')::int = ANY($1::int[]) AND (s->>'stock_disponible')::numeric > 0)
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(precios::jsonb) p
                  WHERE (p->>'id')::int = $2 AND (p->>'precio')::numeric > 0)
  `;
  const r = await client.query(sql, [depositIds, PVP_LIST_ID]);
  console.log(`${r.rows.length} items DUX central candidatos`);

  const groups = new Map();
  for (const row of r.rows) {
    const key = `${normalize(row.item)}|${normalize(row.marca_nombre || '')}`;
    if (!groups.has(key)) groups.set(key, { key, name: row.item, brand: row.marca_nombre || '', items: [] });
    groups.get(key).items.push(row);
  }
  const allGroups = [...groups.values()];
  const toProcess = LIMIT > 0 ? allGroups.slice(0, LIMIT) : allGroups;
  console.log(`${allGroups.length} productos únicos; procesando ${toProcess.length}`);

  const token = await auth();
  const refs = await getMedusaRefs(token);
  console.log('Leguizamon SC id:', refs.scByName['Salta-Leguizamon']);

  const t0 = Date.now();
  let created = 0, skipped = 0, errors = 0, alreadyExists = 0, extended = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const group = toProcess[i];
    try {
      const existing = await existingProductByDuxKey(token, group.key);
      if (existing) {
        alreadyExists++;
        const scId = refs.scByName['Salta-Leguizamon'];
        const slocId = refs.slByName['Deposito Leguizamon Salta'];
        const stockSum = group.items.reduce((acc, it) => acc + extractStock(it.stock_json, 18498), 0);
        if (scId && stockSum > 0) {
          const added = await addSalesChannelToExisting(token, existing, scId);
          if (added) extended++;
          if (slocId) await addInventoryLevel(token, existing, scId, slocId, stockSum);
        }
        if (i % 20 === 0) process.stdout.write(`\r [${i + 1}/${toProcess.length}] exist=${alreadyExists} ext=${extended} new=${created} err=${errors}   `);
        continue;
      }
      const result = await createProduct(token, refs, group);
      if (result.skipped) { skipped++; continue; }
      await setInventory(token, refs, result.product, group);
      created++;
      if (i % 10 === 0) process.stdout.write(`\r [${i + 1}/${toProcess.length}] exist=${alreadyExists} new=${created} err=${errors}  ${group.name.slice(0, 30)}   `);
    } catch (err) {
      errors++;
      if (errors < 10) console.error(`\n[ERR ${group.name.slice(0, 40)}]`, err.message.slice(0, 250));
    }
  }
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log('\n\n=== RESUMEN LEGUIZAMON ===');
  console.log(`  Productos ya existían:  ${alreadyExists}`);
  console.log(`  Extendidos con Leg:     ${extended}`);
  console.log(`  Productos creados:      ${created}`);
  console.log(`  Skipped (sin precio):   ${skipped}`);
  console.log(`  Errores:                ${errors}`);
  console.log(`  Tiempo total:           ${secs}s`);
  await client.end();
}

main().catch(err => { console.error('FATAL:', err.message, err.stack); process.exit(1); });
