import {initialState,normalizeState} from './core.js';
export class ProgressSync{
 constructor({storage,request=(...args)=>fetch(...args),onRemote,onStatus}){this.storage=storage;this.request=request;this.onRemote=onRemote;this.onStatus=onStatus;this.revision=0;this.dirty=false;this.busy=false;this.conflict=null;this.ready=false;this.key='haru-korean-v1';this.status='正在连接云端…';}
 statusChanged(text){this.status=text;this.onStatus?.(text);}
 remember(){this.storage.setItem(this.key+':sync',JSON.stringify({revision:this.revision,dirty:this.dirty}));}
 async connect(){
  const response=await this.request('/api/progress',{cache:'no-store',headers:{Accept:'application/json'}});
  if(response.status===404){this.statusChanged('仅保存在当前浏览器');return null;}
  if(response.status===401){this.statusChanged('登录后可跨设备同步');return null;}
  if(!response.ok)throw Error('云端暂不可用；请联网后刷新，避免覆盖旧进度。');
  const remote=await response.json();if(typeof remote.userId!=='string'||!Number.isSafeInteger(remote.revision))throw Error('云端响应格式有误。');
  const incoming=remote.state?normalizeState(remote.state):initialState();
  this.userId=remote.userId;this.key+=':'+remote.userId;
  const raw=this.storage.getItem(this.key),meta=JSON.parse(this.storage.getItem(this.key+':sync')||'null');
  const local=raw?normalizeState(JSON.parse(raw)):null;
  this.ready=true;this.revision=remote.revision;
  if(local&&meta?.dirty){
   this.revision=meta.revision;this.dirty=true;
   if(meta.revision!==remote.revision){this.conflict={...remote,state:incoming};this.statusChanged('同步冲突，请到学习设置选择版本');}
   else this.statusChanged('有进度待上传');
   return local;
  }
  this.storage.setItem(this.key,JSON.stringify(incoming));this.remember();this.statusChanged('云端已同步');return incoming;
 }
 changed(state){
  const text=JSON.stringify(state);if(this.storage.getItem(this.key)===text)return;
  this.storage.setItem(this.key,text);
  if(!this.ready)return;
  this.dirty=true;this.remember();if(!this.conflict)this.statusChanged('正在保存…');
  clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync(),700);
 }
 async sync(){
  if(!this.ready||this.busy||this.conflict)return;
  this.busy=true;
  try{
   if(this.dirty){
    const snapshot=this.storage.getItem(this.key);
    const response=await this.request('/api/progress',{method:'PUT',headers:{'Content-Type':'application/json'},keepalive:new TextEncoder().encode(snapshot).length<60000,body:JSON.stringify({userId:this.userId,revision:this.revision,state:JSON.parse(snapshot)})});
    const data=await response.json();
    if(data.code==='account_changed'){this.ready=false;this.statusChanged('账号已切换，请刷新页面后继续');return;}
    if(response.status===409){this.conflict={...data,state:normalizeState(data.state)};this.statusChanged('同步冲突，请到学习设置选择版本');return;}
    if(!response.ok)throw Error(data.error||'保存失败');
    this.revision=data.revision;this.dirty=this.storage.getItem(this.key)!==snapshot;this.remember();
    this.statusChanged(this.dirty?'有进度待上传':'云端已同步');
    if(this.dirty){clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync(),700);}
   }else{
    const response=await this.request('/api/progress',{cache:'no-store'});if(!response.ok)throw Error('读取失败');
    const data=await response.json();
    if(data.userId!==this.userId){this.ready=false;this.statusChanged('账号已切换，请刷新页面后继续');return;}
    if(this.dirty)return;
    if(data.revision!==this.revision){
     const next=normalizeState(data.state);this.revision=data.revision;this.storage.setItem(this.key,JSON.stringify(next));this.remember();this.onRemote(next);
    }
    this.statusChanged('云端已同步');
   }
  }catch{this.statusChanged('尚未同步：本地已保留，联网后重试');}finally{this.busy=false;}
 }
 async resolve(useLocal){
  if(!this.conflict)return;
  const remote=this.conflict;this.revision=remote.revision;
  if(!useLocal){this.storage.setItem(this.key,JSON.stringify(remote.state));this.dirty=false;this.remember();this.onRemote(remote.state);}
  else this.dirty=true;
  this.conflict=null;this.remember();this.statusChanged(useLocal?'正在保存…':'云端已同步');await this.sync();
 }
}
