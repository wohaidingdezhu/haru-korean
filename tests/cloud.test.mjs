import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core.js';
import {ProgressSync} from '../src/cloud.js';
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
function server(){let state=null,revision=0;return async(url,options={})=>{
 if(options.method==='PUT'){const value=JSON.parse(options.body);if(value.revision!==revision)return Response.json({userId:'a',state,revision},{status:409});state=value.state;revision++;return Response.json({revision});}
 return Response.json({userId:'a',state,revision});
};}
function device(request,store=storage()){const d={state:null,status:''};d.sync=new ProgressSync({storage:store,request,onRemote:s=>d.state=s,onStatus:s=>d.status=s});d.store=store;d.change=()=>{d.sync.changed(d.state);clearTimeout(d.sync.timer);};return d;}
test('a second device automatically reads the first device progress',async()=>{
 const request=server(),a=device(request),b=device(request);a.state=await a.sync.connect();b.state=await b.sync.connect();
 a.state.completedLessons=[0];a.change();await a.sync.sync();await b.sync.sync();
 assert.deepEqual(b.state.completedLessons,[0]);assert.equal(b.sync.revision,1);assert.equal(a.sync.dirty,false);
});
test('simultaneous device edits preserve local data and require explicit conflict resolution',async()=>{
 const request=server(),a=device(request),b=device(request);a.state=await a.sync.connect();b.state=await b.sync.connect();
 a.state.notes={a:'one'};a.change();await a.sync.sync();b.state.notes={b:'two'};b.change();await b.sync.sync();
 assert.ok(b.sync.conflict);assert.deepEqual(JSON.parse(b.store.getItem(b.sync.key)).notes,{b:'two'});assert.equal(b.sync.dirty,true);
 await b.sync.resolve(false);assert.deepEqual(b.state.notes,{a:'one'});assert.equal(b.sync.conflict,null);
});
test('offline edits survive reload and upload after reconnecting',async()=>{
 const request=server(),store=storage();let offline=false;
 const network=(...args)=>{if(offline)throw Error('offline');return request(...args);};
 const a=device(network,store);a.state=await a.sync.connect();a.state.completedLessons=[1];a.change();offline=true;await a.sync.sync();assert.equal(a.sync.dirty,true);
 offline=false;const reloaded=device(network,store);reloaded.state=await reloaded.sync.connect();assert.deepEqual(reloaded.state.completedLessons,[1]);await reloaded.sync.sync();assert.equal(reloaded.sync.dirty,false);
});
test('an account switch stops synchronization instead of copying data between accounts',async()=>{
 let switched=false;const request=async()=>Response.json({userId:switched?'b':'a',state:initialState(),revision:0});
 const a=device(request);a.state=await a.sync.connect();switched=true;await a.sync.sync();assert.equal(a.sync.ready,false);assert.match(a.status,/账号已切换/);
});
test('the default browser fetch is invoked without binding it to the sync instance',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=function(){assert.equal(this,undefined);return Promise.resolve(Response.json({userId:'a',state:initialState(),revision:0}));};
 const sync=new ProgressSync({storage:storage(),onRemote:()=>{}});assert.ok(await sync.connect());
 }finally{globalThis.fetch=original;}
});
