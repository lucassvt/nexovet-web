module.exports = {
  apps: [
    {
      name: 'nexovet-shop-backend',
      cwd: '/var/www/nexovet-shop/backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 9000,
      },
      max_memory_restart: '1500M',
      error_file: '/var/log/nexovet-shop/backend-err.log',
      out_file: '/var/log/nexovet-shop/backend-out.log',
      merge_logs: true,
      time: true,
      autorestart: true,
    },
    {
      name: 'nexovet-shop-storefront',
      cwd: '/var/www/nexovet-shop/backend-storefront',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 8100,
      },
      max_memory_restart: '1000M',
      error_file: '/var/log/nexovet-shop/storefront-err.log',
      out_file: '/var/log/nexovet-shop/storefront-out.log',
      merge_logs: true,
      time: true,
      autorestart: true,
    },
  ],
};
