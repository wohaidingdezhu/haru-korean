export const initialState=()=>({version:1,quota:2,minutes:15,completedLessons:[],lessonProgress:{},cards:{},reviews:[],days:{},song:{title:'Wedding Dress',artist:'TAEYANG',videoId:'vXNmN0kHRwA',biliBvid:'BV1hL411q7Zb',mvSource:'bilibili',lines:[]},learned:[],notes:{},segment:{start:0,end:10,rate:0.8},songBatches:{}});
export function normalizeState(value){
 if(!value||value.version!==1||!Array.isArray(value.completedLessons)||!value.cards||!Array.isArray(value.song?.lines))throw Error('这不是 HARU 的进度文件。');
 const base=initialState();const s={...base,...value,song:{...base.song,...value.song}};
 s.quota=value.quota===1?1:2;s.minutes=[3,15,20].includes(value.minutes)?value.minutes:15;
 s.completedLessons=s.completedLessons.filter(x=>Number.isInteger(x)&&x>=0&&x<14);
 for(const line of s.song.lines){if(typeof line.id!=='string'||typeof line.text!=='string'||line.text.length>3000)throw Error('歌词数据格式有误。');}
 for(const c of Object.values(s.cards)){if(!c||typeof c.front!=='string'||typeof c.back!=='string'||!Number.isFinite(new Date(c.fsrs?.due).getTime()))throw Error('复习数据格式有误。');}
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(!Array.isArray(s.learned)||!Array.isArray(s.reviews)||!object(s.cards)||!object(s.days)||!object(s.songBatches)||!object(s.notes)||!object(s.lessonProgress)||!object(s.segment))throw Error('进度数据格式有误。');
 for(const [id,index] of Object.entries(s.lessonProgress))if(!/^\d+$/.test(id)||Number(id)>=14||!Number.isInteger(index)||index<0||index>4)throw Error('课程进度格式有误。');
 for(const [key,d] of Object.entries(s.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!object(d)||d.lessonId!==undefined&&(!Number.isInteger(d.lessonId)||d.lessonId< -1||d.lessonId>=14)||d.reviewIds!==undefined&&(!Array.isArray(d.reviewIds)||d.reviewIds.some(id=>typeof id!=='string')))throw Error('每日进度格式有误。');
  if(d.activities!==undefined&&(!Array.isArray(d.activities)||d.activities.some(a=>!a||!['basic','lesson','song'].includes(a.kind)||typeof a.id!=='string'||typeof a.front!=='string'||typeof a.back!=='string'||typeof a.title!=='string'||!Number.isFinite(Date.parse(a.at)))))throw Error('学习历史格式有误。');
 }
 if(s.reviews.some(r=>!r||typeof r.id!=='string'||![1,2,3,4].includes(r.rating)||!Number.isFinite(Date.parse(r.at))))throw Error('复习记录格式有误。');
 if(Object.values(s.songBatches).some(ids=>!Array.isArray(ids)||ids.some(id=>typeof id!=='string'))||s.learned.some(id=>typeof id!=='string')||Object.values(s.notes).some(n=>typeof n!=='string'))throw Error('歌曲进度格式有误。');
 return s;
}
