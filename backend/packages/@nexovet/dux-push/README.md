# @nexovet/dux-push

Plugin interno para el backend Medusa del ecommerce Nexovet que **empuja** los pedidos confirmados hacia los ERPs **DUX** (Central y Franquicias) con routing por región del sales_channel.

## Resumen

- Escucha el evento `order.placed` de Medusa.
- Encola un job en BullMQ (`dux-push`).
- El worker mapea el order al payload de DUX, hace `POST /pedidos` contra el ERP correspondiente y guarda auditoría en `dux_push_log`.
- Reintentos con backoff exponencial: 1m, 5m, 30m, 2h, 6h, 24h. Tras 24h → alerta.

## Routing por región

Ver `src/dux-client.ts → REGION_ROUTING`.

| Región | ERP | Token env | Empresa |
|---|---|---|---|
| Salta Leguizamón | Central | `DUX_CENTRAL_TOKEN` | 9425 |
| Catamarca, Chaco, Jujuy, Mendoza, Orán, Córdoba, Zapala | Franquicias | `DUX_FRANQUICIAS_TOKEN` | pendiente |

## Activación (cuando estén los tokens)

1. Copiar el token de Central desde `sistema-finanzas` al `.env.production` → `DUX_CENTRAL_TOKEN`.
2. Completar `DUX_FRANQUICIAS_TOKEN` y `DUX_FRANQUICIAS_EMPRESA_ID` con los datos que pase Lucas.
3. Correr la migración: `psql $DATABASE_URL -f src/migrations/dux_push_log.sql`
4. Setear `DUX_PUSH_ENABLED=true`.
5. Rebuild Medusa: `cd /var/www/nexovet-shop/backend && npm run build && pm2 restart nexovet-shop-backend` (o el nombre real del proceso).
6. Lanzar el worker como proceso PM2 aparte:
   `pm2 start --name nexovet-dux-push-worker --interpreter tsx ./packages/@nexovet/dux-push/src/worker.ts`
   (o compilar y correr el `.js` generado).
