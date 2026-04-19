import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Club La Mascotera — Puntos, descuentos y beneficios",
  description: "Sumate al Club. Ganá puntos con cada compra y canjealos por productos, consultas veterinarias y más.",
}

export default function Club() {
  return (
    <div style={{ background: "#fafafa" }}>
      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, #f6a906 0%, #ffbd3a 100%)", color: "#0d1816" }}>
        <div className="content-container py-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3">
            Programa de fidelización gratuito
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none">
            Club<br />
            <span style={{ color: "#fff" }}>La Mascotera</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl mx-auto">
            Cada peso que gastás suma puntos. Los puntos se canjean por productos, descuentos y consultas veterinarias gratis.
          </p>
          <LocalizedClientLink
            href="/account"
            className="mt-8 inline-block px-10 py-4 rounded font-bold uppercase tracking-wide transition-transform hover:scale-105"
            style={{ background: "#0d1816", color: "#f6a906" }}
          >
            Registrate gratis
          </LocalizedClientLink>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="content-container py-16">
        <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-12" style={{ color: "#0d1816" }}>
          Cómo <span style={{ color: "#f6a906" }}>funciona</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: "1", title: "Registrate", desc: "Con tu DNI y email, gratis y en 1 minuto. Sumás 50 puntos de bienvenida." },
            { n: "2", title: "Comprá", desc: "Por cada $90 de compra (online o en sucursal) sumás 1 punto. Tu DNI es tu llave." },
            { n: "3", title: "Canjeá", desc: "Descuentos, productos, consultas veterinarias gratis. Los puntos duran 365 días." },
          ].map((step) => (
            <div key={step.n} className="text-center p-8 bg-white rounded-xl border-2 border-gray-100">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-black mb-4"
                style={{ background: "#f6a906", color: "#0d1816" }}
              >
                {step.n}
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#0d1816" }}>{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section style={{ background: "#fff" }}>
        <div className="content-container py-16">
          <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-4" style={{ color: "#0d1816" }}>
            Niveles <span style={{ color: "#2e9e8a" }}>de fidelidad</span>
          </h2>
          <p className="text-center text-gray-600 mb-12">A más compras, más beneficios.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Bronce", from: "$0", pts: "x1", color: "#cd7f32", perks: "Acceso al Club" },
              { name: "Plata", from: "$50k anuales", pts: "x1.2", color: "#9ea0a5", perks: "Puntos extras" },
              { name: "Oro", from: "$200k anuales", pts: "x1.5", color: "#f6a906", perks: "Envío gratis +$15k" },
              { name: "Platino", from: "$500k anuales", pts: "x2", color: "#2e9e8a", perks: "2 televet gratis/mes" },
            ].map((t) => (
              <div key={t.name} className="rounded-xl overflow-hidden border-2 border-gray-100">
                <div className="p-4 text-center" style={{ background: t.color, color: "#0d1816" }}>
                  <h3 className="text-2xl font-black uppercase">{t.name}</h3>
                  <p className="text-xs font-semibold mt-1">{t.from}</p>
                </div>
                <div className="p-4 text-center">
                  <div className="text-3xl font-black mb-1" style={{ color: "#0d1816" }}>{t.pts}</div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">puntos</p>
                  <p className="text-sm text-gray-700">{t.perks}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS EXTRA */}
      <section className="content-container py-16">
        <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-12" style={{ color: "#0d1816" }}>
          Beneficios <span style={{ color: "#f6a906" }}>extra</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "🎂", title: "Cumple de tu mascota", desc: "Cupón de descuento del 20% en alimento para el cumpleaños de tu mascota." },
            { icon: "🎁", title: "Bienvenida", desc: "50 puntos gratis al registrarte con mascota cargada." },
            { icon: "👥", title: "Referidos", desc: "Invitá amigos y ganá 200 puntos cuando hacen su primera compra." },
            { icon: "📅", title: "Recordatorios", desc: "Te avisamos cuándo toca vacunar o desparasitar a tu mascota." },
          ].map((b) => (
            <div key={b.title} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-[#f6a906] transition-colors">
              <div className="text-4xl mb-4">{b.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0d1816" }}>{b.title}</h3>
              <p className="text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight mb-6">
            Sumate hoy.<br />
            <span style={{ color: "#f6a906" }}>Es gratis y en 1 minuto.</span>
          </h2>
          <LocalizedClientLink
            href="/account"
            className="inline-block px-10 py-4 rounded font-bold uppercase tracking-wide transition-transform hover:scale-105"
            style={{ background: "#f6a906", color: "#0d1816" }}
          >
            Crear mi cuenta
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
