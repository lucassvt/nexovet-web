"use client"

import { useEffect, useState } from "react"

type PriceFilterProps = {
  bounds: { min: number; max: number }
  value: { min?: number; max?: number }
  onCommit: (next: { min?: number; max?: number }) => void
}

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

const PriceFilter = ({ bounds, value, onCommit }: PriceFilterProps) => {
  const [localMin, setLocalMin] = useState<number>(value.min ?? bounds.min)
  const [localMax, setLocalMax] = useState<number>(value.max ?? bounds.max)

  useEffect(() => {
    setLocalMin(value.min ?? bounds.min)
    setLocalMax(value.max ?? bounds.max)
  }, [value.min, value.max, bounds.min, bounds.max])

  const commit = (nextMin: number, nextMax: number) => {
    const min = Math.max(bounds.min, Math.min(nextMin, nextMax))
    const max = Math.min(bounds.max, Math.max(nextMin, nextMax))
    onCommit({
      min: min === bounds.min ? undefined : min,
      max: max === bounds.max ? undefined : max,
    })
  }

  if (bounds.max <= bounds.min) {
    return (
      <p className="text-xs text-gray-500 font-montserrat">
        No hay rango disponible.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-montserrat text-[#0d1816]">
        <span>{formatARS(localMin)}</span>
        <span>{formatARS(localMax)}</span>
      </div>
      <div className="relative h-6">
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={localMin}
          onChange={(e) => setLocalMin(Number(e.target.value))}
          onMouseUp={() => commit(localMin, localMax)}
          onTouchEnd={() => commit(localMin, localMax)}
          onKeyUp={() => commit(localMin, localMax)}
          aria-label="Precio minimo"
          className="range-thumb absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-auto"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={localMax}
          onChange={(e) => setLocalMax(Number(e.target.value))}
          onMouseUp={() => commit(localMin, localMax)}
          onTouchEnd={() => commit(localMin, localMax)}
          onKeyUp={() => commit(localMin, localMax)}
          aria-label="Precio maximo"
          className="range-thumb absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-auto"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[11px] font-montserrat text-gray-500 block mb-1">
            Min
          </label>
          <input
            type="number"
            min={bounds.min}
            max={bounds.max}
            value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))}
            onBlur={() => commit(localMin, localMax)}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-montserrat focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#f6a906]"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-montserrat text-gray-500 block mb-1">
            Max
          </label>
          <input
            type="number"
            min={bounds.min}
            max={bounds.max}
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            onBlur={() => commit(localMin, localMax)}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-montserrat focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#f6a906]"
          />
        </div>
      </div>
      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #f6a906;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          pointer-events: auto;
        }
        .range-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #f6a906;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          pointer-events: auto;
        }
        .range-thumb::-webkit-slider-runnable-track {
          height: 4px;
          background: #e5e7eb;
          border-radius: 9999px;
        }
        .range-thumb::-moz-range-track {
          height: 4px;
          background: #e5e7eb;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  )
}

export default PriceFilter
