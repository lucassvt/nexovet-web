import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Tienda",
  description: "Explora todos nuestros productos.",
}

type SearchParams = {
  sortBy?: SortOptions
  page?: string
  q?: string
  brands?: string
  species?: string
  minPrice?: string
  maxPrice?: string
  stock?: string
}

type Params = {
  searchParams: Promise<SearchParams>
  params: Promise<{ countryCode: string }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const {
    sortBy,
    page,
    q,
    brands,
    species,
    minPrice,
    maxPrice,
    stock,
  } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      q={q}
      brands={brands}
      species={species}
      minPrice={minPrice}
      maxPrice={maxPrice}
      stock={stock}
    />
  )
}
