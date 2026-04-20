import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

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

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<SearchParams>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = productCategory.name + " | Nexovet"
    const description = productCategory.description ?? `${title} category.`

    return {
      title: `${title} | Nexovet`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
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

  const productCategory = await getCategoryByHandle(params.category)
  if (!productCategory) notFound()

  return (
    <CategoryTemplate
      category={productCategory}
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
