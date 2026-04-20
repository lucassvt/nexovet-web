"use client"

import { useEffect, useRef, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { sdk } from "@lib/config"

type Suggestion = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  brand?: string
}

const MEDUSA_REGION_ID = "reg_01KPKCG4EBTD2AJEXKQVCEECQB" // Argentina

export default function SearchAutosuggest({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("")
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("click", onClickOutside)
    return () => document.removeEventListener("click", onClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 3) {
      setItems([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await sdk.client.fetch<{ products: any[] }>(
          `/store/products`,
          {
            method: "GET",
            query: {
              q,
              region_id: MEDUSA_REGION_ID,
              limit: 6,
              fields: "+thumbnail,+metadata",
            },
          }
        )
        const suggestions: Suggestion[] = (res.products || []).map((p) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          thumbnail: p.thumbnail,
          brand: p.metadata?.dux_marca_nombre || p.metadata?.tn_marca || null,
        }))
        setItems(suggestions)
      } catch (err) {
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [q])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form action="/ar/store" method="GET" className="flex items-center gap-1">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar productos, marcas..."
          className="text-sm px-3 py-1.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906] w-64"
          autoComplete="off"
        />
        <button
          type="submit"
          className="text-sm px-3 py-1.5 rounded font-semibold transition-colors"
          style={{ background: "#f6a906", color: "#0d1816" }}
        >
          🔍
        </button>
      </form>
      {open && q.trim().length >= 3 && (
        <div
          className="absolute top-full mt-2 left-0 w-[380px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {loading && (
            <div className="px-4 py-4 text-xs text-gray-500">Buscando…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-4 py-4 text-sm text-gray-500">
              Sin resultados para <b>{q}</b>
            </div>
          )}
          {!loading && items.length > 0 && (
            <ul>
              {items.map((it) => (
                <li key={it.id}>
                  <LocalizedClientLink
                    href={`/products/${it.handle}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#fafafa] transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden"
                    >
                      {it.thumbnail ? (
                        <img
                          src={it.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🐾</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {it.brand && (
                        <div
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: "#f6a906" }}
                        >
                          {it.brand}
                        </div>
                      )}
                      <div
                        className="text-sm font-semibold leading-tight line-clamp-2"
                        style={{ color: "#0d1816" }}
                      >
                        {it.title}
                      </div>
                    </div>
                  </LocalizedClientLink>
                </li>
              ))}
              <li
                className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider"
                style={{ background: "#fafafa", color: "#0d1816" }}
              >
                <LocalizedClientLink
                  href={`/store?q=${encodeURIComponent(q)}`}
                  onClick={() => setOpen(false)}
                  className="hover:underline"
                  style={{ color: "#f6a906" }}
                >
                  Ver todos los resultados para "{q}" →
                </LocalizedClientLink>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
