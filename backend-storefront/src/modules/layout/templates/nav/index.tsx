import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import RegionPill from "@modules/region-selector/components/region-pill"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* Top bar */}
      <div
        className="text-xs py-1.5 text-center font-semibold"
        style={{ background: "#f6a906", color: "#0d1816" }}
      >
        🚚 Envíos a todo el país · Retiro en sucursal gratis · +40 sucursales del NOA
      </div>
      <header
        className="relative h-20 mx-auto"
        style={{
          background: "#fff",
          color: "#0d1816",
          borderBottom: "1px solid rgba(13,24,22,0.08)",
        }}
      >
        <nav className="content-container flex items-center justify-between w-full h-full">
          <div className="flex-1 basis-0 h-full flex items-center gap-3">
            <div className="h-full">
              <SideMenu regions={regions} />
            </div>
            <div className="hidden small:flex">
              <RegionPill />
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2 transition-transform hover:scale-105"
              data-testid="nav-store-link"
            >
              <img
                src="/images/brand/logo.png"
                alt="La Mascotera"
                style={{ height: "52px", width: "auto" }}
              />
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="flex small:hidden">
              <RegionPill />
            </div>
            <div className="hidden small:flex items-center gap-x-6 h-full text-sm font-semibold">
              <LocalizedClientLink
                className="hover:text-[#f6a906] transition-colors"
                href="/club"
              >
                Club
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-[#f6a906] transition-colors"
                href="/sucursales"
              >
                Sucursales
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-[#f6a906] transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Mi cuenta
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-[#f6a906] flex gap-2 text-sm font-semibold transition-colors"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  🛒 Carrito (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>

      {/* Sub-bar con categorías por especie + búsqueda */}
      <div
        className="hidden small:block"
        style={{ background: "#fafafa", borderBottom: "3px solid #f6a906" }}
      >
        <div className="content-container flex items-center justify-between py-2">
          <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: "#0d1816" }}>
            <LocalizedClientLink
              href="/categories/perros"
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors"
            >
              <span>🐶</span> <span>Perros</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/gatos"
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors"
            >
              <span>🐱</span> <span>Gatos</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/aves"
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors"
            >
              <span>🦜</span> <span>Aves</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/roedores"
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors"
            >
              <span>🐹</span> <span>Roedores</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/peces"
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors"
            >
              <span>🐟</span> <span>Peces</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/televeterinaria"
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors"
            >
              <span>🩺</span> <span>Televeterinaria</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/peluqueria"
              className="flex items-center gap-1.5 hover:text-[#f6a906] transition-colors"
            >
              <span>✂️</span> <span>Peluquería</span>
            </LocalizedClientLink>
          </div>
          {/* Search inline */}
          <form action="/ar/store" method="GET" className="flex items-center gap-1">
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
      </div>
    </div>
  )
}
