import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { sortProducts } from "@lib/util/sort-products"
import ProductPreview from "@modules/products/components/product-preview"
import AppliedChips from "@modules/store/components/refinement-list/applied-chips"
import { BrandOption } from "@modules/store/components/refinement-list/brand-filter"
import EmptyState from "@modules/store/components/refinement-list/empty-state"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { SpeciesOption } from "@modules/store/components/refinement-list/species-filter"

export const PRODUCT_LIMIT = 24

type PaginatedFilters = {
  brands?: string[]
  species?: string[]
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  q?: string
}

export type FacetData = {
  brands: BrandOption[]
  species: SpeciesOption[]
  priceBounds: { min: number; max: number }
  totalCount: number
}

const SPECIES_MAP: { key: string; match: string[] }[] = [
  { key: "perro", match: ["perro", "perros", "dog"] },
  { key: "gato", match: ["gato", "gatos", "cat"] },
  { key: "roedor", match: ["roedor", "roedores", "hamster", "conejo"] },
  { key: "pez", match: ["pez", "peces", "acuario", "fish"] },
  { key: "ave", match: ["ave", "aves", "pajaro", "pajaros", "bird"] },
  { key: "reptil", match: ["reptil", "reptiles"] },
]

const SPECIES_LABEL: Record<string, string> = {
  perro: "Perro",
  gato: "Gato",
  roedor: "Roedor",
  pez: "Pez",
  ave: "Ave",
  reptil: "Reptil",
}

const minVariantPrice = (p: HttpTypes.StoreProduct): number | null => {
  if (!p.variants?.length) return null
  const prices = p.variants
    .map((v) => v?.calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === "number" && n > 0)
  if (!prices.length) return null
  return Math.min(...prices)
}

const productInStock = (p: HttpTypes.StoreProduct): boolean => {
  if (!p.variants?.length) return false
  return p.variants.some((v: any) => {
    if (v?.manage_inventory === false) return true
    if (v?.allow_backorder) return true
    const qty = v?.inventory_quantity
    return typeof qty === "number" ? qty > 0 : true
  })
}

const productBrand = (p: HttpTypes.StoreProduct): string | null => {
  // Prefer product.type.value (set in admin), then collection.title, then
  // first tag, then metadata.brand.
  const anyP = p as any
  if (anyP.type?.value) return anyP.type.value as string
  if (anyP.type?.label) return anyP.type.label as string
  if (p.collection?.title) return p.collection.title
  if ((p as any).metadata?.brand) return String((p as any).metadata.brand)
  if (p.tags && p.tags.length) return p.tags[0].value || null
  return null
}

const productSpecies = (p: HttpTypes.StoreProduct): string[] => {
  const hay: string[] = []
  p.categories?.forEach((c: any) => {
    if (c?.name) hay.push(c.name.toLowerCase())
    if (c?.handle) hay.push(c.handle.toLowerCase())
  })
  p.tags?.forEach((t: any) => {
    if (t?.value) hay.push(String(t.value).toLowerCase())
  })
  if ((p as any).metadata?.species) {
    hay.push(String((p as any).metadata.species).toLowerCase())
  }
  const found = new Set<string>()
  SPECIES_MAP.forEach(({ key, match }) => {
    if (hay.some((text) => match.some((m) => text.includes(m)))) {
      found.add(key)
    }
  })
  return Array.from(found)
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  filters = {},
  showChips = true,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  filters?: PaginatedFilters
  showChips?: boolean
}) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const queryParams: Record<string, any> = { limit: 100 }
  if (collectionId) queryParams.collection_id = [collectionId]
  if (categoryId) queryParams.category_id = [categoryId]
  if (productsIds) queryParams.id = productsIds
  if (filters.q) queryParams.q = filters.q

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 1,
    queryParams: queryParams as any,
    countryCode,
  })

  // Build facet data from the fetched batch
  const brandCounts = new Map<string, number>()
  const speciesCounts = new Map<string, number>()
  let maxPrice = 0
  let minPrice = Infinity

  products.forEach((p) => {
    const b = productBrand(p)
    if (b) brandCounts.set(b, (brandCounts.get(b) || 0) + 1)
    productSpecies(p).forEach((k) =>
      speciesCounts.set(k, (speciesCounts.get(k) || 0) + 1)
    )
    const mp = minVariantPrice(p)
    if (mp !== null) {
      if (mp < minPrice) minPrice = mp
      if (mp > maxPrice) maxPrice = mp
    }
  })
  if (!isFinite(minPrice)) minPrice = 0
  const priceBounds = {
    min: Math.floor(minPrice),
    max: Math.ceil(maxPrice || minPrice + 1),
  }

  // Apply client-side filters not handled by API
  let filtered = products.slice()
  if (filters.brands && filters.brands.length) {
    filtered = filtered.filter((p) => {
      const b = productBrand(p)
      return !!b && filters.brands!.includes(b)
    })
  }
  if (filters.species && filters.species.length) {
    filtered = filtered.filter((p) => {
      const sp = productSpecies(p)
      return sp.some((s) => filters.species!.includes(s))
    })
  }
  if (typeof filters.minPrice === "number") {
    filtered = filtered.filter((p) => {
      const mp = minVariantPrice(p)
      return mp !== null && mp >= filters.minPrice!
    })
  }
  if (typeof filters.maxPrice === "number") {
    filtered = filtered.filter((p) => {
      const mp = minVariantPrice(p)
      return mp === null || mp <= filters.maxPrice!
    })
  }
  if (filters.inStockOnly) {
    filtered = filtered.filter((p) => productInStock(p))
  }

  // Sort
  const sorted = sortProducts(filtered, sortBy || "created_at")

  // Paginate
  const pageSize = PRODUCT_LIMIT
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  const pageProducts = sorted.slice(start, start + pageSize)
  const filteredTotal = sorted.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize))

  const brandOptions: BrandOption[] = Array.from(brandCounts.entries())
    .map(([value, n]) => ({ value, label: value, count: n }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"))

  const speciesOptions: SpeciesOption[] = Array.from(speciesCounts.entries())
    .map(([value, n]) => ({
      value,
      label: SPECIES_LABEL[value] ?? value,
      count: n,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"))

  const facets: FacetData = {
    brands: brandOptions,
    species: speciesOptions,
    priceBounds,
    totalCount: count,
  }

  // Emit a hidden script so the client sidebar (rendered higher in the tree)
  // can update counts. We also pass facets via JSON for debugging/SEO.

  if (!pageProducts.length) {
    return (
      <>
        {showChips && (
          <AppliedChips
            brands={brandOptions}
            species={speciesOptions}
            priceBounds={priceBounds}
          />
        )}
        <EmptyState />
        <FacetsBroadcast facets={facets} />
      </>
    )
  }

  return (
    <>
      {showChips && (
        <AppliedChips
          brands={brandOptions}
          species={speciesOptions}
          priceBounds={priceBounds}
        />
      )}
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {pageProducts.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={safePage}
          totalPages={totalPages}
        />
      )}
      <FacetsBroadcast facets={facets} />
    </>
  )
}

// Broadcasts the facet payload via a <script> tag so Server-rendered sidebar
// facets are available to the client (not strictly needed currently but kept
// for future client-rendered sidebars if we decide to swap).
function FacetsBroadcast({ facets }: { facets: FacetData }) {
  return (
    <script
      type="application/json"
      data-facets="store"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(facets) }}
    />
  )
}

export type { PaginatedFilters }
