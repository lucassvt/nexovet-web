import type { ClubSaldo } from "@lib/data/club"

const TIPO_LABEL: Record<string, string> = {
  REGISTRO: "Bienvenida",
  COMPRA: "Compra",
  CANJE: "Canje",
  CUMPLEANOS: "Cumpleaños",
  EXPIRACION: "Expiración",
  AJUSTE_MANUAL: "Ajuste",
}

const CANAL_LABEL: Record<string, string> = {
  ecommerce_propio: "Tienda online",
  tn_noa: "Tiendanube NOA",
  tn_neu: "Tiendanube NEU",
  sucursal_fisica: "Sucursal",
  televet: "Televet",
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export default function LoyaltyHistory({ saldo }: { saldo: ClubSaldo | null }) {
  if (!saldo) {
    return (
      <div className="p-6 rounded-xl border border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          No pudimos cargar tu historial. Intentá nuevamente.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase" style={{ color: "#0d1816" }}>
          Historial de puntos
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Saldo actual:{" "}
          <strong style={{ color: "#f6a906" }}>{saldo.balance} puntos</strong> · Nivel{" "}
          <strong>{saldo.tier.name}</strong>
        </p>
      </div>

      {saldo.history.length === 0 ? (
        <div className="p-6 rounded-xl border border-gray-100 text-center">
          <p className="text-sm text-gray-500">Todavía no tenés movimientos.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2 pr-4 font-semibold">Fecha</th>
                <th className="py-2 pr-4 font-semibold">Tipo</th>
                <th className="py-2 pr-4 font-semibold">Motivo</th>
                <th className="py-2 pr-4 font-semibold">Canal</th>
                <th className="py-2 pr-4 font-semibold text-right">Puntos</th>
                <th className="py-2 pr-4 font-semibold">Vence</th>
              </tr>
            </thead>
            <tbody>
              {saldo.history.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{formatDate(row.created_at)}</td>
                  <td className="py-2 pr-4">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase"
                      style={{
                        background: row.points < 0 ? "#fde7e7" : "#e7f5ef",
                        color: row.points < 0 ? "#9e2e2e" : "#1f7a4f",
                      }}
                    >
                      {TIPO_LABEL[row.tipo] || row.tipo}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{row.motivo || "—"}</td>
                  <td className="py-2 pr-4 text-gray-500 text-xs">
                    {row.source_canal ? CANAL_LABEL[row.source_canal] || row.source_canal : "—"}
                  </td>
                  <td
                    className="py-2 pr-4 text-right font-bold"
                    style={{ color: row.points < 0 ? "#9e2e2e" : "#0d1816" }}
                  >
                    {row.points > 0 ? `+${row.points}` : row.points}
                  </td>
                  <td className="py-2 pr-4 text-gray-500 text-xs">
                    {row.expires_at ? formatDate(row.expires_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
