/**
 * Unit tests para mapOrderToDuxPedido.
 */

import { mapOrderToDuxPedido, mapFormaPago } from "../order-mapper"
import type { DuxRouteInfo } from "../types"

const routeFranquicias: DuxRouteInfo = {
  target: "franquicias",
  baseUrl: "https://erp.duxsoftware.com.ar/WSERP/rest/services",
  token: "t",
  empresaId: 12345,
  idDeposito: 18353,
  regionKey: "sc_01KPKCJEBCTA782VXEHJ128E5Q",
  label: "Catamarca",
}

const routeCentral: DuxRouteInfo = {
  ...routeFranquicias,
  target: "central",
  empresaId: 9425,
  idDeposito: 18498,
  regionKey: "sc_01KPKCJEEJ2B9HAXTGABMZMX1Q",
  label: "Salta Leguizamón",
}

describe("mapOrderToDuxPedido", () => {
  it("mapea un order simple al payload DUX", () => {
    const res = mapOrderToDuxPedido({
      order: {
        id: "order_123",
        sales_channel_id: routeFranquicias.regionKey,
        items: [
          {
            id: "li_1",
            quantity: 2,
            unit_price: 1500,
            product: {
              metadata: {
                dux_cod_items: [
                  { target: "central", cod: 11111 },
                  { target: "franquicias", cod: 22222 },
                ],
              },
            },
          },
        ],
        payment_collections: [
          { payments: [{ provider_id: "pp_mercadopago" }] },
        ],
      },
      route: routeFranquicias,
      idCliente: 777,
    })

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.payload).toMatchObject({
      id_empresa: 12345,
      id_sucursal: 18353,
      id_cliente: 777,
      id_lista_precio_venta: 56755,
      detalles: [
        { id_item: 22222, cantidad: 2, precio_unitario: 1500 },
      ],
      referencia_externa: "order_123",
    })
    expect(typeof res.payload.fecha).toBe("string")
  })

  it("usa el cod_item del target central cuando la region es central", () => {
    const res = mapOrderToDuxPedido({
      order: {
        id: "o2",
        sales_channel_id: routeCentral.regionKey,
        items: [
          {
            quantity: 1,
            unit_price: 500,
            product: {
              metadata: {
                dux_cod_items: [
                  { target: "central", cod: 11111 },
                  { target: "franquicias", cod: 22222 },
                ],
              },
            },
          },
        ],
      },
      route: routeCentral,
      idCliente: 1,
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.payload.detalles[0].id_item).toBe(11111)
  })

  it("cae a dux_cod_items[0] (legacy) cuando es un array de numbers", () => {
    const res = mapOrderToDuxPedido({
      order: {
        id: "o3",
        sales_channel_id: routeFranquicias.regionKey,
        items: [
          {
            quantity: 1,
            unit_price: 10,
            product: { metadata: { dux_cod_items: [42, 99] } },
          },
        ],
      },
      route: routeFranquicias,
      idCliente: 1,
    })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.payload.detalles[0].id_item).toBe(42)
  })

  it("devuelve requiresClientResolution cuando no hay idCliente", () => {
    const res = mapOrderToDuxPedido({
      order: {
        id: "o4",
        sales_channel_id: routeFranquicias.regionKey,
        items: [
          {
            quantity: 1,
            unit_price: 10,
            product: { metadata: { dux_cod_items: [1] } },
          },
        ],
      },
      route: routeFranquicias,
    })
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.requiresClientResolution).toBe(true)
  })

  it("falla si algún item no tiene dux_cod_item para el target", () => {
    const res = mapOrderToDuxPedido({
      order: {
        id: "o5",
        sales_channel_id: routeFranquicias.regionKey,
        items: [
          {
            quantity: 1,
            unit_price: 10,
            variant: { sku: "SKU-SIN-METADATA" },
            product: { metadata: {} },
          },
        ],
      },
      route: routeFranquicias,
      idCliente: 1,
    })
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.requiresClientResolution).toBe(false)
    expect(res.reason).toMatch(/sin dux_cod_item/)
    expect(res.reason).toMatch(/SKU-SIN-METADATA/)
  })

  it("falla si el order no tiene items", () => {
    const res = mapOrderToDuxPedido({
      order: {
        id: "o6",
        sales_channel_id: routeFranquicias.regionKey,
        items: [],
      },
      route: routeFranquicias,
      idCliente: 1,
    })
    expect(res.ok).toBe(false)
  })
})

describe("mapFormaPago", () => {
  it("mapea pp_mercadopago a 6", () => {
    expect(mapFormaPago("pp_mercadopago")).toBe(6)
  })
  it("respeta overrides", () => {
    expect(mapFormaPago("pp_mercadopago", { mercadopago: 99 })).toBe(99)
  })
  it("devuelve undefined si no hay match", () => {
    expect(mapFormaPago("pp_rando")).toBeUndefined()
  })
  it("devuelve undefined si falta el provider", () => {
    expect(mapFormaPago(null)).toBeUndefined()
  })
})
