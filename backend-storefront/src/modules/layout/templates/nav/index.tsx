import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* Top bar con promos */}
      <div className="text-white text-xs py-1.5 text-center" style={{ background: "#f6a906", color: "#0d1816", fontWeight: 600 }}>
        🚚 Envíos a todo el país · Retiro en sucursal gratis · +40 sucursales del NOA
      </div>
      <header className="relative h-16 mx-auto" style={{ background: "#0d1816", color: "#fff", borderBottom: "3px solid #f6a906" }}>
        <nav className="content-container flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="text-2xl font-extrabold uppercase tracking-wide transition-colors"
              style={{ color: "#f6a906" }}
              data-testid="nav-store-link"
            >
              La Mascotera
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink className="hover:text-[#f6a906] text-white/90" href="/club">
                Club
              </LocalizedClientLink>
              <LocalizedClientLink className="hover:text-[#f6a906] text-white/90" href="/sucursales">
                Sucursales
              </LocalizedClientLink>
              <LocalizedClientLink className="hover:text-[#f6a906] text-white/90" href="/account" data-testid="nav-account-link">
                Mi cuenta
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-[#f6a906] flex gap-2 text-white/90"
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
    </div>
  )
}
