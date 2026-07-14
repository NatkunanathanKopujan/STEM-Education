module.exports = {
  apps: [
    {
      name: 'dbitlms-api',
      cwd: './backend',
      script: 'server.js',
      exec_mode: 'cluster',
      instances: process.env.WEB_CONCURRENCY || 'max',
      node_args: '--enable-source-maps',
      max_memory_restart: process.env.PM2_MAX_MEMORY || '512M',
      kill_timeout: 10000,
      listen_timeout: 10000,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
      },
      error_file: './backend/logs/pm2-error.log',
      out_file: './backend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
