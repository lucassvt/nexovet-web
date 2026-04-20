import "server-only"

import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import { BrandOption } from "@modules/store/components/refinement-list/brand-filter"
import { SpeciesOption } from "@modules/store/components/refinement-list/species-filter"

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

const productBrand = (p: HttpTypes.StoreProduct): string | null => {
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

const minVariantPrice = (p: HttpTypes.StoreProduct): number | null => {
  if (!p.variants?.length) return null
  const prices = p.variants
    .map((v) => v?.calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === "number" && n > 0)
  if (!prices.length) return null
  return Math.min(...prices)
}

export type FacetResult = {
  brands: BrandOption[]
  species: SpeciesOption[]
  priceBounds: { min: number; max: number }
  totalProducts: number
}

export async function buildFacets({
  countryCode,
  categoryId,
  collectionId,
}: {
  countryCode: string
  categoryId?: string
  collectionId?: string
}): Promise<FacetResult> {
  const queryParams: Record<string, any> = { limit: 100 }
  if (categoryId) queryParams.category_id = [categoryId]
  if (collectionId) queryParams.collection_id = [collectionId]

  try {
    const {
      response: { products, count },
    } = await listProducts({
      pageParam: 1,
      queryParams: queryParams as any,
      countryCode,
    })

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

    const brands: BrandOption[] = Array.from(brandCounts.entries())
      .map(([value, n]) => ({ value, label: value, count: n }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))

    const species: SpeciesOption[] = Array.from(speciesCounts.entries())
      .map(([value, n]) => ({
        value,
        label: SPECIES_LABEL[value] ?? value,
        count: n,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))

    return {
      brands,
      species,
      priceBounds: {
        min: Math.floor(minPrice),
        max: Math.ceil(maxPrice || minPrice + 1),
      },
      totalProducts: count,
    }
  } catch (err) {
    return {
      brands: [],
      species: [],
      priceBounds: { min: 0, max: 100000 },
      totalProducts: 0,
    }
  }
}
