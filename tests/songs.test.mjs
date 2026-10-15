import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,normalizeState,parseLyrics,librarySongs,addSong,switchSong,removeSong,songBatch,learnLine,studyHistory,songCardId,dailySongCount} from '../src/core.js';
const now=new Date('2026-10-15T01:00:00Z');
const song=(title,text='안녕하세요\n감사합니다')=>({title,artist:'测试歌手',videoId:'',biliBvid:'',mvSource:'bilibili',lines:parseLyrics(text)});
test('legacy one-song backups migrate without losing progress',()=>{
 const legacy=initialState();delete legacy.songId;delete legacy.songs;legacy.song.lines=parseLyrics('안녕하세요');legacy.learned=[legacy.song.lines[0].id];legacy.notes[legacy.learned[0]]='你好';
 const restored=normalizeState(JSON.parse(JSON.stringify(legacy)));assert.equal(librarySongs(restored).length,1);assert.equal(restored.notes[restored.learned[0]],'你好');
});
test('switching songs preserves independent notes, progress and playback settings through backup',()=>{
 const s=initialState();s.song=song('First');const first=s.songId;const line=s.song.lines[0];s.notes[line.id]='第一首';s.segment={start:2,end:4,rate:.5};learnLine(s,line,now);
 addSong(s,song('Second'));const second=s.songId;s.notes[line.id]='第二首';learnLine(s,songBatch(s,now)[0],now);
 assert.notEqual(songCardId(s,line.id),'song:'+first+':'+line.id);
 const restored=normalizeState(JSON.parse(JSON.stringify(s)));switchSong(restored,first);assert.equal(restored.notes[line.id],'第一首');assert.equal(restored.learned.length,1);assert.equal(restored.segment.rate,.5);
 switchSong(restored,second);assert.equal(restored.notes[line.id],'第二首');assert.equal(restored.learned.length,1);assert.equal(Object.values(restored.cards).length,2);
 assert.equal(studyHistory(restored)[0].activities.length,2);
});
test('switching or deleting songs never resets the shared daily new-line quota',()=>{
 const s=initialState();s.song=song('First');songBatch(s,now).forEach(line=>learnLine(s,line,now));
 addSong(s,song('Second'));assert.equal(songBatch(s,now).length,0);const inactive=s.songs[0].id;removeSong(s,inactive,now);assert.equal(dailySongCount(s,now),2);assert.equal(songBatch(s,now).length,0);assert.throws(()=>learnLine(s,s.song.lines[0],now));
 assert.equal(songBatch(s,new Date('2026-10-16T01:00:00Z')).length,2);
});
test('deleting the last song retains history and review cards and allows a fresh song',()=>{
 const s=initialState();s.song=song('Only');learnLine(s,songBatch(s,now)[0],now);removeSong(s,s.songId,now);
 assert.equal(librarySongs(s).length,0);assert.equal(Object.keys(s.cards).length,1);assert.equal(studyHistory(s)[0].activities[0].title,'Only');normalizeState(JSON.parse(JSON.stringify(s)));
 addSong(s,song('Next'));assert.equal(librarySongs(s).length,1);assert.equal(songBatch(s,now).length,1);
});
test('malformed or duplicate saved songs reject before restoring a backup',()=>{
 const s=initialState();s.song=song('First');addSong(s,song('Second'));const broken=JSON.parse(JSON.stringify(s));broken.songs[0].id=broken.songId;assert.throws(()=>normalizeState(broken));
 broken.songs[0].id='different';broken.songs[0].song.lines[0].start=-1;assert.throws(()=>normalizeState(broken));
});

test('oversized lyric lines reject before saving an unreadable backup',()=>{assert.throws(()=>parseLyrics('가'.repeat(3001)),/3000/);});
