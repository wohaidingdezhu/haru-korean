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
