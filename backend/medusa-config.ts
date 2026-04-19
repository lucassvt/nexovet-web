import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    }
  },
  admin: {
    vite: () => ({
      server: {
        allowedHosts: [
          'shop-admin.nexovet.com.ar',
          'tienda-preview.nexovet.com.ar',
          'localhost',
          '127.0.0.1',
          '.nexovet.com.ar',
          '.lamascotera.com.ar',
        ],
      },
    }),
  },
})
