import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Preguntas frecuentes — La Mascotera",
  description: "Respuestas a las dudas más comunes sobre compras, envíos, club de fidelidad y más.",
}

const FAQ = [
  {
    cat: "Compras",
    items: [
      { q: "¿Necesito registrarme para comprar?", a: "No, podés comprar como invitado. Pero te recomendamos registrarte en el Club para sumar puntos y acceder a descuentos exclusivos." },
      { q: "¿Cómo sé que mi compra se procesó?", a: "Recibís un email de confirmación con el número de pedido y otro cuando tu pago se aprueba. Podés seguirlo en 'Mi cuenta' → 'Mis pedidos'." },
      { q: "¿Puedo cancelar o modificar un pedido?", a: "Sí, mientras no esté en estado 'Enviado'. Escribinos por WhatsApp con el número de pedido." },
    ],
  },
  {
    cat: "Envíos",
    items: [
      { q: "¿Cuánto tarda el envío?", a: "Dentro de tu provincia: 24-48hs hábiles. Resto del país (Andreani): 3-5 días hábiles." },
      { q: "¿Hay envío gratis?", a: "Sí, en compras superiores a $30.000 dentro de tu región. Miembros tier Oro y Platino del Club tienen envío gratis desde $15.000." },
      { q: "¿Puedo retirar en sucursal?", a: "Sí, gratis y sin monto mínimo. Al checkout elegís la sucursal y lo retirás en 2-4 horas hábiles." },
      { q: "¿Qué pasa si no estoy cuando llega?", a: "Andreani vuelve a intentar al día siguiente. Si no, el pedido queda en sucursal Andreani para que lo retires." },
    ],
  },
  {
    cat: "Club La Mascotera",
    items: [
      { q: "¿Es gratis sumarme al Club?", a: "Totalmente gratis. Además recibís 50 puntos de bienvenida al registrarte." },
      { q: "¿Cómo sumo puntos?", a: "Con cada compra. Por cada $90 gastados sumás 1 punto (ratio x1 tier Bronce). Si ascendés a Plata/Oro/Platino tus puntos multiplican por 1.2, 1.5 o 2." },
      { q: "¿Se puede canjear por plata?", a: "No, pero sí por productos del catálogo, descuentos en tu próxima compra, consultas veterinarias gratis y beneficios exclusivos." },
      { q: "¿Los puntos vencen?", a: "Sí, a los 365 días. Te avisamos 30, 15 y 1 días antes del vencimiento por email." },
    ],
  },
  {
    cat: "Devoluciones",
    items: [
      { q: "¿Puedo devolver un producto?", a: "Sí, tenés 10 días corridos desde que recibiste el pedido. El producto debe estar sin usar, en su empaque original." },
      { q: "¿El reembolso es en plata?", a: "Te devolvemos el 100% del monto por el mismo medio de pago que usaste. Mercado Pago tarda 5-10 días hábiles." },
      { q: "¿Quién paga el envío de devolución?", a: "Si el error fue nuestro (producto equivocado, defectuoso), nosotros. Si es arrepentimiento del cliente, el costo corre por tu cuenta." },
    ],
  },
  {
    cat: "Productos",
    items: [
      { q: "¿Venden productos veterinarios?", a: "Sí, pulguicidas, desparasitantes, vacunas, suplementos. Algunos requieren receta veterinaria." },
      { q: "¿Tienen variedades sin TACC / hipoalergénicos?", a: "Sí, líneas completas de Royal Canin Hypoallergenic, Proplan sensitive, Pro Plan Urinary, etc. Consultá al vet de la sucursal." },
      { q: "¿Puedo pedir un producto que no aparece?", a: "Sí, si algún proveedor nuestro lo distribuye. Escribinos por WhatsApp con el nombre y lo cotizamos." },
    ],
  },
]

export default function FAQPage() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-16">
          <h1 className="text-5xl font-black uppercase">Preguntas frecuentes</h1>
          <p className="mt-3 text-lg" style={{ color: "rgba(255,255,255,0.7)" }}>Todo lo que necesitás saber antes de comprar.</p>
        </div>
      </section>

      <section className="content-container py-16">
        {FAQ.map((cat) => (
          <div key={cat.cat} className="mb-12">
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-6 pb-2 border-b-4" style={{ color: "#0d1816", borderColor: "#f6a906" }}>
              {cat.cat}
            </h2>
            <div className="space-y-4">
              {cat.items.map((item) => (
                <details key={item.q} className="p-5 bg-white rounded-xl border border-gray-200 hover:border-[#f6a906] transition-colors cursor-pointer">
                  <summary className="font-bold flex justify-between items-center" style={{ color: "#0d1816" }}>
                    {item.q}
                    <span className="text-xl" style={{ color: "#f6a906" }}>+</span>
                  </summary>
                  <p className="mt-4 text-gray-700 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section style={{ background: "#f6a906" }}>
        <div className="content-container py-12 text-center">
          <h2 className="text-2xl font-black uppercase mb-4" style={{ color: "#0d1816" }}>¿No encontraste tu respuesta?</h2>
          <a href="https://wa.me/5493812391001" target="_blank" className="inline-block px-8 py-3 rounded font-bold uppercase tracking-wide" style={{ background: "#0d1816", color: "#f6a906" }}>
            📱 Escribinos por WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}
