import SrtParser from '@qgustavor/srt-parser';
import {SubtitleCollection} from '../upstream/asbplayer/common/subtitle-collection/subtitle-collection.ts';
import {subtitlesToSrt} from '../upstream/asbplayer/common/subtitle-reader/subtitles-to-srt.ts';
import {createEmptyCard,fsrs,Rating} from 'ts-fsrs';
export {Rating,SubtitleCollection};
export const scheduler=fsrs({request_retention:0.9,enable_fuzz:false});
export const dayKey=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const previousDay=(key)=>{const d=new Date(key+'T12:00:00+08:00');d.setUTCDate(d.getUTCDate()-1);return dayKey(d);};
export const initialState=()=>({version:1,quota:2,minutes:15,completedLessons:[],lessonProgress:{},cards:{},reviews:[],days:{},song:{title:'Wedding Dress',artist:'TAEYANG',videoId:'vXNmN0kHRwA',biliBvid:'BV1hL411q7Zb',mvSource:'bilibili',lines:[]},learned:[],notes:{},segment:{start:0,end:10,rate:0.8},songBatches:{}});
export function normalizeState(value){
 if(!value||value.version!==1||!Array.isArray(value.completedLessons)||!value.cards||!Array.isArray(value.song?.lines))throw Error('这不是 HARU 的进度文件。');
 const base=initialState();const s={...base,...value,song:{...base.song,...value.song}};
 s.quota=value.quota===1?1:2;s.minutes=[3,15,20].includes(value.minutes)?value.minutes:15;
 s.completedLessons=s.completedLessons.filter(x=>Number.isInteger(x)&&x>=0&&x<14);
 for(const line of s.song.lines){if(typeof line.id!=='string'||typeof line.text!=='string'||line.text.length>3000)throw Error('歌词数据格式有误。');}
 for(const c of Object.values(s.cards)){if(!c||typeof c.front!=='string'||typeof c.back!=='string'||!Number.isFinite(new Date(c.fsrs?.due).getTime()))throw Error('复习数据格式有误。');}
 if(!Array.isArray(s.learned)||!Array.isArray(s.reviews)||!s.days||!s.songBatches||!s.notes)throw Error('进度数据格式有误。');
 return s;
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
 return nodes.map((x,i)=>{if(x.start!==null&&(!Number.isFinite(x.start)||!Number.isFinite(x.end)||x.end<=x.start||x.start<0))throw Error('歌词时间轴有误，请检查起止时间。');return {...x,id:hash(i+':'+x.text),index:i,track:0};});
}
export function songBatch(state,now=new Date()){
 const key=dayKey(now),existing=state.songBatches[key];
 if(existing)return existing.map(id=>state.song.lines.find(x=>x.id===id)).filter(Boolean);
 const lines=state.song.lines.filter(x=>!state.learned.includes(x.id)).slice(0,state.quota);
 if(lines.length)state.songBatches[key]=lines.map(x=>x.id);
 return lines;
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
 state.reviews.push({id,at:now.toISOString(),rating});state.reviews=state.reviews.slice(-10000);
 const key=dayKey(now);state.days[key]??={};state.days[key].reviews=(state.days[key].reviews||0)+1;
 return next;
}
export function learnLine(state,line,now=new Date()){
 if(!songBatch(state,now).some(x=>x.id===line.id))throw Error('今天的新句额度已用完，下一句留到明天。');
 if(!state.learned.includes(line.id))state.learned.push(line.id);
 addCard(state,'song:'+line.id,line.text,state.notes[line.id]||'回想意思，读一遍，再跟着原唱唱一遍。','song',now);
 const key=dayKey(now);state.days[key]??={};state.days[key].song=true;
}
export function streak(state,now=new Date()){
 let key=dayKey(now),count=0;if(!state.days[key]?.complete)key=previousDay(key);
 while(state.days[key]?.complete){count++;key=previousDay(key);}return count;
}
export function toAnki(state){const clean=(s)=>s.replace(/\t/g,' ').replace(/\r?\n/g,' / ').replace(/<[^>]*>/g,'');return ['#separator:Tab','#html:false','#columns:Front\tBack\tTags',...Object.values(state.cards).map(x=>[clean(x.front),clean(x.back),'haru '+x.kind].join('\t'))].join('\n');}
export function toSrt(lines){return subtitlesToSrt(lines.filter(x=>x.start!==null).map(x=>({...x,start:x.start,end:x.end})));}
export function validateSegment(start,end,duration){return Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start&&(!Number.isFinite(duration)||end<=duration);}
