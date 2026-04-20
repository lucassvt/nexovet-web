"use client"

import { useEffect, useState } from "react"

type SearchBarProps = {
  initialValue?: string
  onSubmit: (q: string) => void
}

const SearchBar = ({ initialValue = "", onSubmit }: SearchBarProps) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Debounced submit so typing doesn't spam the router
  useEffect(() => {
    const handle = setTimeout(() => {
      if (value !== initialValue) {
        onSubmit(value)
      }
    }, 400)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <form
      role="search"
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
    >
      <svg
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm font-montserrat text-[#0d1816] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#f6a906]"
      />
    </form>
  )
}

export default SearchBar
