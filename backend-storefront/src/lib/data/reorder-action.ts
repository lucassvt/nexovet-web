"use server"

import { addToCart } from "@lib/data/cart"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { redirect } from "next/navigation"

// Add all line_items from a previous order to the current cart
// and redirect to /cart. Used by the "Volver a pedir" button on the order card.
export async function reorder(formData: FormData) {
  const orderId = formData.get("orderId") as string
  const countryCode = (formData.get("countryCode") as string) || "ar"
  if (!orderId) throw new Error("Missing orderId")

  const headers = { ...(await getAuthHeaders()) }

  // Fetch the order with line items
  const res = await sdk.store.order.retrieve(
    orderId,
    { fields: "*items" },
    headers
  )
  const order = (res as any)?.order
  if (!order) throw new Error("Order not found")

  const items = (order.items || []) as Array<{
    variant_id: string | null
    quantity: number
  }>

  let added = 0
  let skipped = 0
  for (const it of items) {
    if (!it.variant_id || !it.quantity) {
      skipped++
      continue
    }
    try {
      await addToCart({
        variantId: it.variant_id,
        quantity: it.quantity,
        countryCode,
      })
      added++
    } catch (err) {
      skipped++
    }
  }

  // All good — redirect to cart
  redirect(`/${countryCode}/cart?reorder=${added}&skipped=${skipped}`)
}
