"use client"

import { useState } from "react"

// Equivalencia real del Club La Mascotera (documentada en PLAN §6B.1):
// - pesos por punto: 90
// - multiplicadores por tier: Bronce x1, Plata x1.2, Oro x1.5, Platino x2
// - 50 puntos bienvenida al registro con mascota cargada
// - 1 punto = $90 de descuento en canjes futuros (aprox, depende del premio)

const TIERS = [
  { key: "bronce", name: "Bronce", color: "#cd7f32", multi: 1, threshold: "$0 — Inicial" },
  { key: "plata", name: "Plata", color: "#9ea0a5", multi: 1.2, threshold: "$50k anuales" },
  { key: "oro", name: "Oro", color: "#f6a906", multi: 1.5, threshold: "$200k anuales" },
  { key: "platino", name: "Platino", color: "#2e9e8a", multi: 2, threshold: "$500k anuales" },
]

const PESOS_POR_PUNTO = 90

function formatARS(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-AR")
}

export default function PointsCalculator() {
  const [amount, setAmount] = useState<number>(15000)

  const results = TIERS.map((t) => {
    const puntos = Math.floor((amount / PESOS_POR_PUNTO) * t.multi)
    const descuentoEquivalente = puntos * PESOS_POR_PUNTO
    return { ...t, puntos, descuentoEquivalente }
  })

  return (
    <div
      className="rounded-2xl overflow-hidden border-2"
      style={{ background: "#fff", borderColor: "#f6a906" }}
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex-1">
            <p
              className="text-xs uppercase tracking-widest font-bold mb-1"
              style={{ color: "#f6a906" }}
            >
              Calculadora de puntos
            </p>
            <h3
              className="text-xl md:text-2xl font-black"
              style={{ color: "#0d1816" }}
            >
              ¿Cuánto ganás en cada nivel?
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold whitespace-nowrap" style={{ color: "#0d1816" }}>
              Compra de:
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 font-bold"
                style={{ color: "#0d1816" }}
              >
                $
              </span>
              <input
                type="number"
                min={100}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="pl-8 pr-3 py-2 rounded border border-gray-300 text-base font-bold w-40 focus:outline-none focus:ring-2 focus:ring-[#f6a906] focus:border-[#f6a906]"
                style={{ color: "#0d1816" }}
              />
            </div>
          </div>
        </div>

        {/* Quick picks */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-gray-500 self-center">Pruebas rápidas:</span>
          {[5000, 15000, 30000, 50000, 90000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={
                "text-xs px-3 py-1 rounded-full border transition-colors " +
                (amount === v
                  ? "bg-[#f6a906] border-[#f6a906] text-[#0d1816] font-bold"
                  : "border-gray-200 hover:border-[#f6a906] text-gray-600")
              }
            >
              {formatARS(v)}
            </button>
          ))}
        </div>

        {/* Grid de resultados por tier */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {results.map((r) => (
            <div
              key={r.key}
              className="rounded-lg overflow-hidden border-2 hover:scale-[1.02] transition-transform"
              style={{ borderColor: r.color }}
            >
              <div
                className="px-3 py-2 text-center font-black text-xs uppercase tracking-wider"
                style={{ background: r.color, color: "#0d1816" }}
              >
                {r.name}
              </div>
              <div className="p-4 text-center">
                <div
                  className="text-3xl md:text-4xl font-black leading-none"
                  style={{ color: "#0d1816" }}
                >
                  {r.puntos}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
                  puntos
                </div>
                <div className="text-xs font-semibold mt-2" style={{ color: "#2e9e8a" }}>
                  ≈ {formatARS(r.descuentoEquivalente)} canje
                </div>
                <div className="text-[10px] text-gray-400 mt-1">x{r.multi} puntos</div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs text-gray-500 leading-relaxed">
          Equivalencia: 1 punto por cada $90 de compra (Bronce). Tu tier anual se calcula con las
          compras de los últimos 12 meses. Los puntos vencen a los 365 días — te avisamos 30, 15 y
          1 días antes por email.
        </p>
      </div>
    </div>
  )
}
