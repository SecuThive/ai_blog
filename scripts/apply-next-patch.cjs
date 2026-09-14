const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const patchFile = path.join(projectRoot, 'patches', 'next+16.2.6.patch');

const reverseCheck = spawnSync('git', ['apply', '--check', '--reverse', patchFile], {
  cwd: projectRoot,
  stdio: 'ignore',
});

if (reverseCheck.status === 0) {
  console.log('Next.js patch is already applied; skipping.');
  process.exit(0);
}

const result = spawnSync('patch-package', [], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`Failed to run patch-package: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
