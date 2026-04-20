import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Peluquería canina — La Mascotera",
  description: "Baño, corte y spa para tu mascota. Estilistas profesionales en sucursales seleccionadas.",
}

export default function Peluqueria() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f6a906" }}>
            ✂️ Servicio estrella
          </span>
          <h1 className="text-5xl md:text-6xl font-black uppercase leading-none">
            Peluquería<br /><span style={{ color: "#f6a906" }}>canina</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl" style={{ color: "rgba(255,255,255,0.8)" }}>
            Baño, corte, cepillado y spa. Tu mascota vuelve linda, relajada y con olor rico.
          </p>
        </div>
      </section>

      <section className="content-container py-16">
        <h2 className="text-3xl md:text-4xl font-black uppercase mb-10 text-center" style={{ color: "#0d1816" }}>
          Servicios <span style={{ color: "#f6a906" }}>disponibles</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Baño completo", desc: "Shampoo según pelaje, enjuague, acondicionador, secado.", price: "desde $8.000" },
            { title: "Corte + baño", desc: "Corte a tijera o máquina según raza + baño completo + perfumado.", price: "desde $15.000" },
            { title: "Spa premium", desc: "Baño + corte + arreglo de uñas + limpieza de oídos + perfume premium.", price: "desde $22.000" },
            { title: "Arreglo de uñas", desc: "Corte y limado.", price: "desde $2.500" },
            { title: "Limpieza de oídos", desc: "Producto veterinario.", price: "desde $2.000" },
            { title: "Cepillado desenredante", desc: "Para pelajes largos con nudos.", price: "desde $3.500" },
          ].map((s) => (
            <div key={s.title} className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold mb-2" style={{ color: "#0d1816" }}>{s.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{s.desc}</p>
              <p className="font-bold" style={{ color: "#f6a906" }}>{s.price}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">* Precios de referencia. Pueden variar según tamaño/raza. Consultá en tu sucursal.</p>
      </section>

      <section style={{ background: "#fff" }}>
        <div className="content-container py-16 text-center">
          <h2 className="text-3xl font-black uppercase mb-6" style={{ color: "#0d1816" }}>
            Reservá tu turno
          </h2>
          <p className="mb-8 text-gray-600">Disponible en sucursales seleccionadas. Consultá en tu sucursal más cercana.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <LocalizedClientLink href="/sucursales" className="inline-block px-8 py-4 rounded font-bold uppercase tracking-wide" style={{ background: "#f6a906", color: "#0d1816" }}>
              Ver sucursales con peluquería
            </LocalizedClientLink>
            <a href="https://wa.me/5493812391001?text=Quiero%20reservar%20turno%20de%20peluqueria" target="_blank" className="inline-block px-8 py-4 rounded font-bold uppercase tracking-wide" style={{ background: "#25d366", color: "#fff" }}>
              📱 Reservar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
