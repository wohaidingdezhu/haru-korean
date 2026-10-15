import test from 'node:test';import assert from 'node:assert/strict';
import {knowledge,knowledgeCategories,filterKnowledge,learnKnowledge} from '../src/knowledge.js';
import {initialState,normalizeState,dueCards,rateCard,Rating,studyHistory} from '../src/core.js';
import {lessons} from '../src/curriculum.js';
const now=new Date('2026-10-15T03:30:00Z');
test('knowledge content has usable examples, stable unique IDs and working grammar/course links',()=>{
 const ids=new Set(knowledge.map(x=>x.id));assert.equal(ids.size,knowledge.length);
 assert.deepEqual(Object.fromEntries(Object.keys(knowledgeCategories).map(key=>[key,knowledge.filter(x=>x.category===key).length])),{pronunciation:8,grammar:12,vocabulary:48,sentence:24});
 for(const entry of knowledge){assert.ok(knowledgeCategories[entry.category]);assert.ok(entry.title&&entry.meaning&&entry.explanation&&entry.audio);assert.ok(entry.examples.length);for(const e of entry.examples)assert.ok(/[가-힣]/.test(e.ko)&&e.zh);for(const id of entry.related||[])assert.equal(knowledge.find(x=>x.id===id)?.category,'grammar');if(entry.lessonId!==undefined)assert.ok(lessons[entry.lessonId]);}
});
test('search combines Chinese, Korean and category filters and handles empty results',()=>{
 assert.equal(filterKnowledge().length,knowledge.length);assert.equal(filterKnowledge('grammar','   ').length,12);
 assert.ok(filterKnowledge('vocabulary','咖啡 커피').some(x=>x.id==='v-coffee'));
 assert.ok(filterKnowledge('sentence','咖啡').some(x=>x.id==='s-coffee'));
 assert.ok(filterKnowledge('grammar','收音').some(x=>x.id==='g-copula'));
 assert.equal(filterKnowledge('vocabulary','a-nonexistent-term').length,0);assert.equal(filterKnowledge('sentence','은 / 는').length,0);
});
test('adding knowledge persists examples and history without completing any daily task or resetting review scheduling',()=>{
 const s=initialState();s.days['2026-10-15']={lessonId:0,reviewIds:[]};
 learnKnowledge(s,'v-coffee',now);const card=s.cards['knowledge:v-coffee'];assert.equal(card.front,'커피');assert.match(card.back,/커피를 마셔요/);assert.equal(dueCards(s,now).length,0);
 const restored=normalizeState(JSON.parse(JSON.stringify(s)));const h=studyHistory(restored);assert.equal(h.length,1);assert.equal(h[0].activities[0].title,'知识库 · 词汇积累');assert.equal(h[0].activities[0].front,'커피');assert.equal(restored.days['2026-10-15'].basic,undefined);assert.equal(restored.days['2026-10-15'].complete,undefined);assert.equal(restored.completedLessons.length,0);
 const tomorrow=new Date('2026-10-16T03:31:00Z');rateCard(restored,card.id,Rating.Good,tomorrow);const scheduled=JSON.stringify(restored.cards[card.id]);learnKnowledge(restored,'v-coffee',tomorrow);assert.equal(JSON.stringify(restored.cards[card.id]),scheduled);assert.equal(studyHistory(restored).flatMap(x=>x.activities).filter(x=>x.id===card.id).length,1);
});
test('an unknown knowledge ID rejects without changing progress',()=>{const s=initialState(),before=JSON.stringify(s);assert.throws(()=>learnKnowledge(s,'missing',now));assert.equal(JSON.stringify(s),before);});
test('knowledge progress filters combine with search and classification and reflect newly added cards',()=>{const s=initialState();assert.equal(filterKnowledge('all','','saved',s.cards).length,0);assert.equal(filterKnowledge('all','','new',s.cards).length,knowledge.length);learnKnowledge(s,'v-coffee',now);assert.deepEqual(filterKnowledge('vocabulary','咖啡','saved',s.cards).map(x=>x.id),['v-coffee']);assert.equal(filterKnowledge('vocabulary','커피','new',s.cards).some(x=>x.id==='v-coffee'),false);assert.equal(filterKnowledge('grammar','','saved',s.cards).length,0);});
