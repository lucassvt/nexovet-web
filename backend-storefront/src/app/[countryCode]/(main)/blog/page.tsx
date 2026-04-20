import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { BLOG_ARTICLES } from "@lib/data/blog-data"

export const metadata: Metadata = {
  title: "Blog — Guías y consejos para tu mascota",
  description:
    "Artículos sobre alimentación, salud, vacunación y cuidado de perros, gatos y otras mascotas. Escritos por nuestros veterinarios del NOA.",
  openGraph: {
    title: "Blog La Mascotera",
    description: "Guías y consejos para tu mascota",
  },
}

export default function Blog() {
  return (
    <div style={{ background: "#fafafa" }}>
      <Breadcrumbs items={[{ label: "Blog" }]} />

      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-14">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#f6a906" }}
          >
            📚 Guías y consejos
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight">
            Blog La Mascotera
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-2xl" style={{ color: "rgba(255,255,255,0.75)" }}>
            Todo lo que tenés que saber sobre alimentación, salud y cuidado de tu mascota. Escrito por nuestro equipo veterinario del NOA.
          </p>
        </div>
      </section>

      <section className="content-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_ARTICLES.map((art) => (
            <LocalizedClientLink
              key={art.slug}
              href={`/blog/${art.slug}`}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-[#f6a906] flex flex-col"
            >
              <div
                className="aspect-[16/9] flex items-center justify-center text-6xl"
                style={{ background: "linear-gradient(135deg, #f6a906 0%, #ffbd3a 100%)" }}
              >
                {art.emoji}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: "#f6a906" }}
                >
                  {art.category} · {art.readingMinutes} min lectura
                </span>
                <h2
                  className="text-lg font-black leading-tight mb-2"
                  style={{ color: "#0d1816" }}
                >
                  {art.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-3 flex-1">{art.excerpt}</p>
                <span className="mt-3 text-xs font-semibold" style={{ color: "#2e9e8a" }}>
                  Leer artículo →
                </span>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff" }}>
        <div className="content-container py-10 text-center">
          <h3 className="text-xl font-black uppercase" style={{ color: "#0d1816" }}>
            ¿Tenés una duda puntual sobre tu mascota?
          </h3>
          <p className="mt-2 text-gray-600">
            Podés agendar una consulta online con uno de nuestros veterinarios.
          </p>
          <LocalizedClientLink
            href="/televeterinaria/agendar"
            className="mt-4 inline-block px-6 py-3 rounded font-bold uppercase tracking-wide text-sm"
            style={{ background: "#2e9e8a", color: "#fff" }}
          >
            🩺 Agendar televeterinaria
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
