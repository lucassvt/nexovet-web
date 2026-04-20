"use client"

import { ReactNode, useState } from "react"

type FilterSectionProps = {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  "data-testid"?: string
}

const FilterSection = ({
  title,
  defaultOpen = true,
  children,
  "data-testid": dataTestId,
}: FilterSectionProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      data-testid={dataTestId}
      className="border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-left font-montserrat text-sm font-semibold uppercase tracking-wide text-[#0d1816] hover:text-[#f6a906] transition"
        aria-expanded={open}
      >
        <span>{title}</span>
        <svg
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
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
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

export default FilterSection
