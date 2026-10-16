export function validateStudyNote(note){
 if(!note||typeof note!=='object'||Array.isArray(note)||typeof note.id!=='string'||!note.id||note.id.length>100||typeof note.title!=='string'||!note.title.trim()||note.title.length>120||typeof note.body!=='string'||note.body.length>30000||typeof note.source!=='string'||note.source.length>2000||typeof note.createdAt!=='string'||!Number.isFinite(Date.parse(note.createdAt))||typeof note.updatedAt!=='string'||!Number.isFinite(Date.parse(note.updatedAt)))throw Error('学习笔记格式有误。');
}
export function createStudyNote(state,now=new Date()){
 if(state.studyNotes.length>=200)throw Error('最多保存 200 篇笔记，请先整理已有笔记。');
 const note={id:crypto.randomUUID(),title:'未命名笔记',body:'',source:'',createdAt:now.toISOString(),updatedAt:now.toISOString()};
 state.studyNotes.unshift(note);return note;
}
export function updateStudyNote(state,id,fields,now=new Date()){
 const note=state.studyNotes.find(x=>x.id===id);if(!note)throw Error('找不到这篇笔记。');
 const next={...note,title:fields.title.trim()||'未命名笔记',body:fields.body,source:fields.source.trim(),updatedAt:now.toISOString()};
 validateStudyNote(next);Object.assign(note,next);return note;
}
export function removeStudyNote(state,id){const index=state.studyNotes.findIndex(x=>x.id===id);if(index<0)throw Error('找不到这篇笔记。');state.studyNotes.splice(index,1);}
export function studyNotes(state,query=''){
 const terms=query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return state.studyNotes.filter(note=>{const text=(note.title+' '+note.body+' '+note.source).normalize('NFKC').toLocaleLowerCase();return terms.every(term=>text.includes(term));}).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export function noteSourceUrl(source){try{const url=new URL(source);return ['http:','https:'].includes(url.protocol)?url.href:null;}catch{return null;}}
export function noteKoreanPhrases(body){
 // shortcut: show up to 100 distinct fragments; add paging if longer notes need more.
 return [...new Set(body.normalize('NFC').match(/(?<![가-힣ㄱ-ㅎㅏ-ㅣ])[가-힣]+(?:[ \t]+[가-힣]+)*(?![가-힣ㄱ-ㅎㅏ-ㅣ])/g)||[])].slice(0,100);
}
export function noteTimeLinks(body,source){
 const href=noteSourceUrl(source);if(!href)return [];
 const url=new URL(href);if(url.username||url.password)return [];
 const id=url.hostname==='youtu.be'?url.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)&&url.pathname==='/watch'?url.searchParams.get('v'):null;
 if(!/^[\w-]{11}$/.test(id||''))return [];
 const seen=new Set(),links=[];
 // shortcut: cap long notes at 40 unique video positions; add paging if a lesson needs more.
 for(const match of body.matchAll(/(?<![\d:/])\b(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)\b(?!:\d)/g)){
  if(match[1]&&Number(match[2])>=60)continue;
  const seconds=Number(match[1]||0)*3600+Number(match[2])*60+Number(match[3]);
  if(seen.has(seconds))continue;seen.add(seconds);links.push({label:match[0],href:`https://www.youtube.com/watch?v=${id}&t=${seconds}s`});if(links.length===40)break;
 }
 return links;
}
