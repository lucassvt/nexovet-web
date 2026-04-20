"use client"

type StockFilterProps = {
  inStockOnly: boolean
  onChange: (next: boolean) => void
}

const StockFilter = ({ inStockOnly, onChange }: StockFilterProps) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={inStockOnly}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-[#f6a906] focus:ring-[#f6a906]"
      />
      <span
        className={`text-sm font-montserrat transition ${
          inStockOnly
            ? "font-semibold text-[#0d1816]"
            : "text-[#0d1816] group-hover:text-[#f6a906]"
        }`}
      >
        Solo con stock disponible
      </span>
    </label>
  )
}

export default StockFilter
