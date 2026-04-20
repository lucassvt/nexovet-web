/**
 * Shim del subscriber `order.placed` que vive físicamente en el paquete
 * interno `@nexovet/dux-push`. Lo re-exportamos desde `src/subscribers/` para
 * que Medusa lo auto-cargue.
 */

export {
  default,
  config,
} from "../../packages/@nexovet/dux-push/src/subscribers/order-placed"
