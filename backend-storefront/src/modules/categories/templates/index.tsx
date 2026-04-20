import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { buildFacets } from "@lib/util/build-facets"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import ListingHeader from "@modules/store/components/refinement-list/listing-header"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts, {
  PaginatedFilters,
} from "@modules/store/templates/paginated-products"

type CategoryTemplateProps = {
  category: HttpTypes.StoreProductCategory
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

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  q,
  brands,
  species,
  minPrice,
  maxPrice,
  stock,
}: CategoryTemplateProps) {
  const pageNumber = page ? parseInt(page, 10) : 1
  const sort: SortOptions = sortBy || "best_selling"

  if (!category || !countryCode) notFound()

  const parents: HttpTypes.StoreProductCategory[] = []
  const getParents = (c: HttpTypes.StoreProductCategory) => {
    if (c.parent_category) {
      parents.push(c.parent_category)
      getParents(c.parent_category)
    }
  }
  getParents(category)

  const [allCategories, facets] = await Promise.all([
    listCategories().catch(() => []),
    buildFacets({ countryCode, categoryId: category.id }),
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
        categories={allCategories}
        brands={facets.brands}
        species={facets.species}
        priceBounds={facets.priceBounds}
        currentCategoryHandle={category.handle}
        data-testid="sort-by-container"
      />
      <div className="w-full">
        <div className="flex flex-row mb-4 text-2xl font-semibold gap-3 text-[#0d1816]">
          {parents.length > 0 &&
            parents.reverse().map((parent) => (
              <span key={parent.id} className="text-gray-500">
                <LocalizedClientLink
                  className="mr-3 hover:text-[#f6a906] transition"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                <span className="mr-3">/</span>
              </span>
            ))}
          <h1 data-testid="category-page-title">{category.name}</h1>
        </div>
        {category.description && (
          <p className="mb-4 text-sm text-gray-600 max-w-3xl">
            {category.description}
          </p>
        )}
        {category.category_children && category.category_children.length > 0 && (
          <div className="mb-5">
            <ul className="flex flex-wrap gap-2">
              {category.category_children.map((c) => (
                <li key={c.id}>
                  <InteractiveLink href={`/categories/${c.handle}`}>
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ListingHeader sortBy={sort} totalCount={facets.totalProducts} />
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
            filters={filters}
          />
        </Suspense>
      </div>
    </div>
  )
}
