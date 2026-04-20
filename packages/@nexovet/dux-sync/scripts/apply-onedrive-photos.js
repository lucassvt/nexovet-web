#!/usr/bin/env node
// Apply OneDrive photos to Medusa products without thumbnail.
// Two-pass strategy:
//   Pass 1: use /tmp/matches-v2.json (fuzzy matcher output with score>=0.75 + images_urls[0] = slug webp)
//           NOTE: matches-v2 stores FULL CDN URLs in images_urls, but "slug" field is the catalog slug
//           that maps directly to our OneDrive folder name.
//   Pass 2: for products still without thumbnail, try direct base-slug derivation from handle
//           (strip franchise code + SKU). Match any OneDrive folder whose name equals the base-slug
//           or shares > 0.7 token jaccard similarity.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PG_URL =
  process.env.NEXOVET_SHOP_DB ||
  'postgresql://medusa:medusa_nexovet_2026@localhost:5435/nexovet_shop';
const EXTRACT_ROOT =
  process.env.EXTRACT_ROOT || '/tmp/tn-onedrive-extract/imagenes_productos';
const PUBLIC_DIR =
  process.env.PUBLIC_DIR ||
  '/var/www/nexovet-shop/backend-storefront/public/images/products';
const MATCHES_PATH = process.env.MATCHES_PATH || '/tmp/matches-v2.json';
const MIN_SCORE = parseFloat(process.env.MIN_SCORE || '0.70');
const DRY = process.argv.includes('--dry');
const LIMIT = parseInt(
  (process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0'
);

const FRANQ = new Set([
  'cat',
  'cor',
  'res',
  'ora',
  'her',
  'god',
  'juj',
  'zap',
  'ros',
  'taf',
]);

function deriveBaseSlug(handle) {
  const parts = handle.split('-');
  if (parts[parts.length - 1] === 'leg') parts.pop();
  if (parts.length > 1) parts.pop(); // SKU
  if (parts.length > 0 && FRANQ.has(parts[parts.length - 1])) parts.pop(); // franq
  return parts.join('-');
}

function tokenize(s) {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 2)
  );
}

function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function webpFilesFor(slug) {
  const dir = path.join(EXTRACT_ROOT, slug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
    .map((f) => ({ name: f, full: path.join(dir, f) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function copyWebps(webps, handle) {
  const destDir = path.join(PUBLIC_DIR, handle);
  fs.mkdirSync(destDir, { recursive: true });
  const copied = [];
  webps.forEach((w, i) => {
    const ext = path.extname(w.name).toLowerCase() || '.webp';
    const destName = `${i + 1}${ext}`;
    const destPath = path.join(destDir, destName);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(w.full, destPath);
    }
    copied.push(`/images/products/${handle}/${destName}`);
  });
  return copied;
}

async function updateProductImages(pg, productId, urls) {
  const thumbUrl = urls[0];
  await pg.query(
    `UPDATE product SET thumbnail = $1, updated_at = NOW() WHERE id = $2`,
    [thumbUrl, productId]
  );
  for (const u of urls) {
    try {
      // Check if url already present
      const { rows: existing } = await pg.query(
        `SELECT i.id FROM image i JOIN product_image pi ON pi.image_id = i.id
         WHERE pi.product_id = $1 AND i.url = $2`,
        [productId, u]
      );
      if (existing.length) continue;
      const imgId =
        'img_' +
        Math.random().toString(36).slice(2, 12).toUpperCase() +
        Date.now().toString(36).toUpperCase().slice(-4);
      await pg.query(
        `INSERT INTO image (id, url, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [imgId, u]
      );
      await pg.query(
        `INSERT INTO product_image (product_id, image_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [productId, imgId]
      );
    } catch (e) {
      // Swallow — thumbnail is the main win
    }
  }
}

async function main() {
  console.log('=== APPLY ONEDRIVE PHOTOS v2 ===');
  console.log('DRY:', DRY, 'LIMIT:', LIMIT || 'ALL');
  console.log('MIN_SCORE (pass 1):', MIN_SCORE);

  if (!fs.existsSync(EXTRACT_ROOT)) {
    throw new Error(`extract root not found: ${EXTRACT_ROOT}`);
  }
  const availableSlugs = fs
    .readdirSync(EXTRACT_ROOT)
    .filter((f) => fs.statSync(path.join(EXTRACT_ROOT, f)).isDirectory());
  console.log(`Available OneDrive slugs: ${availableSlugs.length}`);

  // Pre-tokenize all slugs for Pass 2 fuzzy
  const slugTokens = new Map();
  for (const s of availableSlugs) slugTokens.set(s, tokenize(s));
  const slugSet = new Set(availableSlugs);

  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  // ===== PASS 1: use matches-v2.json =====
  let pass1Matched = 0;
  let pass1Skipped = 0;
  if (fs.existsSync(MATCHES_PATH)) {
    const data = JSON.parse(fs.readFileSync(MATCHES_PATH, 'utf-8'));
    const matches = (data.matches || [])
      .filter((m) => m.score >= MIN_SCORE && m.slug && slugSet.has(m.slug));
    console.log(`Pass 1: ${matches.length} fuzzy matches from matches-v2.json`);
    const targets = LIMIT > 0 ? matches.slice(0, LIMIT) : matches;

    for (let i = 0; i < targets.length; i++) {
      const m = targets[i];
      const webps = webpFilesFor(m.slug);
      if (!webps.length) {
        pass1Skipped++;
        continue;
      }
      if (DRY) {
        console.log(
          `  DRY[1] ${m.handle} <- ${m.slug} (${webps.length} files, score ${m.score})`
        );
        pass1Matched++;
        continue;
      }
      const urls = copyWebps(webps, m.handle);
      await updateProductImages(pg, m.medusa_id, urls);
      pass1Matched++;
      if (i % 10 === 0) {
        process.stdout.write(
          `\r  Pass1 [${i + 1}/${targets.length}] matched=${pass1Matched}  ${m.handle.slice(0, 40)}   `
        );
      }
    }
    process.stdout.write('\n');
  } else {
    console.log(`Pass 1 skipped (no ${MATCHES_PATH})`);
  }

  // ===== PASS 2: base-slug derivation + fuzzy (only products STILL without thumb) =====
  const { rows: still } = await pg.query(
    `SELECT id, handle FROM product
     WHERE thumbnail IS NULL OR thumbnail = ''
     ORDER BY handle`
  );
  console.log(`Pass 2: ${still.length} products still without thumbnail`);

  let pass2Exact = 0;
  let pass2Fuzzy = 0;
  let pass2None = 0;

  const targets2 = LIMIT > 0 ? still.slice(0, LIMIT) : still;
  for (let i = 0; i < targets2.length; i++) {
    const p = targets2[i];
    const base = deriveBaseSlug(p.handle);

    // Exact match
    let matchSlug = null;
    let matchKind = null;
    if (slugSet.has(base)) {
      matchSlug = base;
      matchKind = 'exact';
    } else {
      // Fuzzy: compute jaccard against all slugs, pick best >= 0.70
      const baseTokens = tokenize(base);
      if (baseTokens.size >= 2) {
        let best = null;
        let bestScore = 0;
        for (const [slug, toks] of slugTokens) {
          const s = jaccard(baseTokens, toks);
          if (s > bestScore) {
            bestScore = s;
            best = slug;
          }
        }
        if (best && bestScore >= 0.82) {
          matchSlug = best;
          matchKind = `fuzzy(${bestScore.toFixed(2)})`;
        }
      }
    }

    if (!matchSlug) {
      pass2None++;
      continue;
    }

    const webps = webpFilesFor(matchSlug);
    if (!webps.length) {
      pass2None++;
      continue;
    }

    if (DRY) {
      if (i < 30) {
        console.log(`  DRY[2][${matchKind}] ${p.handle} <- ${matchSlug}`);
      }
    } else {
      const urls = copyWebps(webps, p.handle);
      await updateProductImages(pg, p.id, urls);
    }
    if (matchKind === 'exact') pass2Exact++;
    else pass2Fuzzy++;

    if (i % 25 === 0) {
      process.stdout.write(
        `\r  Pass2 [${i + 1}/${targets2.length}] exact=${pass2Exact} fuzzy=${pass2Fuzzy} none=${pass2None}  ${p.handle.slice(0, 40)}   `
      );
    }
  }
  process.stdout.write('\n');

  console.log('\n=== RESUMEN FINAL ===');
  console.log(`  Pass 1 (matches-v2):  ${pass1Matched} ok / ${pass1Skipped} skip`);
  console.log(`  Pass 2 exact:         ${pass2Exact}`);
  console.log(`  Pass 2 fuzzy:         ${pass2Fuzzy}`);
  console.log(`  Pass 2 sin match:     ${pass2None}`);
  console.log(`  TOTAL aplicados:      ${pass1Matched + pass2Exact + pass2Fuzzy}`);

  await pg.end();
}

main().catch((e) => {
  console.error('FATAL:', e.message, e.stack);
  process.exit(1);
});
