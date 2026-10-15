import {normalizeState} from './state.js';
const limit=3000000;
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function readBody(request){
 if(Number(request.headers.get('content-length'))>limit)throw Error('too_large');
 const reader=request.body?.getReader();if(!reader)throw Error('invalid');
 const decoder=new TextDecoder();let size=0,text='';
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('too_large');}text+=decoder.decode(value,{stream:true});}}finally{reader.releaseLock();}
 return JSON.parse(text+decoder.decode());
}
export async function handleProgress(request,db,user){
 if(!user?.userId)return reply({error:'请先登录以同步学习进度。'},401);
 if(!db)return reply({error:'云端保存暂不可用，本地进度仍会保留。'},503);
 if(!['GET','PUT'].includes(request.method))return reply({error:'不支持的请求。'},405);
 if(request.method==='PUT'&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'请求来源不匹配。'},403);
 const read=async()=>{
  const row=await db.prepare('SELECT state, revision, updated_at FROM progress WHERE user_id = ?').bind(user.userId).first();
  return {userId:user.userId,state:row?JSON.parse(row.state):null,revision:row?.revision??0,updatedAt:row?.updated_at??null};
 };
 try{
  if(request.method==='GET')return reply(await read());
  let input,state;
  try{input=await readBody(request);if(!Number.isSafeInteger(input.revision)||input.revision<0)throw Error('invalid');state=normalizeState(input.state);}catch(error){return reply({error:error.message==='too_large'?'进度超过 3 MB，请先导出备份。':'进度数据格式有误，云端原记录未更改。'},error.message==='too_large'?413:400);}
  if(input.userId!==user.userId)return reply({error:'账号已切换，请刷新后继续。',code:'account_changed'},409);
  const json=JSON.stringify(state),at=new Date().toISOString();
  const result=input.revision===0
   ?await db.prepare('INSERT INTO progress (user_id, state, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,json,at).run()
   :await db.prepare('UPDATE progress SET state = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?').bind(json,at,user.userId,input.revision).run();
  if(!result.meta.changes)return reply({error:'另一台设备已更新进度，请选择要保留的版本。',...await read()},409);
  return reply({revision:input.revision+1,updatedAt:at});
 }catch{return reply({error:'云端暂时无法保存，本地进度已保留，请稍后重试。'},503);}
}
