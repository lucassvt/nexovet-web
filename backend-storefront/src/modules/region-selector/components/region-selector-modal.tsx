"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  REGIONS_HUB,
  REGION_COOKIE,
  REGION_COOKIE_MAX_AGE,
  SALES_CHANNEL_COOKIE,
  RegionHubEntry,
  buildRegionUrl,
} from "@lib/data/regions-hub"

export const REGION_SELECTOR_OPEN_EVENT = "nxv:open-region-selector"

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
  )
  return match ? decodeURIComponent(match[1]) : undefined
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return
  const secure = typeof window !== "undefined" && window.location.protocol === "https:"
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; Max-Age=" +
    maxAgeSeconds +
    "; Path=/; SameSite=Lax" +
    (secure ? "; Secure" : "")
}

async function detectRegionByIp(): Promise<string | undefined> {
  // Detección no bloqueante. Usamos un servicio público gratuito como sugerencia.
  // Si falla, no pasa nada: el usuario elige manualmente.
  try {
    const res = await fetch("https://ipapi.co/json/", {
      cache: "no-store",
      // timeout via AbortController
    })
    if (!res.ok) return undefined
    const data = (await res.json()) as {
      region?: string
      region_code?: string
      country?: string
      city?: string
    }
    if (data.country && data.country !== "AR") return undefined
    const haystack = [data.region, data.region_code, data.city]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase().trim())
    if (!haystack.length) return undefined
    for (const region of REGIONS_HUB) {
      if (!region.matchProvinces?.length) continue
      for (const token of region.matchProvinces) {
        const t = token.toLowerCase()
        if (haystack.some((h) => h === t || h.includes(t) || t.includes(h))) {
          return region.key
        }
      }
    }
  } catch {
    return undefined
  }
  return undefined
}

interface Props {
  /** Si true, fuerza abrir al montar aunque haya cookie (ej. página de ajustes). */
  forceOpen?: boolean
}

export default function RegionSelectorModal({ forceOpen = false }: Props) {
  const [open, setOpen] = useState(false)
  const [suggested, setSuggested] = useState<string | undefined>(undefined)
  const [remember, setRemember] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Inicialización: decidir si mostrar en base a cookie + escuchar evento.
  useEffect(() => {
    setMounted(true)
    const existing = readCookie(REGION_COOKIE)
    if (!existing || forceOpen) {
      setOpen(true)
    }
    // IP detection (no bloquea el render del modal).
    detectRegionByIp().then((key) => {
      if (key) setSuggested(key)
    })
    // Listener para reabrir modal desde la pill u otros componentes.
    const handler = () => setOpen(true)
    window.addEventListener(REGION_SELECTOR_OPEN_EVENT, handler)
    return () => window.removeEventListener(REGION_SELECTOR_OPEN_EVENT, handler)
  }, [forceOpen])

  // Bloquear scroll del body cuando el modal está abierto.
  useEffect(() => {
    if (!mounted) return
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open, mounted])

  const handleSelect = useCallback(
    (region: RegionHubEntry) => {
      if (remember) {
        writeCookie(REGION_COOKIE, region.key, REGION_COOKIE_MAX_AGE)
        if (region.salesChannelId) {
          writeCookie(SALES_CHANNEL_COOKIE, region.salesChannelId, REGION_COOKIE_MAX_AGE)
        }
      }
      const url = buildRegionUrl(region)
      if (region.kind === "tiendanube") {
        window.location.href = url
        return
      }
      setOpen(false)
      // Navegación interna: usamos href directo para forzar que el servidor vea la cookie.
      if (typeof window !== "undefined") {
        window.location.href = url
      }
    },
    [remember]
  )

  const sortedRegions = useMemo(() => {
    if (!suggested) return REGIONS_HUB
    const idx = REGIONS_HUB.findIndex((r) => r.key === suggested)
    if (idx < 0) return REGIONS_HUB
    const copy = REGIONS_HUB.slice()
    const [s] = copy.splice(idx, 1)
    copy.unshift(s)
    return copy
  }, [suggested])

  if (!mounted || !open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nxv-region-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(13, 24, 22, 0.78)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "Montserrat, system-ui, sans-serif",
      }}
      onClick={(e) => {
        // Solo cierra si hay cookie previa (primer ingreso obliga a elegir).
        if (e.target === e.currentTarget && readCookie(REGION_COOKIE)) {
          setOpen(false)
        }
      }}
    >
      <div
        style={{
          background: "#fff",
          color: "#0d1816",
          borderRadius: "18px",
          maxWidth: "780px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          border: "3px solid #f6a906",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 1.75rem 1rem",
            borderBottom: "1px solid #eee",
            position: "relative",
          }}
        >
          {readCookie(REGION_COOKIE) && (
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.9rem",
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#0d1816",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/images/brand/logo.png"
              alt="La Mascotera"
              style={{ height: "40px", width: "auto" }}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
            <div>
              <h2
                id="nxv-region-title"
                style={{
                  margin: 0,
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                Seleccioná tu región
              </h2>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.9rem",
                  color: "#4a5a57",
                  fontWeight: 500,
                }}
              >
                Elegí tu ubicación para ver productos y ofertas disponibles en tu zona.
              </p>
            </div>
          </div>
          {suggested && (
            <div
              style={{
                marginTop: "0.9rem",
                fontSize: "0.82rem",
                color: "#0d1816",
                background: "rgba(46,158,138,0.12)",
                border: "1px solid rgba(46,158,138,0.35)",
                padding: "0.45rem 0.7rem",
                borderRadius: "999px",
                display: "inline-block",
                fontWeight: 600,
              }}
            >
              📍 Detectamos que estás cerca de{" "}
              <strong>
                {REGIONS_HUB.find((r) => r.key === suggested)?.name ?? ""}
              </strong>
            </div>
          )}
        </div>

        {/* Grid */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {sortedRegions.map((region) => {
            const isSuggested = suggested === region.key
            return (
              <button
                key={region.key}
                type="button"
                onClick={() => handleSelect(region)}
                style={{
                  position: "relative",
                  background: isSuggested ? "#f6a906" : "#fff",
                  color: "#0d1816",
                  border: isSuggested ? "2px solid #f6a906" : "2px solid #e6e6e6",
                  borderRadius: "14px",
                  padding: "1rem 0.75rem",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.18s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.35rem",
                  minHeight: "120px",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (!isSuggested) {
                    e.currentTarget.style.borderColor = "#2e9e8a"
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow =
                      "0 8px 18px rgba(46,158,138,0.18)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSuggested) {
                    e.currentTarget.style.borderColor = "#e6e6e6"
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }
                }}
              >
                <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>
                  {region.emoji}
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    lineHeight: 1.15,
                  }}
                >
                  {region.name}
                </span>
                {region.kind === "tiendanube" && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: isSuggested ? "#0d1816" : "#2e9e8a",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Tienda externa ↗
                  </span>
                )}
                {region.description && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: isSuggested ? "#0d1816" : "#6b7a77",
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}
                  >
                    {region.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.75rem 1.4rem",
            borderTop: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "#0d1816",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "#2e9e8a",
                cursor: "pointer",
              }}
            />
            Recordar mi selección
          </label>
          <span
            style={{
              fontSize: "0.72rem",
              color: "#6b7a77",
              fontWeight: 500,
            }}
          >
            Podés cambiarla cuando quieras desde la pill del menú.
          </span>
        </div>
      </div>
    </div>
  )
}
