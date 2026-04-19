import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Sucursales — La Mascotera",
  description: "+40 sucursales en todo el país. Encontrá la más cercana.",
}

const SUCURSALES = [
  // Tucumán
  { region: "Tucumán", items: [
    { nombre: "Sucursal Alem", direccion: "Av. Alem 123, San Miguel de Tucumán" },
    { nombre: "Sucursal Banda", direccion: "Banda del Río Salí" },
    { nombre: "Sucursal Belgrano Sur", direccion: "Av. Belgrano Sur" },
    { nombre: "Sucursal Concepción", direccion: "Concepción, Tucumán" },
    { nombre: "Sucursal Congreso", direccion: "Congreso y General Paz" },
    { nombre: "Sucursal Laprida", direccion: "Laprida" },
    { nombre: "Sucursal Yerba Buena", direccion: "Yerba Buena" },
    { nombre: "Sucursal Pinar I", direccion: "Pinar I" },
    { nombre: "Tafí Viejo", direccion: "Tafí Viejo - Tucumán" },
    { nombre: "Pinar 2 (Tucumán)", direccion: "Pinar 2 - Tucumán" },
    { nombre: "Pets Plus Concepción", direccion: "Concepción" },
  ]},
  // Salta
  { region: "Salta", items: [
    { nombre: "Salta 899 (Leguizamón)", direccion: "Leguizamón 899, Salta Capital" },
    { nombre: "Mascotera Orán", direccion: "Orán, Salta" },
  ]},
  // Neuquén
  { region: "Neuquén", items: [
    { nombre: "Pets Plus Neuquén", direccion: "Neuquén capital" },
    { nombre: "Sucursal Neuquén Olascoaga", direccion: "Olascoaga, Neuquén" },
    { nombre: "Zapala (Fernando Correa)", direccion: "Zapala - Neuquén" },
  ]},
  // Jujuy
  { region: "Jujuy", items: [
    { nombre: "Masjujuy Lamadrid", direccion: "Lamadrid, San Salvador de Jujuy" },
  ]},
  // Catamarca
  { region: "Catamarca", items: [
    { nombre: "Julio Monti Catamarca", direccion: "San Fernando del Valle de Catamarca" },
  ]},
  // Chaco
  { region: "Chaco", items: [
    { nombre: "Fernando Traversi Chaco", direccion: "Resistencia, Chaco" },
  ]},
  // Córdoba
  { region: "Córdoba", items: [
    { nombre: "Rumipet Córdoba", direccion: "Córdoba Capital" },
  ]},
  // Mendoza
  { region: "Mendoza", items: [
    { nombre: "Las Heras Mendoza", direccion: "Las Heras, Mendoza" },
    { nombre: "Godoy Cruz Mendoza", direccion: "Godoy Cruz, Mendoza" },
  ]},
  // Santiago del Estero / Rosario
  { region: "Otras", items: [
    { nombre: "Rosario (Coria Santiago)", direccion: "Rosario, Santa Fe" },
  ]},
]

export default function Sucursales() {
  const total = SUCURSALES.reduce((sum, r) => sum + r.items.length, 0)
  return (
    <div style={{ background: "#fafafa", minHeight: "calc(100vh - 120px)" }}>
      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f6a906" }}>
            Nuestras sucursales
          </span>
          <h1 className="text-5xl md:text-6xl font-black uppercase leading-tight">
            +{total} sucursales<br />
            <span style={{ color: "#f6a906" }}>en todo el país</span>
          </h1>
          <p className="mt-4 text-lg max-w-2xl" style={{ color: "rgba(255,255,255,0.7)" }}>
            Tucumán, Salta, Jujuy, Catamarca, Chaco, Córdoba, Mendoza, Neuquén y más. Encontrá la más cercana.
          </p>
        </div>
      </section>

      <section className="content-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SUCURSALES.map((region) => (
            <div key={region.region} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#f6a906] transition-colors">
              <h2 className="text-2xl font-black uppercase mb-4 pb-3 border-b-2" style={{ color: "#0d1816", borderColor: "#f6a906" }}>
                {region.region}
              </h2>
              <ul className="space-y-4">
                {region.items.map((suc) => (
                  <li key={suc.nombre} className="pb-3 border-b border-gray-100 last:border-0">
                    <h3 className="font-semibold text-base mb-1" style={{ color: "#0d1816" }}>
                      📍 {suc.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">{suc.direccion}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">¿Sos de otra zona? Consultanos envíos a todo el país.</p>
          <LocalizedClientLink
            href="/store"
            className="inline-block px-8 py-4 rounded font-bold uppercase tracking-wide"
            style={{ background: "#f6a906", color: "#0d1816" }}
          >
            Ver catálogo online
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
