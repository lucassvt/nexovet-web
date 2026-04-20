import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Política de Devoluciones — La Mascotera",
  description: "Conocé nuestra política de devoluciones y cambios.",
}

export default function Devoluciones() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-12">
          <h1 className="text-4xl font-black uppercase">Política de devoluciones</h1>
        </div>
      </section>

      <section className="content-container py-16 max-w-3xl space-y-8 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>Plazos y condiciones</h2>
          <ul className="space-y-2 list-disc pl-6">
            <li><strong>10 días corridos</strong> desde que recibiste el pedido (Ley 24.240).</li>
            <li>Producto <strong>sin uso</strong>, en su empaque original, con etiquetas.</li>
            <li>Se requiere ticket o factura de compra.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>Qué productos no se pueden devolver</h2>
          <ul className="space-y-2 list-disc pl-6">
            <li>Alimentos ya abiertos (por sanidad alimentaria).</li>
            <li>Medicamentos veterinarios con receta, si el blister fue abierto.</li>
            <li>Productos personalizados o hechos a medida.</li>
            <li>Servicios ya prestados (televeterinaria, peluquería).</li>
          </ul>
          <p className="mt-3 text-sm italic">Si el producto viene defectuoso o equivocado por nuestro error, SE PUEDE devolver siempre (no aplican las restricciones de arriba).</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>Cómo devolver</h2>
          <ol className="space-y-2 list-decimal pl-6">
            <li>Escribinos por WhatsApp o email con el número de pedido y los productos a devolver.</li>
            <li>Nos ponemos de acuerdo sobre el método de devolución (retiro en sucursal, o envío).</li>
            <li>Recibimos el producto y revisamos las condiciones.</li>
            <li>Procesamos el reembolso (5-10 días hábiles por Mercado Pago).</li>
          </ol>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>Quién paga el envío</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded">
              <p className="font-bold text-green-800 mb-2">Nosotros</p>
              <p className="text-sm">Si el error fue nuestro: producto equivocado, defectuoso, dañado en el envío.</p>
            </div>
            <div className="p-4 bg-gray-100 rounded">
              <p className="font-bold text-gray-800 mb-2">Vos</p>
              <p className="text-sm">Si es arrepentimiento (Ley 24.240 art. 34). Cambio de opinión, talla incorrecta, color distinto al esperado.</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl" style={{ background: "#f6a906", color: "#0d1816" }}>
          <h3 className="font-bold mb-2">💡 Tip: Antes de comprar, consultanos</h3>
          <p className="text-sm">Si tenés dudas sobre qué alimento le conviene a tu mascota, escribinos. Preferimos ayudarte a elegir bien que tener que hacer una devolución después.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <LocalizedClientLink href="/arrepentimiento" className="inline-block px-6 py-3 rounded font-bold" style={{ background: "#0d1816", color: "#f6a906" }}>
            Botón de arrepentimiento
          </LocalizedClientLink>
          <a href="https://wa.me/5493812391001" target="_blank" className="inline-block px-6 py-3 rounded font-bold" style={{ background: "#25d366", color: "#fff" }}>
            📱 Consultar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}
