import { HttpTypes } from "@medusajs/types"

// Progress bar estilo Puppis: "Te faltan $X para envío gratis" con barra.
// Threshold default $30.000 (valor del top-bar promocional).
// Si currency != ARS, no renderiza (fallback defensivo).

const FREE_SHIPPING_THRESHOLD_PESOS = 30000

function formatARS(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR")
}

export default function FreeShippingProgress({ cart }: { cart: HttpTypes.StoreCart }) {
  if (!cart) return null
  const currency = (cart.currency_code || "").toLowerCase()
  if (currency && currency !== "ars") return null

  // cart.item_subtotal / cart.subtotal / cart.total están en minor units (cents)
  // Preferimos item_subtotal (no incluye envío), fallback subtotal
  const raw = (cart as any).item_subtotal ?? cart.subtotal ?? cart.total ?? 0
  const amountPesos = raw / 100
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_PESOS - amountPesos)
  const pct = Math.min(100, Math.round((amountPesos / FREE_SHIPPING_THRESHOLD_PESOS) * 100))
  const achieved = remaining <= 0

  return (
    <div className="mb-5 p-4 rounded-lg border-2" style={{ borderColor: achieved ? "#2e9e8a" : "#f6a906", background: achieved ? "#e6f7f3" : "#fff8e6" }}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-sm font-semibold" style={{ color: "#0d1816" }}>
          {achieved ? (
            <>
              <span className="mr-1">🎉</span>
              <span>¡Conseguiste envío gratis!</span>
            </>
          ) : (
            <>
              <span className="mr-1">🚚</span>
              <span>
                Sumá <span className="font-black" style={{ color: "#f6a906" }}>{formatARS(remaining)}</span> más y te llevás <span className="font-bold">envío gratis</span>.
              </span>
            </>
          )}
        </div>
        <span className="text-xs font-bold" style={{ color: achieved ? "#2e9e8a" : "#0d1816" }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(13,24,22,0.1)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: achieved
              ? "linear-gradient(90deg, #2e9e8a 0%, #3ec2a9 100%)"
              : "linear-gradient(90deg, #f6a906 0%, #ffbd3a 100%)",
          }}
        />
      </div>
    </div>
  )
}
