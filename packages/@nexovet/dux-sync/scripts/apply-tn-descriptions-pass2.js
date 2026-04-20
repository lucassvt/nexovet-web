#!/usr/bin/env node
// Pass 2 of description enrichment.
// Uses /tmp/matches-v2.json fuzzy matcher output to map {medusa_id → tn_slug}.
// The tn_slug there is the catalog slug (e.g. "royal-canin-hypoallergenic-x-2-kg"),
// which differs from deriveBaseSlug(handle). We look up this slug in /tmp/tn-products.json
// and apply the description.

const fs = require('fs');
const { Client } = require('pg');

const PG_URL =
  process.env.NEXOVET_SHOP_DB ||
  'postgresql://medusa:medusa_nexovet_2026@localhost:5435/nexovet_shop';
const TN_PATH = process.env.TN_PATH || '/tmp/tn-products.json';
const MATCHES_PATH = process.env.MATCHES_PATH || '/tmp/matches-v2.json';
const MIN_SCORE = parseFloat(process.env.MIN_SCORE || '0.75');
const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');

function isThin(d) {
  if (!d) return true;
  const t = d.trim();
  if (t.length < 40) return true;
  if (/^[\w\s-]{0,60}— /.test(t) && t.length < 120) return true;
  return false;
}

function buildSubtitle(text) {
  if (!text) return null;
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= 140) return oneLine;
  return oneLine.slice(0, 137) + '...';
}

async function main() {
  console.log('=== TN DESCRIPTIONS PASS 2 (fuzzy via matches-v2) ===');
  console.log('DRY:', DRY, 'FORCE:', FORCE, 'MIN_SCORE:', MIN_SCORE);

  const tn = JSON.parse(fs.readFileSync(TN_PATH, 'utf-8'));
  const matches = JSON.parse(fs.readFileSync(MATCHES_PATH, 'utf-8'));
  const candidates = (matches.matches || []).filter((m) => m.score >= MIN_SCORE);
  console.log(`Candidates from matches-v2 (score>=${MIN_SCORE}): ${candidates.length}`);

  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  let applied = 0;
  let skippedRich = 0;
  let tnMissing = 0;
  let notFound = 0;

  for (let i = 0; i < candidates.length; i++) {
    const m = candidates[i];
    const rec = tn[m.slug];
    if (!rec) {
      tnMissing++;
      continue;
    }
    const { rows } = await pg.query(
      `SELECT id, description, metadata FROM product WHERE id = $1`,
      [m.medusa_id]
    );
    if (!rows.length) {
      notFound++;
      continue;
    }
    const p = rows[0];
    if (!FORCE && !isThin(p.description)) {
      skippedRich++;
      continue;
    }
    const desc = rec.description_text || p.description || '';
    const sub = buildSubtitle(desc);
    const meta = {
      ...(p.metadata || {}),
      tn_slug: rec.tn_slug,
      tn_nombre: rec.nombre,
      tn_marca: rec.marca || (p.metadata || {}).dux_marca_nombre || null,
      tn_categorias: rec.categorias || null,
      tn_tags: rec.tags && rec.tags.length ? rec.tags : null,
      tn_sku: rec.sku || null,
      tn_source: 'tiendanube-noa-export-2026-04-19',
      tn_match_source: 'matches-v2-fuzzy',
      tn_match_score: m.score,
      tn_applied_at: new Date().toISOString(),
    };

    if (DRY) {
      if (i < 20) {
        console.log(
          `  DRY ${m.handle.slice(0, 40)} <- ${m.slug}  (score ${m.score}, desc ${desc.length})`
        );
      }
      applied++;
      continue;
    }

    await pg.query(
      `UPDATE product SET description = $1, subtitle = $2, metadata = $3, updated_at = NOW() WHERE id = $4`,
      [desc, sub, meta, p.id]
    );
    applied++;

    if (i % 10 === 0) {
      process.stdout.write(
        `\r  [${i + 1}/${candidates.length}] applied=${applied} skipRich=${skippedRich} tnMissing=${tnMissing}  ${m.handle.slice(0, 30)}   `
      );
    }
  }
  process.stdout.write('\n');

  console.log('\n=== RESUMEN PASS 2 ===');
  console.log(`  Candidates:        ${candidates.length}`);
  console.log(`  Aplicados:         ${applied}`);
  console.log(`  Skipped ricos:     ${skippedRich}`);
  console.log(`  TN slug no existe: ${tnMissing}`);
  console.log(`  Product no found:  ${notFound}`);

  await pg.end();
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
