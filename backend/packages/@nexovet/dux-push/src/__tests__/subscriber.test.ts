/**
 * Test del subscriber: simula `order.placed` y verifica que se encole el job.
 *
 * Mockea `../queue` para no pegarle a Redis.
 */

jest.mock("../queue", () => ({
  enqueuePush: jest.fn().mockResolvedValue(undefined),
  DUX_PUSH_QUEUE_NAME: "dux-push",
}))

import duxPushOrderPlacedHandler from "../subscribers/order-placed"
import { enqueuePush } from "../queue"

const ORIGINAL_ENV = process.env

describe("order.placed subscriber", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    ;(enqueuePush as jest.Mock).mockClear()
  })
  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it("encola cuando DUX_PUSH_ENABLED=true", async () => {
    process.env.DUX_PUSH_ENABLED = "true"
    // El flag se lee al import, pero como es módulo ya cargado lo sobrescribimos
    // con un re-require (CommonJS — compatible con node16 moduleResolution).
    jest.resetModules()
    process.env.DUX_PUSH_ENABLED = "true"
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const handler = require("../subscribers/order-placed").default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const enq = require("../queue").enqueuePush as jest.Mock

    await handler({
      event: { data: { id: "order_xyz" } },
    } as Parameters<typeof handler>[0])

    expect(enq).toHaveBeenCalledWith("order_xyz")
  })

  it("NO encola cuando DUX_PUSH_ENABLED es falsy", async () => {
    jest.resetModules()
    process.env.DUX_PUSH_ENABLED = "false"
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const handler = require("../subscribers/order-placed").default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const enq = require("../queue").enqueuePush as jest.Mock

    await handler({
      event: { data: { id: "order_xyz" } },
    } as Parameters<typeof handler>[0])

    expect(enq).not.toHaveBeenCalled()
  })
})
