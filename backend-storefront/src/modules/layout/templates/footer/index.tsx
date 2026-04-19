import { listCategories } from "@lib/data/categories"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const productCategories = await listCategories()

  return (
    <footer className="w-full" style={{ background: "#0d1816", color: "#fff", borderTop: "6px solid #f6a906" }}>
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-8 xsmall:flex-row items-start justify-between py-16">
          <div className="flex flex-col gap-y-4 max-w-sm">
            <LocalizedClientLink href="/" className="text-3xl font-extrabold uppercase tracking-wide" style={{ color: "#f6a906" }}>
              La Mascotera
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
                        <LocalizedClientLink className="text-sm hover:text-[#f6a906] transition" href={`/categories/${c.handle}`} style={{ color: "rgba(255,255,255,0.8)" }}>
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
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/devoluciones">Devoluciones</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/terminos">Términos y condiciones</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-[#f6a906]" href="/arrepentimiento">Botón de arrepentimiento</LocalizedClientLink></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full mb-6 justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px", color: "rgba(255,255,255,0.55)" }}>
          <Text className="text-xs">© {new Date().getFullYear()} La Mascotera — Todos los derechos reservados</Text>
          <div className="flex items-center gap-4 text-xs">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>TikTok</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
