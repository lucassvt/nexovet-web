import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products client-side until the Medusa store API
 * supports all sort options natively.
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = products as MinPricedProduct[]

  if (sortBy === "price_asc" || sortBy === "price_desc") {
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    sortedProducts.sort((a, b) => {
      const diff = (a._minPrice ?? 0) - (b._minPrice ?? 0)
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
      )
    })
  }

  if (sortBy === "title_asc") {
    sortedProducts.sort((a, b) =>
      (a.title ?? "").localeCompare(b.title ?? "", "es", { sensitivity: "base" })
    )
  }

  if (sortBy === "best_selling") {
    // No "times sold" field on the storefront product; fall back to
    // "created_at" descending so the newest (and usually trending) go first.
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
      )
    })
  }

  return sortedProducts
}
