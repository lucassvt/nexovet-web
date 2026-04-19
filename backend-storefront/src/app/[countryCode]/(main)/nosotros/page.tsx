import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Quiénes somos — La Mascotera",
  description: "La cadena de pet shops más grande del NOA, con más de 40 sucursales y una filosofía: el cuidado real de cada mascota.",
}

export default function Nosotros() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f6a906" }}>
            Nuestra historia
          </span>
          <h1 className="text-5xl md:text-6xl font-black uppercase leading-none">
            Somos<br />
            <span style={{ color: "#f6a906" }}>La Mascotera</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl" style={{ color: "rgba(255,255,255,0.8)" }}>
            La cadena de pet shops más grande del NOA. +40 sucursales. +15 años cuidando a las mascotas de miles de familias argentinas.
          </p>
        </div>
      </section>

      <section className="content-container py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { stat: "+40", label: "Sucursales" },
            { stat: "+15", label: "Años de trayectoria" },
            { stat: "+10.000", label: "Clientes activos" },
          ].map((s) => (
            <div key={s.label} className="text-center p-8 bg-white rounded-xl border-2 border-gray-100">
              <div className="text-5xl font-black" style={{ color: "#f6a906" }}>{s.stat}</div>
              <div className="mt-2 text-sm uppercase tracking-wider font-semibold" style={{ color: "#0d1816" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff" }}>
        <div className="content-container py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-6" style={{ color: "#0d1816" }}>
              Misión
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Hacer que cada mascota del NOA tenga acceso al mejor alimento, los mejores accesorios y la mejor atención veterinaria. Sin vueltas. Sin precios abusivos. Con la confianza de quienes saben lo que hacen.
            </p>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-6" style={{ color: "#2e9e8a" }}>
              Valores
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-3"><span className="text-2xl">🐾</span><span><strong>Cuidado real</strong> — Cada recomendación es pensada para el bienestar del animal, no para vender más.</span></li>
              <li className="flex gap-3"><span className="text-2xl">🤝</span><span><strong>Cercanía</strong> — +40 sucursales porque creemos que el comercio de barrio es irremplazable.</span></li>
              <li className="flex gap-3"><span className="text-2xl">📚</span><span><strong>Conocimiento</strong> — Equipo con veterinarios y expertos en nutrición en todas las sucursales.</span></li>
              <li className="flex gap-3"><span className="text-2xl">💚</span><span><strong>Compromiso</strong> — Apoyamos refugios y campañas de adopción en toda la región.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-6">
            ¿Querés ser parte?
          </h2>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Si querés sumarte a nuestro equipo o abrir una franquicia, te estamos esperando.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <LocalizedClientLink href="/trabajo" className="inline-block px-8 py-4 rounded font-bold uppercase tracking-wide" style={{ background: "#f6a906", color: "#0d1816" }}>
              Trabajá con nosotros
            </LocalizedClientLink>
            <LocalizedClientLink href="/franquicias" className="inline-block px-8 py-4 rounded font-bold uppercase tracking-wide border-2" style={{ borderColor: "#f6a906", color: "#f6a906" }}>
              Quiero una franquicia
            </LocalizedClientLink>
          </div>
        </div>
      </section>
    </div>
  )
}
