import test from 'node:test';import assert from 'node:assert/strict';
import {lessons} from '../src/curriculum.js';
import {lessonQuestions,lessonSession,learnLessonItem,recordQuizAnswer,warmupItems,practiceSegment,videoSource} from '../src/practice.js';
import {initialState,normalizeState,studyHistory} from '../src/core.js';
test('every lesson has eight valid questions, mixed answer positions and an accessible listening fallback',()=>{
 for(const lesson of lessons){const original=JSON.stringify(lesson),qs=lessonQuestions(lesson);assert.equal(qs.length,8);assert.ok(new Set(qs.map(q=>q[2])).size>1);for(const q of qs){assert.ok(q[1][q[2]]);assert.equal(new Set(q[1]).size,q[1].length);if(q[4])assert.equal(q[1][q[2]],q[5]);}assert.equal(JSON.stringify(lesson),original);}
});
test('warmups work without imported lyrics and never change course content',()=>{lessons.forEach((l,i)=>{const items=warmupItems(l,i);assert.equal(items.length,4);for(const x of items)assert.ok(x.front&&x.audio&&x.back&&x.note);});assert.match(warmupItems(lessons[0],0)[0].front,/아 어/);});
test('automatic segments use real millisecond timing and reject untimed or invalid lines',()=>{assert.deepEqual(practiceSegment([{start:1500,end:3200},{start:4000,end:5100}]),{start:1.5,end:5.1});for(const lines of [[],[{start:null,end:null}],[{start:3,end:1}],[{start:-1,end:2}],[{start:0,end:Infinity}]])assert.equal(practiceSegment(lines),null);});
test('saved source falls back to the available video without requiring a selection',()=>{assert.equal(videoSource({mvSource:'bilibili',biliBvid:'BV1234567890',videoId:'abcdefghijk'}),'bilibili');assert.equal(videoSource({mvSource:'bilibili',biliBvid:'',videoId:'abcdefghijk'}),'youtube');assert.equal(videoSource({mvSource:'youtube',biliBvid:'BV1234567890',videoId:''}),'bilibili');assert.equal(videoSource({} ),null);});
const now=new Date('2026-10-16T03:00:00Z');
test('partial correct answers survive a reload as history without completing the lesson or daily drill',()=>{
 const s=initialState(),session=lessonSession(s,0);session.phase='quiz';
 assert.equal(recordQuizAnswer(s,session,session.questions[0][2],now),true);
 recordQuizAnswer(s,session,session.questions[0][2],now);
 const restored=normalizeState(JSON.parse(JSON.stringify(s))),h=studyHistory(restored);
 assert.equal(h.length,1);assert.equal(h[0].activities.length,1);assert.equal(h[0].activities[0].front,session.questions[0][0]);assert.match(h[0].activities[0].back,/正确答案：아/);
 assert.deepEqual(restored.completedLessons,[]);assert.equal(h[0].basic,undefined);assert.equal(h[0].drill,undefined);assert.equal(h[0].complete,undefined);assert.deepEqual(restored.cards,{});
});
test('course and daily drills keep separate question history; an ordinary retry keeps the mistake pending',()=>{
 const s=initialState(),session=lessonSession(s,0),answer=session.questions[0][2];
 assert.equal(recordQuizAnswer(s,session,(answer+1)%4,now),false);assert.equal(studyHistory(s).length,0);assert.ok(s.mistakes['0:0']);
 recordQuizAnswer(s,session,answer,now);assert.equal(s.mistakes['0:0'].resolvedAt,null);
 session.practiceOnly=true;recordQuizAnswer(s,session,answer,now);
 assert.equal(studyHistory(s)[0].activities.length,2);assert.match(studyHistory(s)[0].activities[1].title,/今日巩固/);
 recordQuizAnswer(s,session,answer,new Date('2026-10-17T03:00:00Z'));assert.equal(studyHistory(s).length,2);
});
test('focused quiz answers resolve the original question without altering ordinary quiz progress',()=>{
 const s=initialState(),source=lessonSession(s,1);source.quiz=2;
 recordQuizAnswer(s,source,(source.questions[2][2]+1)%4,now);s.quizProgress[1]=4;
 const focused={id:0,quiz:0,mistakeKeys:['1:2'],questions:[s.mistakes['1:2'].question]};
 recordQuizAnswer(s,focused,focused.questions[0][2],now);
 assert.equal(s.mistakes['1:2'].resolvedAt,now.toISOString());assert.equal(s.quizProgress[1],4);assert.equal(studyHistory(s)[0].activities.length,1);assert.equal(studyHistory(s)[0].activities[0].title,'错题巩固');
});
test('invalid quiz choices do not write progress',()=>{const s=initialState(),session=lessonSession(s,0),before=structuredClone(s);for(const choice of [-1,8,0.5,NaN])assert.throws(()=>recordQuizAnswer(s,session,choice,now));assert.deepEqual(s,before);});
test('light study always offers one knowledge item and preserves the unfinished full quiz',()=>{
 const s=initialState();s.lessonProgress[0]=4;s.quizProgress[0]=5;
 const light=lessonSession(s,0,true);assert.equal(light.phase,'learn');assert.equal(light.index,3);
 learnLessonItem(s,0,light.index,now);assert.equal(s.quizProgress[0],5);assert.equal(lessonSession(s,0).phase,'quiz');assert.equal(lessonSession(s,0).quiz,5);
});
test('revisiting knowledge never moves the resume position backwards or reschedules its card',()=>{
 const s=initialState();learnLessonItem(s,0,2,now);const due=s.cards['basic:0:2'].fsrs.due;
 learnLessonItem(s,0,0,now);assert.equal(s.lessonProgress[0],3);assert.equal(lessonSession(s,0).index,3);
 learnLessonItem(s,0,3,now);learnLessonItem(s,0,2,new Date('2026-10-17T03:00:00Z'));
 assert.equal(s.lessonProgress[0],4);assert.equal(s.cards['basic:0:2'].fsrs.due,due);assert.equal(lessonSession(normalizeState(JSON.parse(JSON.stringify(s))),0).phase,'quiz');
});
