import { Metadata } from "next"
import { notFound } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { BLOG_ARTICLES } from "@lib/data/blog-data"

type PageParams = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const { slug } = await props.params
  const art = BLOG_ARTICLES.find((a) => a.slug === slug)
  if (!art) return { title: "Artículo no encontrado" }
  return {
    title: art.seoTitle,
    description: art.seoDescription,
    openGraph: {
      title: art.title,
      description: art.excerpt,
      type: "article",
    },
  }
}

// Super-minimal markdown renderer (headings, lists, bold, tables, paragraphs)
function renderMarkdown(md: string): string {
  // Escape HTML first
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Tables
  html = html.replace(/((?:^\|[^\n]+\|\n)+)/gm, (block) => {
    const rows = block.trim().split("\n")
    if (rows.length < 2) return block
    const headerCells = rows[0]
      .split("|")
      .slice(1, -1)
      .map((c) => `<th>${c.trim()}</th>`)
      .join("")
    const bodyRows = rows
      .slice(2)
      .map(
        (r) =>
          `<tr>${r
            .split("|")
            .slice(1, -1)
            .map((c) => `<td>${c.trim()}</td>`)
            .join("")}</tr>`
      )
      .join("")
    return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>\n`
  })

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>")

  // Bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>")

  // Lists (- and 1. numbered)
  html = html.replace(/(?:^- .+(?:\n|$))+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => l.replace(/^- /, "").trim())
      .map((l) => `<li>${l}</li>`)
      .join("")
    return `<ul>${items}</ul>\n`
  })
  html = html.replace(/(?:^\d+\. .+(?:\n|$))+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => l.replace(/^\d+\. /, "").trim())
      .map((l) => `<li>${l}</li>`)
      .join("")
    return `<ol>${items}</ol>\n`
  })

  // Links (markdown [text](href))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Horizontal rules
  html = html.replace(/^---\s*$/gm, "<hr />")

  // Paragraphs (double newlines)
  html = html
    .split(/\n\n+/)
    .map((chunk) => {
      const trimmed = chunk.trim()
      if (!trimmed) return ""
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<hr")
      )
        return trimmed
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`
    })
    .join("\n")

  return html
}

export default async function BlogArticle(props: PageParams) {
  const { slug } = await props.params
  const art = BLOG_ARTICLES.find((a) => a.slug === slug)
  if (!art) notFound()

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: art.title,
    description: art.excerpt,
    datePublished: art.publishedAt,
    author: { "@type": "Organization", name: "La Mascotera" },
    publisher: {
      "@type": "Organization",
      name: "La Mascotera",
      logo: { "@type": "ImageObject", url: "https://lamascotera.com.ar/images/brand/logo.png" },
    },
  }

  const related = BLOG_ARTICLES.filter((a) => a.slug !== slug).slice(0, 3)

  return (
    <div style={{ background: "#fafafa" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Breadcrumbs
        items={[
          { label: "Blog", href: "/blog" },
          { label: art.title },
        ]}
      />

      <section style={{ background: "#0d1816", color: "#fff" }}>
        <div className="content-container py-12">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#f6a906" }}
          >
            {art.category} · {art.readingMinutes} min lectura
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight max-w-4xl">
            {art.title}
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-3xl" style={{ color: "rgba(255,255,255,0.75)" }}>
            {art.excerpt}
          </p>
        </div>
      </section>

      <article className="content-container py-12 max-w-3xl">
        <div
          className="prose-blog"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(art.body) }}
        />
        <style>{`
          .prose-blog { font-family: system-ui, -apple-system, sans-serif; color: #334; line-height: 1.75; font-size: 16px; }
          .prose-blog h1 { font-size: 28px; font-weight: 900; color: #0d1816; margin: 32px 0 16px; }
          .prose-blog h2 { font-size: 24px; font-weight: 800; color: #0d1816; margin: 28px 0 14px; padding-bottom: 6px; border-bottom: 2px solid #f6a906; display: inline-block; }
          .prose-blog h3 { font-size: 19px; font-weight: 700; color: #2e9e8a; margin: 20px 0 10px; }
          .prose-blog p { margin: 12px 0; }
          .prose-blog ul, .prose-blog ol { margin: 12px 0 12px 24px; }
          .prose-blog li { margin: 6px 0; }
          .prose-blog strong { color: #0d1816; font-weight: 700; }
          .prose-blog a { color: #f6a906; text-decoration: underline; font-weight: 600; }
          .prose-blog table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
          .prose-blog th { background: #0d1816; color: #fff; padding: 10px; text-align: left; font-weight: 700; }
          .prose-blog td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .prose-blog tr:nth-child(even) td { background: #fafafa; }
          .prose-blog hr { margin: 28px 0; border: 0; border-top: 2px dashed #e5e7eb; }
        `}</style>
      </article>

      {related.length > 0 && (
        <section className="content-container pb-14 max-w-3xl">
          <h3 className="text-xl font-black uppercase mb-5" style={{ color: "#0d1816" }}>
            Más artículos
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((r) => (
              <LocalizedClientLink
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#f6a906] transition-colors"
              >
                <div className="text-3xl mb-2">{r.emoji}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f6a906" }}>
                  {r.category}
                </div>
                <div className="text-sm font-semibold mt-1 line-clamp-2" style={{ color: "#0d1816" }}>
                  {r.title}
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
