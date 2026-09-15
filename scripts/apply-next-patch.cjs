const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const nextVersion = require('next/package.json').version;
if (nextVersion !== '16.2.6') {
  console.log(`Skipping the Next.js 16.2.6 patch for Next.js ${nextVersion}.`);
  process.exit(0);
}
const patchFile = path.join(projectRoot, 'patches', 'next+16.2.6.patch');

const reverseCheck = spawnSync('git', ['apply', '--check', '--reverse', patchFile], {
  cwd: projectRoot,
  stdio: 'ignore',
});

if (reverseCheck.status === 0) {
  console.log('Next.js patch is already applied; skipping.');
  process.exit(0);
}

const patch = fs.readFileSync(patchFile, 'utf8');
const rejectFiles = [...patch.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((match) =>
  path.join(projectRoot, `${match[1]}.rej`),
);

const result = spawnSync('git', ['apply', '--reject', patchFile], {
  cwd: projectRoot,
  encoding: 'utf8',
});

for (const rejectFile of rejectFiles) {
  fs.rmSync(rejectFile, { force: true });
}

const verify = spawnSync('git', ['apply', '--check', '--reverse', patchFile], {
  cwd: projectRoot,
  stdio: 'ignore',
});

if (verify.status === 0) {
  console.log('Next.js patch is applied.');
  process.exit(0);
}

if (result.error) {
  console.error(`Failed to apply the Next.js patch: ${result.error.message}`);
} else if (result.stderr) {
  console.error(result.stderr.trim());
}

console.error('The Next.js patch could not be fully applied.');
process.exit(1);
