/**
 * Wrapper BullMQ para la cola `dux-push`.
 *
 * Se re-exporta desde `index.ts` para que el subscriber lo use, y también lo
 * consume `worker.ts`.
 */

import { Queue, type JobsOptions } from "bullmq"
import IORedis from "ioredis"
import { REDIS_URL, RETRY_DELAYS_MS } from "./config"
import type { DuxPushJobData } from "./types"

export const DUX_PUSH_QUEUE_NAME = "dux-push"

let connection: IORedis | null = null
let queue: Queue<DuxPushJobData> | null = null

export function getRedis(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      // BullMQ requiere esto para poder hacer BRPOPLPUSH sin timeouts raros.
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  }
  return connection
}

export function getQueue(): Queue<DuxPushJobData> {
  if (!queue) {
    queue = new Queue<DuxPushJobData>(DUX_PUSH_QUEUE_NAME, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: RETRY_DELAYS_MS.length + 1, // intento inicial + retries
        backoff: {
          type: "custom-dux",
        },
        removeOnComplete: {
          // Mantener los últimos 1000 completados (el log real vive en dux_push_log).
          count: 1000,
        },
        removeOnFail: {
          count: 5000,
        },
      },
    })
  }
  return queue
}

/**
 * Encola un job de push. Usa `jobId = order_id` como lock de idempotencia a
 * nivel BullMQ — si ya existe un job con ese ID, BullMQ lo ignora.
 */
export async function enqueuePush(
  orderId: string,
  opts: JobsOptions = {}
): Promise<void> {
  await getQueue().add(
    "push",
    { order_id: orderId },
    {
      jobId: `order:${orderId}`,
      ...opts,
    }
  )
}
