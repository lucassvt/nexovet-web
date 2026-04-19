import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sumá tu franquicia — La Mascotera",
  description: "Invertí en el negocio que más crece del rubro pet en Argentina.",
}

export default function Franquicias() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#2e9e8a", color: "#fff" }}>
        <div className="content-container py-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#0d1816" }}>
            Oportunidad de negocio
          </span>
          <h1 className="text-5xl md:text-6xl font-black uppercase leading-none">
            Sumá tu<br />
            <span style={{ color: "#f6a906" }}>franquicia</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl">
            Ya somos +40 sucursales. Si creés que tu ciudad merece la mejor pet shop, conversemos.
          </p>
        </div>
      </section>

      <section className="content-container py-16">
        <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-12" style={{ color: "#0d1816" }}>
          ¿Por qué <span style={{ color: "#f6a906" }}>La Mascotera</span>?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "1", title: "Marca consolidada", desc: "+15 años en el mercado. Nombre reconocido en NOA y Cuyo." },
            { n: "2", title: "Proveedores directos", desc: "Acceso a importadores y distribuidores con los mejores precios del mercado." },
            { n: "3", title: "Sistema completo", desc: "POS, ecommerce, CRM, programa de fidelización. Todo listo para vender." },
            { n: "4", title: "Capacitación", desc: "Entrenamos a tu equipo en producto, atención y gestión." },
            { n: "5", title: "Marketing centralizado", desc: "Campañas nacionales + mantenemos las redes sociales de tu sucursal." },
            { n: "6", title: "Soporte operativo", desc: "Equipo de expansión acompañándote en cada etapa." },
          ].map((b) => (
            <div key={b.n} className="p-6 bg-white rounded-xl border border-gray-200">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mb-4" style={{ background: "#f6a906", color: "#0d1816" }}>
                {b.n}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0d1816" }}>{b.title}</h3>
              <p className="text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight mb-6">
            Conversemos.<br />
            <span style={{ color: "#f6a906" }}>Primera reunión sin compromiso.</span>
          </h2>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
            Contanos de vos, de tu ciudad, y evaluemos juntos si La Mascotera es para vos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/5493812391001?text=Quiero%20sumar%20una%20franquicia%20La%20Mascotera" target="_blank" className="inline-block px-10 py-4 rounded font-bold uppercase tracking-wide transition-transform hover:scale-105" style={{ background: "#25d366", color: "#fff" }}>
              📱 Escribinos por WhatsApp
            </a>
            <a href="mailto:franquicias@lamascotera.com.ar" className="inline-block px-10 py-4 rounded font-bold uppercase tracking-wide border-2" style={{ borderColor: "#f6a906", color: "#f6a906" }}>
              ✉️ Mail a franquicias
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
