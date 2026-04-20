/**
 * Subscriber Medusa: `order.placed` → encola job en la cola `dux-push`.
 *
 * Para que este subscriber sea cargado por Medusa, debe estar accesible desde
 * `src/subscribers/` del backend. La forma recomendada es un shim en
 * `backend/src/subscribers/dux-push-order-placed.ts` que reexporta este archivo:
 *
 * ```ts
 * export {
 *   default,
 *   config,
 * } from "../../packages/@nexovet/dux-push/src/subscribers/order-placed"
 * ```
 *
 * El feature flag `DUX_PUSH_ENABLED` controla el encolado en runtime.
 */

import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

import { DUX_PUSH_ENABLED, REGION_ROUTING } from "../config"
import { enqueuePush } from "../queue"

export default async function duxPushOrderPlacedHandler({
  event,
}: SubscriberArgs<{ id: string }>) {
  if (!DUX_PUSH_ENABLED) {
    // Fail-safe mientras los tokens no estén configurados.
    // eslint-disable-next-line no-console
    console.log(
      `[dux-push] DUX_PUSH_ENABLED=false, ignorando order=${event.data.id}`
    )
    return
  }

  const orderId = event.data.id
  if (!orderId) {
    // eslint-disable-next-line no-console
    console.warn("[dux-push] order.placed sin id en payload")
    return
  }

  try {
    await enqueuePush(orderId)
    // eslint-disable-next-line no-console
    console.log(`[dux-push] enqueued order=${orderId}`)
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      `[dux-push] falló encolado de order=${orderId}:`,
      err instanceof Error ? err.message : err
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

// Exportado para tests: lista de regiones routeables, útil para validar que
// todos los sales_channels productivos estén contemplados.
export const SUPPORTED_REGION_KEYS = Object.keys(REGION_ROUTING)
