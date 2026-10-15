import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,normalizeState,recordStudy,studyHistory,parseLyrics,songBatch,learnLine,addCard,rateCard,Rating} from '../src/core.js';
const today=new Date('2026-10-14T16:01:00Z');
test('history records studied items once per day, independent of completion and assigned tasks',()=>{
 const s=initialState(),a={kind:'basic',id:'basic:0:0',title:'第一组元音',front:'아',back:'a'};
 s.days['2026-10-14']={lessonId:0,reviewIds:[]};
 recordStudy(s,a,today);recordStudy(s,a,today);
 const history=studyHistory(normalizeState(JSON.parse(JSON.stringify(s))));
 assert.equal(history.length,1);assert.equal(history[0].date,'2026-10-15');assert.equal(history[0].activities.length,1);assert.equal(history[0].complete,undefined);
});
test('song history preserves text and notes after switching songs',()=>{
 const s=initialState();s.song.lines=parseLyrics('안녕하세요');s.notes[s.song.lines[0].id]='你好';
 const line=songBatch(s,today)[0];learnLine(s,line,today);s.song.lines=[];s.notes={};s.songBatches={};s.learned=[];
 const item=studyHistory(s)[0].activities[0];assert.equal(item.front,'안녕하세요');assert.equal(item.back,'你好');
});
test('review history retains the answer as it was when reviewed',()=>{
 const s=initialState();addCard(s,'a','아','a','basic',today);rateCard(s,'a',Rating.Good,today);s.cards.a.back='updated';
 const r=studyHistory(s)[0].reviewDetails[0];assert.equal(r.front,'아');assert.equal(r.back,'a');assert.equal(r.rating,3);
});
test('legacy backups keep daily flags without inventing studied content',()=>{
 const s=initialState();s.days={'2026-10-13':{complete:true,basic:true,lessonId:0},'2026-10-14':{reviews:10001}};
 const h=studyHistory(normalizeState(s));assert.equal(h.length,2);assert.equal(h[0].reviews,10001);assert.deepEqual(h[1].activities,[]);
});
test('backup validation rejects broken progress and history before restore',()=>{
 for(const changes of [{lessonProgress:null},{lessonProgress:{0:-1}},{days:{'2026-10-15':{reviewIds:'bad'}}},{days:{'2026-10-15':{activities:[{kind:'invalid'}]}}}])assert.throws(()=>normalizeState({...initialState(),...changes}));
});
