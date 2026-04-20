// src/api/store/club/canje/route.ts
// POST /store/club/canje
// STUB por ahora: valida auth y saldo, registra intent en ledger con tipo=CANJE (negativo) y estado motivo="pending".
// TODO: integrar con catalogo de recompensas (productos/servicios) y descuentos checkout.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getBalance, insertLedger } from "../_lib"

function resolveCustomerId(req: MedusaRequest): string | null {
  const ctx: any = (req as any).auth_context || (req as any).auth || null
  if (ctx) {
    const actorId =
      ctx.actor_id || ctx.actorId || ctx?.app_metadata?.customer_id || null
    if (actorId) return String(actorId)
  }
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = resolveCustomerId(req)
    if (!customerId) {
      return res.status(401).json({ error: "no_autenticado" })
    }

    const body = (req.body as any) || {}
    const pointsRaw = Number(body.points)
    const reward_id = (body.reward_id || "").toString()
    const motivo = (body.motivo || "Canje pendiente de validación").toString()

    if (!Number.isFinite(pointsRaw) || pointsRaw <= 0) {
      return res.status(400).json({ error: "points_invalido", message: "Debe ser un entero positivo" })
    }

    const balance = await getBalance(customerId)
    if (balance < pointsRaw) {
      return res.status(400).json({
        error: "saldo_insuficiente",
        message: `Saldo insuficiente. Tenés ${balance} puntos, necesitás ${pointsRaw}.`,
        balance,
      })
    }

    // STUB: registramos intent como CANJE negativo. Futuramente requerira reward catalog + approval flow.
    const entry = await insertLedger({
      customer_id: customerId,
      tipo: "CANJE",
      points: -Math.floor(pointsRaw),
      motivo: `[STUB] ${motivo}${reward_id ? ` (reward: ${reward_id})` : ""}`,
      source_canal: "ecommerce_propio",
    })

    const newBalance = await getBalance(customerId)

    return res.status(200).json({
      ok: true,
      stub: true,
      entry,
      balance: newBalance,
      message:
        "Canje registrado (stub). La aplicación efectiva de la recompensa se implementará cuando exista el catálogo.",
    })
  } catch (err: any) {
    console.error("[club/canje] error:", err?.stack || err)
    return res.status(500).json({
      error: "internal_error",
      message: err?.message || "Error interno",
    })
  }
}
