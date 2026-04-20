import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Agendar consulta televeterinaria — La Mascotera",
  description:
    "Agendá tu consulta online con un veterinario. Completá los datos y te contactamos por WhatsApp para coordinar día y horario.",
}

// Placeholder: la agenda con LiveKit llega en Fase 5. Por ahora, formulario que dispara WhatsApp
// con toda la información pre-llenada.

export default function AgendarTelevet() {
  return (
    <div style={{ background: "#fafafa" }}>
      <Breadcrumbs
        items={[
          { label: "Televeterinaria", href: "/televeterinaria" },
          { label: "Agendar consulta" },
        ]}
      />

      {/* HERO */}
      <section
        style={{
          background: "linear-gradient(135deg, #2e9e8a 0%, #3ec2a9 100%)",
          color: "#fff",
        }}
      >
        <div className="content-container py-12 md:py-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>
            Paso 1 de 2
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight">
            Agendá tu <br />
            <span style={{ color: "#0d1816" }}>consulta televeterinaria</span>
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-2xl" style={{ color: "rgba(255,255,255,0.9)" }}>
            Contanos de tu mascota y en qué podemos ayudarte. Te respondemos por WhatsApp en
            menos de 2 horas hábiles para coordinar día y horario.
          </p>
        </div>
      </section>

      {/* FORMULARIO */}
      <section className="content-container py-12 md:py-16 max-w-3xl">
        <form
          action="https://wa.me/5493812391001"
          method="GET"
          target="_blank"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 md:p-8 space-y-5"
        >
          {/* Identificacion */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#f6a906" }}>
              Sobre vos
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Nombre y apellido *
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Teléfono *
                </label>
                <input
                  name="telefono"
                  type="tel"
                  required
                  placeholder="Ej. 381 239 1001"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                />
              </div>
            </div>
          </div>

          {/* Mascota */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#f6a906" }}>
              Sobre tu mascota
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Nombre de la mascota *
                </label>
                <input
                  name="mascota_nombre"
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Especie *
                </label>
                <select
                  name="especie"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906] bg-white"
                >
                  <option value="">Seleccioná...</option>
                  <option value="perro">Perro 🐶</option>
                  <option value="gato">Gato 🐱</option>
                  <option value="ave">Ave 🦜</option>
                  <option value="roedor">Roedor 🐹</option>
                  <option value="reptil">Reptil 🦎</option>
                  <option value="pez">Pez 🐟</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Raza (opcional)
                </label>
                <input
                  name="raza"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Edad aproximada *
                </label>
                <input
                  name="edad"
                  type="text"
                  required
                  placeholder="Ej. 3 años"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                />
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#f6a906" }}>
              Motivo de la consulta
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Tipo de consulta *
                </label>
                <select
                  name="tipo"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906] bg-white"
                >
                  <option value="">Seleccioná...</option>
                  <option value="control">Control rutinario</option>
                  <option value="prevencion">Prevención / vacunas</option>
                  <option value="comportamiento">Comportamiento</option>
                  <option value="urgencia_leve">Síntoma leve (no emergencia)</option>
                  <option value="segunda_opinion">Segunda opinión</option>
                  <option value="cachorro">Cachorro / gatito nuevo</option>
                  <option value="alimentacion">Alimentación</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Contanos más (síntomas, duración, qué notaste) *
                </label>
                <textarea
                  name="descripcion"
                  rows={4}
                  required
                  placeholder="Ej. Hace 2 días no come y está con vómitos..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0d1816" }}>
                  Preferencia horaria *
                </label>
                <select
                  name="horario"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906] bg-white"
                >
                  <option value="">Seleccioná...</option>
                  <option value="manana">Mañana (9-12 hs)</option>
                  <option value="mediodia">Mediodía (12-14 hs)</option>
                  <option value="tarde">Tarde (14-18 hs)</option>
                  <option value="noche">Noche (18-21 hs)</option>
                  <option value="flexible">Flexible, me adapto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aviso emergencia */}
          <div className="p-4 rounded border-l-4" style={{ background: "#fff3cd", borderColor: "#f6a906" }}>
            <p className="font-bold text-sm mb-1" style={{ color: "#0d1816" }}>
              ⚠️ ¿Es una emergencia?
            </p>
            <p className="text-xs" style={{ color: "#0d1816" }}>
              Si tu mascota tiene convulsiones, sangrado, ingesta de tóxico o no respira bien,
              <strong> NO esperes esta consulta online</strong>. Andá a{" "}
              <LocalizedClientLink
                href="/sucursales"
                className="underline font-semibold"
                style={{ color: "#d32f2f" }}
              >
                tu sucursal La Mascotera más cercana
              </LocalizedClientLink>{" "}
              o a una clínica veterinaria de urgencias.
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded font-bold uppercase tracking-wide transition-all hover:scale-[1.02]"
              style={{ background: "#25D366", color: "#fff" }}
            >
              📱 Enviar por WhatsApp
            </button>
            <LocalizedClientLink
              href="/televeterinaria"
              className="flex-1 py-3 px-6 rounded font-bold uppercase tracking-wide text-center border-2"
              style={{ borderColor: "#0d1816", color: "#0d1816" }}
            >
              ← Volver
            </LocalizedClientLink>
          </div>

          <p className="text-xs text-center text-gray-500">
            Al enviar aceptás nuestros{" "}
            <LocalizedClientLink href="/terminos" className="underline hover:text-[#f6a906]">
              Términos y Condiciones
            </LocalizedClientLink>
            . El costo de la consulta se coordina vía WhatsApp antes del turno.
          </p>
        </form>
      </section>

      {/* FAQ COMPACTA */}
      <section className="content-container py-10 max-w-3xl">
        <h2 className="text-xl font-black uppercase mb-6" style={{ color: "#0d1816" }}>
          Dudas frecuentes
        </h2>
        <div className="space-y-3">
          <details className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#f6a906] transition-colors cursor-pointer">
            <summary className="font-semibold text-sm" style={{ color: "#0d1816" }}>
              ¿Cuánto cuesta?
            </summary>
            <p className="mt-3 text-sm text-gray-700">
              El valor depende del tipo de consulta. Te lo confirmamos por WhatsApp antes
              del turno. Miembros del Club La Mascotera tienen descuentos según su tier.
            </p>
          </details>
          <details className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#f6a906] transition-colors cursor-pointer">
            <summary className="font-semibold text-sm" style={{ color: "#0d1816" }}>
              ¿Cuánto dura la consulta?
            </summary>
            <p className="mt-3 text-sm text-gray-700">
              Consultas estándar duran 20 minutos. Para cachorros/gatitos nuevos podemos
              extender a 30 min si hace falta (sin costo extra).
            </p>
          </details>
          <details className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#f6a906] transition-colors cursor-pointer">
            <summary className="font-semibold text-sm" style={{ color: "#0d1816" }}>
              ¿Puedo recibir receta digital?
            </summary>
            <p className="mt-3 text-sm text-gray-700">
              Sí. Si el veterinario considera que hace falta medicación, te enviamos la
              receta digital firmada (PDF) por WhatsApp al finalizar la consulta.
            </p>
          </details>
        </div>
      </section>
    </div>
  )
}
