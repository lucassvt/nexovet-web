"use client"

export type ActiveChip = {
  id: string
  label: string
  onRemove: () => void
}

type ActiveFilterChipsProps = {
  chips: ActiveChip[]
  onClearAll?: () => void
}

const ActiveFilterChips = ({ chips, onClearAll }: ActiveFilterChipsProps) => {
  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-full bg-[#f6a906]/10 px-3 py-1 text-xs font-montserrat text-[#0d1816] border border-[#f6a906]/40 hover:bg-[#f6a906]/20 transition"
        >
          <span>{chip.label}</span>
          <svg
            aria-hidden="true"
            className="h-3 w-3 text-gray-500 group-hover:text-[#0d1816]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-montserrat text-[#2e9e8a] hover:underline ml-1"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

export default ActiveFilterChips
