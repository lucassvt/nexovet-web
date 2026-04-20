import { Metadata } from "next"
import { notFound } from "next/navigation"
import { sdk } from "@lib/config"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Config de las 8 regiones del ecommerce propio
const REGIONS_CONFIG: Record<string, {
  sales_channel_id: string
  name: string
  emoji: string
  description: string
  color: string
}> = {
  "catamarca": {
    sales_channel_id: "sc_01KPKCJEBCTA782VXEHJ128E5Q",
    name: "Catamarca",
    emoji: "🌵",
    description: "Tu tienda en Catamarca capital. Retiro en sucursal o delivery local.",
    color: "#f6a906",
  },
  "chaco": {
    sales_channel_id: "sc_01KPKCJECAFV4TNC2FK9DP99DJ",
    name: "Chaco",
    emoji: "🌾",
    description: "Tu tienda en Resistencia. Retiro en sucursal o delivery local.",
    color: "#2e9e8a",
  },
  "jujuy": {
    sales_channel_id: "sc_01KPKCJED27208QVXZSRRC1DP0",
    name: "Jujuy",
    emoji: "⛰️",
    description: "Tu tienda en San Salvador de Jujuy. Retiro en sucursal o delivery local.",
    color: "#f6a906",
  },
  "mendoza": {
    sales_channel_id: "sc_01KPKCJEDRCBTF9FACT926HTWG",
    name: "Mendoza",
    emoji: "🍷",
    description: "Tu tienda en Mendoza. 2 sucursales: Godoy Cruz y Las Heras.",
    color: "#2e9e8a",
  },
  "salta-leguizamon": {
    sales_channel_id: "sc_01KPKCJEEJ2B9HAXTGABMZMX1Q",
    name: "Salta (Leguizamón)",
    emoji: "☀️",
    description: "Sucursal Leguizamón 899, Salta capital.",
    color: "#f6a906",
  },
  "oran": {
    sales_channel_id: "sc_01KPKCJEFDXVS09FKHQM5X5P19",
    name: "Orán",
    emoji: "🌳",
    description: "Tu tienda en Orán.",
    color: "#2e9e8a",
  },
  "cordoba": {
    sales_channel_id: "sc_01KPKCJEG7KQNYFDM2ZHETYMHN",
    name: "Córdoba",
    emoji: "🏛️",
    description: "Tu tienda en Córdoba capital (Rumipet).",
    color: "#f6a906",
  },
  "zapala": {
    sales_channel_id: "sc_01KPKCJEH1S313GZPXX6JN8Y09",
    name: "Zapala",
    emoji: "🏔️",
    description: "Tu tienda en Zapala, Neuquén.",
    color: "#2e9e8a",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string; region: string }>
}): Promise<Metadata> {
  const { region } = await params
  const cfg = REGIONS_CONFIG[region]
  if (!cfg) return { title: "Tienda — La Mascotera" }
  return {
    title: `La Mascotera ${cfg.name} — Tienda online`,
    description: cfg.description,
  }
}

async function getProductsByChannel(regionId: string, salesChannelId: string, limit = 24) {
  try {
    const { products, count } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>("/store/products", {
      method: "GET",
      query: {
        region_id: regionId,
        sales_channel_id: salesChannelId,
        limit,
        fields: "+thumbnail,+variants.calculated_price",
      },
      cache: "no-store",
    })
    return { products: products || [], count: count || 0 }
  } catch {
    return { products: [], count: 0 }
  }
}

export default async function TiendaRegion({
  params,
}: {
  params: Promise<{ countryCode: string; region: string }>
}) {
  const { countryCode, region: regionSlug } = await params
  const cfg = REGIONS_CONFIG[regionSlug]
  if (!cfg) notFound()

  const region = await getRegion(countryCode)
  if (!region) notFound()

  const { products, count } = await getProductsByChannel(region.id, cfg.sales_channel_id)

  return (
    <div style={{ background: "#fafafa" }}>
      {/* Hero con la región seleccionada */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "#0d1816",
          color: "#fff",
          backgroundImage: `radial-gradient(ellipse at top right, ${cfg.color}22 0%, transparent 50%)`,
        }}
      >
        <div className="content-container py-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{cfg.emoji}</span>
            <div>
              <p className="text-xs uppercase tracking-widest opacity-60">La Mascotera en</p>
              <h1 className="text-4xl md:text-5xl font-black uppercase">{cfg.name}</h1>
            </div>
          </div>
          <p className="text-lg max-w-2xl" style={{ color: "rgba(255,255,255,0.8)" }}>{cfg.description}</p>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {count} productos disponibles con stock en tu región.
          </p>
        </div>
      </section>

      {/* Listado */}
      <section className="content-container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase" style={{ color: "#0d1816" }}>
            Productos destacados
          </h2>
          <LocalizedClientLink
            href={`/store?sales_channel=${cfg.sales_channel_id}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: cfg.color }}
          >
            Ver todos ({count}) →
          </LocalizedClientLink>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-500 mb-4">
              Cargando productos para {cfg.name}…
            </p>
            <p className="text-sm text-gray-400">
              Si persiste el problema, probá seleccionar otra región desde la pill del header.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => {
              const variant = product.variants?.[0]
              const price = variant?.calculated_price?.calculated_amount
              return (
                <LocalizedClientLink
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-5xl opacity-20">🐾</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold line-clamp-2 mb-2" style={{ color: "#0d1816" }}>{product.title}</h3>
                    {price != null && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black" style={{ color: "#0d1816" }}>
                          ${price.toLocaleString("es-AR")}
                        </span>
                        <span className="text-xs text-gray-500">ARS</span>
                      </div>
                    )}
                  </div>
                </LocalizedClientLink>
              )
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{ background: cfg.color }}>
        <div className="content-container py-10 text-center" style={{ color: "#0d1816" }}>
          <h3 className="text-2xl font-black uppercase mb-3">¿No sos de {cfg.name}?</h3>
          <p className="mb-5">Seleccioná tu región desde la pill del header para ver productos de tu zona.</p>
          <LocalizedClientLink href="/" className="inline-block px-8 py-3 rounded font-bold uppercase tracking-wide" style={{ background: "#0d1816", color: cfg.color }}>
            Cambiar región
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
