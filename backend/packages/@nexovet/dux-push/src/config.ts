/**
 * Configuración centralizada del plugin @nexovet/dux-push.
 *
 * Lee variables de entorno y expone constantes tipadas para el resto del
 * paquete. NO tocar secretos acá — siempre vía `process.env`.
 */

export type DuxErpTarget = "central" | "franquicias"

export interface DuxTargetConfig {
  baseUrl: string
  token: string
  empresaId: number
}

export interface DuxPushRegionRoute {
  target: DuxErpTarget
  idDeposito: number
  /** Nombre humano, usado solo para logging/alerting. */
  label: string
}

/**
 * Mapa `sales_channel_id` → routing DUX.
 *
 * - Salta Leguizamón → Central (la empresa dueña del ecommerce).
 * - El resto (franquicias) → Franquicias.
 *
 * Los `id_deposito` salen de `dux_integrada.depositos` y
 * `dux_integrada.depositos_franquicia`. En DUX, el `id_deposito` también
 * sirve como `id_sucursal` para el endpoint `/pedidos`.
 */
export const REGION_ROUTING: Record<string, DuxPushRegionRoute> = {
  // Central
  sc_01KPKCJEEJ2B9HAXTGABMZMX1Q: {
    target: "central",
    idDeposito: 18498,
    label: "Salta Leguizamón",
  },

  // Franquicias
  sc_01KPKCJEBCTA782VXEHJ128E5Q: {
    target: "franquicias",
    idDeposito: 18353,
    label: "Catamarca",
  },
  sc_01KPKCJECAFV4TNC2FK9DP99DJ: {
    target: "franquicias",
    idDeposito: 20585,
    label: "Chaco",
  },
  sc_01KPKCJED27208QVXZSRRC1DP0: {
    target: "franquicias",
    idDeposito: 18311,
    label: "Jujuy",
  },
  sc_01KPKCJEDRCBTF9FACT926HTWG: {
    target: "franquicias",
    // Default: Mendoza Godoy Cruz. Si el order trae una shipping address que
    // matchea Las Heras, usar 19144 en el mapper (override).
    idDeposito: 20329,
    label: "Mendoza (Godoy Cruz)",
  },
  sc_01KPKCJEFDXVS09FKHQM5X5P19: {
    target: "franquicias",
    idDeposito: 18321,
    label: "Orán",
  },
  sc_01KPKCJEG7KQNYFDM2ZHETYMHN: {
    target: "franquicias",
    idDeposito: 18313,
    label: "Córdoba",
  },
  sc_01KPKCJEH1S313GZPXX6JN8Y09: {
    target: "franquicias",
    idDeposito: 17719,
    label: "Zapala",
  },
}

function readNumber(name: string, fallback?: number): number | undefined {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function getTargetConfig(target: DuxErpTarget): DuxTargetConfig {
  if (target === "central") {
    return {
      baseUrl:
        process.env.DUX_CENTRAL_BASE_URL ||
        "https://erp.duxsoftware.com.ar/WSERP/rest/services",
      token: process.env.DUX_CENTRAL_TOKEN || "",
      empresaId: readNumber("DUX_CENTRAL_EMPRESA_ID", 9425)!,
    }
  }
  return {
    baseUrl:
      process.env.DUX_FRANQUICIAS_BASE_URL ||
      "https://erp.duxsoftware.com.ar/WSERP/rest/services",
    token: process.env.DUX_FRANQUICIAS_TOKEN || "",
    // 0 = sin configurar; validado en runtime antes de postear.
    empresaId: readNumber("DUX_FRANQUICIAS_EMPRESA_ID", 0)!,
  }
}

/** Lista de precios por defecto para pedidos de ecommerce. */
export const DUX_DEFAULT_ID_LISTA_PRECIO_VENTA = 56755 // "LISTA DE PRECIOS 1 F"

/** Feature flag global: si está en `false`, el subscriber no encola nada. */
export const DUX_PUSH_ENABLED =
  (process.env.DUX_PUSH_ENABLED || "").toLowerCase() === "true"

/** Conexión Redis para BullMQ. */
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6380"

/** Backoff entre reintentos, en milisegundos. */
export const RETRY_DELAYS_MS = [
  1 * 60 * 1000, //   1 minuto
  5 * 60 * 1000, //   5 minutos
  30 * 60 * 1000, //  30 minutos
  2 * 60 * 60 * 1000, //   2 horas
  6 * 60 * 60 * 1000, //   6 horas
  24 * 60 * 60 * 1000, // 24 horas
]

/** Conexión Postgres para el log de auditoría (reutiliza DATABASE_URL de Medusa). */
export const DATABASE_URL = process.env.DATABASE_URL || ""
