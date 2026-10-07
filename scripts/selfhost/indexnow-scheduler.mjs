import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const job = resolve(import.meta.dirname, 'run-indexnow.mjs');

function scheduleNextRun() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(18, 0, 0, 0); // 09:00 UTC; PM2 sets TZ=Asia/Seoul.
  if (next <= now) next.setDate(next.getDate() + 1);

  console.log(`Next IndexNow run: ${next.toISOString()}`);
  setTimeout(() => {
    const child = spawn(process.execPath, [job], { stdio: 'inherit' });
    let rescheduled = false;
    function done() {
      if (rescheduled) return;
      rescheduled = true;
      scheduleNextRun();
    }
    child.on('error', error => {
      console.error(`IndexNow scheduler error: ${error.message}`);
      done();
    });
    child.on('exit', code => {
      if (code !== 0) console.error(`IndexNow exited with code ${code}`);
      done();
    });
  }, next.getTime() - now.getTime());
}

scheduleNextRun();
