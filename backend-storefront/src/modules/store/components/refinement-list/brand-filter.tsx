"use client"

export type BrandOption = {
  value: string
  label: string
  count?: number
}

type BrandFilterProps = {
  options: BrandOption[]
  selected: string[]
  onToggle: (value: string) => void
}

const BrandFilter = ({ options, selected, onToggle }: BrandFilterProps) => {
  if (!options.length) {
    return (
      <p className="text-xs text-gray-500 font-montserrat">
        No hay marcas disponibles.
      </p>
    )
  }

  return (
    <ul className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
      {options.map((opt) => {
        const checked = selected.includes(opt.value)
        return (
          <li key={opt.value}>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(opt.value)}
                className="h-4 w-4 rounded border-gray-300 text-[#f6a906] focus:ring-[#f6a906]"
              />
              <span
                className={`flex-1 text-sm font-montserrat transition ${
                  checked
                    ? "font-semibold text-[#0d1816]"
                    : "text-[#0d1816] group-hover:text-[#f6a906]"
                }`}
              >
                {opt.label}
              </span>
              {typeof opt.count === "number" && (
                <span className="text-xs text-gray-500">({opt.count})</span>
              )}
            </label>
          </li>
        )
      })}
    </ul>
  )
}

export default BrandFilter
