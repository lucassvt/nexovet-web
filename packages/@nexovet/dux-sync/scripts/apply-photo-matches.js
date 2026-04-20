#!/usr/bin/env node
// Apply matches from /tmp/matches-v2.json to Medusa products:
// - download image URL from scraped catalog
// - save to /var/www/nexovet-shop/backend-storefront/public/images/products/<handle>/1.webp
// - POST thumbnail URL to Medusa admin

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lamascotera.com.ar';
const ADMIN_PASS = process.env.ADMIN_PASS || 'NexovetAdmin2026!';
const MATCHES_PATH = process.env.MATCHES_PATH || '/tmp/matches-v2.json';
const PUBLIC_DIR = process.env.PUBLIC_DIR || '/var/www/nexovet-shop/backend-storefront/public/images/products';
const MIN_SCORE = parseFloat(process.env.MIN_SCORE || '0.75');
const LIMIT = parseInt((process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1] || '0');
const DRY = process.argv.includes('--dry');

async function auth() {
  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const j = await res.json();
  if (!j.token) throw new Error('auth failed');
  return j.token;
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBinary(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function setProductThumbnail(token, productId, imageUrl) {
  const res = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ thumbnail: imageUrl, images: [{ url: imageUrl }] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('set thumbnail failed: ' + text.slice(0, 200));
  }
  return res.json();
}

async function main() {
  const data = JSON.parse(fs.readFileSync(MATCHES_PATH, 'utf-8'));
  let matches = (data.matches || []).filter((m) => m.score >= MIN_SCORE && m.images_urls && m.images_urls.length > 0);
  if (LIMIT > 0) matches = matches.slice(0, LIMIT);
  console.log(`Applying ${matches.length} matches (min_score=${MIN_SCORE}) dry=${DRY}`);

  const token = DRY ? null : await auth();
  let ok = 0, dlFail = 0, setFail = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const handle = m.handle;
    const imgUrl = m.images_urls[0];
    const outDir = path.join(PUBLIC_DIR, handle);
    const outPath = path.join(outDir, '1.webp');
    const relUrl = `/images/products/${handle}/1.webp`;

    try {
      if (!DRY && !fs.existsSync(outPath)) {
        fs.mkdirSync(outDir, { recursive: true });
        const buf = await fetchBinary(imgUrl);
        fs.writeFileSync(outPath, buf);
      }
      if (DRY) {
        console.log(`  DRY ${i + 1}/${matches.length} ${handle} <- ${imgUrl.slice(0, 80)} (score=${m.score})`);
      } else {
        await setProductThumbnail(token, m.medusa_id, relUrl);
      }
      ok++;
      if (i % 10 === 0) process.stdout.write(`\r [${i + 1}/${matches.length}] ok=${ok} dlFail=${dlFail} setFail=${setFail}    `);
    } catch (err) {
      const msg = (err.message || err.toString()).slice(0, 120);
      if (msg.includes('set thumbnail failed') || msg.includes('HTTP 5') || msg.includes('Medusa')) setFail++;
      else dlFail++;
      if (setFail + dlFail < 10) console.error(`\n[ERR ${handle}]`, msg);
    }
  }
  console.log(`\n\n=== RESUMEN APPLY ===`);
  console.log(`  Matches procesados: ${matches.length}`);
  console.log(`  Aplicados OK:       ${ok}`);
  console.log(`  Falló descarga:     ${dlFail}`);
  console.log(`  Falló Medusa:       ${setFail}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
