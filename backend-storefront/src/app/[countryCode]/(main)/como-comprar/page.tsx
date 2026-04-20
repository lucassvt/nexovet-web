import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Cómo comprar — La Mascotera",
  description: "Guía paso a paso para comprar en nuestra tienda online.",
}

export default function ComoComprar() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#f6a906", color: "#0d1816" }}>
        <div className="content-container py-16">
          <h1 className="text-5xl font-black uppercase">Cómo comprar</h1>
          <p className="mt-3 text-lg">En 3 pasos tu pedido está en camino.</p>
        </div>
      </section>

      <section className="content-container py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {[
            { n: "1", title: "Elegí tus productos", desc: "Navegá nuestro catálogo por categorías (Perros / Gatos / Otros) o usá el buscador. Agregá al carrito con el botón '+'." },
            { n: "2", title: "Completá el pago", desc: "Click en el carrito → 'Pagar con Mercado Pago'. Te redirige al checkout seguro donde pagás con tarjeta, MODO, Pago Fácil, RapiPago o tarjeta débito." },
            { n: "3", title: "Recibí tu pedido", desc: "Elegí envío a domicilio o retiro en sucursal (gratis). Los envíos dentro de la provincia llegan en 24-48hs. Envíos nacionales via Andreani." },
          ].map((s) => (
            <div key={s.n} className="flex gap-6 items-start p-6 bg-white rounded-xl border border-gray-200">
              <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black" style={{ background: "#f6a906", color: "#0d1816" }}>
                {s.n}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: "#0d1816" }}>{s.title}</h2>
                <p className="text-gray-700">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff" }}>
        <div className="content-container py-16">
          <h2 className="text-3xl font-black uppercase mb-8" style={{ color: "#0d1816" }}>Medios de pago</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Mercado Pago", desc: "Tarjetas crédito/débito (todas), MODO, Pago Fácil, RapiPago. Hasta 12 cuotas." },
              { title: "Transferencia bancaria", desc: "Coordinás con nuestra sucursal. Ideal para montos grandes." },
              { title: "Efectivo en sucursal", desc: "Retirás el pedido y pagás allá. Sin costos extra." },
              { title: "Puntos del Club", desc: "Canjeás puntos acumulados por descuentos. Combinable con pago $." },
            ].map((m) => (
              <div key={m.title} className="p-5 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2" style={{ color: "#0d1816" }}>{m.title}</h3>
                <p className="text-sm text-gray-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-container py-16">
        <h2 className="text-3xl font-black uppercase mb-8" style={{ color: "#0d1816" }}>Envíos y retiros</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl">
            <h3 className="font-bold mb-3" style={{ color: "#f6a906" }}>🚚 Envío a domicilio</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>· Provincia: 24-48 horas hábiles</li>
              <li>· Resto del país: 3-5 días hábiles (Andreani)</li>
              <li>· Envío gratis en compras superiores a $30.000</li>
              <li>· Costo calculado al checkout según CP</li>
            </ul>
          </div>
          <div className="p-6 bg-white rounded-xl">
            <h3 className="font-bold mb-3" style={{ color: "#2e9e8a" }}>🏪 Retiro en sucursal</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>· Gratis, sin monto mínimo</li>
              <li>· +40 sucursales disponibles</li>
              <li>· Listo en 2-4 horas hábiles</li>
              <li>· Pago en efectivo o tarjeta al retirar (si no lo pagaste online)</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-12 text-center">
          <p className="text-lg mb-4">¿Más dudas?</p>
          <LocalizedClientLink href="/faq" className="inline-block px-8 py-3 rounded font-bold uppercase tracking-wide" style={{ background: "#f6a906", color: "#0d1816" }}>
            Ver preguntas frecuentes
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
