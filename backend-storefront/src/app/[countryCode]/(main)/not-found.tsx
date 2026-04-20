import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Página no encontrada (404)",
  description: "La página que buscás no existe o fue movida.",
}

export default function NotFound() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section
        className="relative overflow-hidden"
        style={{
          background: "#0d1816",
          color: "#fff",
          minHeight: "calc(100vh - 180px)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ zIndex: 0 }}
        >
          <img
            src="/images/brand/patita.png"
            alt=""
            className="absolute rotate-12"
            style={{ top: "15%", left: "10%", width: "90px" }}
          />
          <img
            src="/images/brand/patita-blanca.png"
            alt=""
            className="absolute -rotate-12"
            style={{ top: "30%", right: "15%", width: "120px" }}
          />
          <img
            src="/images/brand/huesito.png"
            alt=""
            className="absolute rotate-45"
            style={{ top: "55%", left: "22%", width: "60px" }}
          />
          <img
            src="/images/brand/patita-rellena.png"
            alt=""
            className="absolute rotate-6"
            style={{ top: "70%", right: "8%", width: "100px" }}
          />
        </div>
        <div className="content-container py-16 md:py-24 relative z-10 text-center">
          <span className="text-[140px] md:text-[200px] font-black leading-none block" style={{ color: "#f6a906" }}>
            404
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-4">
            Nos <span style={{ color: "#f6a906" }}>perdimos</span> 🐾
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            La página que buscás no existe o fue movida. Probá buscar lo que necesitás
            o volvé al inicio.
          </p>

          {/* Buscador */}
          <form action="/ar/store" method="GET" className="mt-8 max-w-lg mx-auto flex items-center gap-2">
            <input
              type="search"
              name="q"
              autoFocus
              placeholder="¿Qué estás buscando?"
              className="flex-1 px-4 py-3 rounded-md text-sm text-[#0d1816] focus:outline-none focus:ring-2 focus:ring-[#f6a906]"
              style={{ background: "#fff" }}
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-md font-bold uppercase tracking-wide text-sm"
              style={{ background: "#f6a906", color: "#0d1816" }}
            >
              Buscar
            </button>
          </form>

          {/* Links rápidos */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto text-sm">
            {[
              { href: "/", label: "🏠 Inicio" },
              { href: "/store", label: "🛒 Tienda" },
              { href: "/club", label: "🏆 Club" },
              { href: "/sucursales", label: "📍 Sucursales" },
              { href: "/televeterinaria", label: "🩺 Televeterinaria" },
              { href: "/peluqueria", label: "✂️ Peluquería" },
              { href: "/faq", label: "❓ Ayuda" },
              { href: "/account", label: "👤 Mi cuenta" },
            ].map((l) => (
              <LocalizedClientLink
                key={l.href}
                href={l.href}
                className="px-4 py-3 rounded-md font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
              >
                {l.label}
              </LocalizedClientLink>
            ))}
          </div>

          <p className="mt-10 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            ¿Seguís sin encontrarlo? Escribinos por{" "}
            <a href="https://wa.me/5493812391001" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#f6a906]">
              WhatsApp
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
