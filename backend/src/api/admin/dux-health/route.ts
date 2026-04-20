/**
 * GET /admin/dux-health
 *
 * Panel de salud del push a DUX:
 *   - queue size (waiting + active + delayed)
 *   - fails últimos 24h (de `dux_push_log`)
 *   - last-success por región
 *
 * Si no podemos conectar a Redis (Redis caido), igual devolvemos 200 con
 * `queue: null` para no romper el admin.
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  DUX_PUSH_ENABLED,
  REGION_ROUTING,
} from "../../../../packages/@nexovet/dux-push/src/config"
import {
  getQueue,
} from "../../../../packages/@nexovet/dux-push/src/queue"
import {
  getHealthStats,
} from "../../../../packages/@nexovet/dux-push/src/db"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const [queueCounts, stats] = await Promise.all([
    getQueueCountsSafe(),
    getHealthStats().catch((e) => ({
      queueFailsLast24h: -1,
      lastSuccessByRegion: [],
      _dbError: (e as Error).message,
    })),
  ])

  res.json({
    enabled: DUX_PUSH_ENABLED,
    regions_configured: Object.keys(REGION_ROUTING).length,
    queue: queueCounts,
    fails_24h: stats.queueFailsLast24h,
    last_success_by_region: stats.lastSuccessByRegion,
  })
}

async function getQueueCountsSafe() {
  try {
    const q = getQueue()
    const counts = await q.getJobCounts(
      "waiting",
      "active",
      "delayed",
      "failed",
      "completed"
    )
    return counts
  } catch (err: unknown) {
    return { error: (err as Error).message }
  }
}
