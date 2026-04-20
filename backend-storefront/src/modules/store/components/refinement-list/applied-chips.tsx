"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import ActiveFilterChips, { ActiveChip } from "./active-filter-chips"
import { BrandOption } from "./brand-filter"
import { SpeciesOption } from "./species-filter"

type AppliedChipsProps = {
  brands?: BrandOption[]
  species?: SpeciesOption[]
  priceBounds?: { min: number; max: number }
}

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

const AppliedChips = ({
  brands = [],
  species = [],
  priceBounds = { min: 0, max: 100000 },
}: AppliedChipsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedBrands = useMemo(
    () => (searchParams.get("brands")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  )
  const selectedSpecies = useMemo(
    () => (searchParams.get("species")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  )
  const inStockOnly = searchParams.get("stock") === "1"
  const q = searchParams.get("q") ?? ""
  const priceMin = searchParams.get("minPrice")
  const priceMax = searchParams.get("maxPrice")

  const pushWith = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams)
      mutate(params)
      params.delete("page")
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const setMulti = (key: string, values: string[]) => {
    pushWith((p) => {
      if (values.length === 0) p.delete(key)
      else p.set(key, values.join(","))
    })
  }

  const chips: ActiveChip[] = []
  if (q) {
    chips.push({
      id: "q",
      label: `Busqueda: "${q}"`,
      onRemove: () => pushWith((p) => p.delete("q")),
    })
  }
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
  if (priceMin || priceMax) {
    const min = priceMin ? Number(priceMin) : priceBounds.min
    const max = priceMax ? Number(priceMax) : priceBounds.max
    chips.push({
      id: "price",
      label: `${formatARS(min)} - ${formatARS(max)}`,
      onRemove: () =>
        pushWith((p) => {
          p.delete("minPrice")
          p.delete("maxPrice")
        }),
    })
  }
  if (inStockOnly) {
    chips.push({
      id: "stock",
      label: "Con stock",
      onRemove: () => pushWith((p) => p.delete("stock")),
    })
  }

  const clearAll = () => {
    pushWith((p) => {
      ;["brands", "species", "minPrice", "maxPrice", "stock", "q"].forEach(
        (k) => p.delete(k)
      )
    })
  }

  return <ActiveFilterChips chips={chips} onClearAll={clearAll} />
}

export default AppliedChips
