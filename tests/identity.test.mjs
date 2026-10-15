import test from 'node:test';
import assert from 'node:assert/strict';
import {identityFromHeaders} from '../src/identity.js';
test('hosted email-only identity can save progress without a missing-ID login loop',async()=>{
 const a=await identityFromHeaders(new Headers({'oai-authenticated-user-email':'Me@example.test'}));
 const b=await identityFromHeaders(new Headers({'oai-authenticated-user-email':'me@example.test'}));
 const other=await identityFromHeaders(new Headers({'oai-authenticated-user-email':'other@example.test'}));
 assert.equal(a.userId,b.userId);assert.notEqual(a.userId,other.userId);assert.match(a.userId,/^email:[a-f0-9]{64}$/);
});
test('native user ID is preferred and missing identity remains unauthenticated',async()=>{
 const user=await identityFromHeaders(new Headers({'oai-authenticated-user-id':'native-id','oai-authenticated-user-email':'me@example.test','oai-authenticated-user-full-name':'%ED%95%98%EB%A3%A8','oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'}));
 assert.equal(user.userId,'native-id');assert.equal(user.displayName,'하루');assert.equal(await identityFromHeaders(new Headers()),null);
});
