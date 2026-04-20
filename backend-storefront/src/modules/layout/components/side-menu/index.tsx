"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"

const PRIMARY_LINKS: Array<{ name: string; href: string; emoji?: string }> = [
  { name: "Inicio", href: "/" },
  { name: "Tienda", href: "/store" },
  { name: "Mi cuenta", href: "/account" },
  { name: "Carrito", href: "/cart" },
]

const SPECIES: Array<{ name: string; slug: string; emoji: string }> = [
  { name: "Perros", slug: "perros", emoji: "🐶" },
  { name: "Gatos", slug: "gatos", emoji: "🐱" },
  { name: "Aves", slug: "otros-aves", emoji: "🦜" },
  { name: "Roedores", slug: "otros-roedores", emoji: "🐹" },
  { name: "Peces", slug: "otros-peces", emoji: "🐟" },
]

const SERVICES: Array<{ name: string; href: string; emoji: string }> = [
  { name: "Club La Mascotera", href: "/club", emoji: "🏆" },
  { name: "Envío Programado", href: "/envio-programado", emoji: "🗓️" },
  { name: "Televeterinaria", href: "/televeterinaria", emoji: "🩺" },
  { name: "Peluquería canina", href: "/peluqueria", emoji: "✂️" },
  { name: "Nuestras sucursales", href: "/sucursales", emoji: "📍" },
]

const HELP_LINKS: Array<{ name: string; href: string }> = [
  { name: "Preguntas frecuentes", href: "/faq" },
  { name: "Blog & consejos", href: "/blog" },
  { name: "Devoluciones", href: "/devoluciones" },
  { name: "Botón de arrepentimiento", href: "/arrepentimiento" },
  { name: "Términos y condiciones", href: "/terminos" },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center gap-2 px-2 transition-all ease-out duration-200 focus:outline-none hover:text-[#f6a906] font-semibold text-sm uppercase tracking-wide"
                >
                  <span className="flex flex-col gap-[3px]">
                    <span className="block w-5 h-[2px] bg-current" />
                    <span className="block w-5 h-[2px] bg-current" />
                    <span className="block w-5 h-[2px] bg-current" />
                  </span>
                  <span className="hidden sm:inline">Menú</span>
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/40 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-x-4"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-4"
              >
                <PopoverPanel
                  static
                  className="flex flex-col fixed top-0 left-0 w-[92vw] sm:w-[420px] h-screen z-[51] shadow-2xl"
                  style={{ background: "#0d1816", color: "#fff" }}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <LocalizedClientLink href="/" onClick={close}>
                      <img src="/images/brand/logo.png" alt="La Mascotera" style={{ height: "36px", width: "auto", filter: "brightness(0) invert(1)" }} />
                    </LocalizedClientLink>
                    <button data-testid="close-menu-button" onClick={close} className="p-2 hover:text-[#f6a906]" aria-label="Cerrar menú">
                      <XMark />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Search */}
                    <form action="/ar/store" method="GET" className="p-6 pb-4 flex items-center gap-2" onSubmit={() => close()}>
                      <input
                        type="search"
                        name="q"
                        placeholder="¿Qué estás buscando?"
                        className="flex-1 px-3 py-2 rounded text-sm text-[#0d1816] focus:outline-none focus:ring-2 focus:ring-[#f6a906]"
                      />
                      <button type="submit" className="px-3 py-2 rounded font-bold text-sm" style={{ background: "#f6a906", color: "#0d1816" }}>
                        🔍
                      </button>
                    </form>

                    {/* Primary */}
                    <div className="px-6 pb-4">
                      <ul className="flex flex-col">
                        {PRIMARY_LINKS.map((l) => (
                          <li key={l.name}>
                            <LocalizedClientLink
                              href={l.href}
                              onClick={close}
                              data-testid={`${l.name.toLowerCase().replace(/\s/g, '-')}-link`}
                              className="block py-2 text-lg font-semibold hover:text-[#f6a906] transition-colors"
                            >
                              {l.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Species */}
                    <div className="px-6 pb-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "#f6a906" }}>
                        Por mascota
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {SPECIES.map((s) => (
                          <li key={s.slug}>
                            <LocalizedClientLink
                              href={`/categories/${s.slug}`}
                              onClick={close}
                              className="flex items-center gap-2 py-2 text-base hover:text-[#f6a906] transition-colors"
                            >
                              <span className="text-xl">{s.emoji}</span>
                              <span>{s.name}</span>
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Services */}
                    <div className="px-6 pb-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "#f6a906" }}>
                        Servicios
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {SERVICES.map((s) => (
                          <li key={s.href}>
                            <LocalizedClientLink
                              href={s.href}
                              onClick={close}
                              className="flex items-center gap-2 py-2 text-base hover:text-[#f6a906] transition-colors"
                            >
                              <span className="text-xl">{s.emoji}</span>
                              <span>{s.name}</span>
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Regions */}
                    <div className="px-6 pb-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "#f6a906" }}>
                        Nuestras regiones
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                        {[
                          { slug: "catamarca", name: "Catamarca" },
                          { slug: "chaco", name: "Chaco" },
                          { slug: "cordoba", name: "Córdoba" },
                          { slug: "jujuy", name: "Jujuy" },
                          { slug: "mendoza", name: "Mendoza" },
                          { slug: "oran", name: "Orán" },
                          { slug: "salta-leguizamon", name: "Salta (Leguizamón)" },
                          { slug: "zapala", name: "Zapala" },
                        ].map((r) => (
                          <LocalizedClientLink
                            key={r.slug}
                            href={`/tienda/${r.slug}`}
                            onClick={close}
                            className="py-1 hover:text-[#f6a906] transition-colors"
                          >
                            {r.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    </div>

                    {/* Help */}
                    <div className="px-6 pb-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "#f6a906" }}>
                        Ayuda
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {HELP_LINKS.map((h) => (
                          <li key={h.href}>
                            <LocalizedClientLink
                              href={h.href}
                              onClick={close}
                              className="block py-1.5 text-sm hover:text-[#f6a906] transition-colors"
                              style={{ color: "rgba(255,255,255,0.8)" }}
                            >
                              {h.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact */}
                    <div className="px-6 pb-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <a
                        href="https://wa.me/5493812391001"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded font-semibold text-sm"
                        style={{ background: "#25D366", color: "#fff" }}
                      >
                        <span>📱</span>
                        <span>Escribinos por WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t space-y-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    {!!locales?.length && (
                      <div className="flex justify-between" onMouseEnter={languageToggleState.open} onMouseLeave={languageToggleState.close}>
                        <LanguageSelect toggleState={languageToggleState} locales={locales} currentLocale={currentLocale} />
                        <ArrowRightMini className={clx("transition-transform duration-150", languageToggleState.state ? "-rotate-90" : "")} />
                      </div>
                    )}
                    <div className="flex justify-between" onMouseEnter={countryToggleState.open} onMouseLeave={countryToggleState.close}>
                      {regions && <CountrySelect toggleState={countryToggleState} regions={regions} />}
                      <ArrowRightMini className={clx("transition-transform duration-150", countryToggleState.state ? "-rotate-90" : "")} />
                    </div>
                    <Text className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      © {new Date().getFullYear()} La Mascotera. Todos los derechos reservados.
                    </Text>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
