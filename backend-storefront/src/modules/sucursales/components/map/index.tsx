"use client"

import { useEffect, useRef, useState } from "react"

type Point = { nombre: string; lat: number; lng: number; direccion: string; color: string }

// Coordenadas aproximadas por ciudad (aprox centros urbanos); refinar con dirección exacta más adelante
const POINTS: Point[] = [
  // Tucumán
  { nombre: "Sucursal Alem (Tucumán)", lat: -26.8241, lng: -65.2226, direccion: "Av. Alem 532, San Miguel de Tucumán", color: "#f6a906" },
  { nombre: "Banda del Río Salí", lat: -26.8464, lng: -65.1844, direccion: "Banda del Río Salí", color: "#f6a906" },
  { nombre: "Yerba Buena", lat: -26.8161, lng: -65.3183, direccion: "Yerba Buena, Tucumán", color: "#f6a906" },
  { nombre: "Concepción (Tucumán)", lat: -27.3403, lng: -65.5911, direccion: "Concepción, Tucumán", color: "#f6a906" },
  { nombre: "Tafí Viejo", lat: -26.7303, lng: -65.2594, direccion: "Tafí Viejo, Tucumán", color: "#f6a906" },
  // Salta
  { nombre: "Leguizamón (Salta)", lat: -24.7859, lng: -65.4117, direccion: "Leguizamón 899, Salta Capital", color: "#2e9e8a" },
  { nombre: "Orán", lat: -23.1333, lng: -64.3167, direccion: "Orán, Salta", color: "#2e9e8a" },
  // Neuquén
  { nombre: "Neuquén Olascoaga", lat: -38.9516, lng: -68.0591, direccion: "Olascoaga, Neuquén Capital", color: "#f6a906" },
  { nombre: "Zapala", lat: -38.8958, lng: -70.0639, direccion: "Zapala, Neuquén", color: "#f6a906" },
  // Jujuy
  { nombre: "Jujuy Lamadrid", lat: -24.1858, lng: -65.2995, direccion: "Lamadrid, San Salvador de Jujuy", color: "#2e9e8a" },
  // Catamarca
  { nombre: "Catamarca Capital", lat: -28.4696, lng: -65.7852, direccion: "San Fernando del Valle de Catamarca", color: "#f6a906" },
  // Chaco
  { nombre: "Resistencia (Chaco)", lat: -27.4519, lng: -58.9867, direccion: "Resistencia, Chaco", color: "#2e9e8a" },
  // Córdoba
  { nombre: "Córdoba Capital", lat: -31.4201, lng: -64.1888, direccion: "Córdoba Capital (Rumipet)", color: "#f6a906" },
  // Mendoza
  { nombre: "Godoy Cruz (Mendoza)", lat: -32.9259, lng: -68.841, direccion: "Godoy Cruz, Mendoza", color: "#2e9e8a" },
  { nombre: "Las Heras (Mendoza)", lat: -32.8509, lng: -68.8251, direccion: "Las Heras, Mendoza", color: "#2e9e8a" },
]

export default function SucursalesMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!mapRef.current || loaded) return
    // Inject Leaflet CSS + JS from CDN (no build deps)
    const cssId = "leaflet-css"
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link")
      link.id = cssId
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      link.crossOrigin = ""
      document.head.appendChild(link)
    }
    const scriptId = "leaflet-js"
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null
    const init = () => {
      const L = (window as any).L
      if (!L || !mapRef.current) return
      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(
        [-29, -65],
        5
      )
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '© OpenStreetMap',
      }).addTo(map)
      const markers: any[] = []
      POINTS.forEach((p) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;background:${p.color};border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:#0d1816;font-weight:900;font-size:14px;">🐾</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map)
        marker.bindPopup(
          `<div style="font-family:system-ui;min-width:180px"><b>${p.nombre}</b><br><small>${p.direccion}</small><br><a href="https://www.google.com/maps/search/${encodeURIComponent(p.direccion)}" target="_blank" style="color:#f6a906;font-weight:600">Cómo llegar →</a></div>`
        )
        markers.push(marker)
      })
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.2))
      setLoaded(true)
    }
    if (existingScript && (window as any).L) {
      init()
    } else if (!existingScript) {
      const s = document.createElement("script")
      s.id = scriptId
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      s.crossOrigin = ""
      s.onload = init
      document.body.appendChild(s)
    }
  }, [loaded])

  return (
    <div>
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border-2 border-gray-200"
        style={{ height: "500px", background: "#e5e7eb" }}
      />
      <p className="text-xs text-gray-500 mt-3 text-center">
        📍 Ubicaciones aproximadas por ciudad — tocá un marcador para dirección exacta y cómo llegar.
      </p>
    </div>
  )
}
