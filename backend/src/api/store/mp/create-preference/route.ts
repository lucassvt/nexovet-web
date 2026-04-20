// src/api/store/mp/create-preference/route.ts
// POST /store/mp/create-preference
// Crea preference en Mercado Pago para un cart Medusa y devuelve init_point

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercadoPagoConfig, Preference } from "mercadopago"

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

if (!ACCESS_TOKEN) {
  console.error("[mp] MP_ACCESS_TOKEN no seteado")
}

const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: { timeout: 10000 },
})

const STOREFRONT_URL = process.env.STOREFRONT_URL || "https://tienda-preview.nexovet.com.ar"
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "https://shop-admin.nexovet.com.ar"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body as any) || {}
    const { cart_id } = body

    if (!cart_id) {
      return res.status(400).json({ error: "cart_id requerido" })
    }

    // Obtener cart desde Medusa
    const cartService = req.scope.resolve("cart")
    const cart = await cartService.retrieveCart(cart_id, {
      relations: ["items", "shipping_address", "billing_address"],
    })

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(404).json({ error: "Cart vacio o no encontrado" })
    }

    const preferenceItems = cart.items.map((item: any) => ({
      id: item.variant_id || item.id,
      title: item.title || item.product_title || "Producto",
      quantity: item.quantity,
      unit_price: Number(item.unit_price) / 100, // Medusa usa centavos, MP usa pesos
      currency_id: "ARS",
    }))

    const preference = new Preference(client)
    const payload: any = {
      items: preferenceItems,
      external_reference: cart_id,
      statement_descriptor: "LAMASCOTERA",
      metadata: {
        cart_id,
        customer_id: cart.customer_id || null,
        region_id: cart.region_id || null,
      },
    }

    if (BACKEND_URL.startsWith("https://")) {
      payload.notification_url = `${BACKEND_URL}/store/mp/webhook`
    }
    if (STOREFRONT_URL.startsWith("https://")) {
      payload.back_urls = {
        success: `${STOREFRONT_URL}/ar/order/confirmed?cart_id=${cart_id}`,
        failure: `${STOREFRONT_URL}/ar/checkout?status=failure`,
        pending: `${STOREFRONT_URL}/ar/checkout?status=pending`,
      }
      payload.auto_return = "approved"
    }
    if (cart.email) payload.payer = { email: cart.email }

    const result = await preference.create({ body: payload })

    return res.status(200).json({
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      cart_id,
    })
  } catch (err: any) {
    console.error("[mp create-preference] ERROR:", err?.message || err)
    return res.status(500).json({
      error: "mp_preference_failed",
      message: err?.message || "Error creando preference en Mercado Pago",
    })
  }
}
