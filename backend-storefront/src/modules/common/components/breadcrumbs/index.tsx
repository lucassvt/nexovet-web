import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type Crumb = { label: string; href?: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" className="content-container py-3 text-xs text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <LocalizedClientLink href="/" className="hover:underline hover:text-[#f6a906]">
            Inicio
          </LocalizedClientLink>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <span>›</span>
            {it.href ? (
              <LocalizedClientLink href={it.href} className="hover:underline hover:text-[#f6a906]">
                {it.label}
              </LocalizedClientLink>
            ) : (
              <span className="text-gray-700 font-medium">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
