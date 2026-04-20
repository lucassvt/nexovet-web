#!/usr/bin/env node
// Generate procedural descriptions for Medusa products that still have thin/empty description.
// Uses DUX rubro/sub_rubro + name + brand to build 2-3 sentence copy in es-AR.
// Idempotent: skips products with description >= 40 chars.
// Uses raw SQL only (pg).

const { Client } = require('pg');

const PG_URL = process.env.NEXOVET_SHOP_DB || 'postgresql://medusa:medusa_nexovet_2026@localhost:5435/nexovet_shop';
const DUX_URL = process.env.DUX_URL || 'postgresql://dux_user:lamascotera@localhost:5432/dux_integrada';
const DRY = process.argv.includes('--dry');
const LIMIT = parseInt((process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1] || '0');

const FRANQ_PREFIX_RE = /^(CAT|COR|RES|ORA|HER|GOD|JUJ|ZAP|ROS|TAF) - /;

function cleanRubro(r) {
  if (!r) return '';
  return r.replace(FRANQ_PREFIX_RE, '').trim();
}

function detectSpecies(name, subrubro) {
  const s = ((name || '') + ' ' + (subrubro || '')).toUpperCase();
  if (/\bPERR|CANIN|PUPPY|CACHORRO|DOG|GATO|GATIT|FEL/.test(s)) {
    if (/\bGAT|FEL|KITT|KATZE/.test(s)) return 'gato';
    if (/\bPERR|CANIN|PUPPY|CACHORR|DOG/.test(s)) return 'perro';
  }
  if (/\bAVE|LORO|CANARIO|PERIQ/.test(s)) return 'ave';
  if (/\bPEZ|ACUARIO|PECECIT/.test(s)) return 'pez';
  if (/\bROED|HAMSTER|CONEJ|CHINCH/.test(s)) return 'roedor';
  return null;
}

function detectLife(name) {
  const n = (name || '').toUpperCase();
  if (/\bCACHORR|PUPPY|JUNIOR|GATIT|KITT/.test(n)) return 'joven';
  if (/\bSENIOR|MAYOR|AGING|7\s*\+|\+7|MAYORE/.test(n)) return 'senior';
  if (/\bADULT/.test(n)) return 'adulto';
  return null;
}

function detectSize(name) {
  const n = (name || '').toUpperCase();
  if (/\b(RAZA\s*PEQ|RP\b|RAZ\s*PEQ|MINI|CHICA|PEQUENA|SMALL|TALLA\s*P)/i.test(n)) return 'pequeña';
  if (/\b(RAZA\s*MED|RM\b|MEDIAN|MEDIUM|TALLA\s*M|RM\/RG|RM\/G)/i.test(n)) return 'mediana';
  if (/\b(RAZA\s*GRA|RG\b|GRANDE|LARGE|GIANT|TALLA\s*G|MAXI)/i.test(n)) return 'grande';
  return null;
}

function detectWeight(name) {
  const n = (name || '').toUpperCase();
  // X kg, X KG, X,XKG, X.5KG, X GR, X GRS
  const m = n.match(/(\d+(?:[.,]\d+)?)\s*(KG|GRS?|ML|L)\b/);
  if (!m) return null;
  return `${m[1].replace(',', '.')} ${m[2].toLowerCase()}`;
}

function buildDescription({ name, brand, rubro, subrubro }) {
  const species = detectSpecies(name, subrubro);
  const life = detectLife(name);
  const size = detectSize(name);
  const weight = detectWeight(name);
  const r = cleanRubro(rubro).toUpperCase();
  const sr = (subrubro || '').toUpperCase();
  const brandStr = brand ? ` ${brand}` : '';
  const speciesStr = species ? ` para ${species}s` : '';
  const lifeStr = life ? ` ${life}s` : '';
  const sizeStr = size ? ` de raza ${size}` : '';
  const presentacion = weight ? ` en presentación de ${weight}.` : '.';

  const lines = [];
  lines.push(`${name}${brandStr ? ' es un producto' + brandStr : ''}.`);

  // Sentence 2: based on rubro
  if (r.includes('ALIMENTOS') || sr.includes('ALIMENT')) {
    if (species === 'perro' || sr.includes('PERR')) {
      lines.push(`Alimento balanceado formulado para cubrir las necesidades nutricionales de perros${lifeStr || ' adultos'}${sizeStr}${presentacion}`);
      lines.push('Ingredientes seleccionados para favorecer la digestión, pelaje saludable y energía diaria.');
    } else if (species === 'gato' || sr.includes('GAT')) {
      lines.push(`Alimento balanceado formulado para cubrir las necesidades nutricionales de gatos${lifeStr || ' adultos'}${presentacion}`);
      lines.push('Favorece el tracto urinario, mantiene el peso ideal y aporta taurina esencial.');
    } else {
      lines.push(`Alimento balanceado${speciesStr}${lifeStr}${presentacion}`);
      lines.push('Nutrientes esenciales para una dieta completa y equilibrada.');
    }
  } else if (r.includes('SALUD') || sr.includes('MEDICAMEN') || sr.includes('PULG') || sr.includes('DESPARA')) {
    lines.push(`Producto veterinario${speciesStr}. Indicado para prevención y tratamiento según prescripción profesional${presentacion}`);
    lines.push('Consultá con tu veterinario de confianza la dosis y frecuencia de aplicación adecuada para tu mascota.');
  } else if (r.includes('HIGIENE') || sr.includes('SHAMPOO') || sr.includes('CEPIL')) {
    lines.push(`Producto de higiene y estética${speciesStr}${presentacion}`);
    lines.push('Ideal para el cuidado diario del pelaje, manteniendo a tu mascota limpia y con buen olor.');
  } else if (r.includes('ACCESORIOS') || sr.includes('JUGUETES') || sr.includes('COLLAR') || sr.includes('CORREA') || sr.includes('COMEDER') || sr.includes('CAMA') || sr.includes('ROPA')) {
    lines.push(`Accesorio${speciesStr} de La Mascotera, seleccionado por calidad y resistencia${presentacion}`);
    lines.push('Diseñado para el día a día de tu mascota. Consultá medidas y talles antes de comprar.');
  } else if (sr.includes('PIEDRAS') || sr.includes('ARENA')) {
    lines.push(`Piedras sanitarias absorbentes${presentacion}`);
    lines.push('Control eficaz de olores, fácil de limpiar y de bajo polvo para cuidar las vías respiratorias del gato.');
  } else {
    lines.push(`Producto${speciesStr} de La Mascotera${presentacion}`);
    lines.push('Consultá con tu vendedor de sucursal si necesitás más información antes de comprar.');
  }

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

function buildSubtitle(text) {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= 140) return oneLine;
  return oneLine.slice(0, 137) + '...';
}

async function main() {
  console.log('=== APPLY PROCEDURAL DESCRIPTIONS ===');
  console.log('DRY:', DRY, 'LIMIT:', LIMIT || 'ALL');

  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();
  const dux = new Client({ connectionString: DUX_URL });
  await dux.connect();

  // Target products with thin description and no TN metadata
  const { rows: products } = await pg.query(`
    SELECT id, handle, title, description, metadata
    FROM product
    WHERE (description IS NULL OR LENGTH(description) < 40)
    ORDER BY handle
  `);
  console.log(`Targets (desc thin): ${products.length}`);

  const targets = LIMIT > 0 ? products.slice(0, LIMIT) : products;
  let updated = 0;
  let noDuxMatch = 0;

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const codItems = (p.metadata && p.metadata.dux_cod_items) || [];
    const sku = codItems[0] || null;

    let rubro = null;
    let subrubro = null;
    let brand = (p.metadata && (p.metadata.dux_brand || p.metadata.dux_marca_nombre)) || null;

    if (sku) {
      // Check items_franquicia first, then items_central
      const { rows: duxRows } = await dux.query(
        `SELECT marca_nombre, rubro_nombre, sub_rubro_nombre FROM items_franquicia WHERE cod_item = $1 LIMIT 1`,
        [sku]
      );
      if (duxRows.length) {
        rubro = duxRows[0].rubro_nombre;
        subrubro = duxRows[0].sub_rubro_nombre;
        brand = brand || duxRows[0].marca_nombre;
      } else {
        const { rows: central } = await dux.query(
          `SELECT marca_nombre, rubro_nombre, sub_rubro_nombre FROM items_central WHERE cod_item = $1 LIMIT 1`,
          [sku]
        );
        if (central.length) {
          rubro = central[0].rubro_nombre;
          subrubro = central[0].sub_rubro_nombre;
          brand = brand || central[0].marca_nombre;
        }
      }
    }

    if (!rubro && !subrubro && !brand) {
      noDuxMatch++;
      // Still generate a generic description from title
    }

    const desc = buildDescription({
      name: p.title,
      brand,
      rubro,
      subrubro,
    });
    const subtitle = buildSubtitle(desc);

    const newMeta = {
      ...(p.metadata || {}),
      desc_source: 'procedural-v1',
      desc_applied_at: new Date().toISOString(),
      dux_rubro: rubro,
      dux_sub_rubro: subrubro,
      dux_marca_nombre: brand || (p.metadata || {}).dux_marca_nombre || null,
    };

    if (DRY) {
      if (i < 10) {
        console.log(`  DRY ${p.handle.slice(0, 50)}`);
        console.log(`     rubro: ${rubro || '-'} | sub: ${subrubro || '-'} | brand: ${brand || '-'}`);
        console.log(`     desc: ${desc}`);
      }
      updated++;
      continue;
    }

    await pg.query(
      `UPDATE product SET description = $1, subtitle = COALESCE(subtitle, $2), metadata = $3, updated_at = NOW() WHERE id = $4`,
      [desc, subtitle, newMeta, p.id]
    );
    updated++;

    if (i % 50 === 0) {
      process.stdout.write(`\r  [${i + 1}/${targets.length}] updated=${updated} noDux=${noDuxMatch}   `);
    }
  }
  process.stdout.write('\n');

  console.log('\n=== RESUMEN ===');
  console.log(`  Productos iterados: ${targets.length}`);
  console.log(`  Actualizados:       ${updated}`);
  console.log(`  Sin match DUX:      ${noDuxMatch}`);

  await pg.end();
  await dux.end();
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
