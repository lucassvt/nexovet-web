import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trabajá con nosotros — La Mascotera",
  description: "Sumate al equipo de la cadena de pet shops más grande del NOA.",
}

export default function Trabajo() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#2e9e8a", color: "#fff" }}>
        <div className="content-container py-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#0d1816" }}>
            Oportunidades laborales
          </span>
          <h1 className="text-5xl md:text-6xl font-black uppercase leading-none">
            Trabajá con<br /><span style={{ color: "#f6a906" }}>La Mascotera</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl">
            +40 sucursales, +100 empleados. Buscamos gente apasionada por las mascotas.
          </p>
        </div>
      </section>

      <section className="content-container py-16">
        <h2 className="text-3xl md:text-4xl font-black uppercase mb-10" style={{ color: "#0d1816" }}>
          Por qué sumarte a <span style={{ color: "#f6a906" }}>nuestro equipo</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "📈", title: "Carrera real", desc: "Plan de carrera con ascensos internos. El 80% de nuestros encargados empezó como vendedor." },
            { icon: "🎓", title: "Capacitación", desc: "Entrenamiento continuo en producto, atención y gestión. Cursos con veterinarios y nutricionistas." },
            { icon: "🐕", title: "Ambiente cálido", desc: "Trabajás rodeado de mascotas. Nuestros empleados suelen traer a sus perros y gatos." },
            { icon: "💰", title: "Comisiones y bonos", desc: "Remuneración fija + variable por productividad, venta de complementarios y club." },
            { icon: "🏥", title: "Beneficios médicos", desc: "Obra social, licencia ampliada y cobertura veterinaria para tu propia mascota." },
            { icon: "🌱", title: "Franquicia propia", desc: "Los mejores encargados tienen la posibilidad de abrir su propia sucursal con apoyo de la central." },
          ].map((b) => (
            <div key={b.title} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-[#f6a906] transition-colors">
              <div className="text-4xl mb-4">{b.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0d1816" }}>{b.title}</h3>
              <p className="text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff" }}>
        <div className="content-container py-16">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-10" style={{ color: "#0d1816" }}>
            Postulate <span style={{ color: "#f6a906" }}>ahora</span>
          </h2>
          <div className="max-w-lg p-8 bg-gray-50 rounded-xl border border-gray-200">
            <p className="mb-6 text-gray-700">
              Mandá tu CV y una breve descripción de tu experiencia. Si tu perfil matchea con alguna búsqueda abierta, te contactamos.
            </p>
            <div className="flex flex-col gap-3">
              <a href="mailto:rrhh@lamascotera.com.ar?subject=Postulación%20La%20Mascotera" className="inline-block px-6 py-3 rounded font-bold uppercase tracking-wide text-center" style={{ background: "#f6a906", color: "#0d1816" }}>
                ✉️ Enviar CV a rrhh@lamascotera.com.ar
              </a>
              <a href="https://wa.me/5493812391001?text=Hola,%20quiero%20postularme%20a%20La%20Mascotera" target="_blank" className="inline-block px-6 py-3 rounded font-bold uppercase tracking-wide text-center" style={{ background: "#25d366", color: "#fff" }}>
                📱 WhatsApp directo a RRHH
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
