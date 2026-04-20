"use client"

import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useState } from "react"

type MPCheckoutButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid"?: string
}

/**
 * Botón que crea preference en MP y redirige al checkout de Mercado Pago
 */
const MPCheckoutButton: React.FC<MPCheckoutButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const notReady = !cart || !cart.items || cart.items.length === 0

  const handleClick = async () => {
    if (notReady) return
    setSubmitting(true)
    setError(null)
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
        "https://shop-admin.nexovet.com.ar"
      const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

      const res = await fetch(`${baseUrl}/store/mp/create-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": pk,
        },
        body: JSON.stringify({ cart_id: cart.id }),
      })
      const json = await res.json()

      if (!res.ok || !json.init_point) {
        throw new Error(json.message || "No se pudo iniciar el pago en Mercado Pago.")
      }

      // Redirigir al checkout de MP
      window.location.href = json.init_point
    } catch (e: any) {
      setError(e.message || "Error al iniciar el pago.")
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={notReady || submitting}
        onClick={handleClick}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId || "mp-checkout-button"}
        style={{ background: "#009ee3", color: "#fff", fontWeight: 700 }}
      >
        {submitting ? "Redirigiendo a Mercado Pago..." : "💳 Pagar con Mercado Pago"}
      </Button>
      {error && (
        <p className="text-red-600 text-sm" data-testid="mp-checkout-error">
          {error}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Pagá con tarjeta, débito, MODO, Rapipago o Pago Fácil. Vas a ser redirigido al checkout seguro de Mercado Pago.
      </p>
    </div>
  )
}

export default MPCheckoutButton
