"use client"

import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import ActiveFilterChips, { ActiveChip } from "./active-filter-chips"
import BrandFilter, { BrandOption } from "./brand-filter"
import CategoryTree from "./category-tree"
import FilterSection from "./filter-section"
import PriceFilter from "./price-filter"
import SpeciesFilter, { SpeciesOption } from "./species-filter"
import StockFilter from "./stock-filter"

type RefinementListProps = {
  categories?: HttpTypes.StoreProductCategory[]
  brands?: BrandOption[]
  species?: SpeciesOption[]
  priceBounds?: { min: number; max: number }
  currentCategoryHandle?: string
  lockCategory?: boolean
  "data-testid"?: string
}

const DEFAULT_BOUNDS = { min: 0, max: 100000 }

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

const RefinementList = ({
  categories = [],
  brands = [],
  species = [],
  priceBounds = DEFAULT_BOUNDS,
  currentCategoryHandle,
  lockCategory,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [openMobile, setOpenMobile] = useState(false)

  const selectedBrands = useMemo(
    () => (searchParams.get("brands")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  )
  const selectedSpecies = useMemo(
    () => (searchParams.get("species")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  )
  const inStockOnly = searchParams.get("stock") === "1"
  const priceMinParam = searchParams.get("minPrice")
  const priceMaxParam = searchParams.get("maxPrice")
  const priceValue = {
    min: priceMinParam ? Number(priceMinParam) : undefined,
    max: priceMaxParam ? Number(priceMaxParam) : undefined,
  }

  const pushWith = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams)
      mutate(params)
      // Reset pagination whenever filters change
      params.delete("page")
      const q = params.toString()
      router.push(q ? `${pathname}?${q}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const setMulti = (key: string, values: string[]) => {
    pushWith((p) => {
      if (values.length === 0) {
        p.delete(key)
      } else {
        p.set(key, values.join(","))
      }
    })
  }

  const toggleIn = (key: string, current: string[], value: string) => {
    const exists = current.includes(value)
    const next = exists
      ? current.filter((v) => v !== value)
      : [...current, value]
    setMulti(key, next)
  }

  const onCategorySelect = (handle: string | null) => {
    if (lockCategory) return // category pages own the handle
    // Prefer full navigation to /categories/<handle> if we have a real one
    if (handle) {
      const parts = pathname.split("/").filter(Boolean)
      const countryCode = parts[0] || "ar"
      router.push(`/${countryCode}/categories/${handle}`)
    } else {
      const parts = pathname.split("/").filter(Boolean)
      const countryCode = parts[0] || "ar"
      router.push(`/${countryCode}/store`)
    }
  }

  const onPriceCommit = (next: { min?: number; max?: number }) => {
    pushWith((p) => {
      if (next.min === undefined) p.delete("minPrice")
      else p.set("minPrice", String(next.min))
      if (next.max === undefined) p.delete("maxPrice")
      else p.set("maxPrice", String(next.max))
    })
  }

  const onStockChange = (next: boolean) => {
    pushWith((p) => {
      if (next) p.set("stock", "1")
      else p.delete("stock")
    })
  }

  const clearAll = () => {
    pushWith((p) => {
      ;["brands", "species", "minPrice", "maxPrice", "stock", "q"].forEach((k) =>
        p.delete(k)
      )
    })
  }

  const chips: ActiveChip[] = []
  selectedBrands.forEach((val) => {
    const opt = brands.find((b) => b.value === val)
    chips.push({
      id: `brand-${val}`,
      label: opt?.label ?? val,
      onRemove: () =>
        setMulti(
          "brands",
          selectedBrands.filter((v) => v !== val)
        ),
    })
  })
  selectedSpecies.forEach((val) => {
    const opt = species.find((s) => s.value === val)
    chips.push({
      id: `species-${val}`,
      label: opt?.label ?? val,
      onRemove: () =>
        setMulti(
          "species",
          selectedSpecies.filter((v) => v !== val)
        ),
    })
  })
  if (priceValue.min !== undefined || priceValue.max !== undefined) {
    const min = priceValue.min ?? priceBounds.min
    const max = priceValue.max ?? priceBounds.max
    chips.push({
      id: "price",
      label: `${formatARS(min)} - ${formatARS(max)}`,
      onRemove: () => onPriceCommit({ min: undefined, max: undefined }),
    })
  }
  if (inStockOnly) {
    chips.push({
      id: "stock",
      label: "Con stock",
      onRemove: () => onStockChange(false),
    })
  }

  useEffect(() => {
    // Close mobile panel when route changes
    setOpenMobile(false)
  }, [pathname, searchParams])

  const Panel = (
    <div className="space-y-1">
      {!lockCategory && (
        <FilterSection title="Categoria" data-testid="filter-category">
          <CategoryTree
            categories={categories}
            currentHandle={currentCategoryHandle}
            onSelect={onCategorySelect}
          />
        </FilterSection>
      )}
      <FilterSection title="Marca" data-testid="filter-brand">
        <BrandFilter
          options={brands}
          selected={selectedBrands}
          onToggle={(v) => toggleIn("brands", selectedBrands, v)}
        />
      </FilterSection>
      <FilterSection title="Precio" data-testid="filter-price">
        <PriceFilter
          bounds={priceBounds}
          value={priceValue}
          onCommit={onPriceCommit}
        />
      </FilterSection>
      <FilterSection title="Especie" data-testid="filter-species">
        <SpeciesFilter
          options={species}
          selected={selectedSpecies}
          onToggle={(v) => toggleIn("species", selectedSpecies, v)}
        />
      </FilterSection>
      <FilterSection
        title="Disponibilidad"
        defaultOpen={false}
        data-testid="filter-stock"
      >
        <StockFilter inStockOnly={inStockOnly} onChange={onStockChange} />
      </FilterSection>
      {chips.length > 0 && (
        <div className="pt-4 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={clearAll}
            className="w-full py-2 text-xs font-montserrat font-semibold uppercase tracking-wide text-[#2e9e8a] hover:text-[#0d1816] transition"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="small:hidden mb-4">
        <button
          type="button"
          onClick={() => setOpenMobile(!openMobile)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0d1816] text-white text-sm font-montserrat font-semibold"
          aria-expanded={openMobile}
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-.553.894l-4 2A1 1 0 019 21v-8.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          {openMobile ? "Ocultar filtros" : "Mostrar filtros"}
          {chips.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[11px] rounded-full bg-[#f6a906] text-[#0d1816]">
              {chips.length}
            </span>
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        data-testid={dataTestId ?? "refinement-list"}
        className={`${
          openMobile ? "block" : "hidden"
        } small:block small:sticky small:top-24 small:self-start small:min-w-[260px] small:max-w-[260px] w-full px-4 py-5 mb-6 small:mb-0 small:mr-6 bg-white border border-gray-100 rounded-lg shadow-sm font-montserrat`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0d1816] mb-4">
          Filtros
        </h2>
        {Panel}
      </aside>
    </>
  )
}

export { RefinementList as default }
export type { RefinementListProps }
