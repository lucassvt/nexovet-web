import { listCategories } from "@lib/data/categories"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const productCategories = await listCategories()

  return (
    <footer
      className="w-full"
      style={{ background: "#0d1816", color: "#fff", borderTop: "6px solid #f6a906" }}
    >
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-8 xsmall:flex-row items-start justify-between py-16">
          <div className="flex flex-col gap-y-4 max-w-sm">
            <LocalizedClientLink href="/" className="inline-block">
              <img
                src="/images/brand/logo.png"
                alt="La Mascotera"
                style={{ height: "60px", width: "auto", filter: "brightness(0) invert(1)" }}
              />
            </LocalizedClientLink>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              La cadena de pet shops más grande del NOA. +40 sucursales. Alimento, accesorios, veterinaria y peluquería canina.
            </p>
            <div className="flex flex-col gap-1 text-sm mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              <span>📱 WhatsApp: +54 381 239 1001</span>
              <span>✉️ soportelamascotera@gmail.com</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
            {productCategories && productCategories.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="font-semibold uppercase text-sm tracking-wider" style={{ color: "#f6a906" }}>
                  Categorías
                </span>
                <ul className="grid grid-cols-1 gap-2 mt-2" data-testid="footer-categories">
                  {productCategories.slice(0, 8).map((c) => {
                    if (c.parent_category) return null
                    return (
                      <li key={c.id}>
                        <LocalizedClientLink
                          className="text-sm hover:text-[#f6a906] transition"
                          href={`/categories/${c.handle}`}
                          style={{ color: "rgba(255,255,255,0.8)" }}
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="font-semibold uppercase text-sm tracking-wider" style={{ color: "#f6a906" }}>La Mascotera</span>
              <ul className="grid grid-cols-1 gap-2 mt-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/nosotros">Quiénes somos</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/sucursales">Sucursales</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/trabajo">Trabajá con nosotros</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/franquicias">Franquicias</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/como-comprar">Cómo comprar</LocalizedClientLink></li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="font-semibold uppercase text-sm tracking-wider" style={{ color: "#f6a906" }}>Ayuda</span>
              <ul className="grid grid-cols-1 gap-2 mt-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/account">Mi cuenta</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/club">Club La Mascotera</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/televeterinaria">Televeterinaria</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/peluqueria">Peluquería canina</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/faq">Preguntas frecuentes</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/blog">Blog & consejos</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/devoluciones">Devoluciones</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/terminos">Términos y condiciones</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/arrepentimiento">Botón de arrepentimiento</LocalizedClientLink></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trust / certificaciones */}
        <div className="py-6 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Compra segura</span>
            <a href="https://www.cace.org.ar/socios" target="_blank" rel="noopener noreferrer" title="Miembro CACE" className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white hover:scale-105 transition-transform">
              <span className="font-black text-xs" style={{ color: "#003f7f" }}>CACE</span>
              <span className="text-[10px] font-semibold" style={{ color: "#555" }}>Cámara Argentina de Comercio Electrónico</span>
            </a>
            <a href="https://www.argentina.gob.ar/aaip/datospersonales" target="_blank" rel="noopener noreferrer" title="Ley 25.326 Protección de Datos Personales" className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white hover:scale-105 transition-transform">
              <span className="font-black text-xs" style={{ color: "#0d1816" }}>🔒 Datos Protegidos</span>
            </a>
            <a href="/ar/arrepentimiento" title="Botón de arrepentimiento Decreto 276/98" className="inline-flex items-center gap-1 px-3 py-1.5 rounded" style={{ background: "#d32f2f", color: "#fff" }}>
              <span className="text-[11px] font-black uppercase">Botón de Arrepentimiento</span>
            </a>
          </div>
        </div>

        <div className="py-6 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Pagá con</span>
            <span className="inline-block px-3 py-1 bg-white rounded text-[#009ee3] font-bold text-xs">Mercado Pago</span>
            <span className="inline-block px-3 py-1 bg-white rounded text-blue-900 font-bold text-xs">VISA</span>
            <span className="inline-block px-3 py-1 bg-white rounded text-red-600 font-bold text-xs">Mastercard</span>
            <span className="inline-block px-3 py-1 bg-white rounded text-green-700 font-bold text-xs">Cabal</span>
            <span className="inline-block px-3 py-1 bg-white rounded text-gray-800 font-bold text-xs">Transferencia</span>
            <span className="inline-block px-3 py-1 bg-white rounded text-orange-500 font-bold text-xs">Naranja</span>
          </div>
          <a href="https://consumidor.produccion.gob.ar/" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-[#f6a906]" style={{ color: "rgba(255,255,255,0.65)" }}>
            Defensa del Consumidor →
          </a>
        </div>
        <div
          className="flex flex-col sm:flex-row w-full mb-6 justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px", color: "rgba(255,255,255,0.55)" }}
        >
          <Text className="text-xs">© {new Date().getFullYear()} La Mascotera — Todos los derechos reservados</Text>
          <div className="flex items-center gap-3 text-xs">
            <a href="https://www.instagram.com/lamascotera.noa/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex items-center gap-1.5 hover:text-[#f6a906] transition-colors">
              <img src="/images/brand/instagram.png" alt="" className="h-4 w-4" />
              <span>Instagram</span>
            </a>
            <a href="https://www.facebook.com/lamascotera" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-[#f6a906] transition-colors">Facebook</a>
            <a href="https://www.tiktok.com/@lamascotera" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-[#f6a906] transition-colors">TikTok</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
