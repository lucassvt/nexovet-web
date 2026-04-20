/**
 * Tipos compartidos del plugin.
 *
 * El payload de DUX está documentado en:
 *   https://duxsoftware.readme.io/reference/crear-pedido
 */

import type { DuxErpTarget } from "./config"

/** Ítem del detalle del pedido (un line_item del carrito). */
export interface DuxPedidoDetalle {
  id_item: number
  cantidad: number
  precio_unitario: number
  /** Descuento en porcentaje (0-100). Opcional. */
  porcentaje_descuento?: number
  observaciones?: string
}

/** Payload completo para `POST /pedidos`. */
export interface DuxPedidoPayload {
  id_empresa: number
  id_sucursal: number
  id_cliente: number
  id_lista_precio_venta: number
  fecha: string // ISO yyyy-mm-dd
  detalles: DuxPedidoDetalle[]
  /** Código interno de forma de pago en DUX. */
  id_forma_pago?: number
  observaciones?: string
  /** Referencia cruzada al order de Medusa. */
  referencia_externa?: string
}

export interface DuxPedidoResponse {
  /** ID del pedido creado en DUX. */
  id_pedido?: number | string
  /** Algunos endpoints devuelven el número. */
  nro_pedido?: number | string
  mensaje?: string
  [key: string]: unknown
}

export interface DuxPushJobData {
  order_id: string
}

export interface DuxRouteInfo {
  target: DuxErpTarget
  baseUrl: string
  token: string
  empresaId: number
  idDeposito: number
  regionKey: string
  label: string
}
