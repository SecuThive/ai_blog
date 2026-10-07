const { existsSync } = require('node:fs');
const path = require('node:path');

const root = __dirname;
const tokenFile = path.join(root, '.secrets', 'cloudflare-tunnel-token');

const apps = [
  {
    name: 'thivelab-web',
    cwd: root,
    script: path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'),
    args: 'start -H 127.0.0.1 -p 3103',
    interpreter: process.execPath,
    env: { NODE_ENV: 'production' },
    max_memory_restart: '1536M',
    kill_timeout: 10000,
    watch: false,
  },
  {
    name: 'thivelab-indexnow-scheduler',
    cwd: root,
    script: path.join(root, 'scripts', 'selfhost', 'indexnow-scheduler.mjs'),
    interpreter: process.execPath,
    env: { NODE_ENV: 'production', TZ: 'Asia/Seoul' },
    max_memory_restart: '128M',
    watch: false,
  },
];

// The remotely managed tunnel gets its hostname and origin route from Cloudflare.
// Keep its token out of PM2 arguments, logs, and the Git repository.
if (existsSync(tokenFile)) {
  apps.push({
    name: 'thivelab-tunnel',
    cwd: root,
    script: '/opt/homebrew/bin/cloudflared',
    args: `tunnel --no-autoupdate run --token-file ${tokenFile}`,
    interpreter: 'none',
    watch: false,
  });
}

module.exports = { apps };
