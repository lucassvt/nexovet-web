/**
 * Acceso directo a Postgres para la tabla de auditoría `dux_push_log`.
 *
 * Usamos `pg` raw (no Mikro ORM) porque el plugin corre también en el proceso
 * del worker BullMQ, fuera del ciclo de vida de Medusa. Es menos acoplado y
 * más barato para un log de auditoría.
 */

import { Pool, type PoolClient } from "pg"
import { DATABASE_URL } from "./config"

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL no configurado")
    }
    pool = new Pool({ connectionString: DATABASE_URL, max: 4 })
  }
  return pool
}

export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export interface DuxPushLogRow {
  id: number
  order_id: string
  erp_target: "central" | "franquicias"
  region_key: string | null
  attempt: number
  status: "pending" | "success" | "failed"
  dux_pedido_id: string | null
  error: string | null
  request_payload: unknown
  response_body: unknown
  created_at: Date
  updated_at: Date
}

/**
 * Idempotencia: si ya existe un log SUCCESS para este order_id, no reintentamos.
 */
export async function findSuccessfulPush(
  orderId: string
): Promise<DuxPushLogRow | null> {
  return withClient(async (c) => {
    const r = await c.query<DuxPushLogRow>(
      `SELECT * FROM dux_push_log
        WHERE order_id = $1 AND status = 'success'
        ORDER BY id DESC
        LIMIT 1`,
      [orderId]
    )
    return r.rows[0] ?? null
  })
}

export async function insertPushAttempt(params: {
  orderId: string
  erpTarget: "central" | "franquicias"
  regionKey: string | null
  attempt: number
  requestPayload: unknown
}): Promise<number> {
  return withClient(async (c) => {
    const r = await c.query<{ id: number }>(
      `INSERT INTO dux_push_log
         (order_id, erp_target, region_key, attempt, status, request_payload)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id`,
      [
        params.orderId,
        params.erpTarget,
        params.regionKey,
        params.attempt,
        params.requestPayload as unknown as string, // pg serializa JSONB
      ]
    )
    return r.rows[0].id
  })
}

export async function markPushSuccess(params: {
  id: number
  duxPedidoId: string
  responseBody: unknown
}): Promise<void> {
  await withClient(async (c) => {
    await c.query(
      `UPDATE dux_push_log
         SET status = 'success',
             dux_pedido_id = $2,
             response_body = $3,
             updated_at = NOW()
       WHERE id = $1`,
      [params.id, params.duxPedidoId, params.responseBody]
    )
  })
}

export async function markPushFailed(params: {
  id: number
  error: string
  responseBody?: unknown
}): Promise<void> {
  await withClient(async (c) => {
    await c.query(
      `UPDATE dux_push_log
         SET status = 'failed',
             error = $2,
             response_body = COALESCE($3, response_body),
             updated_at = NOW()
       WHERE id = $1`,
      [params.id, params.error, params.responseBody ?? null]
    )
  })
}

export interface HealthStats {
  queueFailsLast24h: number
  lastSuccessByRegion: Array<{ region_key: string; last_success_at: Date }>
}

export async function getHealthStats(): Promise<HealthStats> {
  return withClient(async (c) => {
    const [fails, successes] = await Promise.all([
      c.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
           FROM dux_push_log
          WHERE status = 'failed'
            AND updated_at > NOW() - INTERVAL '24 hours'`
      ),
      c.query<{ region_key: string; last_success_at: Date }>(
        `SELECT region_key, MAX(updated_at) AS last_success_at
           FROM dux_push_log
          WHERE status = 'success' AND region_key IS NOT NULL
          GROUP BY region_key
          ORDER BY last_success_at DESC`
      ),
    ])
    return {
      queueFailsLast24h: Number(fails.rows[0]?.count ?? 0),
      lastSuccessByRegion: successes.rows,
    }
  })
}
