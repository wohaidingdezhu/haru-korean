import {initialState,normalizeState} from './state.js';
export {initialState,normalizeState};
import SrtParser from '@qgustavor/srt-parser';
import {SubtitleCollection} from '../upstream/asbplayer/common/subtitle-collection/subtitle-collection.ts';
import {subtitlesToSrt} from '../upstream/asbplayer/common/subtitle-reader/subtitles-to-srt.ts';
import {createEmptyCard,fsrs,Rating} from 'ts-fsrs';
export {Rating,SubtitleCollection};
export const scheduler=fsrs({request_retention:0.9,enable_fuzz:false});
export const dayKey=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const previousDay=(key)=>{const d=new Date(key+'T12:00:00+08:00');d.setUTCDate(d.getUTCDate()-1);return dayKey(d);};
export function librarySongs(state){return [...(state.songId?[{id:state.songId,song:state.song,learned:state.learned,notes:state.notes,segment:state.segment,songBatches:state.songBatches}]:[]),...state.songs];}
export function switchSong(state,id){
 if(id===state.songId)return;
 const index=state.songs.findIndex(x=>x.id===id);if(index<0)throw Error('找不到这首歌。');
 const current=librarySongs(state)[0],next=state.songs.splice(index,1)[0];
 if(state.songId)state.songs.push(current);
 Object.assign(state,{songId:next.id,song:next.song,learned:next.learned,notes:next.notes,segment:next.segment,songBatches:next.songBatches});
}
export function addSong(state,song){
 const current=librarySongs(state)[0];if(state.songId)state.songs.push(current);
 Object.assign(state,{songId:crypto.randomUUID(),song,learned:[],notes:{},segment:{start:0,end:10,rate:0.8},songBatches:{}});
}
export function dailySongCount(state,now=new Date()){
 const key=dayKey(now),day=state.days[key];
 const batches=librarySongs(state).reduce((n,entry)=>n+(entry.songBatches[key]||[]).filter(id=>entry.learned.includes(id)).length,0);
 return Math.max(day?.songLearnedCount||0,day?.activities?.filter(x=>x.kind==='song').length||0,batches);
}
export function removeSong(state,id,now=new Date()){
 const entries=librarySongs(state);if(!entries.some(x=>x.id===id))throw Error('找不到这首歌。');
 const key=dayKey(now);state.days[key]??={};state.days[key].songLearnedCount=dailySongCount(state,now);
 if(id!==state.songId){state.songs=state.songs.filter(x=>x.id!==id);return;}
 const remaining=entries.filter(x=>x.id!==id),next=remaining.shift();
 Object.assign(state,next?{songId:next.id,song:next.song,learned:next.learned,notes:next.notes,segment:next.segment,songBatches:next.songBatches,songs:remaining}:{songId:'',songs:[],song:{title:'我的歌曲',artist:'',videoId:'',biliBvid:'',mvSource:'bilibili',lines:[]},learned:[],notes:{},segment:{start:0,end:10,rate:0.8},songBatches:{}});
}
export const songCardId=(state,id)=>state.songId==='default-song'&&state.cards['song:'+id]?'song:'+id:'song:'+state.songId+':'+id;
export function recordStudy(state,activity,now=new Date()){
 const key=dayKey(now);state.days[key]??={};const day=state.days[key];day.activities??=[];
 if(!day.activities.some(x=>x.kind===activity.kind&&x.id===activity.id))day.activities.push({...activity,at:now.toISOString()});
}
export function studyHistory(state){
 const grouped=new Map();
 for(const [date,day] of Object.entries(state.days))if(day.complete||day.basic||day.lightBasic||day.song||day.reviews||day.activities?.length)grouped.set(date,{date,...day,activities:day.activities||[],reviewDetails:[]});
 for(const r of state.reviews){const date=dayKey(new Date(r.at));if(!grouped.has(date))grouped.set(date,{date,activities:[],reviewDetails:[]});const card=state.cards[r.id];grouped.get(date).reviewDetails.push({...r,front:r.front??card?.front??'旧复习卡',back:r.back??card?.back??''});}
 return [...grouped.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
export const hash=(s)=>{let h=2166136261;for(const c of s){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
export function parseLyrics(raw,format='auto'){
 if(raw.length>300000)throw Error('文件过大，请导入 300 KB 以内的歌词。');
 const text=raw.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();if(!text)throw Error('先粘贴歌词，或选择一个歌词文件。');
 let nodes=[];
 if(format==='srt'||/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(text)){
  const parsed=new SrtParser({numericTimestamps:true}).fromSrt(text);
  nodes=parsed.map(x=>({text:x.text.replace(/<[^>]*>/g,'').trim(),start:Math.round(Number(x.startTime)*1000),end:Math.round(Number(x.endTime)*1000)}));
 }else if(/\[\d{1,3}:\d{2}(?:[.:]\d+)?\]/.test(text)){
  for(const row of text.split('\n')){const stamps=[...row.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];const words=row.replace(/\[[^\]]*\]/g,'').trim();for(const m of stamps){const start=(Number(m[1])*60+Number(m[2]))*1000+Number((m[3]||'').padEnd(3,'0'));if(words)nodes.push({text:words,start,end:null});}}
  nodes=nodes.filter(x=>/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(x.text));nodes.sort((a,b)=>a.start-b.start);nodes.forEach((x,i)=>x.end=nodes.slice(i+1).find(n=>n.start>x.start)?.start??x.start+6000);
 }else nodes=text.split('\n').map(x=>({text:x.trim(),start:null,end:null})).filter(x=>x.text&&!/^\[[^\]]*\]$/.test(x.text));
 nodes=nodes.filter(x=>x.text&&/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(x.text));
 if(!nodes.length)throw Error('没有找到韩文句子。请每行放一句韩语歌词，或导入含韩文的 LRC/SRT。');
 if(nodes.length>500)throw Error('最多导入 500 句。');
 return nodes.map((x,i)=>{if(x.text.length>3000)throw Error('单句歌词不能超过 3000 个字符，请按句分行。');if(x.start!==null&&(!Number.isFinite(x.start)||!Number.isFinite(x.end)||x.end<=x.start||x.start<0))throw Error('歌词时间轴有误，请检查起止时间。');return {...x,id:hash(i+':'+x.text),index:i,track:0};});
}
export function songBatch(state,now=new Date()){
 const key=dayKey(now),existing=state.songBatches[key];state.days[key]??={};const day=state.days[key];
 if(state.song.lines.length)day.songQuota??=state.quota;
 const remaining=Math.max(0,(day.songQuota||state.quota)-dailySongCount(state,now));
 if(existing){const lines=existing.map(id=>state.song.lines.find(x=>x.id===id)).filter(Boolean);const pending=lines.filter(x=>!state.learned.includes(x.id)).slice(0,remaining);return lines.filter(x=>state.learned.includes(x.id)||pending.includes(x));}
 const lines=state.song.lines.filter(x=>!state.learned.includes(x.id)).slice(0,remaining);
 if(lines.length)state.songBatches[key]=lines.map(x=>x.id);
 return lines;
}
export function dailyStatus(state,light=false,now=new Date()){
 const key=dayKey(now),batch=songBatch(state,now),day=state.days[key];
 const basic=day.lessonId===-1||!!(light?(day.basic||day.lightBasic):day.basic);
 const review=day.reviewIds?.length?day.reviewIds.every(id=>state.reviews.some(x=>x.id===id&&dayKey(new Date(x.at))===key)):light||!!(day.drill||day.basic);
 const quotaDone=dailySongCount(state,now)>=(light?1:day.songQuota||state.quota);
 const useWarmup=batch.length===0&&!quotaDone;
 const song=quotaDone|| (useWarmup?!!(light?(day.warmup||day.lightWarmup):day.warmup):light?batch.some(x=>state.learned.includes(x.id)):batch.every(x=>state.learned.includes(x.id)));
 return {basic,review,song,useWarmup,quotaDone,complete:basic&&review&&song};
}
export function addCard(state,id,front,back,kind='basic',now=new Date()){
 if(!state.cards[id])state.cards[id]={id,front,back,kind,fsrs:createEmptyCard(new Date(now.getTime()+86400000))};
 else state.cards[id].back=back;
}
export function dueCards(state,now=new Date()){return Object.values(state.cards).filter(x=>new Date(x.fsrs.due)<=now).sort((a,b)=>new Date(a.fsrs.due)-new Date(b.fsrs.due));}
export function rateCard(state,id,rating,now=new Date()){
 const c=state.cards[id];if(!c)throw Error('找不到复习卡');
 const card={...c.fsrs,due:new Date(c.fsrs.due)};if(c.fsrs.last_review)card.last_review=new Date(c.fsrs.last_review);
 const next=scheduler.next(card,now,rating);c.fsrs=next.card;
 state.reviews.push({id,at:now.toISOString(),rating,front:c.front,back:c.back});state.reviews=state.reviews.slice(-10000);
 const key=dayKey(now);state.days[key]??={};state.days[key].reviews=(state.days[key].reviews||0)+1;
 return next;
}
export function learnLine(state,line,now=new Date()){
 if(!songBatch(state,now).some(x=>x.id===line.id))throw Error('今天的新句额度已用完，下一句留到明天。');
 const key=dayKey(now),count=dailySongCount(state,now),isNew=!state.learned.includes(line.id);
 if(!state.learned.includes(line.id))state.learned.push(line.id);
 addCard(state,songCardId(state,line.id),line.text,state.notes[line.id]||'回想意思，读一遍，再跟着原唱唱一遍。','song',now);
 state.days[key]??={};state.days[key].song=true;state.days[key].songLearnedCount=count+(isNew?1:0);
 recordStudy(state,{kind:'song',id:state.songId+':'+line.id,songId:state.songId,title:state.song.title,front:line.text,back:state.notes[line.id]||''},now);
}
export function streak(state,now=new Date()){
 let key=dayKey(now),count=0;if(!state.days[key]?.complete)key=previousDay(key);
 while(state.days[key]?.complete){count++;key=previousDay(key);}return count;
}
export function toAnki(state){const clean=(s)=>s.replace(/\t/g,' ').replace(/\r?\n/g,' / ').replace(/<[^>]*>/g,'');return ['#separator:Tab','#html:false','#columns:Front\tBack\tTags',...Object.values(state.cards).map(x=>[clean(x.front),clean(x.back),'haru '+x.kind].join('\t'))].join('\n');}
export function toSrt(lines){return subtitlesToSrt(lines.filter(x=>x.start!==null).map(x=>({...x,start:x.start,end:x.end})));}
export function validateSegment(start,end,duration){return Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start&&(!Number.isFinite(duration)||end<=duration);}
