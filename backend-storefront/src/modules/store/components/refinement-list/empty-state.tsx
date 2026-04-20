"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

const EmptyState = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const clearAll = () => {
    const params = new URLSearchParams(searchParams)
    ;["brands", "species", "minPrice", "maxPrice", "stock", "q", "page"].forEach(
      (k) => params.delete(k)
    )
    const q = params.toString()
    router.push(q ? `${pathname}?${q}` : pathname)
  }

  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-gray-200 rounded-lg bg-white font-montserrat"
      data-testid="empty-products"
    >
      <div className="h-14 w-14 rounded-full bg-[#f6a906]/10 flex items-center justify-center mb-4">
        <svg
          aria-hidden="true"
          className="h-7 w-7 text-[#f6a906]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[#0d1816] mb-1">
        No hay productos que matcheen tus filtros
      </h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm">
        Probe quitar alguna marca o ampliar el rango de precio.
      </p>
      <button
        type="button"
        onClick={clearAll}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#f6a906] text-[#0d1816] text-sm font-semibold hover:bg-[#e29a00] transition"
      >
        Limpiar filtros
      </button>
    </div>
  )
}

export default EmptyState
