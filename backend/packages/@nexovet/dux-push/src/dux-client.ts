/**
 * Cliente HTTP a DUX ERP.
 *
 * - Routing: según `regionKey` (sales_channel_id) decide si va al ERP Central
 *   o al de Franquicias (usando un token distinto).
 * - Solo hace el POST — la idempotencia y el logging viven en `worker.ts`.
 *
 * Docs: https://duxsoftware.readme.io/reference/crear-pedido
 */

import {
  REGION_ROUTING,
  getTargetConfig,
  type DuxErpTarget,
} from "./config"
import type {
  DuxPedidoPayload,
  DuxPedidoResponse,
  DuxRouteInfo,
} from "./types"

export class DuxConfigError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = "DuxConfigError"
  }
}

export class DuxApiError extends Error {
  constructor(
    msg: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(msg)
    this.name = "DuxApiError"
  }
}

/**
 * Cliente reusable. Inyectable para tests (fetch mock).
 */
export class DuxClient {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = 20_000
  ) {}

  /**
   * Dado un `sales_channel_id` (regionKey) devuelve la config de routing.
   * Incluye el token concreto del env. Throwea si falta configuración.
   */
  routeByRegion(regionKey: string): DuxRouteInfo {
    const route = REGION_ROUTING[regionKey]
    if (!route) {
      throw new DuxConfigError(
        `No hay routing DUX configurado para region=${regionKey}`
      )
    }
    const target: DuxErpTarget = route.target
    const cfg = getTargetConfig(target)

    if (!cfg.token) {
      throw new DuxConfigError(
        `Token DUX ${target} no configurado (revisar DUX_${target.toUpperCase()}_TOKEN)`
      )
    }
    if (!cfg.empresaId) {
      throw new DuxConfigError(
        `empresaId DUX ${target} no configurado (revisar DUX_${target.toUpperCase()}_EMPRESA_ID)`
      )
    }

    return {
      target,
      baseUrl: cfg.baseUrl,
      token: cfg.token,
      empresaId: cfg.empresaId,
      idDeposito: route.idDeposito,
      regionKey,
      label: route.label,
    }
  }

  /**
   * POST /pedidos contra el ERP indicado por `route`.
   *
   * NOTA: el `id_empresa` y `id_sucursal` ya deben venir bakeados en el
   * `pedido`; este método solo agrega headers y hace el fetch.
   */
  async crearPedido(
    route: DuxRouteInfo,
    pedido: DuxPedidoPayload
  ): Promise<DuxPedidoResponse> {
    const url = `${route.baseUrl.replace(/\/$/, "")}/pedidos`

    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs)

    try {
      const res = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: route.token,
        },
        body: JSON.stringify(pedido),
        signal: ctrl.signal,
      })

      const text = await res.text()
      let body: unknown
      try {
        body = text ? JSON.parse(text) : {}
      } catch {
        body = { raw: text }
      }

      if (!res.ok) {
        throw new DuxApiError(
          `DUX /pedidos respondió ${res.status}`,
          res.status,
          body
        )
      }

      return body as DuxPedidoResponse
    } finally {
      clearTimeout(t)
    }
  }
}

/** Helper de conveniencia: una instancia por default. */
export const duxClient = new DuxClient()
