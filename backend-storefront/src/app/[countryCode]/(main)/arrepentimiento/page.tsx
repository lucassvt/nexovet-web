import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Botón de arrepentimiento — La Mascotera",
  description: "Ejercé tu derecho de arrepentimiento según la Ley 24.240 y el Decreto 276/98.",
}

export default function Arrepentimiento() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#d32f2f", color: "#fff" }}>
        <div className="content-container py-12">
          <h1 className="text-4xl font-black uppercase">Botón de arrepentimiento</h1>
          <p className="mt-3" style={{ color: "rgba(255,255,255,0.9)" }}>Ejercé tu derecho según Ley 24.240 y Decreto 276/98.</p>
        </div>
      </section>

      <section className="content-container py-12 max-w-3xl">
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
            <p className="font-bold mb-1" style={{ color: "#0d1816" }}>Tu derecho</p>
            <p>Tenés <strong>10 días corridos</strong> desde que recibiste el producto (o desde la contratación del servicio) para arrepentirte, sin necesidad de justificar. Te devolvemos el 100% del monto pagado.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>Cómo ejercerlo</h2>
            <p className="mb-4">Completá el formulario de abajo, o contactanos por alguna de estas vías indicando:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tu nombre completo</li>
              <li>Email de registro</li>
              <li>Número de pedido</li>
              <li>Productos que querés devolver</li>
            </ul>
          </div>

          <form className="bg-white p-8 rounded-xl border-2 border-gray-200" action="mailto:devoluciones@lamascotera.com.ar" method="post" encType="text/plain">
            <h3 className="text-xl font-bold mb-6" style={{ color: "#0d1816" }}>Formulario de arrepentimiento</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre y apellido</label>
                <input name="nombre" type="text" required className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">DNI</label>
                <input name="dni" type="text" required className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input name="email" type="email" required className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Teléfono</label>
                <input name="telefono" type="tel" className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Número de pedido</label>
                <input name="pedido" type="text" required className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Ej. NXV-12345" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Productos que querés devolver</label>
                <textarea name="productos" rows={4} required className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Motivo (opcional)</label>
                <textarea name="motivo" rows={2} className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded font-bold uppercase tracking-wide" style={{ background: "#f6a906", color: "#0d1816" }}>
              Enviar solicitud
            </button>
          </form>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>Condiciones</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>El producto debe estar <strong>sin uso</strong> y en su empaque original.</li>
              <li>Alimentos y productos perecederos abiertos no son elegibles para arrepentimiento (por seguridad sanitaria), salvo defecto comprobable.</li>
              <li>Te pedimos el ticket/factura como comprobante.</li>
              <li>El reembolso se hace por la misma vía de pago original (Mercado Pago tarda 5-10 días hábiles).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>Contacto directo</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="mailto:devoluciones@lamascotera.com.ar" className="flex-1 text-center px-6 py-3 rounded font-semibold" style={{ background: "#f6a906", color: "#0d1816" }}>
                ✉️ devoluciones@lamascotera.com.ar
              </a>
              <a href="https://wa.me/5493812391001?text=Quiero%20ejercer%20el%20boton%20de%20arrepentimiento" target="_blank" className="flex-1 text-center px-6 py-3 rounded font-semibold" style={{ background: "#25d366", color: "#fff" }}>
                📱 WhatsApp +54 381 239 1001
              </a>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
            <p><strong>Marco legal:</strong> Artículo 34 de la Ley 24.240 de Defensa del Consumidor. Decreto 276/98.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
