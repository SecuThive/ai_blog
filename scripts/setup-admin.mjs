#!/usr/bin/env node
// Creates the first local administrator. Existing administrator settings are never overwritten.
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, appendFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
const email = process.argv[2] || 'admin';
if (!/^[a-zA-Z0-9][a-zA-Z0-9._@+\-]{2,253}$/.test(email)) throw new Error('영문·숫자로 시작하는 3~254자의 아이디를 입력하세요.');
const file = '.env.local';
let existing = '';
try { existing = readFileSync(file, 'utf8'); } catch {}
if (/^ADMIN_(USERS_JSON|SESSION_SECRET)=/m.test(existing)) throw new Error('관리자 설정이 이미 있습니다. 기존 설정을 보존하기 위해 중단합니다.');
const password = randomBytes(24).toString('base64url');
const salt = randomBytes(16).toString('hex');
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
mkdirSync('.secrets', { recursive: true, mode: 0o700 });
writeFileSync('.secrets/admin-login.txt', `관리자 로그인: /admin/login\n아이디: ${email}\n비밀번호: ${password}\n\n비밀번호 관리자에 보관한 후 이 파일을 삭제하세요.\n`, { mode: 0o600, flag: 'wx' });
appendFileSync(file, `\n# Administrator authentication (server-only)\nADMIN_USERS_JSON='${JSON.stringify([{ email, passwordHash }])}'\nADMIN_SESSION_SECRET=${randomBytes(48).toString('hex')}\n`, { mode: 0o600 });
chmodSync(file, 0o600);
console.log('관리자 설정 완료. 로그인 정보: .secrets/admin-login.txt (소유자만 읽기 가능). 서버를 다시 시작하세요.');
