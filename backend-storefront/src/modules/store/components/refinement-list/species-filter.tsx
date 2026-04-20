"use client"

export type SpeciesOption = {
  value: string
  label: string
  count?: number
}

type SpeciesFilterProps = {
  options: SpeciesOption[]
  selected: string[]
  onToggle: (value: string) => void
}

const SpeciesFilter = ({
  options,
  selected,
  onToggle,
}: SpeciesFilterProps) => {
  if (!options.length) {
    return (
      <p className="text-xs text-gray-500 font-montserrat">
        No hay especies disponibles.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            aria-pressed={active}
            className={`px-3 py-1.5 text-xs font-montserrat rounded-full border transition ${
              active
                ? "bg-[#2e9e8a] border-[#2e9e8a] text-white"
                : "bg-white border-gray-200 text-[#0d1816] hover:border-[#2e9e8a] hover:text-[#2e9e8a]"
            }`}
          >
            {opt.label}
            {typeof opt.count === "number" && (
              <span className="ml-1 opacity-75">({opt.count})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SpeciesFilter
