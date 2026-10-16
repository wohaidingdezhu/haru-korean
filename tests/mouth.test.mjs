import test from 'node:test';import assert from 'node:assert/strict';
import {vowelMouths,compoundMouths,mouthGuide} from '../src/mouth.js';
test('mouth guide covers all 21 vowels with valid transition endpoints and distinct contrasting lips',()=>{
 assert.equal(vowelMouths.length,10);assert.equal(compoundMouths.length,11);
 assert.equal(new Set([...vowelMouths.map(x=>x.letter),...compoundMouths.map(x=>x[0])]).size,21);
 for(const v of vowelMouths){assert.match(v.sound,/^[가-힣]$/);assert.ok(v.width>0&&v.width<100&&v.height>0&&v.height<60);assert.ok(v.tongue&&v.tip&&v.lips);}
 for(const [,,roman,from,to] of compoundMouths){assert.ok(roman);assert.ok(vowelMouths.some(v=>v.sound===from));assert.ok(vowelMouths.some(v=>v.sound===to));}
 const bySound=Object.fromEntries(vowelMouths.map(v=>[v.sound,v]));assert.ok(bySound.어.width>bySound.오.width);assert.ok(bySound.으.width>bySound.우.width);assert.ok(bySound.아.height>bySound.이.height);
});
test('diagrams have text alternatives and complete syllables for listening',()=>{
 const html=mouthGuide();assert.equal((html.match(/role="img" aria-label=/g)||[]).length,32);
 assert.equal((html.match(/data-mouth-speak=/g)||[]).length,27);assert.doesNotMatch(html,/undefined|NaN/);
 for(const match of html.matchAll(/data-mouth-speak="([^"]+)"/g))assert.match(match[1],/^[가-힣 ]+$/);
 assert.match(html,/正面图只表示嘴唇开合与圆展/);assert.match(html,/不是先后念两个独立音节/);
});
