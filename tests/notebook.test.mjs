import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,normalizeState} from '../src/state.js';
import {createStudyNote,updateStudyNote,removeStudyNote,studyNotes,noteSourceUrl,noteKoreanPhrases,noteTimeLinks} from '../src/notebook.js';
const now=new Date('2026-10-16T03:00:00Z');
test('notes preserve Korean text, multiline content, dates and existing song notes through backup',()=>{
 const s=initialState();s.notes={lyric:'原来的歌词备注'};const note=createStudyNote(s,now);
 updateStudyNote(s,note.id,{title:' 第一讲 ',body:'元音 아\n辅音 ㅇ\n19 / 21 / 27',source:' 课程第一讲 08:10 '},new Date(now.getTime()+1000));
 const restored=normalizeState(JSON.parse(JSON.stringify(s))),saved=restored.studyNotes[0];
 assert.equal(saved.title,'第一讲');assert.match(saved.body,/아\n辅音 ㅇ/);assert.equal(saved.source,'课程第一讲 08:10');assert.equal(saved.createdAt,now.toISOString());assert.notEqual(saved.createdAt,saved.updatedAt);
 assert.deepEqual(restored.notes,{lyric:'原来的歌词备注'});assert.deepEqual(restored.cards,{});assert.deepEqual(restored.days,{});assert.deepEqual(restored.completedLessons,[]);
});
test('legacy progress gets an empty notebook without changing its old notes',()=>{const old=initialState();delete old.studyNotes;old.notes={a:'saved'};const restored=normalizeState(old);assert.deepEqual(restored.studyNotes,[]);assert.deepEqual(restored.notes,{a:'saved'});});
test('search combines title, Korean content and source while sorting without mutating the stored array',()=>{
 const s=initialState(),a=createStudyNote(s,now),b=createStudyNote(s,new Date(now.getTime()+1000));
 updateStudyNote(s,a.id,{title:'元音 １',body:'한국어 아',source:'Video Lesson A'},new Date(now.getTime()+2000));
 const before=s.studyNotes.map(x=>x.id);assert.deepEqual(studyNotes(s,'元音 1 한국어 video').map(x=>x.id),[a.id]);assert.equal(studyNotes(s,'不匹配').length,0);assert.equal(studyNotes(s)[0].id,a.id);assert.deepEqual(s.studyNotes.map(x=>x.id),before);
 removeStudyNote(s,b.id);assert.equal(s.studyNotes[0].id,a.id);
});
test('invalid or duplicate note backups reject, and rejected edits do not change an existing note',()=>{
 const s=initialState(),n=createStudyNote(s,now);updateStudyNote(s,n.id,{title:'saved',body:'正文',source:''},now);
 for(const edit of [x=>x.studyNotes=null,x=>x.studyNotes[0].body=5,x=>x.studyNotes[0].body='x'.repeat(30001),x=>x.studyNotes[0].title='',x=>x.studyNotes[0].title='x'.repeat(121),x=>x.studyNotes[0].source='x'.repeat(2001),x=>x.studyNotes[0].updatedAt='bad',x=>x.studyNotes[0].createdAt=null,x=>x.studyNotes.push({...x.studyNotes[0]})]){const copy=structuredClone(s);edit(copy);assert.throws(()=>normalizeState(copy));}
 const before=structuredClone(s);assert.throws(()=>updateStudyNote(s,n.id,{title:'new',body:'x'.repeat(30001),source:''},now));assert.throws(()=>removeStudyNote(s,'missing'));assert.throws(()=>updateStudyNote(s,'missing',{},now));assert.deepEqual(s,before);
});
test('blank titles use a safe default, capacity checks preserve saved notes and only valid web sources link',()=>{
 const s=initialState(),n=createStudyNote(s,now);updateStudyNote(s,n.id,{title:'  ',body:'',source:'javascript:alert(1)'},now);assert.equal(n.title,'未命名笔记');assert.equal(noteSourceUrl(n.source),null);
 for(const url of ['javascript:alert(1)','data:text/html,test','/relative','课程第一讲','file:///tmp/notes'])assert.equal(noteSourceUrl(url),null);
 assert.equal(noteSourceUrl('https://www.bilibili.com/video/BV1hL411q7Zb/?t=10'),'https://www.bilibili.com/video/BV1hL411q7Zb/?t=10');
 while(s.studyNotes.length<200)createStudyNote(s,now);assert.throws(()=>createStudyNote(s,now));assert.equal(s.studyNotes.length,200);
 const copy=structuredClone(s);copy.studyNotes.push({...n,id:'extra'});assert.throws(()=>normalizeState(copy));
});
test('note readings keep Korean phrases intact, skip isolated letters and preserve the note',()=>{
 const body='ㅏ → 아 (a)\nㄱ → 가 (ga)\n저는 학생입니다.\n저는 학생입니다.\nㅂ니다, ㄱ나다, 은/는\n中文与 <img src=x onerror=alert(1)> 안녕하세요';
 assert.deepEqual(noteKoreanPhrases(body),['아','가','저는 학생입니다','은','는','안녕하세요']);assert.match(body,/<img/);
 assert.deepEqual(noteKoreanPhrases('只有中文、English 和 ㅏ ㄱ ㅇ'),[]);assert.deepEqual(noteKoreanPhrases('아'.normalize('NFD')),['아']);
});
test('long notebooks limit rendered reading controls without repeating a phrase',()=>{const text=Array.from({length:120},(_,i)=>String.fromCharCode(0xac00+i)).join('\n');assert.equal(noteKoreanPhrases(text).length,100);});
test('note time links preserve the exact video and deduplicate minutes and hours without editing content',()=>{
 const text='01:40｜字母\n03:16、06:32｜元音\n00:03:16｜重复\n1:02:03｜长课\n99:99、1:99:10';
 const links=noteTimeLinks(text,'https://www.youtube.com/watch?v=smoKuiv5I1g&list=playlist&t=5');
 assert.deepEqual(links.map(x=>x.label),['01:40','03:16','06:32','1:02:03']);
 assert.deepEqual(links.map(x=>new URL(x.href).searchParams.get('t')),['100s','196s','392s','3723s']);
 assert.ok(links.every(x=>new URL(x.href).searchParams.get('v')==='smoKuiv5I1g'));assert.match(text,/99:99/);
 assert.equal(noteTimeLinks('00:10','https://youtu.be/smoKuiv5I1g')[0].href,links[0].href.replace('100s','10s'));
});
test('time links require a trusted YouTube video URL and cap long notes',()=>{
 for(const source of ['javascript:alert(1)','https://youtube.com.evil.test/watch?v=smoKuiv5I1g','https://evil.test/?v=smoKuiv5I1g','https://www.youtube.com/playlist?list=PL123','https://user:pass@youtu.be/smoKuiv5I1g','https://youtu.be/bad'])assert.deepEqual(noteTimeLinks('01:40',source),[]);
 assert.equal(noteTimeLinks(Array.from({length:50},(_,i)=>`${i}:00`).join('\n'),'https://youtu.be/smoKuiv5I1g').length,40);
});
