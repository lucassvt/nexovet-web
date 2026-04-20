#!/usr/bin/env node
// @nexovet/dux-sync — match-photos-v2.js
// v2: sinonimia EN<->ES, normalizacion de unidades, preserve linea terapeutica,
//     matching por codigo de barras (si existe), threshold 0.70 + tamano exacto + marca bonus.
// Corre EN EL VPS (tiene acceso a /var/www/nexovet-shop/data-sources/catalogo_completo.json).
// Output: /tmp/matches-v2.json con matches nuevos contra productos Medusa sin thumbnail.
//
// Uso: node match-photos-v2.js [--dry-run] [--limit=N]

const fs = require('fs');
const path = require('path');

const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lamascotera.com.ar';
const ADMIN_PASS = process.env.ADMIN_PASS || 'NexovetAdmin2026!';
const CATALOG_PATH = process.env.CATALOG_PATH || '/var/www/nexovet-shop/data-sources/catalogo_completo.json';
const OUT_PATH = process.env.OUT_PATH || '/tmp/matches-v2.json';
const THRESHOLD = parseFloat(process.env.THRESHOLD || '0.70');
const LIMIT = parseInt((process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1] || '0');

// =========== Diccionario sinonimia EN<->ES ===========
const SYNONYMS = [
  // animales
  ['perro', 'dog', 'perros', 'dogs', 'canino', 'caninos', 'canine'],
  ['gato', 'cat', 'gatos', 'cats', 'felino', 'felinos', 'feline'],
  ['cachorro', 'cachorros', 'puppy', 'puppies', 'junior'],
  ['gatito', 'gatitos', 'kitten', 'kittens'],
  ['adulto', 'adultos', 'adult', 'maintenance', 'mantenimiento'],
  ['senior', 'mayor', 'mayores', 'aged', 'aging', '7plus', '7 plus'],
  // terapeutica (CLAVE - no se cruzan)
  ['urinary', 'urinario', 'urinaria'],
  ['hepatic', 'hepatico', 'hepatica', 'hepatico'],
  ['renal', 'kidney'],
  ['mobility', 'movilidad', 'articular', 'joint'],
  ['diabetic', 'diabetico', 'diabetes'],
  ['gastro', 'gastrointestinal', 'digestive', 'digestivo', 'digestion'],
  ['cardiac', 'cardiaco', 'heart'],
  ['obesity', 'obesidad', 'satiety', 'saciedad', 'light', 'weight', 'peso'],
  ['dermato', 'dermatologic', 'dermatologia', 'piel', 'skin', 'sensitive'],
  ['hairball', 'bolas pelo', 'bola pelo'],
  ['sterilized', 'esterilizado', 'esterilizada', 'castrado', 'castrada', 'castrate', 'neutered'],
  ['hypoallergenic', 'hipoalergenico', 'hipoalergenica', 'allergy'],
  // tamanos
  ['mini', 'pequeno', 'pequena', 'small', 'razas pequenas', 'raza pequena', 'toy'],
  ['mediano', 'medium', 'med'],
  ['grande', 'large', 'maxi', 'giant'],
  // proteinas
  ['salmon', 'salmon'],
  ['pollo', 'chicken'],
  ['cordero', 'lamb'],
  ['cerdo', 'pork'],
  ['pescado', 'fish'],
  ['carne', 'beef', 'vacuno', 'res'],
  ['arroz', 'rice'],
  ['atun', 'tuna'],
  // marcas conocidas (ayuda a cluster)
  ['royal canin', 'royal', 'rc'],
  ['pro plan', 'proplan', 'pro-plan'],
  ['excellent', 'purina excellent'],
  ['pedigree'],
  ['whiskas'],
  ['old prince'],
  ['eukanuba'],
  ['nutrique', 'nutric'],
  ['vital can', 'vitalcan'],
  ['hills', 'science diet'],
];

// linea terapeutica: grupo de palabras que si estan en uno y no en otro -> block match
// Las keys aca se guardan en forma CANONICAL (luego de pasar por CANONICAL map).
const THERAPEUTIC_KEYWORDS = new Set([
  'urinary', 'hepatic', 'renal', 'mobility', 'diabetic',
  'gastro', 'cardiac', 'obesity', 'dermato', 'hairball',
  'hypoallergenic', 'recovery', 'convalescence', 'sterilized',
]);

// age/life-stage: tambien bloqueante. cachorro != adulto != senior != gatito
const AGE_KEYWORDS = new Set(['cachorro', 'adulto', 'senior', 'gatito']);

// tamano-raza: mini/mediano/grande (si ambos lo tienen, deben coincidir)
const BREED_SIZE_KEYWORDS = new Set(['mini', 'mediano', 'grande']);

// proteinas (signal, penalizacion si difieren)
const PROTEIN_KEYWORDS = new Set(['salmon', 'pollo', 'cordero', 'cerdo', 'pescado', 'carne', 'arroz', 'atun']);

// construir mapa palabra -> canonical
const CANONICAL = {};
for (const group of SYNONYMS) {
  const canon = group[0];
  for (const w of group) CANONICAL[w] = canon;
}

// =========== Normalizacion ===========
function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalize(s) {
  if (!s) return '';
  return stripAccents(String(s)).toLowerCase()
    .replace(/[\(\),\.;:\-\_\/\\\+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normaliza unidades/tamanos: 1,5kg -> 1.5kg, 10 gr -> 10g, 340gr -> 340g
function normalizeUnits(s) {
  let t = ' ' + s + ' ';
  // reemplaza coma decimal seguida de digito (ej 1,5kg)
  t = t.replace(/(\d),(\d)/g, '$1.$2');
  // unidades largas -> cortas
  t = t.replace(/(\d+(?:\.\d+)?)\s*(kilogramos|kilogramo|kilos|kilo)\b/g, '$1kg');
  t = t.replace(/(\d+(?:\.\d+)?)\s*(kgs|kg)\b/g, '$1kg');
  t = t.replace(/(\d+(?:\.\d+)?)\s*(gramos|gramo|grs|gr|g)\b/g, '$1g');
  t = t.replace(/(\d+(?:\.\d+)?)\s*(mililitros|mililitro|mls|ml)\b/g, '$1ml');
  t = t.replace(/(\d+(?:\.\d+)?)\s*(litros|litro|lts|lt|l)\b/g, '$1l');
  // normaliza espacios
  return t.replace(/\s+/g, ' ').trim();
}

// Extrae "tamano" como tuple {value, unit}. Ej "1.5kg" -> {v:1.5, u:'kg'}
// Devuelve array con todos los tamanos detectados (productos pueden tener mas de uno en titulo de descripcion).
function extractSizes(s) {
  const sizes = [];
  const re = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    let v = parseFloat(m[1]);
    let u = m[2];
    // convertir a base: kg->g, l->ml
    if (u === 'kg') { v = v * 1000; u = 'g'; }
    else if (u === 'l') { v = v * 1000; u = 'ml'; }
    sizes.push({ v, u });
  }
  return sizes;
}

// Tokenizar + canonicalizar sinonimos
function tokenize(s) {
  const norm = normalizeUnits(normalize(s));
  const raw = norm.split(' ').filter(Boolean);
  const tokens = [];
  // Primero: manejar bigramas sinonimos conocidos (ej "royal canin", "pro plan")
  const bigramMap = { 'royal canin': 'royal', 'pro plan': 'proplan', 'old prince': 'oldprince',
    'vital can': 'vitalcan', 'science diet': 'hills', 'razas pequenas': 'mini', 'raza pequena': 'mini',
    'pets plus': 'petsplus', 'bolas pelo': 'hairball', 'bola pelo': 'hairball' };
  let i = 0;
  while (i < raw.length) {
    if (i + 1 < raw.length) {
      const bi = raw[i] + ' ' + raw[i + 1];
      if (bigramMap[bi]) {
        tokens.push(bigramMap[bi]);
        i += 2;
        continue;
      }
    }
    let t = raw[i];
    // canonicalizar
    if (CANONICAL[t]) t = CANONICAL[t];
    // stop words y ruidos
    if (['de', 'del', 'la', 'el', 'los', 'las', 'para', 'x', 'con', 'y', 'por', 'en'].includes(t)) { i++; continue; }
    if (t.length <= 1) { i++; continue; }
    tokens.push(t);
    i++;
  }
  return tokens;
}

// extraer marca del string (primera palabra que matchee marca conocida)
const KNOWN_BRANDS = ['royal', 'proplan', 'excellent', 'pedigree', 'whiskas', 'oldprince', 'eukanuba',
  'nutrique', 'vitalcan', 'hills', 'agility', 'exceed', 'sieger', '7vidas', 'dogchow', 'catchow',
  'purina', 'optimum', 'sheba', 'gatsy', 'nutripower', 'naturalista', 'petsplus', 'amigo', 'kongo'];

function extractBrand(tokens) {
  for (const t of tokens) {
    if (KNOWN_BRANDS.includes(t)) return t;
  }
  return null;
}

// deteccion linea terapeutica (canonical)
function therapeuticLine(tokens) {
  const out = new Set();
  for (const t of tokens) {
    const c = CANONICAL[t] || t;
    if (THERAPEUTIC_KEYWORDS.has(c)) out.add(c);
  }
  return out;
}

// age/life-stage (canonical). Detecta RP/RG/RM/etc heuristico ademas.
function ageLine(tokens, rawText) {
  const out = new Set();
  for (const t of tokens) {
    const c = CANONICAL[t] || t;
    if (AGE_KEYWORDS.has(c)) out.add(c);
  }
  // tambien detectar "cach" como cachorro, "ad" como adulto (muy frecuente en Medusa titulos)
  if (/\bcach\b/.test(rawText)) out.add('cachorro');
  // "AD" aislado es adulto. Muy comun ej "OLD PRINCE CORD Y ARROZ CACH X 15 KGS" vs "... AD ..."
  if (/\bad\b/.test(rawText) && !out.has('cachorro')) out.add('adulto');
  return out;
}

function breedSize(tokens, rawText) {
  const out = new Set();
  for (const t of tokens) {
    const c = CANONICAL[t] || t;
    if (BREED_SIZE_KEYWORDS.has(c)) out.add(c);
  }
  // abreviaciones: RP=mini, RG=grande, RM=mediano
  if (/\brp\b/.test(rawText)) out.add('mini');
  if (/\brg\b/.test(rawText)) out.add('grande');
  if (/\brm\b/.test(rawText) && !out.has('grande')) out.add('mediano');
  return out;
}

function proteins(tokens) {
  const out = new Set();
  for (const t of tokens) {
    const c = CANONICAL[t] || t;
    if (PROTEIN_KEYWORDS.has(c)) out.add(c);
  }
  return out;
}

// =========== Similarity ===========
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return inter / union;
}

// size match: debe haber al menos un tamano en comun (tolerancia 2%)
function sizeMatch(szA, szB) {
  if (szA.length === 0 && szB.length === 0) return { ok: true, exact: false }; // ambos sin tamano
  if (szA.length === 0 || szB.length === 0) return { ok: false, exact: false };
  for (const a of szA) {
    for (const b of szB) {
      if (a.u !== b.u) continue;
      const diff = Math.abs(a.v - b.v) / Math.max(a.v, b.v);
      if (diff <= 0.02) return { ok: true, exact: true };
    }
  }
  return { ok: false, exact: false };
}

// therapeutic line debe coincidir exactamente (o ambos sin)
function therapeuticCompatible(thA, thB) {
  if (thA.size === 0 && thB.size === 0) return true;
  if (thA.size !== thB.size) return false;
  for (const x of thA) if (!thB.has(x)) return false;
  return true;
}

// age: si ambos tienen age, deben ser iguales. Si uno tiene y otro no, permitido (con penalizacion).
function ageCompatible(ageA, ageB) {
  if (ageA.size === 0 || ageB.size === 0) return true;
  // ambos con age -> intersect
  for (const x of ageA) if (ageB.has(x)) return true;
  return false;
}

// breed size: si ambos tienen, deben coincidir
function breedCompatible(bA, bB) {
  if (bA.size === 0 || bB.size === 0) return true;
  for (const x of bA) if (bB.has(x)) return true;
  return false;
}

// score final entre 2 productos
// peso: jaccard tokens (core) + bonus marca (x1.5) + tamano debe matchear + age/therapeutic compat
function score(a, b) {
  // codigo de barras (si existe): prioridad absoluta
  if (a.barcode && b.barcode && a.barcode === b.barcode) {
    return { score: 1.0, reason: 'barcode_exact', sizeExact: true };
  }

  // bloque 1: linea terapeutica
  if (!therapeuticCompatible(a.therapeutic, b.therapeutic)) {
    return { score: 0, reason: 'therapeutic_mismatch' };
  }
  // bloque 2: age
  if (!ageCompatible(a.age, b.age)) {
    return { score: 0, reason: 'age_mismatch' };
  }
  // bloque 3: breed size
  if (!breedCompatible(a.breed, b.breed)) {
    return { score: 0, reason: 'breed_mismatch' };
  }
  // bloque 4: tamano (debe matchear al menos uno)
  const sz = sizeMatch(a.sizes, b.sizes);
  if (!sz.ok) return { score: 0, reason: 'size_mismatch' };

  // jaccard sobre tokens (sin tamano, sin stop)
  const tokA = new Set(a.tokens.filter(t => !/^\d+(?:\.\d+)?(kg|g|ml|l)$/.test(t)));
  const tokB = new Set(b.tokens.filter(t => !/^\d+(?:\.\d+)?(kg|g|ml|l)$/.test(t)));
  let jac = jaccard(tokA, tokB);

  // bonus marca: si ambos tienen la misma marca, multiplicar x1.5 (cap 1.0)
  if (a.brand && b.brand && a.brand === b.brand) {
    jac = Math.min(1.0, jac * 1.5);
  } else if (a.brand && b.brand && a.brand !== b.brand) {
    // marca distinta = penalizar fuerte
    jac = jac * 0.5;
  }

  // proteinas: si AMBOS tienen protein y son distintas, penalizar
  if (a.proteins.size > 0 && b.proteins.size > 0) {
    let shared = 0;
    for (const p of a.proteins) if (b.proteins.has(p)) shared++;
    if (shared === 0) jac = jac * 0.7; // protein mismatch penalty
  }

  // age bonus: si ambos tienen age y coinciden, bump jac
  if (a.age.size > 0 && b.age.size > 0) {
    let shared = false;
    for (const x of a.age) if (b.age.has(x)) { shared = true; break; }
    if (shared) jac = Math.min(1.0, jac * 1.1);
  }

  return { score: jac, reason: 'jaccard', sizeExact: sz.exact };
}

// =========== Medusa API ===========
async function auth() {
  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const j = await res.json();
  if (!j.token) throw new Error('Auth failed: ' + JSON.stringify(j));
  return j.token;
}

async function fetchAllProducts(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const all = [];
  let offset = 0;
  const LIMIT_PAGE = 200;
  while (true) {
    const url = `${MEDUSA_URL}/admin/products?limit=${LIMIT_PAGE}&offset=${offset}&fields=id,title,handle,thumbnail,metadata`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error('fetch products ' + r.status);
    const j = await r.json();
    all.push(...j.products);
    if (j.products.length < LIMIT_PAGE) break;
    offset += LIMIT_PAGE;
  }
  return all;
}

// =========== Main ===========
(async () => {
  console.log('[v2] Loading catalog...');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  console.log('[v2] Catalog size:', catalog.length);

  console.log('[v2] Authenticating Medusa...');
  const token = await auth();
  console.log('[v2] Fetching all Medusa products...');
  const medusaProducts = await fetchAllProducts(token);
  console.log('[v2] Medusa products:', medusaProducts.length);

  const withThumb = medusaProducts.filter(p => p.thumbnail && !p.thumbnail.includes('medusa-public-images'));
  const noThumb = medusaProducts.filter(p => !p.thumbnail || p.thumbnail.includes('medusa-public-images'));
  console.log('[v2] With REAL thumbnail:', withThumb.length, '| Without:', noThumb.length);

  // Preparar features catalogo
  console.log('[v2] Featurizing catalog...');
  const catFeats = catalog.map(c => {
    const rawNorm = normalizeUnits(normalize(c.name));
    const tokens = tokenize(c.name);
    return {
      slug: c.slug,
      name: c.name,
      images: c.images || [],
      tokens,
      sizes: extractSizes(rawNorm),
      brand: extractBrand(tokens),
      therapeutic: therapeuticLine(tokens),
      age: ageLine(tokens, rawNorm),
      breed: breedSize(tokens, rawNorm),
      proteins: proteins(tokens),
      barcode: c.barcode || null,
    };
  });

  // Pre-index catalog por primer token de marca/nombre para acelerar (pero mantener simple: loop full)
  // Con 780 x 1145 = 892k comparaciones, es ok.

  console.log('[v2] Matching...');
  const matches = [];
  const unmatched = [];
  const targets = LIMIT > 0 ? noThumb.slice(0, LIMIT) : noThumb;

  for (const m of targets) {
    const rawNorm = normalizeUnits(normalize(m.title));
    const tokens = tokenize(m.title);
    const mf = {
      tokens,
      sizes: extractSizes(rawNorm),
      brand: extractBrand(tokens),
      therapeutic: therapeuticLine(tokens),
      age: ageLine(tokens, rawNorm),
      breed: breedSize(tokens, rawNorm),
      proteins: proteins(tokens),
      barcode: null, // Medusa no tiene barcode en metadata actualmente
    };

    let best = null;
    let bestScore = 0;
    let bestSizeExact = false;
    let bestReason = '';

    for (const c of catFeats) {
      const r = score(mf, c);
      if (r.score > bestScore) {
        bestScore = r.score;
        best = c;
        bestSizeExact = !!r.sizeExact;
        bestReason = r.reason;
      }
    }

    if (best && bestScore >= THRESHOLD) {
      matches.push({
        medusa_id: m.id,
        title: m.title,
        handle: m.handle,
        slug: best.slug,
        name: best.name,
        score: Number(bestScore.toFixed(3)),
        size_exact: bestSizeExact,
        reason: bestReason,
        images_urls: best.images,
      });
    } else {
      unmatched.push({ medusa_id: m.id, title: m.title, best_score: Number(bestScore.toFixed(3)) });
    }
  }

  console.log('[v2] New matches:', matches.length, '/', targets.length);
  console.log('[v2] Unmatched:', unmatched.length);

  // Distribucion de scores
  const hist = { '>=0.95': 0, '0.85-0.95': 0, '0.75-0.85': 0, '0.70-0.75': 0 };
  for (const x of matches) {
    if (x.score >= 0.95) hist['>=0.95']++;
    else if (x.score >= 0.85) hist['0.85-0.95']++;
    else if (x.score >= 0.75) hist['0.75-0.85']++;
    else hist['0.70-0.75']++;
  }
  console.log('[v2] Score histogram:', hist);

  const result = {
    generated_at: new Date().toISOString(),
    threshold: THRESHOLD,
    medusa_total: medusaProducts.length,
    medusa_with_real_thumb: withThumb.length,
    medusa_targets: targets.length,
    catalog_total: catalog.length,
    new_matches: matches.length,
    unmatched: unmatched.length,
    score_histogram: hist,
    matches,
    unmatched_sample: unmatched.slice(0, 50),
    unmatched_all: unmatched,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
  console.log('[v2] Saved:', OUT_PATH);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
