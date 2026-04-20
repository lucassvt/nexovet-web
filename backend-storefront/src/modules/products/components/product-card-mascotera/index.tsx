import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type Props = {
  product: HttpTypes.StoreProduct
}

const BRAND_COLOR = "#f6a906"
const DARK = "#0d1816"
const MINT = "#2e9e8a"

// Precio bruto (en cents) → pesos. Luego 5% descuento transferencia.
function getPricing(product: HttpTypes.StoreProduct) {
  const variant = product.variants?.[0] as any
  const rawAmount: number | null = variant?.calculated_price?.calculated_amount ?? null
  if (rawAmount == null) return null
  const precio = Math.round(rawAmount / 100)
  const precioTransfer = Math.round(precio * 0.95)
  const cuota3 = Math.round(precio / 3)
  const cuota6 = Math.round(precio / 6)
  return { precio, precioTransfer, cuota3, cuota6 }
}

function getBrand(product: HttpTypes.StoreProduct): string | null {
  const meta: any = product.metadata
  return (meta?.dux_brand as string) || (meta?.dux_marca_nombre as string) || null
}

function getInventoryWarning(product: HttpTypes.StoreProduct): number | null {
  const variants = product.variants || []
  let total = 0
  for (const v of variants as any[]) {
    if (typeof v?.inventory_quantity === "number") total += v.inventory_quantity
  }
  if (total === 0 || total >= 5) return null
  return total
}

export default function ProductCardMascotera({ product }: Props) {
  const pricing = getPricing(product)
  const brand = getBrand(product)
  const lowStock = getInventoryWarning(product)

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#f6a906] flex flex-col"
    >
      {/* Imagen */}
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <span className="text-5xl opacity-20">🐾</span>
        )}
        {lowStock != null && (
          <span
            className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded text-white"
            style={{ background: "#e67e22" }}
          >
            Solo {lowStock} disp.
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {brand && (
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: BRAND_COLOR }}
          >
            {brand}
          </p>
        )}
        <h3
          className="text-sm font-semibold line-clamp-2 mb-3 min-h-[2.5em]"
          style={{ color: DARK }}
        >
          {product.title}
        </h3>

        {pricing ? (
          <div className="mt-auto space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black" style={{ color: DARK }}>
                ${pricing.precio.toLocaleString("es-AR")}
              </span>
            </div>
            <div className="text-xs font-semibold flex items-center gap-1" style={{ color: MINT }}>
              💰 ${pricing.precioTransfer.toLocaleString("es-AR")} con transferencia
            </div>
            <div className="text-xs text-gray-600">
              3 cuotas de <span className="font-semibold">${pricing.cuota3.toLocaleString("es-AR")}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-auto">Precio a consultar</p>
        )}
      </div>
    </LocalizedClientLink>
  )
}
