# Nexovet Shop

Ecommerce multi-regi\u00f3n de La Mascotera, construido sobre Medusa.js v2 + Next.js 15.

## Stack

- **Backend:** Medusa.js v2 (Node 20, TypeScript, Postgres 16, Redis 7)
- **Storefront:** Next.js 15 App Router + Tailwind + shadcn/ui
- **Base de datos:** Postgres dedicado `nexovet_shop` (puerto 5435 en VPS)
- **Cache + queue:** Redis dedicado (puerto 6380)
- **Deploy:** VPS Dattaweb 66.97.35.249 + Docker Compose + Nginx + Let's Encrypt

## Estructura

```
/var/www/nexovet-shop/
  backend/              # Medusa API + Admin
  backend-storefront/   # Next.js storefront
  packages/@nexovet/    # Plugins custom (dux-sync, loyalty, televet, etc.)
  docker-compose.yml    # Postgres + Redis (infra)
```

## Regiones del ecommerce propio (8)

Catamarca, Chaco, Jujuy, Mendoza (Godoy Cruz + Las Heras), Salta Leguizam\u00f3n, Or\u00e1n, C\u00f3rdoba, Zapala.

Las 2 Tiendanube existentes (NOA, Neuqu\u00e9n) NO se tocan \u2014 coexisten como canales paralelos.

## Arquitectura datos

```
DUX Cloud -> dux_integrada (sync CRON existente) -> Medusa (read-only)
Medusa -> DUX API (solo PUT /pedidos)
```

Regla: NING\u00daN sitio consulta DUX API para leer. Todo pasa por la BD local sincronizada.

## Plan completo

Ver `/c/Users/LaMascotera/Desktop/modulo ecommerce v2/plan-ecommerce-nexovet-v10-FINAL.md`
