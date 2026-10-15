import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {initialState} from '../src/core.js';
import {handleProgress} from '../src/progress-api.js';
function database(){const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE progress (user_id TEXT PRIMARY KEY, state TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL)');return {prepare(query){return {bind(...args){return {first:()=>sql.prepare(query).get(...args),run:()=>({meta:{changes:sql.prepare(query).run(...args).changes}})};}}},close:()=>sql.close()};}
const user={userId:'user-a'},other={userId:'user-b'};
const get=()=>new Request('https://haru.test/api/progress');
const put=(revision,state=initialState(),userId=user.userId,origin='https://haru.test')=>new Request('https://haru.test/api/progress',{method:'PUT',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({userId,revision,state})});
test('cloud writes are isolated per account and stale writes cannot overwrite a newer device',async()=>{
 const db=database();try{
  assert.equal((await handleProgress(get(),db,null)).status,401);
  assert.equal((await handleProgress(put(0),db,user)).status,200);
  const a=await (await handleProgress(get(),db,user)).json();assert.equal(a.revision,1);
  const b=await (await handleProgress(get(),db,other)).json();assert.equal(b.state,null);
  const next=initialState();next.completedLessons=[0];assert.equal((await handleProgress(put(1,next),db,user)).status,200);
  const stale=await handleProgress(put(1),db,user);assert.equal(stale.status,409);assert.deepEqual((await stale.json()).state.completedLessons,[0]);
  assert.equal((await handleProgress(put(0,initialState(),'user-a'),db,other)).status,409);
  assert.equal((await (await handleProgress(get(),db,other)).json()).state,null);
 }finally{db.close();}
});
test('invalid backups and cross-origin writes leave the cloud record unchanged',async()=>{
 const db=database();try{
  assert.equal((await handleProgress(put(0,initialState(),'user-a','https://other.test'),db,user)).status,403);
  assert.equal((await handleProgress(put(0,{...initialState(),lessonProgress:null}),db,user)).status,400);
  const oversized=new Request('https://haru.test/api/progress',{method:'PUT',headers:{Origin:'https://haru.test','Content-Length':'3000001'},body:'{}'});
  assert.equal((await handleProgress(oversized,db,user)).status,413);
  const response=await handleProgress(get(),db,user);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal((await response.json()).state,null);
 }finally{db.close();}
});
