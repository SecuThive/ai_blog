import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accounts, allowLogin, hashPassword, signSession, verifyPassword, verifySession } from '../src/lib/admin-credentials.ts';
import { contentInput, isResource, validOrigin } from '../src/lib/admin-policy.ts';

test('passwords, signed sessions, expiry and credential revocation', async () => {
 const hash = await hashPassword('a-long-test-password');
 assert.equal(await verifyPassword('a-long-test-password', hash), true);
 assert.equal(await verifyPassword('wrong', hash), false);
 assert.equal(await verifyPassword('wrong'), false);
 process.env.ADMIN_USERS_JSON = JSON.stringify([{email:'admin', passwordHash:hash}]);
 process.env.ADMIN_SESSION_SECRET = 'test-only-session-secret-with-more-than-32-characters';
 const account = accounts()[0]; const now = Date.now(); const token = signSession(account, now);
 assert.equal(verifySession(token, now)?.email, account.email);
 assert.equal(verifySession(token + 'x', now), null);
 assert.equal(verifySession(token, now + 3600001), null);
 process.env.ADMIN_USERS_JSON = '[]';
 assert.equal(verifySession(token, now), null);
 process.env.ADMIN_USERS_JSON = JSON.stringify([{...account, passwordHash:await hashPassword('changed-password')}]);
 assert.equal(verifySession(token, now), null);
 delete process.env.ADMIN_USERS_JSON; delete process.env.ADMIN_SESSION_SECRET;
 assert.equal(verifySession(token), null);
});
test('origin and resource allowlists reject cross-site access', () => {
 assert.equal(validOrigin(new Request('https://site.test/api', {headers:{origin:'https://evil.test'}}), 'https://site.test'), false);
 assert.equal(validOrigin(new Request('https://site.test/api')), false);
 assert.equal(validOrigin(new Request('http://localhost:3187/api', {headers:{origin:'https://site.test'}}), 'https://site.test'), true);
 assert.equal(isResource('auth.users'), false);
 assert.equal(isResource('posts'), true);
});
test('content validation strips unknown privileged fields and rejects unsafe input', () => {
 const input = {title:'테스트',slug:'테스트-글',content:'body',category:'기술',author:'editor',status:'draft',tags:['a','a'],excerpt:'',cover_image:'',views:123,reviewed_by:'forged'};
 const result=contentInput(input,false);
 assert.equal(result.views,undefined); assert.equal(result.reviewed_by,undefined); assert.deepEqual(result.tags,['a']);
 assert.throws(()=>contentInput({...input,cover_image:'javascript:alert(1)'},false));
 assert.throws(()=>contentInput({...input,cover_image:'//evil.test'},false));
 assert.throws(()=>contentInput({...input,status:'admin'},false));
 assert.throws(()=>contentInput({...input,slug:'../../admin'},false));
 assert.throws(()=>contentInput({...input,content:''},false));
 assert.throws(()=>contentInput({...input,tags:[1]},false));
});
test('login attempts are limited by account even when the IP changes', () => {
 const now=Date.now();
 for(let i=0;i<5;i++) assert.equal(allowLogin('limited@example.com',now),true);
 assert.equal(allowLogin('LIMITED@example.com',now),false);
 assert.equal(allowLogin('limited@example.com',now+15*60_000+1),true);
});
