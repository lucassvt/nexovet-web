import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Televeterinaria — La Mascotera",
  description: "Consulta online con veterinario desde tu casa. Sin salir, sin esperar.",
}

export default function Televeterinaria() {
  return (
    <div style={{ background: "#fafafa" }}>
      <Breadcrumbs items={[{ label: "Servicios" }, { label: "Televeterinaria" }]} />
      <section style={{ background: "linear-gradient(135deg, #2e9e8a 0%, #3ec2a9 100%)", color: "#fff" }}>
        <div className="content-container py-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#0d1816" }}>
            🎥 Nuevo servicio
          </span>
          <h1 className="text-5xl md:text-6xl font-black uppercase leading-none">
            Televeterinaria<br /><span style={{ color: "#f6a906" }}>desde tu casa</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl">
            Consulta online con nuestros veterinarios especialistas. Resolvé dudas, chequeos preventivos y controles sin salir de casa.
          </p>
        </div>
      </section>

      <section className="content-container py-16">
        <h2 className="text-3xl md:text-4xl font-black uppercase mb-10 text-center" style={{ color: "#0d1816" }}>
          Cómo <span style={{ color: "#2e9e8a" }}>funciona</span>
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { n: "1", title: "Agendá", desc: "Elegí veterinario y horario que te venga bien." },
            { n: "2", title: "Pagá", desc: "Con tarjeta, Mercado Pago o canjeando puntos del Club." },
            { n: "3", title: "Conectate", desc: "A la hora agendada recibís un link de videollamada." },
            { n: "4", title: "Receta", desc: "Si tu vet te indica, descargás la receta digital al momento." },
          ].map((s) => (
            <div key={s.n} className="text-center p-6 bg-white rounded-xl border-2 border-gray-100">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-black mb-4" style={{ background: "#2e9e8a", color: "#fff" }}>
                {s.n}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0d1816" }}>{s.title}</h3>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff" }}>
        <div className="content-container py-16">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-10 text-center" style={{ color: "#0d1816" }}>
            ¿En qué <span style={{ color: "#f6a906" }}>te ayudamos</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "💊", title: "Consultas de rutina", desc: "Plan de vacunación, desparasitación, calendario sanitario." },
              { icon: "🩺", title: "Chequeos preventivos", desc: "Control de peso, nutrición, signos tempranos a observar." },
              { icon: "🐾", title: "Comportamiento", desc: "Problemas de conducta, ansiedad, educación." },
              { icon: "🩹", title: "Orientación primaria", desc: "Si tu mascota está rara, te ayudamos a decidir si podés esperar o hay que ir urgente." },
              { icon: "💉", title: "Segunda opinión", desc: "¿Tenés dudas sobre un tratamiento? Pedile opinión a otro profesional." },
              { icon: "👶", title: "Cachorros y gatitos", desc: "Todo lo que necesitás saber en las primeras semanas." },
            ].map((b) => (
              <div key={b.title} className="p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: "#0d1816" }}>{b.title}</h3>
                <p className="text-sm text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border-l-4 border-[#f6a906] p-6 rounded-r">
            <p className="font-bold mb-1" style={{ color: "#0d1816" }}>⚠️ No es para urgencias</p>
            <p className="text-sm text-gray-700">Si tu mascota tiene una emergencia (accidente, envenenamiento, dificultad respiratoria), llamá al vet presencial más cercano o a nuestra <LocalizedClientLink href="/sucursales" className="underline font-semibold">sucursal más cercana</LocalizedClientLink>.</p>
          </div>
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg, #f6a906 0%, #ffbd3a 100%)" }}>
        <div className="content-container py-16 text-center">
          <h2 className="text-4xl font-black uppercase mb-6" style={{ color: "#0d1816" }}>
            Agendá tu primera consulta
          </h2>
          <p className="text-lg mb-8" style={{ color: "rgba(13,24,22,0.8)" }}>
            Miembros <strong>Platino</strong> del Club tienen 2 consultas gratis por mes.
          </p>
          <LocalizedClientLink href="/televeterinaria/agendar" className="inline-block px-10 py-4 rounded font-bold uppercase tracking-wide transition-transform hover:scale-105" style={{ background: "#0d1816", color: "#f6a906" }}>
            Agendar consulta
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
