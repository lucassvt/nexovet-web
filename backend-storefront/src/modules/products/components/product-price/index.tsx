import { clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"

const DARK = "#0d1816"
const MINT = "#2e9e8a"

function toArs(amount: number): string {
  return Math.round(amount).toLocaleString("es-AR")
}

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse rounded" />
  }

  // calculated_price_number is minor units (cents); convert to pesos
  const raw = selectedPrice.calculated_price_number ?? 0
  const precio = raw / 100
  const precioTransfer = precio * 0.95
  const cuota3 = precio / 3
  const cuota6 = precio / 6
  const cuota12 = precio / 12

  const isSale = selectedPrice.price_type === "sale"
  const rawOriginal = selectedPrice.original_price_number ?? 0
  const originalPesos = rawOriginal / 100

  return (
    <div className="flex flex-col gap-y-2 text-ui-fg-base">
      {/* Precio principal */}
      <div className="flex items-baseline gap-3">
        {!variant && (
          <span className="text-sm text-gray-500">Desde</span>
        )}
        <span
          data-testid="product-price"
          data-value={raw}
          className={clx("text-4xl font-black", isSale && "text-red-600")}
          style={{ color: isSale ? undefined : DARK }}
        >
          ${toArs(precio)}
        </span>
        {isSale && originalPesos > 0 && (
          <span
            data-testid="original-product-price"
            data-value={rawOriginal}
            className="text-lg text-gray-400 line-through"
          >
            ${toArs(originalPesos)}
          </span>
        )}
        {isSale && selectedPrice.percentage_diff && (
          <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
            -{selectedPrice.percentage_diff}%
          </span>
        )}
      </div>

      {/* Precio transferencia */}
      <div
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color: MINT }}
      >
        <span className="text-lg">💰</span>
        <span>
          <span className="font-black text-base">
            ${toArs(precioTransfer)}
          </span>
          {" "}con transferencia bancaria
          <span className="ml-1 text-xs bg-[#2e9e8a] text-white px-2 py-0.5 rounded-full font-bold">
            5% OFF
          </span>
        </span>
      </div>

      {/* Cuotas MP */}
      <div className="text-sm text-gray-700 border-t border-gray-200 pt-2 mt-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#009ee3] bg-[#E3F4FB] px-2 py-0.5 rounded">
            Mercado Pago
          </span>
          <span className="text-xs text-gray-500">Hasta 12 cuotas sin interés</span>
        </div>
        <ul className="text-xs space-y-0.5 text-gray-600">
          <li>
            3 cuotas de{" "}
            <span className="font-semibold text-gray-800">
              ${toArs(cuota3)}
            </span>
          </li>
          <li>
            6 cuotas de{" "}
            <span className="font-semibold text-gray-800">
              ${toArs(cuota6)}
            </span>
          </li>
          <li>
            12 cuotas de{" "}
            <span className="font-semibold text-gray-800">
              ${toArs(cuota12)}
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
