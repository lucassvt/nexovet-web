import { Metadata } from "next"
import Link from "next/link"
import { sdk } from "@lib/config"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCardMascotera from "@modules/products/components/product-card-mascotera"

export const metadata: Metadata = {
  title: "La Mascotera — Pet shop online del NOA",
  description: "Más de 40 sucursales. Alimento, accesorios, veterinaria y peluquería canina. Envíos a todo el país.",
}

async function getFeaturedProducts(regionId: string) {
  try {
    const { products } = await sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>(
      `/store/products`,
      {
        method: "GET",
        query: { region_id: regionId, limit: 8, fields: "+thumbnail,+variants.calculated_price" },
        cache: "no-store",
      }
    )
    return products || []
  } catch { return [] }
}

const HERO_CARDS = [
  {
    title: "Perros",
    emoji: "🐕",
    href: "/categories/perros",
    bg: "linear-gradient(135deg, #f6a906 0%, #ffbd3a 100%)",
    desc: "Alimento, accesorios y más",
  },
  {
    title: "Gatos",
    emoji: "🐈",
    href: "/categories/gatos",
    bg: "linear-gradient(135deg, #2e9e8a 0%, #3ec2a9 100%)",
    desc: "Todo para tu felino",
  },
  {
    title: "Otros",
    emoji: "🐰",
    href: "/categories/otros",
    bg: "linear-gradient(135deg, #1a4d42 0%, #2a6c5c 100%)",
    desc: "Roedores, peces y más",
  },
]

const BRAND_HIGHLIGHTS = [
  { name: "Royal Canin" },
  { name: "Jaspe" },
  { name: "Sieger" },
  { name: "Senda" },
  { name: "Eukanuba" },
  { name: "Pro Plan" },
  { name: "Old Prince" },
  { name: "Nutrique" },
]

export default async function Home({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)
  if (!region) return null

  const products = await getFeaturedProducts(region.id)

  return (
    <div style={{ background: "#fafafa" }}>
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "#0d1816",
          color: "#fff",
          backgroundImage:
            "radial-gradient(ellipse at top left, rgba(246,169,6,0.18) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(46,158,138,0.18) 0%, transparent 50%)",
        }}
      >
        <div className="content-container py-16 md:py-24 relative z-10">
          <div className="max-w-3xl">
            <span
              className="inline-block px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ background: "#f6a906", color: "#0d1816" }}
            >
              +40 sucursales · NOA
            </span>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tight">
              La tienda de tu <span style={{ color: "#f6a906" }}>mejor amigo</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-2xl" style={{ color: "rgba(255,255,255,0.8)" }}>
              Alimento balanceado, accesorios, veterinaria y peluquería canina. Envíos a todo el país y retiro en sucursal sin cargo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LocalizedClientLink
                href="/store"
                className="inline-block px-8 py-4 rounded font-bold uppercase tracking-wide transition-all hover:scale-105"
                style={{ background: "#f6a906", color: "#0d1816" }}
              >
                Ver todo el catálogo
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/club"
                className="inline-block px-8 py-4 rounded font-bold uppercase tracking-wide border-2 transition-all hover:bg-white/10"
                style={{ borderColor: "#f6a906", color: "#f6a906" }}
              >
                Club La Mascotera
              </LocalizedClientLink>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span>🚚 Envío gratis desde $30.000</span>
              <span>🏪 Retiro en sucursal sin cargo</span>
              <span>💳 Mercado Pago / MODO</span>
            </div>
          </div>

          {/* Decoración con assets reales de marca */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute right-0 bottom-0 top-0 w-[40%] opacity-25 pointer-events-none overflow-hidden"
            style={{ zIndex: 0 }}
          >
            <img src="/images/brand/patita.png" alt="" className="absolute rotate-12" style={{ top: "15%", right: "20%", width: "80px" }} />
            <img src="/images/brand/patita-blanca.png" alt="" className="absolute -rotate-6" style={{ top: "40%", right: "8%", width: "120px", filter: "brightness(0) saturate(100%) invert(79%) sepia(43%) saturate(1840%) hue-rotate(354deg) brightness(101%) contrast(95%)" }} />
            <img src="/images/brand/huesito.png" alt="" className="absolute rotate-45" style={{ top: "55%", right: "30%", width: "70px" }} />
            <img src="/images/brand/patita-rellena.png" alt="" className="absolute -rotate-12" style={{ top: "70%", right: "12%", width: "95px" }} />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-b border-gray-200" style={{ background: "#fff" }}>
        <div className="content-container py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: "#f6a906" }}>+40</div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Sucursales NOA</p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: "#2e9e8a" }}>8</div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Regiones c/ stock propio</p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: "#0d1816" }}>1.815</div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Productos online</p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: "#f6a906" }}>24-48h</div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Entrega intra-prov.</p>
          </div>
        </div>
      </section>

      {/* CARDS COMPRÁ POR MASCOTA */}
      <section className="content-container py-16">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: "#0d1816" }}>
            Comprá por <span style={{ color: "#f6a906" }}>tu mascota</span>
          </h2>
          <p className="mt-2 text-gray-600">Todo lo que necesita, bien organizado por especie.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HERO_CARDS.map((card) => (
            <LocalizedClientLink
              key={card.title}
              href={card.href}
              className="group relative rounded-2xl overflow-hidden p-10 text-white transition-transform hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: card.bg, minHeight: "260px" }}
            >
              <div className="absolute top-4 right-4 text-7xl opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all">
                {card.emoji}
              </div>
              <div className="relative z-10 flex flex-col justify-end h-full">
                <h3 className="text-4xl font-black uppercase tracking-tight">{card.title}</h3>
                <p className="mt-2 text-white/90">{card.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-wider">
                  Ver productos →
                </span>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section style={{ background: "#fff" }}>
        <div className="content-container py-16">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: "#0d1816" }}>
                Productos <span style={{ color: "#2e9e8a" }}>destacados</span>
              </h2>
              <p className="mt-2 text-gray-600">Lo más vendido esta semana.</p>
            </div>
            <LocalizedClientLink
              href="/store"
              className="text-sm font-semibold uppercase tracking-wider hover:underline"
              style={{ color: "#f6a906" }}
            >
              Ver todos →
            </LocalizedClientLink>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Cargando productos...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCardMascotera key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MARCAS */}
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-12">
          <h3 className="text-center text-sm font-semibold uppercase tracking-[0.3em] mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            Trabajamos con las mejores marcas
          </h3>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {BRAND_HIGHLIGHTS.map((b) => (
              <span key={b.name} className="px-6 py-3 rounded-full text-sm font-semibold border" style={{ borderColor: "rgba(246,169,6,0.4)", color: "rgba(255,255,255,0.85)" }}>
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="content-container py-16">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: "#0d1816" }}>
            Nuestros <span style={{ color: "#f6a906" }}>servicios</span>
          </h2>
          <p className="mt-2 text-gray-600">Más que una tienda — el lugar donde tu mascota es bienvenida.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { emoji: "✂️", title: "Peluquería canina", desc: "Baño, corte, cepillado profesional en nuestras sucursales con sala propia." },
            { emoji: "🏥", title: "Veterinaria", desc: "Consultas, vacunación, desparasitación y controles de rutina." },
            { emoji: "📞", title: "Televeterinaria", desc: "Consulta online con un veterinario desde tu casa." },
            { emoji: "🏆", title: "Club La Mascotera", desc: "Sumá puntos en cada compra y canjeá por premios exclusivos." },
          ].map((s) => (
            <div key={s.title} className="p-6 rounded-xl bg-white border border-gray-200 hover:border-[#f6a906] transition-colors">
              <div className="text-4xl mb-4">{s.emoji}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0d1816" }}>{s.title}</h3>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* REGIONES */}
      <section style={{ background: "#fff", borderTop: "1px solid #eee" }}>
        <div className="content-container py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: "#0d1816" }}>
              Encontranos en <span style={{ color: "#f6a906" }}>tu región</span>
            </h2>
            <p className="mt-2 text-gray-600">Stock y precios específicos para tu zona. Retiro en sucursal o delivery local.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { slug: "catamarca", name: "Catamarca", emoji: "🌵" },
              { slug: "chaco", name: "Chaco (Resistencia)", emoji: "🌾" },
              { slug: "cordoba", name: "Córdoba", emoji: "🏛️" },
              { slug: "jujuy", name: "Jujuy", emoji: "⛰️" },
              { slug: "mendoza", name: "Mendoza", emoji: "🍷" },
              { slug: "oran", name: "Orán", emoji: "🌳" },
              { slug: "salta-leguizamon", name: "Salta (Leguizamón)", emoji: "☀️" },
              { slug: "zapala", name: "Zapala", emoji: "🏔️" },
            ].map((r) => (
              <LocalizedClientLink
                key={r.slug}
                href={"/tienda/" + r.slug}
                className="flex items-center gap-3 p-4 bg-[#fafafa] rounded-xl border border-gray-200 hover:border-[#f6a906] hover:shadow-md transition-all"
              >
                <span className="text-3xl">{r.emoji}</span>
                <span className="font-bold uppercase text-sm" style={{ color: "#0d1816" }}>{r.name}</span>
              </LocalizedClientLink>
            ))}
          </div>
          <p className="text-center mt-6 text-xs text-gray-500">
            ¿No ves tu ciudad? Hacé tu pedido desde <LocalizedClientLink href="/store" className="text-[#f6a906] font-semibold hover:underline">/store</LocalizedClientLink> y elegimos la sucursal más cercana.
          </p>
        </div>
      </section>
      {/* CTA CLUB */}
      <section style={{ background: "linear-gradient(135deg, #f6a906 0%, #ffbd3a 100%)" }}>
        <div className="content-container py-16 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#0d1816" }}>
            Sumate al Club
          </span>
          <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight" style={{ color: "#0d1816" }}>
            Cada compra<br />
            <span style={{ color: "#fff" }}>vale puntos</span>
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: "rgba(13,24,22,0.8)" }}>
            Canjeá tus puntos por productos, descuentos y consultas veterinarias gratis.
          </p>
          <LocalizedClientLink
            href="/club"
            className="mt-8 inline-block px-10 py-4 rounded font-bold uppercase tracking-wide transition-transform hover:scale-105"
            style={{ background: "#0d1816", color: "#f6a906" }}
          >
            Registrate gratis
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
