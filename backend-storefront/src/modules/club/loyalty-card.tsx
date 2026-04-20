import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { ClubSaldo } from "@lib/data/club"

const TIER_COLORS: Record<string, string> = {
  Bronce: "#cd7f32",
  Plata: "#9ea0a5",
  Oro: "#f6a906",
  Platino: "#2e9e8a",
}

function formatArs(amount: number): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${amount.toLocaleString("es-AR")}`
  }
}

export default function LoyaltyCard({ saldo }: { saldo: ClubSaldo | null }) {
  if (!saldo) {
    return (
      <div
        className="w-full rounded-xl p-6 flex flex-col gap-3"
        style={{ background: "#0d1816", color: "#fff" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f6a906" }}>
            Club La Mascotera
          </span>
        </div>
        <h3 className="text-xl font-black uppercase">Sumate al Club</h3>
        <p className="text-sm opacity-80">
          No pudimos cargar tu saldo. Recargá la página o contactanos si el problema persiste.
        </p>
        <LocalizedClientLink
          href="/club"
          className="mt-2 inline-block text-xs font-bold uppercase underline"
          style={{ color: "#f6a906" }}
        >
          Conocé los beneficios
        </LocalizedClientLink>
      </div>
    )
  }

  const tierColor = TIER_COLORS[saldo.tier.name] || "#f6a906"
  const nextSpend = saldo.tier.next_spend
  const pct =
    nextSpend && nextSpend > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((saldo.spent_year_ars - saldo.tier.min_spend) /
              (nextSpend - saldo.tier.min_spend)) *
              100
          )
        )
      : 100
  const faltante = nextSpend ? Math.max(0, nextSpend - saldo.spent_year_ars) : 0

  return (
    <div
      className="w-full rounded-xl p-6 flex flex-col gap-4"
      style={{ background: "#0d1816", color: "#fff" }}
      data-testid="loyalty-card"
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#f6a906" }}
        >
          Club La Mascotera
        </span>
        <span
          className="text-[10px] font-bold uppercase px-2 py-1 rounded"
          style={{ background: tierColor, color: "#0d1816" }}
          data-testid="loyalty-tier"
        >
          {saldo.tier.name} · {saldo.tier.multiplier}x
        </span>
      </div>

      <div className="flex items-end gap-3">
        <span
          className="text-5xl font-black leading-none"
          style={{ color: "#f6a906" }}
          data-testid="loyalty-balance"
        >
          {saldo.balance}
        </span>
        <span className="text-sm font-semibold uppercase opacity-70 mb-1">puntos</span>
      </div>

      {nextSpend !== null && (
        <div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: "#f6a906" }}
            />
          </div>
          <p className="text-xs mt-2 opacity-80">
            Te faltan <strong>{formatArs(faltante)}</strong> para subir al siguiente nivel.
          </p>
        </div>
      )}
      {nextSpend === null && (
        <p className="text-xs opacity-80">
          Estás en el nivel máximo. Seguí disfrutando todos los beneficios.
        </p>
      )}

      <ul className="text-xs space-y-1 opacity-90">
        {saldo.tier.perks.map((p) => (
          <li key={p}>· {p}</li>
        ))}
      </ul>

      <div className="flex gap-2 mt-2">
        <LocalizedClientLink
          href="/account/loyalty"
          className="flex-1 text-center text-xs font-bold uppercase py-2 rounded"
          style={{ background: "#f6a906", color: "#0d1816" }}
        >
          Ver historial
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/club"
          className="flex-1 text-center text-xs font-bold uppercase py-2 rounded border"
          style={{ borderColor: "#f6a906", color: "#f6a906" }}
        >
          Beneficios
        </LocalizedClientLink>
      </div>
    </div>
  )
}
