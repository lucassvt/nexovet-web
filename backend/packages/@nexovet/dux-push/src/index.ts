/**
 * Entry point del paquete @nexovet/dux-push.
 *
 * Re-exports para consumo limpio desde el backend Medusa.
 */

export * from "./config"
export * from "./types"
export { DuxClient, duxClient, DuxApiError, DuxConfigError } from "./dux-client"
export {
  mapOrderToDuxPedido,
  mapFormaPago,
  DEFAULT_FORMA_PAGO_MP_TO_DUX,
} from "./order-mapper"
export {
  DUX_PUSH_QUEUE_NAME,
  getQueue,
  enqueuePush,
  getRedis,
} from "./queue"
export { startWorker, buildProcessor, NonRetriableError } from "./worker"
export {
  findSuccessfulPush,
  insertPushAttempt,
  markPushSuccess,
  markPushFailed,
  getHealthStats,
} from "./db"
