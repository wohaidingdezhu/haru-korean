import test from 'node:test';import assert from 'node:assert/strict';
import {lessons} from '../src/curriculum.js';
import {lessonQuestions,warmupItems,practiceSegment,videoSource} from '../src/practice.js';
test('every lesson has eight valid questions, mixed answer positions and an accessible listening fallback',()=>{
 for(const lesson of lessons){const original=JSON.stringify(lesson),qs=lessonQuestions(lesson);assert.equal(qs.length,8);assert.ok(new Set(qs.map(q=>q[2])).size>1);for(const q of qs){assert.ok(q[1][q[2]]);assert.equal(new Set(q[1]).size,q[1].length);if(q[4])assert.equal(q[1][q[2]],q[5]);}assert.equal(JSON.stringify(lesson),original);}
});
test('warmups work without imported lyrics and never change course content',()=>{lessons.forEach((l,i)=>{const items=warmupItems(l,i);assert.equal(items.length,4);for(const x of items)assert.ok(x.front&&x.audio&&x.back&&x.note);});assert.match(warmupItems(lessons[0],0)[0].front,/아 어/);});
test('automatic segments use real millisecond timing and reject untimed or invalid lines',()=>{assert.deepEqual(practiceSegment([{start:1500,end:3200},{start:4000,end:5100}]),{start:1.5,end:5.1});for(const lines of [[],[{start:null,end:null}],[{start:3,end:1}],[{start:-1,end:2}],[{start:0,end:Infinity}]])assert.equal(practiceSegment(lines),null);});
test('saved source falls back to the available video without requiring a selection',()=>{assert.equal(videoSource({mvSource:'bilibili',biliBvid:'BV1234567890',videoId:'abcdefghijk'}),'bilibili');assert.equal(videoSource({mvSource:'bilibili',biliBvid:'',videoId:'abcdefghijk'}),'youtube');assert.equal(videoSource({mvSource:'youtube',biliBvid:'BV1234567890',videoId:''}),'bilibili');assert.equal(videoSource({} ),null);});
