import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core.js';
import {ProgressSync} from '../src/cloud.js';
import {createStudyNote,updateStudyNote} from '../src/notebook.js';
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
test('notebook drafts sync to a second device and retain edits after reconnecting',async()=>{
 const request=server(),a=device(request),b=device(request);a.state=await a.sync.connect();b.state=await b.sync.connect();
 const note=createStudyNote(a.state);updateStudyNote(a.state,note.id,{title:'视频第一讲',body:'아\n元音21个',source:'课堂 08:10'});a.change();await a.sync.sync();await b.sync.sync();
 assert.equal(b.state.studyNotes[0].body,'아\n元音21个');
 updateStudyNote(b.state,note.id,{title:'视频第一讲',body:'아\n元音21个\n补充笔记',source:'课堂 08:10'});b.change();await b.sync.sync();
 const reloaded=device(request,a.store);reloaded.state=await reloaded.sync.connect();assert.match(reloaded.state.studyNotes[0].body,/补充笔记/);assert.equal(reloaded.state.studyNotes[0].id,note.id);
});
test('identical concurrent saves acknowledge the latest revision instead of reporting a conflict',async()=>{
 const request=server(),a=device(request),b=device(request);a.state=await a.sync.connect();b.state=await b.sync.connect();
 a.state.completedLessons=[0];a.change();await a.sync.sync();b.state.completedLessons=[0];b.change();await b.sync.sync();
 assert.equal(b.sync.conflict,null);assert.equal(b.sync.dirty,false);assert.equal(b.sync.revision,a.sync.revision);assert.equal(b.status,'云端已同步');
 const saved=await (await request('/api/progress')).json();assert.equal(saved.revision,1);
});
test('reloading an already saved offline snapshot clears stale dirty metadata without another write',async()=>{
 const request=server(),a=device(request),b=device(request);a.state=await a.sync.connect();b.state=await b.sync.connect();
 a.state.completedLessons=[0];a.change();await a.sync.sync();b.state.completedLessons=[0];b.change();
 const reloaded=device(request,b.store);reloaded.state=await reloaded.sync.connect();
 assert.equal(reloaded.sync.conflict,null);assert.equal(reloaded.sync.dirty,false);assert.equal(reloaded.sync.revision,1);assert.deepEqual(reloaded.state.completedLessons,[0]);
 assert.equal(JSON.parse(b.store.getItem(reloaded.sync.key+':sync')).dirty,false);
});
test('an identical rejected request does not discard newer local edits made while it was in flight',async()=>{
 const remote=initialState();remote.completedLessons=[0];let release;let waiting=false;
 const request=async(url,options={})=>options.method==='PUT'?new Promise(resolve=>{waiting=true;release=()=>resolve(Response.json({userId:'a',state:remote,revision:1},{status:409}));}):Response.json({userId:'a',state:initialState(),revision:0});
 const a=device(request);a.state=await a.sync.connect();a.state.completedLessons=[0];a.change();const saving=a.sync.sync();assert.equal(waiting,true);
 a.state.notes={draft:'请求途中新增的笔记'};a.change();release();await saving;
 assert.ok(a.sync.conflict);assert.equal(a.sync.dirty,true);assert.equal(JSON.parse(a.store.getItem(a.sync.key)).notes.draft,'请求途中新增的笔记');
});
