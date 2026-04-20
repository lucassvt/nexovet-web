/**
 * Unit tests para DuxClient.routeByRegion.
 */

import { DuxClient, DuxConfigError } from "../dux-client"

describe("DuxClient.routeByRegion", () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.DUX_CENTRAL_TOKEN = "fake-central-token"
    process.env.DUX_CENTRAL_EMPRESA_ID = "9425"
    process.env.DUX_FRANQUICIAS_TOKEN = "fake-franquicias-token"
    process.env.DUX_FRANQUICIAS_EMPRESA_ID = "99999"
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it("rutea Leguizamón al ERP Central", () => {
    const client = new DuxClient()
    const route = client.routeByRegion("sc_01KPKCJEEJ2B9HAXTGABMZMX1Q")
    expect(route.target).toBe("central")
    expect(route.empresaId).toBe(9425)
    expect(route.idDeposito).toBe(18498)
    expect(route.token).toBe("fake-central-token")
    expect(route.baseUrl).toMatch(/duxsoftware/)
  })

  it("rutea Catamarca al ERP Franquicias", () => {
    const client = new DuxClient()
    const route = client.routeByRegion("sc_01KPKCJEBCTA782VXEHJ128E5Q")
    expect(route.target).toBe("franquicias")
    expect(route.idDeposito).toBe(18353)
    expect(route.token).toBe("fake-franquicias-token")
  })

  it("rutea Zapala al ERP Franquicias con depósito correcto", () => {
    const client = new DuxClient()
    const route = client.routeByRegion("sc_01KPKCJEH1S313GZPXX6JN8Y09")
    expect(route.target).toBe("franquicias")
    expect(route.idDeposito).toBe(17719)
  })

  it("explota si la region no existe", () => {
    const client = new DuxClient()
    expect(() => client.routeByRegion("sc_FAKE")).toThrow(DuxConfigError)
  })

  it("explota si falta el token del target", () => {
    delete process.env.DUX_CENTRAL_TOKEN
    const client = new DuxClient()
    expect(() =>
      client.routeByRegion("sc_01KPKCJEEJ2B9HAXTGABMZMX1Q")
    ).toThrow(/DUX_CENTRAL_TOKEN/)
  })

  it("explota si falta empresaId", () => {
    delete process.env.DUX_FRANQUICIAS_EMPRESA_ID
    const client = new DuxClient()
    expect(() =>
      client.routeByRegion("sc_01KPKCJEBCTA782VXEHJ128E5Q")
    ).toThrow(/DUX_FRANQUICIAS_EMPRESA_ID/)
  })
})

describe("DuxClient.crearPedido (mocked fetch)", () => {
  beforeEach(() => {
    process.env.DUX_CENTRAL_TOKEN = "t"
    process.env.DUX_CENTRAL_EMPRESA_ID = "9425"
  })

  it("envía headers y body correctos", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ id_pedido: 1234 }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    )
    const client = new DuxClient(fetchImpl as unknown as typeof fetch)
    const route = client.routeByRegion("sc_01KPKCJEEJ2B9HAXTGABMZMX1Q")

    const res = await client.crearPedido(route, {
      id_empresa: route.empresaId,
      id_sucursal: route.idDeposito,
      id_cliente: 1,
      id_lista_precio_venta: 56755,
      fecha: "2026-04-18",
      detalles: [{ id_item: 10, cantidad: 2, precio_unitario: 100 }],
    })

    expect(res.id_pedido).toBe(1234)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/pedidos$/)
    expect(init.method).toBe("POST")
    expect(init.headers.authorization).toBe("t")
    expect(init.headers.accept).toBe("application/json")
  })

  it("throwea DuxApiError con status y body al recibir !ok", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "nope" }), { status: 422 })
    )
    const client = new DuxClient(fetchImpl as unknown as typeof fetch)
    const route = client.routeByRegion("sc_01KPKCJEEJ2B9HAXTGABMZMX1Q")

    await expect(
      client.crearPedido(route, {
        id_empresa: route.empresaId,
        id_sucursal: route.idDeposito,
        id_cliente: 1,
        id_lista_precio_venta: 56755,
        fecha: "2026-04-18",
        detalles: [],
      })
    ).rejects.toMatchObject({
      name: "DuxApiError",
      status: 422,
      body: { error: "nope" },
    })
  })
})
