// ecosystem.config.js — PM2 process definitions (D-01)
// Run: pm2 start ecosystem.config.js
// Requires: pm2 installed globally on VPS (npm install -g pm2)
module.exports = {
  apps: [
    {
      name: 'agency-os',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'job-worker',
      script: 'src/worker/index.ts',
      interpreter: 'node_modules/.bin/tsx',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        // ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
        // must be set in the VPS environment or .env file (NOT committed to git)
      },
      autorestart: true,
      max_memory_restart: '512M',
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
}
