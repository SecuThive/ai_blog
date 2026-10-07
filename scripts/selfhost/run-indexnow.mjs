import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
process.loadEnvFile(resolve(root, '.env.local'));

const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error('CRON_SECRET is missing');
  process.exit(1);
}

const response = await fetch('http://127.0.0.1:3103/api/indexnow', {
  headers: { authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) {
  console.error(`IndexNow request failed: HTTP ${response.status}`);
  process.exit(1);
}

console.log('IndexNow submission completed');
