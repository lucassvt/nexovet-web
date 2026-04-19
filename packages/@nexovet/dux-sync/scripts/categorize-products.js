#!/usr/bin/env node
/**
 * categorize-products.js
 *
 * Reorganiza los productos Medusa en una taxonomía real basada en
 * rubro_nombre / sub_rubro_nombre de dux_integrada.items_franquicia.
 *
 * Matching producto Medusa ↔ item DUX:
 *   metadata.dux_cod_items[0] (p.ej. "RES - 00633") → items_franquicia.cod_item
 *
 * Pasos:
 *   1. Carga mapa cod_item → (rubro, sub_rubro, item_nombre) desde DB
 *   2. Crea árbol de categorías en Medusa (idempotente por handle)
 *   3. Para cada producto: detecta categoría hoja + asocia
 *      (y desasocia de "Productos" genérica)
 *   4. Reporta distribución
 *
 * Uso: node categorize-products.js [--dry-run] [--limit=N]
 */

const { Client } = require('pg');

const DUX_URL = process.env.DUX_INTEGRADA_URL || 'postgresql://dux_user:lamascotera@localhost:5432/dux_integrada';
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lamascotera.com.ar';
const ADMIN_PASS = process.env.ADMIN_PASS || 'NexovetAdmin2026!';
const GENERIC_CAT_ID = 'pcat_01KPKKE57E55C25CK45B9493VP'; // "Productos"

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '0');

// ---------------- Taxonomía ----------------
// Estructura:  nivel1 → nivel2 → nivel3 (opcional)
// Cada hoja tiene un handle único.
const TAXONOMY = [
  {
    name: 'Perros',
    handle: 'perros',
    children: [
      {
        name: 'Alimentos',
        handle: 'perros-alimentos',
        children: [
          { name: 'Alimento Balanceado Seco', handle: 'perros-alimento-seco' },
          { name: 'Alimento Húmedo', handle: 'perros-alimento-humedo' },
          { name: 'Snacks y Premios', handle: 'perros-snacks' },
        ],
      },
      {
        name: 'Accesorios',
        handle: 'perros-accesorios',
        children: [
          { name: 'Elementos de Paseo', handle: 'perros-paseo' },
          { name: 'Juguetes', handle: 'perros-juguetes' },
          { name: 'Camas, Cuchas y Colchonetas', handle: 'perros-camas' },
          { name: 'Comederos y Bebederos', handle: 'perros-comederos' },
          { name: 'Ropa', handle: 'perros-ropa' },
          { name: 'Educadores', handle: 'perros-educadores' },
          { name: 'Transportadores', handle: 'perros-transportadores' },
        ],
      },
    ],
  },
  {
    name: 'Gatos',
    handle: 'gatos',
    children: [
      {
        name: 'Alimentos',
        handle: 'gatos-alimentos',
        children: [
          { name: 'Alimento Balanceado Seco', handle: 'gatos-alimento-seco' },
          { name: 'Alimento Húmedo', handle: 'gatos-alimento-humedo' },
          { name: 'Snacks y Premios', handle: 'gatos-snacks' },
        ],
      },
      {
        name: 'Accesorios',
        handle: 'gatos-accesorios',
        children: [
          { name: 'Piedras Sanitarias', handle: 'gatos-piedras' },
          { name: 'Rascadores', handle: 'gatos-rascadores' },
          { name: 'Juguetes', handle: 'gatos-juguetes' },
          { name: 'Camas y Descanso', handle: 'gatos-camas' },
          { name: 'Comederos y Bebederos', handle: 'gatos-comederos' },
          { name: 'Transportadores', handle: 'gatos-transportadores' },
        ],
      },
    ],
  },
  {
    name: 'Salud, Higiene y Estética',
    handle: 'salud-higiene',
    children: [
      { name: 'Medicamentos', handle: 'salud-medicamentos' },
      { name: 'Pulguicidas y Garrapaticidas', handle: 'salud-pulguicidas' },
      { name: 'Shampoos y Acondicionadores', handle: 'salud-shampoo' },
      { name: 'Cepillos, Cardinas y Corta Uñas', handle: 'salud-cepillos' },
      { name: 'Cuidado Dental', handle: 'salud-dental' },
      { name: 'Shampoo Profesional', handle: 'salud-shampoo-pro' },
      { name: 'Accesorios Peluquería Canina', handle: 'salud-peluqueria' },
    ],
  },
  {
    name: 'Otros Animales',
    handle: 'otros-animales',
    children: [
      { name: 'Aves', handle: 'otros-aves' },
      { name: 'Peces', handle: 'otros-peces' },
      { name: 'Roedores', handle: 'otros-roedores' },
    ],
  },
  {
    name: 'Varios',
    handle: 'varios',
    children: [
      { name: 'Otros Accesorios', handle: 'varios-otros' },
      { name: 'Limpieza', handle: 'varios-limpieza' },
    ],
  },
];

// ---------------- Normalización sub_rubro ----------------
function normSubRubro(s) {
  if (!s) return '';
  return s
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Detecta si el nombre del item habla claramente de gato
function itemIsGato(name) {
  if (!name) return false;
  const n = name.toUpperCase();
  return /\bGATO(S)?\b|\bCAT\b|\bGATUNO\b|\bFELINO\b|\bFELINE\b|\bKITTEN\b/.test(n);
}
function itemIsPerro(name) {
  if (!name) return false;
  const n = name.toUpperCase();
  return /\bPERRO(S)?\b|\bDOG\b|\bCACHORRO\b|\bCANINO\b|\bPUPPY\b/.test(n);
}

/**
 * Devuelve handle de hoja donde va el producto.
 * Acepta (rubro, sub_rubro, item_nombre) — el rubro se usa solo para fallback.
 */
function categorizeLeaf(rubroRaw, subRubroRaw, itemName) {
  const sr = normSubRubro(subRubroRaw);
  const rb = normSubRubro(rubroRaw);

  // Quitar prefijo "XXX - " de rubro, p.ej. "TAF - ALIMENTOS BALANCEADOS" → "ALIMENTOS BALANCEADOS"
  const rbCore = rb.replace(/^[A-Z]{3}\s*-\s*/, '');

  // Normalización de variantes concatenadas sin espacios
  const srNorm = sr
    .replace(/ALIMENTOSPERROS/g, 'ALIMENTOS PERROS')
    .replace(/ALIMENTOSGATOS/g, 'ALIMENTOS GATOS')
    .replace(/ALIMENTOSHUMEDOS/g, 'ALIMENTOS HUMEDOS')
    .replace(/JUGUETESPERROS/g, 'JUGUETES PERROS')
    .replace(/JUGUETESGATOS/g, 'JUGUETES GATOS')
    .replace(/PIEDRASSANITARIAS/g, 'PIEDRAS SANITARIAS')
    .replace(/ELEMENTOSDEPASEO/g, 'ELEMENTOS DE PASEO')
    .replace(/PULGUICIDASYGARRAPATICIDAS/g, 'PULGUICIDAS Y GARRAPATICIDAS')
    .replace(/SHAMPOOSYACONDICIONADORES/g, 'SHAMPOOS Y ACONDICIONADORES')
    .replace(/ACCESORIOSPELUQUERIACANINA/g, 'ACCESORIOS PELUQUERIA CANINA')
    .replace(/SERVICIOSVETERINARIOS/g, 'SERVICIOS VETERINARIOS');

  // Reglas por sub_rubro
  if (srNorm === 'ALIMENTOS PERROS' || srNorm === 'ALIMENTO BALANCEADO SUELTO') return 'perros-alimento-seco';
  if (srNorm === 'ALIMENTOS GATOS') return 'gatos-alimento-seco';

  if (srNorm === 'ALIMENTOS HUMEDOS') {
    if (itemIsGato(itemName)) return 'gatos-alimento-humedo';
    if (itemIsPerro(itemName)) return 'perros-alimento-humedo';
    return 'perros-alimento-humedo';
  }

  if (srNorm === 'SNACKS') {
    if (itemIsGato(itemName)) return 'gatos-snacks';
    return 'perros-snacks';
  }

  if (srNorm === 'JUGUETES PERROS') return 'perros-juguetes';
  if (srNorm === 'JUGUETES GATOS') return 'gatos-juguetes';

  if (srNorm === 'ELEMENTOS DE PASEO') return 'perros-paseo';
  if (srNorm === 'ROPA') return 'perros-ropa';
  if (srNorm === 'EDUCADORES') return 'perros-educadores';

  if (srNorm === 'CAMAS, CUCHAS Y COLCHONETAS') {
    if (itemIsGato(itemName)) return 'gatos-camas';
    return 'perros-camas';
  }
  if (srNorm === 'COMEDEROS') {
    if (itemIsGato(itemName)) return 'gatos-comederos';
    return 'perros-comederos';
  }
  if (srNorm === 'TRANSPORTADORES') {
    if (itemIsGato(itemName)) return 'gatos-transportadores';
    return 'perros-transportadores';
  }

  if (srNorm === 'PIEDRAS SANITARIAS') return 'gatos-piedras';
  if (srNorm === 'RASCADORES') return 'gatos-rascadores';

  if (srNorm === 'MEDICAMENTOS') return 'salud-medicamentos';
  if (srNorm === 'PULGUICIDAS Y GARRAPATICIDAS') return 'salud-pulguicidas';
  if (srNorm === 'SHAMPOOS Y ACONDICIONADORES') return 'salud-shampoo';
  if (srNorm === 'SHAMPOO PROFESIONAL') return 'salud-shampoo-pro';
  if (srNorm === 'CUIDADO DENTAL') return 'salud-dental';

  if (srNorm.startsWith('CEPILLOS') || srNorm.includes('CARDINAS') || srNorm.includes('CORTA UNAS') || srNorm.includes('CORTA UÑAS')) {
    return 'salud-cepillos';
  }
  if (srNorm === 'ACCESORIOS PELUQUERIA CANINA' || srNorm === 'CUCHILLAS' || srNorm === 'TIJERAS' || srNorm === 'TURBINAS' || srNorm === 'PELADORAS' || srNorm === 'BS USO INSUMOS PELU' || srNorm === 'CURSO PELUQUERIA' || srNorm === 'SERVIVICOS PELUQUERIA') {
    return 'salud-peluqueria';
  }

  if (srNorm === 'AVES') return 'otros-aves';
  if (srNorm === 'PECES') return 'otros-peces';
  if (srNorm === 'ROEDORES') return 'otros-roedores';

  if (srNorm === 'LIMPIEZA') return 'varios-limpieza';
  if (srNorm === 'OTROS ACCESORIOS' || srNorm === 'VARIOS' || srNorm === 'LIBRERIA' || srNorm === 'BOLSAS' || srNorm === 'SUPER' || srNorm === 'MASCOCLUB PREMIOS' || srNorm === 'RODADOS' || srNorm === 'LUBRICANTES Y ENFRIANTES') {
    return 'varios-otros';
  }

  // Sin sub_rubro explícito: intentar derivar del rubro + nombre item
  if (rbCore.includes('ALIMENTOS BALANCEADOS')) {
    if (itemIsGato(itemName)) return 'gatos-alimento-seco';
    if (itemIsPerro(itemName)) return 'perros-alimento-seco';
    return 'perros-alimento-seco';
  }
  if (rbCore.includes('ACCESORIOS')) {
    if (itemIsGato(itemName)) return 'gatos-comederos'; // mejor que null
    return 'varios-otros';
  }
  if (rbCore.includes('SALUD')) {
    return 'salud-medicamentos';
  }

  return null; // sin categorizar
}

// ---------------- Medusa helpers ----------------
async function auth() {
  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const json = await res.json();
  if (!json.token) throw new Error('Auth failed');
  return json.token;
}

async function listAllCategories(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${MEDUSA_URL}/admin/product-categories?limit=200&offset=${offset}&fields=id,name,handle,parent_category_id`, { headers });
    const j = await r.json();
    const batch = j.product_categories || [];
    all.push(...batch);
    if (batch.length < 200) break;
    offset += 200;
  }
  return all;
}

async function createCategory(token, payload) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const r = await fetch(`${MEDUSA_URL}/admin/product-categories`, {
    method: 'POST', headers, body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`createCategory failed ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j.product_category;
}

async function ensureTaxonomy(token) {
  console.log('\n=== 1. Asegurando taxonomía en Medusa ===');
  const existing = await listAllCategories(token);
  const byHandle = Object.fromEntries(existing.map(c => [c.handle, c]));
  console.log(`  ${existing.length} categorías ya existentes`);

  const handleToId = {};

  async function ensure(node, parentId) {
    if (byHandle[node.handle]) {
      handleToId[node.handle] = byHandle[node.handle].id;
      console.log(`  [keep]   ${node.handle} → ${byHandle[node.handle].id}`);
    } else {
      if (DRY_RUN) {
        console.log(`  [DRY]    crear ${node.handle} (parent=${parentId || '-'})`);
        handleToId[node.handle] = `DRY_${node.handle}`;
      } else {
        const created = await createCategory(token, {
          name: node.name,
          handle: node.handle,
          is_active: true,
          is_internal: false,
          parent_category_id: parentId || null,
        });
        handleToId[node.handle] = created.id;
        byHandle[node.handle] = created;
        console.log(`  [create] ${node.handle} → ${created.id}`);
      }
    }
    if (node.children) {
      for (const child of node.children) await ensure(child, handleToId[node.handle]);
    }
  }

  for (const top of TAXONOMY) await ensure(top, null);
  return handleToId;
}

async function listAllProducts(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${MEDUSA_URL}/admin/products?limit=200&offset=${offset}&fields=id,title,metadata,categories.id`, { headers });
    const j = await r.json();
    const batch = j.products || [];
    all.push(...batch);
    if (batch.length < 200) break;
    offset += 200;
  }
  return all;
}

async function updateProductCategories(token, productId, categoryIds) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const r = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    method: 'POST', headers,
    body: JSON.stringify({ categories: categoryIds.map(id => ({ id })) }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(`updateProduct ${productId} failed ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  }
}

// ---------------- Main ----------------
async function main() {
  console.log('=== CATEGORIZAR PRODUCTOS ===');
  console.log('DRY_RUN:', DRY_RUN, 'LIMIT:', LIMIT || 'ALL');

  const pg = new Client({ connectionString: DUX_URL });
  await pg.connect();

  console.log('\n=== 0. Leyendo items_franquicia ===');
  const r = await pg.query(`
    SELECT cod_item, item, rubro_nombre, sub_rubro_nombre
    FROM items_franquicia
    WHERE cod_item IS NOT NULL
  `);
  const duxByCodItem = new Map();
  for (const row of r.rows) duxByCodItem.set(row.cod_item, row);
  console.log(`  ${duxByCodItem.size} cod_items indexados`);

  const token = await auth();
  const handleToId = await ensureTaxonomy(token);

  console.log('\n=== 2. Listando productos Medusa ===');
  const products = await listAllProducts(token);
  console.log(`  ${products.length} productos`);

  const toProcess = LIMIT > 0 ? products.slice(0, LIMIT) : products;

  console.log('\n=== 3. Categorizando ===');
  const distribution = {};
  const noCategory = [];
  const noMatch = [];
  let updated = 0, skipped = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const p = toProcess[i];
    const codItems = p.metadata?.dux_cod_items || [];
    if (!codItems.length) {
      // Productos demo (Medusa Shorts, etc.) — no tocar
      skipped++;
      continue;
    }

    // Buscar primer cod_item con match en DUX
    let duxRow = null;
    for (const ci of codItems) {
      if (duxByCodItem.has(ci)) { duxRow = duxByCodItem.get(ci); break; }
    }
    if (!duxRow) {
      noMatch.push({ id: p.id, title: p.title, cods: codItems });
      continue;
    }

    const leafHandle = categorizeLeaf(duxRow.rubro_nombre, duxRow.sub_rubro_nombre, duxRow.item || p.title);
    if (!leafHandle) {
      noCategory.push({ id: p.id, title: p.title, rubro: duxRow.rubro_nombre, sub: duxRow.sub_rubro_nombre });
      continue;
    }
    const leafId = handleToId[leafHandle];
    if (!leafId) {
      noCategory.push({ id: p.id, title: p.title, reason: 'handle sin id: ' + leafHandle });
      continue;
    }

    // Construir set final de categorías: remover la genérica "Productos", agregar la nueva hoja
    const currentCats = (p.categories || []).map(c => c.id).filter(cid => cid !== GENERIC_CAT_ID);
    if (!currentCats.includes(leafId)) currentCats.push(leafId);

    distribution[leafHandle] = (distribution[leafHandle] || 0) + 1;

    if (!DRY_RUN) {
      try {
        await updateProductCategories(token, p.id, currentCats);
        updated++;
      } catch (err) {
        errors++;
        if (errors < 5) console.error(`\n[ERR] ${p.id} ${p.title.slice(0,40)}:`, err.message.slice(0, 200));
      }
    } else {
      updated++;
    }

    if (i % 25 === 0) process.stdout.write(`\r  [${i + 1}/${toProcess.length}] updated=${updated} noCat=${noCategory.length} noMatch=${noMatch.length} err=${errors}`);
  }
  process.stdout.write(`\r  [${toProcess.length}/${toProcess.length}] updated=${updated} noCat=${noCategory.length} noMatch=${noMatch.length} err=${errors}\n`);

  console.log('\n=== 4. REPORTE ===');
  console.log(`  Productos totales:      ${products.length}`);
  console.log(`  Procesados:             ${toProcess.length}`);
  console.log(`  Actualizados:           ${updated}`);
  console.log(`  Sin metadata (demo):    ${skipped}`);
  console.log(`  Sin match en DUX:       ${noMatch.length}`);
  console.log(`  Sin categoría asignada: ${noCategory.length}`);
  console.log(`  Errores:                ${errors}`);

  const totalCats = Object.keys(handleToId).length;
  console.log(`\n  Categorías en taxonomía: ${totalCats}`);

  console.log('\n  Distribución por hoja (top 20):');
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  for (const [h, n] of sorted.slice(0, 20)) console.log(`    ${h.padEnd(32)} ${n}`);

  if (noMatch.length) {
    console.log(`\n  Sin match en DUX (primeros 5):`);
    for (const x of noMatch.slice(0, 5)) console.log(`    ${x.id} ${x.title.slice(0, 50)}  cods=${JSON.stringify(x.cods)}`);
  }
  if (noCategory.length) {
    console.log(`\n  Sin categoría (primeros 5):`);
    for (const x of noCategory.slice(0, 5)) console.log(`    ${x.id} ${x.title.slice(0, 50)}  rubro="${x.rubro}" sub="${x.sub}"`);
  }

  await pg.end();
  console.log('\nOK');
}

main().catch(err => { console.error('FATAL:', err.message, err.stack); process.exit(1); });
