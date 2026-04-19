#!/usr/bin/env node
// Crea categoría "Productos" y asigna TODOS los productos sync-eados
const MEDUSA_URL = 'http://localhost:9000';
const ADMIN_EMAIL = 'admin@lamascotera.com.ar';
const ADMIN_PASS = 'NexovetAdmin2026!';

async function auth() {
  const r = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  return (await r.json()).token;
}

async function main() {
  const token = await auth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  console.log('=== 1. Crear categoría "Productos" ===');
  let catId;
  const existingRes = await fetch(`${MEDUSA_URL}/admin/product-categories?q=Productos&limit=10`, { headers });
  const existingJson = await existingRes.json();
  const existing = (existingJson.product_categories || []).find(c => c.name === 'Productos');
  if (existing) {
    catId = existing.id;
    console.log('  Ya existe:', catId);
  } else {
    const createRes = await fetch(`${MEDUSA_URL}/admin/product-categories`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Productos', handle: 'productos', is_active: true, is_internal: false }),
    });
    const createJson = await createRes.json();
    catId = createJson.product_category.id;
    console.log('  Creada:', catId);
  }

  console.log('\n=== 2. Listar todos los productos ===');
  const allProducts = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${MEDUSA_URL}/admin/products?limit=200&offset=${offset}&fields=id,handle`, { headers });
    const j = await r.json();
    const batch = j.products || [];
    allProducts.push(...batch);
    if (batch.length < 200) break;
    offset += 200;
  }
  console.log('  Total productos:', allProducts.length);

  console.log('\n=== 3. Asignar a categoría en batch ===');
  const productIds = allProducts.map(p => p.id);
  const CHUNK = 50;
  for (let i = 0; i < productIds.length; i += CHUNK) {
    const chunk = productIds.slice(i, i + CHUNK);
    await fetch(`${MEDUSA_URL}/admin/product-categories/${catId}/products`, {
      method: 'POST', headers,
      body: JSON.stringify({ add: chunk }),
    });
    process.stdout.write(`\r  ${Math.min(i + CHUNK, productIds.length)}/${productIds.length}`);
  }
  console.log('\n\n=== 4. Verificar ===');
  const verifyRes = await fetch(`${MEDUSA_URL}/admin/product-categories/${catId}?fields=products.id`, { headers });
  const verifyJson = await verifyRes.json();
  console.log('  Productos en categoría:', (verifyJson.product_category.products || []).length);
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
