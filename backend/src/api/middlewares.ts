// src/api/middlewares.ts
// Medusa v2 custom middleware config.
// Por ahora solo parchamos parsing de body JSON (el default ya lo hace, pero ciertas rutas custom
// pueden necesitarlo explicitamente).

import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    // Aseguramos Content-Type JSON en rutas club (fallback)
    {
      matcher: "/store/club/*",
      method: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
  ],
})
