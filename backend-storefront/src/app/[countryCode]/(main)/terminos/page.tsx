import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones — La Mascotera",
  description: "Términos y condiciones de uso de la tienda online.",
}

export default function Terminos() {
  return (
    <div style={{ background: "#fafafa" }}>
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-12">
          <h1 className="text-4xl font-black uppercase">Términos y Condiciones</h1>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>Última actualización: Abril 2026</p>
        </div>
      </section>

      <section className="content-container py-16 prose prose-lg max-w-4xl">
        <div className="space-y-8 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>1. Aceptación</h2>
            <p>El uso del sitio lamascotera.com.ar y sus subdominios implica la aceptación plena de estos Términos y Condiciones. Si no estás de acuerdo, te pedimos no utilizar el servicio.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>2. Datos personales</h2>
            <p>La Mascotera S.A.S. (CUIT 30-71785446-9, domicilio Av. Alem 532, San Miguel de Tucumán) es responsable del tratamiento de tus datos. Nos ajustamos a la Ley 25.326 de Protección de Datos Personales.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>3. Ley de Defensa del Consumidor</h2>
            <p>Todas las compras están protegidas por la Ley 24.240. Tenés derecho a 10 días corridos de arrepentimiento desde que recibís el producto. Para ejercerlo, ver nuestra página de <a href="/arrepentimiento" className="underline font-semibold" style={{ color: "#f6a906" }}>Botón de Arrepentimiento</a>.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>4. Precios y pagos</h2>
            <p>Los precios están expresados en pesos argentinos e incluyen IVA cuando corresponde. Procesamos pagos a través de Mercado Pago (tercero proveedor), que cumple con PCI-DSS. No almacenamos datos de tarjetas.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>5. Envíos</h2>
            <p>Los tiempos estimados son indicativos. No respondemos por demoras de terceros (Andreani, OCA, servicios de cadetería). Ante cualquier inconveniente, contactanos.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>6. Club de fidelización</h2>
            <p>El Club La Mascotera es un programa gratuito. Los puntos no tienen valor monetario, son canjeables únicamente por productos o servicios del programa. Vigencia de puntos: 365 días desde su acreditación. Podemos modificar las reglas con aviso previo de 30 días.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>7. Televeterinaria (veterinaria online)</h2>
            <p className="mb-3">La consulta veterinaria online tiene una duración máxima de 20 minutos y se realiza mediante videollamada. El servicio comprende evaluación inicial, orientación, asesoramiento general, recomendaciones preventivas y educativas, y diagnósticos presuntivos en base a lo reportado por el Usuario.</p>
            <p className="mb-3"><strong>Este servicio NO reemplaza una consulta presencial veterinaria</strong> ni está diseñado para situaciones de emergencia o urgencia. Quedan expresamente excluidos: casos de emergencia o críticos, animales grandes, especies exóticas (aves, reptiles, roedores, peces), emisión de certificados médicos, procedimientos invasivos y diagnósticos definitivos sin evaluación clínica presencial.</p>
            <p className="mb-3">Los resultados de la consulta y las recomendaciones médicas se almacenan en la ficha clínica digital del paciente dentro del Club La Mascotera, accesibles para consultas futuras.</p>
            <p className="mb-3"><strong>Crédito por consulta presencial:</strong> El valor abonado por una consulta online puede ser acreditado a una consulta presencial en sucursal, siempre que se realice dentro de los 7 días corridos y se refiera a la misma condición clínica.</p>
            <p className="mb-3"><strong>Cancelaciones:</strong> Se requiere preaviso de al menos 12 horas. Cancelaciones fuera de este plazo o inasistencia implican la pérdida total del pago.</p>
            <p className="mb-3"><strong>Requisitos:</strong> el servicio está restringido a usuarios mayores de 18 años. Se recomienda registro previo en el Club La Mascotera.</p>
            <p>La Mascotera no se responsabiliza por fallas de conectividad, problemas del dispositivo del Usuario u otras circunstancias ajenas a su control que afecten la videollamada.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>8. Propiedad intelectual</h2>
            <p>El diseño del sitio, logos, marcas y contenido son propiedad de La Mascotera S.A.S. o sus licenciantes. Prohibido el uso comercial no autorizado.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>9. Jurisdicción</h2>
            <p>Cualquier controversia será resuelta ante los tribunales de San Miguel de Tucumán, con aplicación de la ley argentina.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#0d1816" }}>10. Contacto</h2>
            <p>Por cualquier consulta: soportelamascotera@gmail.com · WhatsApp +54 381 239 1001 · Av. Alem 532, Tucumán.</p>
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
            <p><strong>Atención al consumidor:</strong> Ante cualquier inconveniente, podés reclamar ante la Dirección Nacional de Defensa del Consumidor, <a href="https://consumidor.produccion.gob.ar/" target="_blank" className="underline" style={{ color: "#f6a906" }}>consumidor.produccion.gob.ar</a>.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
