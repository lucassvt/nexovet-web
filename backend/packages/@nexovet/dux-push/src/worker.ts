/**
 * Worker BullMQ para la cola `dux-push`.
 *
 * Se corre como proceso aparte (PM2) para no bloquear el request cycle de
 * Medusa. Lee jobs `{ order_id }`, resuelve el order vía HTTP interno (o via
 * `container` si corre embebido), lo mapea y hace el POST contra DUX.
 *
 * Reintentos:
 *   - `RETRY_DELAYS_MS` de config.ts: 1m, 5m, 30m, 2h, 6h, 24h.
 *   - Tras el último fallo, se marca `failed` en `dux_push_log` y se emite un
 *     log `[dux-push][ALERT]` — el hook de monitoreo/Telegram del VPS puede
 *     engancharse ahí (por ej. vía filebeat/loki alerting).
 *
 * Idempotencia:
 *   - Por `jobId = order:<id>` a nivel BullMQ.
 *   - Por row `dux_push_log` con `status='success'` a nivel DB (segundo
 *     filtro, por si el worker re-ejecuta tras crash pre-commit).
 */

import { Worker, type Job } from "bullmq"
import {
  DUX_PUSH_QUEUE_NAME,
  getRedis,
} from "./queue"
import { RETRY_DELAYS_MS } from "./config"
import { DuxClient, DuxApiError, DuxConfigError } from "./dux-client"
import {
  mapOrderToDuxPedido,
  type OrderLikeInput,
} from "./order-mapper"
import {
  findSuccessfulPush,
  insertPushAttempt,
  markPushFailed,
  markPushSuccess,
} from "./db"
import type { DuxPushJobData } from "./types"

export interface WorkerDeps {
  /** Cómo obtener el order de Medusa dado un id. Inyectable para tests. */
  loadOrder: (orderId: string) => Promise<OrderLikeInput | null>
  /** Cómo obtener el `id_cliente` DUX dado un order. Inyectable para tests. */
  resolveDuxCliente: (
    order: OrderLikeInput,
    target: "central" | "franquicias"
  ) => Promise<number | null>
  duxClient?: DuxClient
}

export function buildProcessor(deps: WorkerDeps) {
  const dux = deps.duxClient ?? new DuxClient()

  return async function processor(job: Job<DuxPushJobData>) {
    const orderId = job.data.order_id
    const attempt = (job.attemptsMade ?? 0) + 1

    // Idempotencia DB
    const already = await findSuccessfulPush(orderId)
    if (already) {
      return { skipped: true, reason: "already-pushed", log_id: already.id }
    }

    const order = await deps.loadOrder(orderId)
    if (!order) {
      throw new Error(`order ${orderId} no encontrado`)
    }

    const regionKey = order.sales_channel_id || ""
    const route = dux.routeByRegion(regionKey)

    const idCliente = await deps.resolveDuxCliente(order, route.target)
    if (!idCliente) {
      throw new Error(
        `No se pudo resolver id_cliente DUX para order ${orderId}`
      )
    }

    const mapped = mapOrderToDuxPedido({ order, route, idCliente })
    if (!mapped.ok) {
      // No reintentable — si el dato está roto, no sirve reintentar.
      throw new NonRetriableError(
        `mapping falló: ${mapped.reason}`
      )
    }

    const logId = await insertPushAttempt({
      orderId,
      erpTarget: route.target,
      regionKey,
      attempt,
      requestPayload: mapped.payload,
    })

    try {
      const resp = await dux.crearPedido(route, mapped.payload)
      const duxPedidoId = String(
        resp.id_pedido ?? resp.nro_pedido ?? ""
      )
      await markPushSuccess({
        id: logId,
        duxPedidoId,
        responseBody: resp,
      })
      return { ok: true, dux_pedido_id: duxPedidoId, log_id: logId }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : JSON.stringify(err)
      const responseBody =
        err instanceof DuxApiError ? err.body : undefined

      await markPushFailed({
        id: logId,
        error: message,
        responseBody,
      })

      // Errores de config no son reintentables.
      if (err instanceof DuxConfigError) {
        throw new NonRetriableError(message)
      }
      throw err
    }
  }
}

/**
 * Marker para no reintentar un job. BullMQ respeta `UnrecoverableError`;
 * mantenemos uno propio para que el import sea simple.
 */
export class NonRetriableError extends Error {
  public readonly unrecoverable = true
  constructor(msg: string) {
    super(msg)
    this.name = "NonRetriableError"
  }
}

export function startWorker(deps: WorkerDeps): Worker<DuxPushJobData> {
  const processor = buildProcessor(deps)

  const worker = new Worker<DuxPushJobData>(
    DUX_PUSH_QUEUE_NAME,
    processor,
    {
      connection: getRedis(),
      concurrency: 2,
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          const idx = Math.min(attemptsMade - 1, RETRY_DELAYS_MS.length - 1)
          return RETRY_DELAYS_MS[Math.max(0, idx)]
        },
      },
    }
  )

  worker.on("failed", (job, err) => {
    const attempt = (job?.attemptsMade ?? 0)
    const max = RETRY_DELAYS_MS.length + 1
    if (attempt >= max) {
      // eslint-disable-next-line no-console
      console.error(
        `[dux-push][ALERT] order=${job?.data.order_id} agotó ${max} intentos: ${err.message}`
      )
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[dux-push] intento ${attempt} falló para order=${job?.data.order_id}: ${err.message}`
      )
    }
  })

  worker.on("completed", (job, result) => {
    // eslint-disable-next-line no-console
    console.log(
      `[dux-push] order=${job.data.order_id} ok`,
      result
    )
  })

  return worker
}

// Si se corre directamente: `node worker.js` → levanta el worker con deps
// resueltas vía HTTP internos a Medusa. Esto queda como TODO porque requiere
// un endpoint interno `/admin/orders/:id?fields=*` autenticado con API key.
if (require.main === module) {
  // eslint-disable-next-line no-console
  console.error(
    "[dux-push] worker standalone todavía no tiene loader de order configurado. Implementar antes de correr en producción."
  )
  process.exit(1)
}
