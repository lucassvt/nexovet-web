"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Col = { title: string; href: string; items: Array<{ label: string; href: string }> }
type SpeciesKey = "perros" | "gatos" | "otros"

type MenuData = Record<
  SpeciesKey,
  {
    label: string
    emoji: string
    rootHref: string
    cols: Col[]
    featured?: { title: string; desc: string; href: string; emoji: string; bg: string }
  }
>

const MENU: MenuData = {
  perros: {
    label: "Perros",
    emoji: "🐶",
    rootHref: "/categories/perros",
    cols: [
      {
        title: "Alimentos",
        href: "/categories/perros-alimentos",
        items: [
          { label: "Alimento Balanceado Seco", href: "/categories/perros-alimento-seco" },
          { label: "Alimento Húmedo", href: "/categories/perros-alimento-humedo" },
          { label: "Snacks y Premios", href: "/categories/perros-snacks" },
        ],
      },
      {
        title: "Accesorios",
        href: "/categories/perros-accesorios",
        items: [
          { label: "Ropa", href: "/categories/perros-ropa" },
          { label: "Elementos de Paseo", href: "/categories/perros-paseo" },
          { label: "Juguetes", href: "/categories/perros-juguetes" },
          { label: "Comederos y Bebederos", href: "/categories/perros-comederos" },
          { label: "Camas y Cuchas", href: "/categories/perros-camas" },
          { label: "Educadores", href: "/categories/perros-educadores" },
          { label: "Transportadores", href: "/categories/perros-transportadores" },
        ],
      },
    ],
    featured: {
      title: "Royal Canin",
      desc: "La marca #1 en nutrición canina",
      href: "/store?brands=Royal%20Canin",
      emoji: "🏆",
      bg: "linear-gradient(135deg, #f6a906 0%, #ffbd3a 100%)",
    },
  },
  gatos: {
    label: "Gatos",
    emoji: "🐱",
    rootHref: "/categories/gatos",
    cols: [
      {
        title: "Alimentos",
        href: "/categories/gatos-alimentos",
        items: [
          { label: "Alimento Balanceado Seco", href: "/categories/gatos-alimento-seco" },
          { label: "Alimento Húmedo", href: "/categories/gatos-alimento-humedo" },
          { label: "Snacks y Premios", href: "/categories/gatos-snacks" },
        ],
      },
      {
        title: "Accesorios",
        href: "/categories/gatos-accesorios",
        items: [
          { label: "Piedras Sanitarias", href: "/categories/gatos-piedras" },
          { label: "Rascadores", href: "/categories/gatos-rascadores" },
          { label: "Juguetes", href: "/categories/gatos-juguetes" },
          { label: "Comederos y Bebederos", href: "/categories/gatos-comederos" },
          { label: "Camas y Descanso", href: "/categories/gatos-camas" },
          { label: "Transportadores", href: "/categories/gatos-transportadores" },
        ],
      },
    ],
    featured: {
      title: "Urinary & Hypoallergenic",
      desc: "Dietas terapéuticas",
      href: "/store?q=urinary",
      emoji: "🩺",
      bg: "linear-gradient(135deg, #2e9e8a 0%, #3ec2a9 100%)",
    },
  },
  otros: {
    label: "Otros",
    emoji: "🐾",
    rootHref: "/categories/otros-animales",
    cols: [
      {
        title: "Por especie",
        href: "/categories/otros-animales",
        items: [
          { label: "Aves 🦜", href: "/categories/otros-aves" },
          { label: "Peces 🐟", href: "/categories/otros-peces" },
          { label: "Roedores 🐹", href: "/categories/otros-roedores" },
        ],
      },
    ],
  },
}

const QUICK_LINKS = [
  { href: "/televeterinaria", emoji: "🩺", label: "Televeterinaria" },
  { href: "/peluqueria", emoji: "✂️", label: "Peluquería" },
  { href: "/club", emoji: "🏆", label: "Club" },
]

export default function SpeciesMegaMenu() {
  const [active, setActive] = useState<SpeciesKey | null>(null)

  return (
    <div
      className="hidden small:block relative"
      style={{ background: "#fafafa", borderBottom: "3px solid #f6a906" }}
      onMouseLeave={() => setActive(null)}
    >
      <div className="content-container flex items-center justify-between py-2">
        <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: "#0d1816" }}>
          {(Object.keys(MENU) as SpeciesKey[]).map((k) => {
            const m = MENU[k]
            const isActive = active === k
            return (
              <div key={k} onMouseEnter={() => setActive(k)} className="py-2">
                <LocalizedClientLink
                  href={m.rootHref}
                  className={
                    "flex items-center gap-1.5 hover:text-[#f6a906] transition-colors " +
                    (isActive ? "text-[#f6a906]" : "")
                  }
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </LocalizedClientLink>
              </div>
            )
          })}
          {QUICK_LINKS.map((q) => (
            <LocalizedClientLink
              key={q.href}
              href={q.href}
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors py-2"
              onMouseEnter={() => setActive(null)}
            >
              <span>{q.emoji}</span>
              <span>{q.label}</span>
            </LocalizedClientLink>
          ))}
        </div>
        <form action="/ar/store" method="GET" className="flex items-center gap-1" onMouseEnter={() => setActive(null)}>
          <input
            type="search"
            name="q"
            placeholder="Buscar productos, marcas..."
            className="text-sm px-3 py-1.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906] w-64"
          />
          <button
            type="submit"
            className="text-sm px-3 py-1.5 rounded font-semibold transition-colors"
            style={{ background: "#f6a906", color: "#0d1816" }}
          >
            🔍
          </button>
        </form>
      </div>

      {/* Mega-menu panel */}
      {active && (
        <div
          className="absolute left-0 right-0 top-full shadow-xl z-40 border-t"
          style={{ background: "#fff", borderColor: "rgba(0,0,0,0.05)" }}
        >
          <div className="content-container py-8">
            <div
              className="grid gap-8"
              style={{
                gridTemplateColumns: `repeat(${MENU[active].cols.length + (MENU[active].featured ? 1 : 0)}, minmax(0, 1fr))`,
              }}
            >
              {MENU[active].cols.map((col) => (
                <div key={col.title}>
                  <LocalizedClientLink
                    href={col.href}
                    className="block text-xs uppercase tracking-widest font-black mb-3 hover:text-[#f6a906] transition-colors"
                    style={{ color: "#f6a906" }}
                  >
                    {col.title} →
                  </LocalizedClientLink>
                  <ul className="flex flex-col gap-1.5">
                    {col.items.map((it) => (
                      <li key={it.href}>
                        <LocalizedClientLink
                          href={it.href}
                          className="text-sm hover:text-[#f6a906] transition-colors"
                          style={{ color: "#0d1816" }}
                        >
                          {it.label}
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {MENU[active].featured && (
                <LocalizedClientLink
                  href={MENU[active].featured!.href}
                  className="rounded-xl p-5 flex flex-col justify-between min-h-[180px] transition-transform hover:scale-[1.02]"
                  style={{ background: MENU[active].featured!.bg, color: "#0d1816" }}
                >
                  <div className="text-5xl opacity-30">{MENU[active].featured!.emoji}</div>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold mb-1">Destacado</p>
                    <p className="text-lg font-black uppercase leading-tight">
                      {MENU[active].featured!.title}
                    </p>
                    <p className="text-xs mt-1 opacity-80">{MENU[active].featured!.desc}</p>
                    <p className="text-xs mt-3 font-bold">Ver productos →</p>
                  </div>
                </LocalizedClientLink>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
