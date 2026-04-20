"use client"

import { useEffect, useState } from "react"
import {
  REGIONS_HUB,
  REGION_COOKIE,
  findRegionByKey,
} from "@lib/data/regions-hub"
import { REGION_SELECTOR_OPEN_EVENT } from "./region-selector-modal"

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
  )
  return match ? decodeURIComponent(match[1]) : undefined
}

export default function RegionPill() {
  const [regionKey, setRegionKey] = useState<string | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setRegionKey(readCookie(REGION_COOKIE))

    // Re-lee la cookie si vuelve el foco (el usuario quizá eligió en otro tab).
    const onFocus = () => setRegionKey(readCookie(REGION_COOKIE))
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  if (!mounted) return null

  const region = findRegionByKey(regionKey) ?? REGIONS_HUB[0]
  const label = regionKey ? region.name : "Elegir región"

  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event(REGION_SELECTOR_OPEN_EVENT))
      }}
      aria-label={`Región actual: ${label}. Click para cambiar.`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        background: "#0d1816",
        color: "#fff",
        border: "2px solid #f6a906",
        borderRadius: "999px",
        padding: "0.28rem 0.75rem",
        fontSize: "0.78rem",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        whiteSpace: "nowrap",
        lineHeight: 1.1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)"
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(246,169,6,0.35)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <span aria-hidden="true">📍</span>
      <span>{label}</span>
      <span
        style={{
          opacity: 0.75,
          fontWeight: 600,
          fontSize: "0.7rem",
          color: "#f6a906",
        }}
      >
        · Cambiar
      </span>
    </button>
  )
}
