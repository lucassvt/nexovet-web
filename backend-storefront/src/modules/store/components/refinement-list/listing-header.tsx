"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import SearchBar from "./search-bar"
import SortProducts, { SortOptions } from "./sort-products"

type ListingHeaderProps = {
  sortBy: SortOptions
  totalCount?: number
  enableSearch?: boolean
  "data-testid"?: string
}

const ListingHeader = ({
  sortBy,
  totalCount,
  enableSearch = true,
  "data-testid": dataTestId,
}: ListingHeaderProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams)
      mutate(params)
      params.delete("page")
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const setSort = (_name: string, value: SortOptions) => {
    push((p) => p.set("sortBy", value))
  }

  const setQuery = (q: string) => {
    push((p) => {
      if (q.trim()) p.set("q", q.trim())
      else p.delete("q")
    })
  }

  const currentQ = searchParams.get("q") ?? ""

  return (
    <div
      data-testid={dataTestId}
      className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between mb-5"
    >
      <div className="flex items-center gap-3">
        {enableSearch && (
          <SearchBar initialValue={currentQ} onSubmit={setQuery} />
        )}
        {typeof totalCount === "number" && (
          <span className="text-xs font-montserrat text-gray-500 whitespace-nowrap hidden small:inline">
            {totalCount} producto{totalCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-montserrat text-gray-500 hidden small:inline">
          Ordenar por:
        </span>
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setSort}
          data-testid="sort-select"
        />
      </div>
    </div>
  )
}

export default ListingHeader
