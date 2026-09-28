// Retitle round 2 (2026-09-29): replace remaining "Complete Guide"/"Mastering" SEO-bait
// English titles on engineer_guides with specific, problem-focused titles, and rewrite
// Korean titles with bait wording (완전 정리 / 완전 활용). EN title = tag `i18n.title:` +
// embedded <!--NodelogEN {json} NodelogEN--> "title" field (value replaced in place).
// Also replaces body headings that repeat an old title verbatim, and (id 69) a table
// link label that repeated id 2's old title. Slugs/status/robots/AdSense untouched.
// Usage (from scripts/): node retitle-engineer-guides-r2-2026-09-29.mjs [--apply]
//   Default is a dry run. --apply saves a before-snapshot to
//   retitle-engineer-guides-r2-backup-2026-09-29.json (gitignored) and then updates.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = existsSync(join(here, '../.env.local')) ? join(here, '../.env.local') : '.env.local';
const env = Object.fromEntries(readFileSync(envPath, 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const BACKUP = join(here, 'retitle-engineer-guides-r2-backup-2026-09-29.json');
const START = '<!--NodelogEN', END = 'NodelogEN-->';
const TAG = 'i18n.title:';
const BAIT_EN = /complete guide|ultimate|mastering|definitive/i;
const BAIT_KO = /완벽|완전 정리|완전 활용|총정리|마스터|끝판왕/;

// [id, slug, new EN title, new KO title | null]
const CHANGES = [
  [2, 'ssh-hardening-guide', 'Hardening SSH: Locking Down sshd_config with Key-Only Login, AllowGroups, and MFA', null],
  [4, 'systemd-service-management', 'Managing systemd Services: systemctl Commands, Custom Unit Files, and Checking Logs with journalctl', null],
  [10, 'git-undo-guide', 'Undoing Git Mistakes: Recovering Bad Commits, Wrong-Branch Work, and Deleted Files with reset, revert, stash, and reflog', null],
  [14, 'ufw-firewall-guide', 'UFW Firewall on Ubuntu: Opening Ports, Allowing Specific IPs, and Keeping SSH Access Safe', null],
  [23, 'tmux-complete-guide', 'tmux for Remote Servers: Keeping Sessions Alive Across Disconnects and Splitting Windows and Panes', null],
  [32, 'journalctl-log-analysis-guide', 'journalctl: Filtering systemd Logs by Service, Time, and Priority to Troubleshoot Failures', 'journalctl로 systemd 로그 찾기 — 서비스·시간·우선순위 필터와 장애 분석'],
  [36, 'aws-cli-setup-and-commands', 'AWS CLI v2: Installing, Setting Up Profiles and Credentials, and Everyday EC2, S3, and IAM Commands', null],
  [63, 'postgresql-replication-wal-pitr', 'PostgreSQL High Availability: Setting Up Streaming Replication, Failover, and Point-in-Time Recovery with WAL', null],
  [76, 'ssl-certificate-renewal-fix', 'Fixing SSL Certificate Expiry and certbot renew Failures: Port 80, DNS, Rate Limits, and Nginx Reloads', 'SSL 인증서 만료·갱신 실패 해결 — certbot renew 오류 원인별 조치(포트 80·DNS·Rate Limit)'],
  [82, 'docker-volume-bind-mount-guide', 'Docker Volumes vs Bind Mounts: Choosing Storage, Backing Up Data, and Fixing Permission Errors', null],
  [108, 'ssh-config-client-guide', 'SSH Config File: Managing Multiple Servers with Host Aliases, Jump Hosts, and ssh-agent', 'SSH Config 파일로 다중 서버 접속 관리 — Host 별칭·점프 호스트·ssh-agent 설정'],
  [112, 'gitlab-cicd-pipeline-guide', 'GitLab CI/CD Pipelines: Writing .gitlab-ci.yml, Using rules and Artifacts, and Registering a Runner', null],
  [114, 'wireguard-vpn-setup', 'WireGuard VPN: Setting Up a Server and Clients, Generating Keys, and Routing Traffic', null],
  [116, 'ssh-port-forwarding-tunneling', 'SSH Port Forwarding: Reaching Private Databases with -L, Exposing Internal Services with -R, and SOCKS Proxies with -D', null],
  [117, 'systemd-timer-guide', 'systemd Timers: Replacing cron Jobs with Scheduled Units, Failure Alerts, and Logs', null],
  [118, 'nfs-filesystem-mount-guide', 'Mounting NFS and Disks on Linux: Persistent /etc/fstab Entries with UUIDs, NFS Clients, and Bind Mounts', null],
  [142, 'kubernetes-configmap-secret-guide', 'Kubernetes ConfigMaps and Secrets: Injecting Configuration, Reloading on Changes, and Protecting Sensitive Data', null],
  [144, 'docker-swarm-cluster-guide', 'Docker Swarm: Building a Cluster and Deploying, Scaling, and Rolling Back Services', null],
  [146, 'mysql-replication-master-slave', 'MySQL Replication: Setting Up Source-Replica (Master-Slave) HA, Diagnosing Lag, and Failing Over', null],
  [151, 'caddy-web-server-auto-https', "Caddy Reverse Proxy: Automatic HTTPS with Let's Encrypt, Caddyfile Setup, and Zero-Downtime Reloads", null],
  [152, 'bind9-authoritative-dns-server', 'BIND9 Authoritative DNS: Setting Up Forward and Reverse Zones, Zone Transfers, and DNSSEC', null],
  [160, 'aws-route53-dns-routing-guide', 'AWS Route 53: Configuring DNS Records, Routing Policies, and Health-Check Failover', null],
];
// Body-only fix: id 69 links to id 2 using id 2's old title as the link label.
const BODY_FIXES = [
  { id: 69, slug: 'linux-server-initial-security-setup',
    from: '[Complete Guide to SSH Configuration and Access Control](/engineer/ssh-hardening-guide)',
    to: '[Hardening SSH: Locking Down sshd_config with Key-Only Login, AllowGroups, and MFA](/engineer/ssh-hardening-guide)' },
];

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ids = [...CHANGES.map(c => c[0]), ...BODY_FIXES.map(f => f.id)];
const { data: rows, error } = await sb.from('engineer_guides').select('*').in('id', ids);
if (error) throw error;
const byId = Object.fromEntries(rows.map(r => [r.id, r]));
const parseEmb = s => { const a = s.indexOf(START), b = s.lastIndexOf(END); return (a === -1 || b <= a) ? null : JSON.parse(s.slice(a + START.length, b).trim()); };

const plans = [];
let problems = 0;
for (const [id, slug, titleEn, titleKo] of CHANGES) {
  const r = byId[id];
  const fail = m => { console.log(`#${id} ${m}`); problems++; };
  if (!r) { fail('MISSING'); continue; }
  if (r.slug !== slug) { fail(`SLUG MISMATCH ${r.slug}`); continue; }
  if (BAIT_EN.test(titleEn)) { fail('new EN title has bait wording'); continue; }
  if (titleKo && BAIT_KO.test(titleKo)) { fail('new KO title has bait wording'); continue; }
  const content = r.content || '';
  const emb = parseEmb(content);
  if (!emb) { fail('no embedded EN block'); continue; }
  const tags = [...(r.tags || [])];
  const ti = tags.findIndex(t => t.startsWith(TAG));
  const oldEn = emb.title;
  if (ti < 0 || tags[ti].slice(TAG.length) !== oldEn) { fail('tag/embedded EN title mismatch'); continue; }
  const koDone = !titleKo || r.title === titleKo;
  if (oldEn === titleEn && koDone) { console.log(`#${id} already applied, skip`); continue; }
  if (!BAIT_EN.test(oldEn) && oldEn !== titleEn) { fail(`old EN title has no bait wording?: ${oldEn}`); continue; }
  if (titleKo && !koDone && !BAIT_KO.test(r.title)) { fail(`old KO title has no bait wording?: ${r.title}`); continue; }
  const patch = {};
  let newContent = content;
  if (oldEn !== titleEn) {
    const a = content.indexOf(START), b = content.lastIndexOf(END);
    const oldKey = '"title":' + JSON.stringify(oldEn);
    const block = content.slice(a, b);
    if (block.split(oldKey).length !== 2) { fail('embedded title key not found exactly once'); continue; }
    newContent = content.slice(0, a) + block.replace(oldKey, '"title":' + JSON.stringify(titleEn)) + content.slice(b);
    tags[ti] = TAG + titleEn; patch.tags = tags;
  }
  // Headings repeating an old title verbatim (KO body and EN body).
  const nA = newContent.indexOf(START), nB = newContent.lastIndexOf(END);
  let ko = newContent.slice(0, nA);
  let embBlock = newContent.slice(nA, nB);
  const pairs = [[oldEn, titleEn]]; if (titleKo) pairs.push([r.title, titleKo]);
  const embNow = parseEmb(newContent);
  let embBodyChanged = false;
  for (const [o, n] of pairs) {
    if (o === n) continue;
    const re = new RegExp('^(#{1,6} )' + esc(o) + '\\s*$', 'gm');
    ko = ko.replace(re, `$1${n}`);
    if (re.test(embNow.content)) { re.lastIndex = 0; embNow.content = embNow.content.replace(re, `$1${n}`); embBodyChanged = true; }
  }
  if (embBodyChanged) embBlock = START + '\n' + JSON.stringify(embNow) + '\n';
  newContent = ko + embBlock + newContent.slice(nB);
  const check = parseEmb(newContent);
  if (check.title !== titleEn || check.excerpt !== emb.excerpt) { fail('post-edit JSON verify failed'); continue; }
  if (newContent !== content) patch.content = newContent;
  if (titleKo && !koDone) patch.title = titleKo;
  plans.push({ id, slug, patch });
  console.log(`#${id} ${slug}\n  EN: ${oldEn}\n   → ${titleEn}` + (patch.title ? `\n  KO: ${r.title}\n   → ${titleKo}` : '') + `\n  content Δchars: ${newContent.length - content.length}${embBodyChanged ? ' (EN heading replaced)' : ''}`);
}
for (const f of BODY_FIXES) {
  const r = byId[f.id];
  const fail = m => { console.log(`#${f.id} ${m}`); problems++; };
  if (!r || r.slug !== f.slug) { fail('missing/slug mismatch'); continue; }
  const content = r.content || '';
  if (!content.includes(f.from) && content.includes(f.to)) { console.log(`#${f.id} body fix already applied, skip`); continue; }
  if (content.split(f.from).length !== 2) { fail('body phrase not found exactly once'); continue; }
  const newContent = content.replace(f.from, f.to);
  const before = parseEmb(content), after = parseEmb(newContent);
  if (!after || after.title !== before.title || after.content.replace(f.to, f.from) !== before.content) { fail('body fix verify failed'); continue; }
  plans.push({ id: f.id, slug: f.slug, patch: { content: newContent } });
  console.log(`#${f.id} ${f.slug} (body link label only)\n  ${f.from}\n   → ${f.to}`);
}
if (problems) { console.error(`${problems} problem(s); aborting.`); process.exit(1); }
console.log(`\n${plans.length} row(s) to change (${plans.filter(p => p.patch.title).length} with KO title).`);
if (!APPLY) { console.log('DRY RUN. Re-run with --apply.'); process.exit(0); }
if (!plans.length) process.exit(0);
if (existsSync(BACKUP)) { console.error('backup exists, refusing to overwrite:', BACKUP); process.exit(1); }
writeFileSync(BACKUP, JSON.stringify(rows, null, 1));
console.log('backup saved', BACKUP, rows.length);
for (const { id, slug, patch } of plans) {
  const { error: e } = await sb.from('engineer_guides').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).eq('slug', slug);
  if (e) { console.error(`#${id} update failed`, e); process.exit(1); }
  console.log(`#${id} updated`);
}
