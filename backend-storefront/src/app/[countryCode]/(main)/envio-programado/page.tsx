import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Envío Programado — La Mascotera",
  description:
    "Recibí el alimento de tu mascota en casa cada mes o cada 2 semanas con 10% OFF permanente y x1.5 puntos del Club La Mascotera.",
}

// Placeholder mientras se desarrolla la suscripción real (Fase 9 del plan ecommerce).
// Por ahora: captura de interés via WhatsApp pre-llenado + landing explicativo.

export default function EnvioProgramado() {
  return (
    <div style={{ background: "#fafafa" }}>
      <Breadcrumbs items={[{ label: "Servicios" }, { label: "Envío Programado" }]} />

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2e9e8a 0%, #3ec2a9 100%)",
          color: "#fff",
        }}
      >
        <div
          aria-hidden="true"
          className="hidden lg:block absolute inset-y-0 right-0 w-[40%] opacity-30 pointer-events-none"
        >
          <img
            src="/images/brand/huesito-curva.png"
            alt=""
            className="absolute"
            style={{ top: "20%", right: "15%", width: "200px" }}
          />
          <img
            src="/images/brand/patita-rellena.png"
            alt=""
            className="absolute rotate-12"
            style={{ top: "50%", right: "5%", width: "150px" }}
          />
        </div>
        <div className="content-container py-16 md:py-20 relative z-10">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: "rgba(13,24,22,0.15)", color: "#0d1816" }}
          >
            🎁 Próximamente
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none">
            Envío <br />
            <span style={{ color: "#0d1816" }}>Programado</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-2xl">
            El alimento de tu mascota llega solo. Vos te olvidás y nosotros nos
            encargamos de que no se quede sin comida.
          </p>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="content-container py-14">
        <h2
          className="text-3xl md:text-4xl font-black uppercase text-center mb-12"
          style={{ color: "#0d1816" }}
        >
          Qué te <span style={{ color: "#f6a906" }}>incluye</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: "💰",
              title: "10% OFF permanente",
              desc: "Descuento automático sobre el precio de lista en cada entrega, mientras dure tu suscripción.",
            },
            {
              icon: "⭐",
              title: "x1.5 puntos del Club",
              desc: "Multiplicador de puntos del Club La Mascotera aplicado a cada compra suscripta.",
            },
            {
              icon: "🚚",
              title: "Envío sin cargo",
              desc: "Entrega gratis a tu domicilio o retiro sin cargo en cualquiera de nuestras +40 sucursales del NOA.",
            },
            {
              icon: "🗓️",
              title: "Frecuencia a medida",
              desc: "Cada 15, 30, 45 o 60 días. Podés pausar, saltar un envío o cambiar la frecuencia cuando quieras.",
            },
            {
              icon: "🤝",
              title: "Sin permanencia",
              desc: "No hay contrato ni penalización por cancelar. Probá un mes y si no te convence, lo das de baja.",
            },
            {
              icon: "🩺",
              title: "Recordatorios sanitarios",
              desc: "Te avisamos cuándo toca la próxima vacuna o desparasitación, alineado con tu plan de alimento.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="p-6 bg-white rounded-xl border border-gray-200 hover:border-[#f6a906] hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-4">{b.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0d1816" }}>
                {b.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "#fff" }}>
        <div className="content-container py-14 max-w-4xl">
          <h2
            className="text-3xl md:text-4xl font-black uppercase text-center mb-12"
            style={{ color: "#0d1816" }}
          >
            Cómo <span style={{ color: "#2e9e8a" }}>funciona</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "1", t: "Elegí el alimento", d: "El que tu mascota ya come, en la presentación habitual." },
              { n: "2", t: "Fijá la frecuencia", d: "Según cuánto le dura el paquete. Te ayudamos a calcular." },
              { n: "3", t: "Confirmá y pagá", d: "Con Mercado Pago en cuotas o transferencia. El primer envío sale ya." },
              { n: "4", t: "Relajate", d: "Te avisamos 3 días antes de cada envío por si querés ajustar algo." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div
                  className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-black mb-4"
                  style={{ background: "#2e9e8a", color: "#fff" }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold mb-2 text-sm uppercase tracking-wider" style={{ color: "#0d1816" }}>
                  {s.t}
                </h3>
                <p className="text-xs text-gray-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA CAPTURA */}
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-14 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-6">
            ¿Te interesa?<br />
            <span style={{ color: "#f6a906" }}>Te avisamos cuando esté listo.</span>
          </h2>
          <p className="mb-8 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.8)" }}>
            Estamos lanzando Envío Programado primero con un grupo piloto de clientes en Salta,
            Tucumán y Catamarca. Anotate por WhatsApp y te contactamos apenas esté disponible.
          </p>
          <a
            href="https://wa.me/5493812391001?text=Hola!%20Quiero%20info%20del%20Env%C3%ADo%20Programado%20para%20alimento%20de%20mi%20mascota"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-4 rounded font-bold uppercase tracking-wide transition-transform hover:scale-105"
            style={{ background: "#25D366", color: "#fff" }}
          >
            📱 Anotarme por WhatsApp
          </a>
          <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            Mientras tanto podés comprar tu alimento habitual en{" "}
            <LocalizedClientLink href="/store" className="underline hover:text-[#f6a906]">
              nuestra tienda online
            </LocalizedClientLink>{" "}
            o agendar{" "}
            <LocalizedClientLink href="/televeterinaria/agendar" className="underline hover:text-[#f6a906]">
              una consulta televeterinaria
            </LocalizedClientLink>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
