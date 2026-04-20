// src/api/store/mp/webhook/route.ts
// POST /store/mp/webhook
// Recibe notificación de Mercado Pago, valida firma HMAC y confirma el pedido en Medusa

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercadoPagoConfig, Payment } from "mercadopago"
import crypto from "crypto"

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || ""

const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: { timeout: 10000 },
})

// Valida x-signature de Mercado Pago (v1 = HMAC-SHA256)
function verifySignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string,
  secret: string
): boolean {
  if (!secret) {
    console.warn("[mp webhook] MP_WEBHOOK_SECRET no configurado, saltando validacion")
    return true // permitir durante setup; rechazar en prod real
  }
  if (!xSignature || !xRequestId) return false

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.trim().split("=")) as [string, string][]
  )
  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex")
  return hmac === v1
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body as any) || {}
    const query = req.query as any

    const topic = body.type || body.topic || query.type || query.topic
    const dataId = body?.data?.id || query["data.id"] || query.id

    console.log("[mp webhook] Recibido:", { topic, dataId, body, query })

    if (topic !== "payment") {
      return res.status(200).json({ ignored: topic })
    }

    // Validar firma (si webhook secret configurado)
    const valid = verifySignature(
      req.headers["x-signature"] as string,
      req.headers["x-request-id"] as string,
      String(dataId),
      WEBHOOK_SECRET
    )
    if (!valid) {
      console.error("[mp webhook] Firma invalida")
      return res.status(401).json({ error: "invalid_signature" })
    }

    // Obtener detalle del pago desde MP API
    const paymentApi = new Payment(client)
    const payment = await paymentApi.get({ id: String(dataId) })

    console.log("[mp webhook] Payment detalle:", {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount,
    })

    // external_reference = cart_id (lo seteamos en create-preference)
    const cartId = payment.external_reference

    if (!cartId) {
      return res.status(200).json({ error: "sin_external_reference" })
    }

    // Según status, accionar:
    if (payment.status === "approved") {
      // TODO: completar order en Medusa (completeCart workflow)
      // await req.scope.resolve("cartModuleService").completeCart(cartId)
      console.log("[mp webhook] PAGO APROBADO para cart:", cartId)
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      console.log("[mp webhook] PAGO RECHAZADO:", payment.status_detail)
    } else {
      console.log("[mp webhook] Pago en estado:", payment.status)
    }

    // TODO: persistir evento en tabla mp_webhook_log para auditoria
    return res.status(200).json({ received: true, cart_id: cartId, status: payment.status })
  } catch (err: any) {
    console.error("[mp webhook] ERROR:", err?.message || err)
    return res.status(500).json({ error: err?.message || "webhook_failed" })
  }
}
