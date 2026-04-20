// src/api/store/club/_lib.ts
// Helpers compartidos del Club La Mascotera.
// Acceso directo a tablas loyalty_* via pg (schema propio, fuera de Medusa ORM).

import { Pool } from "pg"

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error("[club] DATABASE_URL no seteado")
    }
    pool = new Pool({ connectionString, max: 5 })
    pool.on("error", (err) => {
      console.error("[club] pg pool error:", err.message)
    })
  }
  return pool
}

export type LoyaltyConfig = {
  pesos_por_punto: number
  vigencia_dias: number
  dias_inactividad: number
  notif_dias_antes: number[]
  puntos_registro: number
}

export async function getConfig(): Promise<LoyaltyConfig> {
  const p = getPool()
  const { rows } = await p.query(
    `SELECT pesos_por_punto, vigencia_dias, dias_inactividad, notif_dias_antes, puntos_registro
     FROM loyalty_config
     ORDER BY id ASC
     LIMIT 1`
  )
  if (rows.length === 0) {
    return {
      pesos_por_punto: 90,
      vigencia_dias: 365,
      dias_inactividad: 90,
      notif_dias_antes: [30, 15, 1],
      puntos_registro: 50,
    }
  }
  const r = rows[0]
  return {
    pesos_por_punto: r.pesos_por_punto,
    vigencia_dias: r.vigencia_dias,
    dias_inactividad: r.dias_inactividad,
    notif_dias_antes: r.notif_dias_antes || [30, 15, 1],
    puntos_registro: r.puntos_registro,
  }
}

export type LedgerEntryInput = {
  customer_id: string
  dni?: string | null
  tipo: "REGISTRO" | "COMPRA" | "CANJE" | "CUMPLEANOS" | "EXPIRACION" | "AJUSTE_MANUAL"
  points: number
  motivo?: string | null
  order_id?: string | null
  ticket_flexxus?: string | null
  expires_at?: Date | null
  source_canal?: string | null
}

export async function insertLedger(entry: LedgerEntryInput) {
  const p = getPool()
  const { rows } = await p.query(
    `INSERT INTO loyalty_ledger
       (customer_id, dni, tipo, points, motivo, order_id, ticket_flexxus, expires_at, source_canal)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, customer_id, dni, tipo, points, motivo, order_id, ticket_flexxus, expires_at, source_canal, created_at`,
    [
      entry.customer_id,
      entry.dni || null,
      entry.tipo,
      entry.points,
      entry.motivo || null,
      entry.order_id || null,
      entry.ticket_flexxus || null,
      entry.expires_at || null,
      entry.source_canal || null,
    ]
  )
  return rows[0]
}

/**
 * Saldo actual (solo entries no expirados). Expiracion se aplica a puntos positivos vencidos.
 * Simplificacion: contamos todos los points (+/-) cuyo expires_at es null o futuro,
 * mas los negativos (consumos) siempre (un canje realizado ya se descontó).
 */
export async function getBalance(customer_id: string): Promise<number> {
  const p = getPool()
  const { rows } = await p.query(
    `SELECT COALESCE(SUM(CASE
         WHEN points < 0 THEN points
         WHEN expires_at IS NULL OR expires_at > NOW() THEN points
         ELSE 0
       END), 0)::int AS saldo
     FROM loyalty_ledger
     WHERE customer_id = $1`,
    [customer_id]
  )
  return rows[0]?.saldo || 0
}

export async function getHistory(customer_id: string, limit: number = 50) {
  const p = getPool()
  const { rows } = await p.query(
    `SELECT id, tipo, points, motivo, order_id, expires_at, source_canal, created_at
     FROM loyalty_ledger
     WHERE customer_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [customer_id, limit]
  )
  return rows
}

// Gastado en ultimos 365 dias (en centavos) para calcular tier.
// Se basa en entries tipo COMPRA: points ganados * pesos_por_punto.
// Como fallback si no hay ordenes integradas: asumimos 1 punto = pesos_por_punto gastado.
export async function getYearSpent(customer_id: string, pesos_por_punto: number): Promise<number> {
  const p = getPool()
  const { rows } = await p.query(
    `SELECT COALESCE(SUM(points), 0)::int AS pts
     FROM loyalty_ledger
     WHERE customer_id = $1
       AND tipo = 'COMPRA'
       AND points > 0
       AND created_at > NOW() - INTERVAL '365 days'`,
    [customer_id]
  )
  const pts = rows[0]?.pts || 0
  return pts * pesos_por_punto
}

export type Tier = {
  name: "Bronce" | "Plata" | "Oro" | "Platino"
  multiplier: number
  min_spend: number
  next_spend: number | null
  perks: string[]
}

export function computeTier(spent: number): Tier {
  if (spent >= 500_000) {
    return {
      name: "Platino",
      multiplier: 2,
      min_spend: 500_000,
      next_spend: null,
      perks: ["x2 puntos", "Envío gratis", "2 televet gratis/mes"],
    }
  }
  if (spent >= 200_000) {
    return {
      name: "Oro",
      multiplier: 1.5,
      min_spend: 200_000,
      next_spend: 500_000,
      perks: ["x1.5 puntos", "Envío gratis en compras > $15.000"],
    }
  }
  if (spent >= 50_000) {
    return {
      name: "Plata",
      multiplier: 1.2,
      min_spend: 50_000,
      next_spend: 200_000,
      perks: ["x1.2 puntos"],
    }
  }
  return {
    name: "Bronce",
    multiplier: 1,
    min_spend: 0,
    next_spend: 50_000,
    perks: ["Acceso al Club", "x1 puntos"],
  }
}

// Validacion DNI argentino: 7 u 8 digitos.
export function isValidDNI(dni: string): boolean {
  if (!dni) return false
  const cleaned = String(dni).trim().replace(/\./g, "").replace(/\s/g, "")
  return /^[0-9]{7,8}$/.test(cleaned)
}

export function normalizeDNI(dni: string): string {
  return String(dni).trim().replace(/\./g, "").replace(/\s/g, "")
}

export async function dniExists(dni: string, exceptCustomerId?: string): Promise<boolean> {
  const p = getPool()
  // customer.metadata es JSONB en Medusa v2
  const params: any[] = [dni]
  let sql = `SELECT id FROM customer WHERE metadata ->> 'dni' = $1`
  if (exceptCustomerId) {
    sql += ` AND id <> $2`
    params.push(exceptCustomerId)
  }
  sql += ` LIMIT 1`
  const { rows } = await p.query(sql, params)
  return rows.length > 0
}
