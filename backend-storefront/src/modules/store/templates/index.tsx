import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { buildFacets } from "@lib/util/build-facets"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import ListingHeader from "@modules/store/components/refinement-list/listing-header"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts, { PaginatedFilters } from "./paginated-products"

type StoreTemplateProps = {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  q?: string
  brands?: string
  species?: string
  minPrice?: string
  maxPrice?: string
  stock?: string
}

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  q,
  brands,
  species,
  minPrice,
  maxPrice,
  stock,
}: StoreTemplateProps) => {
  const pageNumber = page ? parseInt(page, 10) : 1
  const sort: SortOptions = sortBy || "best_selling"

  const [categories, facets] = await Promise.all([
    listCategories().catch(() => []),
    buildFacets({ countryCode }),
  ])

  const filters: PaginatedFilters = {
    q: q || undefined,
    brands: brands ? brands.split(",").filter(Boolean) : undefined,
    species: species ? species.split(",").filter(Boolean) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStockOnly: stock === "1",
  }

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container font-montserrat"
      data-testid="category-container"
    >
      <RefinementList
        categories={categories}
        brands={facets.brands}
        species={facets.species}
        priceBounds={facets.priceBounds}
      />
      <div className="w-full">
        <div className="mb-4 text-2xl font-semibold text-[#0d1816]">
          <h1 data-testid="store-page-title">Todos los productos</h1>
        </div>
        <ListingHeader sortBy={sort} totalCount={facets.totalProducts} />
        <Suspense fallback={<SkeletonProductGrid numberOfProducts={8} />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            filters={filters}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
