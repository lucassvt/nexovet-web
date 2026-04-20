// src/api/store/club/saldo/route.ts
// GET /store/club/saldo
// Auth: Bearer JWT del store (customer actor) o session cookie.
// Devuelve: balance, tier, spent_year, history (ultimos 50).

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getConfig,
  getBalance,
  getHistory,
  getYearSpent,
  computeTier,
} from "../_lib"

function resolveCustomerId(req: MedusaRequest): string | null {
  // Medusa v2 pone el auth context en req.auth_context cuando el token es valido.
  const ctx: any = (req as any).auth_context || (req as any).auth || null
  if (ctx) {
    const actorId =
      ctx.actor_id || ctx.actorId || ctx?.app_metadata?.customer_id || null
    if (actorId) return String(actorId)
  }

  // Fallback: parsear Bearer manualmente.
  const h = req.headers?.authorization || ""
  const m = /^Bearer\s+(.+)$/i.exec(String(h))
  if (m) {
    try {
      const jwt = require("jsonwebtoken")
      const secret = process.env.JWT_SECRET || "supersecret"
      const decoded: any = jwt.verify(m[1], secret)
      return (
        decoded?.actor_id ||
        decoded?.app_metadata?.customer_id ||
        decoded?.customer_id ||
        null
      )
    } catch {
      return null
    }
  }
  return null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = resolveCustomerId(req)
    if (!customerId) {
      return res.status(401).json({ error: "no_autenticado" })
    }

    const config = await getConfig()
    const [balance, history, spent] = await Promise.all([
      getBalance(customerId),
      getHistory(customerId, 50),
      getYearSpent(customerId, config.pesos_por_punto),
    ])
    const tier = computeTier(spent)

    return res.status(200).json({
      ok: true,
      customer_id: customerId,
      balance,
      spent_year_ars: spent,
      tier,
      config: {
        pesos_por_punto: config.pesos_por_punto,
        vigencia_dias: config.vigencia_dias,
        notif_dias_antes: config.notif_dias_antes,
      },
      history,
    })
  } catch (err: any) {
    console.error("[club/saldo] error:", err?.stack || err)
    return res.status(500).json({
      error: "internal_error",
      message: err?.message || "Error interno",
    })
  }
}
