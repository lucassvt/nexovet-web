"use client"

export type SortOptions =
  | "best_selling"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "best_selling", label: "Mas vendidos" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "title_asc", label: "A - Z" },
  { value: "created_at", label: "Recien ingresados" },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  return (
    <div className="relative inline-block" data-testid={dataTestId}>
      <label className="sr-only" htmlFor="sort-by-select">
        Ordenar por
      </label>
      <select
        id="sort-by-select"
        value={sortBy}
        onChange={(e) => setQueryParams("sortBy", e.target.value as SortOptions)}
        className="appearance-none bg-white border border-gray-200 rounded-md py-2 pl-3 pr-9 text-sm font-montserrat text-[#0d1816] hover:border-[#f6a906] focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-transparent transition cursor-pointer"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  )
}

export default SortProducts
