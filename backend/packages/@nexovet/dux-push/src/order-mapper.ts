/**
 * Mapea un `order` de Medusa al payload esperado por DUX (`POST /pedidos`).
 *
 * Decisiones:
 *
 * - **SKU DUX**: se toma de `product.metadata.dux_cod_items`. Un producto
 *   puede tener varios `cod_items` (uno por franquicia) porque cada DUX
 *   mantiene su propio catálogo. El mapper elige el primero que coincida con
 *   el `target` (central/franquicias) o cae al `[0]` como fallback.
 *
 * - **id_sucursal**: DUX usa el `id_deposito` como id de sucursal dentro del
 *   endpoint de pedidos. El deposito se resuelve por `sales_channel_id` en
 *   `config.REGION_ROUTING` y lo inyecta `DuxClient.routeByRegion`.
 *
 * - **id_cliente**: se asume que viene resuelto río arriba (por ej., un step
 *   del worker llama a `/clientes` con el DNI y persiste el id en
 *   `customer.metadata.dux_id_cliente`). Si no viene, el mapper devuelve
 *   `requiresClientResolution: true` para que el worker lo maneje.
 *
 * - **forma_pago**: la fuente es el gateway de pago del order (Mercado Pago).
 *   Hay un mapping simple `MP → DUX`. Si no hay match, se omite el campo y
 *   DUX usa el default del ERP.
 */

import {
  DUX_DEFAULT_ID_LISTA_PRECIO_VENTA,
  type DuxErpTarget,
} from "./config"
import type {
  DuxPedidoDetalle,
  DuxPedidoPayload,
  DuxRouteInfo,
} from "./types"

// ---------- Tipos auxiliares "mínimos" del order de Medusa ----------
// Mantenemos el shape laxo (`unknown`-ish) para no acoplar a versiones
// concretas de @medusajs/framework y para que los tests sean triviales.

export interface OrderLineItemLike {
  id?: string
  quantity: number
  unit_price?: number | string
  // En Medusa 2, el precio por unidad suele llegar como `unit_price` (number)
  // y puede tener impuestos incluidos vía `tax_total`. Acá lo tomamos tal cual.
  product?: {
    id?: string
    metadata?: Record<string, unknown> | null
  } | null
  variant?: {
    id?: string
    sku?: string | null
    metadata?: Record<string, unknown> | null
    product?: {
      id?: string
      metadata?: Record<string, unknown> | null
    } | null
  } | null
  metadata?: Record<string, unknown> | null
}

export interface OrderLike {
  id: string
  sales_channel_id?: string | null
  currency_code?: string | null
  items?: OrderLineItemLike[] | null
  customer?: {
    id?: string
    email?: string | null
    metadata?: Record<string, unknown> | null
  } | null
  shipping_address?: {
    address_1?: string | null
    city?: string | null
    province?: string | null
  } | null
  payment_collections?: Array<{
    payments?: Array<{
      provider_id?: string | null
      data?: Record<string, unknown> | null
    }>
  }> | null
  metadata?: Record<string, unknown> | null
}

// ---------- Mapping de forma de pago ----------

/**
 * MP → id_forma_pago DUX.
 *
 * Los códigos concretos varían por ERP (!) así que este es un default
 * "razonable" para el ERP Central. Para franquicias puede ser otro — ajustar
 * cuando se tenga el listado real.
 */
export const DEFAULT_FORMA_PAGO_MP_TO_DUX: Record<string, number> = {
  // MP genérico — transferencia electrónica
  mercadopago: 6,
  mp: 6,
  // Efectivo (si algún día sale MP Point por mostrador)
  efectivo: 1,
}

export function mapFormaPago(
  providerId: string | null | undefined,
  overrides: Record<string, number> = {}
): number | undefined {
  if (!providerId) return undefined
  const key = providerId.toLowerCase().replace(/^pp_/, "")
  return overrides[key] ?? DEFAULT_FORMA_PAGO_MP_TO_DUX[key]
}

// ---------- Helpers ----------

function pickDuxCodItem(
  metadata: Record<string, unknown> | null | undefined,
  target: DuxErpTarget
): number | null {
  if (!metadata) return null

  // Formato soportado 1:  dux_cod_items: [{ target: "central", cod: 12345 }, ...]
  // Formato soportado 2:  dux_cod_items: [12345, 6789]   (legacy, toma [0])
  // Formato soportado 3:  dux_cod_item_central / dux_cod_item_franquicias
  const direct = metadata[`dux_cod_item_${target}`]
  if (typeof direct === "number") return direct
  if (typeof direct === "string" && direct) return Number(direct)

  const arr = metadata.dux_cod_items
  if (Array.isArray(arr) && arr.length > 0) {
    // Buscar match por target
    for (const entry of arr) {
      if (
        entry &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>).target === target
      ) {
        const cod = (entry as Record<string, unknown>).cod
        if (typeof cod === "number") return cod
        if (typeof cod === "string" && cod) return Number(cod)
      }
    }
    // Fallback: primer elemento
    const first = arr[0]
    if (typeof first === "number") return first
    if (typeof first === "string" && first) return Number(first)
    if (first && typeof first === "object") {
      const cod = (first as Record<string, unknown>).cod
      if (typeof cod === "number") return cod
      if (typeof cod === "string" && cod) return Number(cod)
    }
  }

  return null
}

function resolveIdItem(
  item: OrderLineItemLike,
  target: DuxErpTarget
): number | null {
  // Preferimos metadata del product; si no, del variant.product; si no, del variant.
  return (
    pickDuxCodItem(item.product?.metadata, target) ||
    pickDuxCodItem(item.variant?.product?.metadata, target) ||
    pickDuxCodItem(item.variant?.metadata, target) ||
    pickDuxCodItem(item.metadata, target)
  )
}

function toNumber(x: unknown): number {
  if (typeof x === "number") return x
  if (typeof x === "string") return Number(x)
  return NaN
}

// ---------- API pública ----------

export interface MapOrderInput {
  order: OrderLikeInput
  route: DuxRouteInfo
  /**
   * id_cliente resuelto previamente (por el worker, llamando a `/clientes`).
   * Si no se pasa, el mapper devuelve `requiresClientResolution: true`.
   */
  idCliente?: number
  /** Override del mapping MP → id_forma_pago (útil para franquicias). */
  formaPagoOverrides?: Record<string, number>
}

export type OrderLikeInput = OrderLike

export type MapOrderResult =
  | { ok: true; payload: DuxPedidoPayload }
  | { ok: false; requiresClientResolution: true; reason: string }
  | { ok: false; requiresClientResolution: false; reason: string }

export function mapOrderToDuxPedido(input: MapOrderInput): MapOrderResult {
  const { order, route, idCliente, formaPagoOverrides } = input

  if (!order.items || order.items.length === 0) {
    return {
      ok: false,
      requiresClientResolution: false,
      reason: "order sin line_items",
    }
  }

  if (!idCliente) {
    return {
      ok: false,
      requiresClientResolution: true,
      reason: "falta id_cliente DUX — resolver por DNI o crear cliente",
    }
  }

  const detalles: DuxPedidoDetalle[] = []
  const missingSkus: string[] = []

  for (const item of order.items) {
    const idItem = resolveIdItem(item, route.target)
    if (!idItem) {
      missingSkus.push(item.variant?.sku || item.id || "<unknown>")
      continue
    }
    const precio = toNumber(item.unit_price)
    if (!Number.isFinite(precio) || precio <= 0) {
      return {
        ok: false,
        requiresClientResolution: false,
        reason: `line_item ${item.id} con unit_price inválido`,
      }
    }
    detalles.push({
      id_item: idItem,
      cantidad: item.quantity,
      precio_unitario: precio,
    })
  }

  if (missingSkus.length > 0) {
    return {
      ok: false,
      requiresClientResolution: false,
      reason: `productos sin dux_cod_item para target=${
        route.target
      }: ${missingSkus.join(", ")}`,
    }
  }

  // Forma de pago: viene del primer payment del payment_collection.
  const firstPayment =
    order.payment_collections?.[0]?.payments?.[0]?.provider_id ?? null
  const idFormaPago = mapFormaPago(firstPayment, formaPagoOverrides)

  const payload: DuxPedidoPayload = {
    id_empresa: route.empresaId,
    id_sucursal: route.idDeposito,
    id_cliente: idCliente,
    id_lista_precio_venta: DUX_DEFAULT_ID_LISTA_PRECIO_VENTA,
    fecha: new Date().toISOString().slice(0, 10),
    detalles,
    id_forma_pago: idFormaPago,
    observaciones: `Pedido ecommerce Nexovet #${order.id}`,
    referencia_externa: order.id,
  }

  return { ok: true, payload }
}
