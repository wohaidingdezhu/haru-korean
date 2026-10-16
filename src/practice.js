import {addCard,recordStudy} from './core.js';
import {lessons} from './curriculum.js';
import {recordMistake,resolveMistake} from './mistakes.js';
// Keep practice tied to the lesson's explanations; no extra account or content setup.
export function lessonQuestions(lesson){
 const questions=lesson.quiz.map(q=>[...q]);
 for(const x of lesson.items)questions.push([`「${x.back}」对应哪一项？`,lesson.items.map(item=>item.front),lesson.items.indexOf(x),x.note]);
 for(const x of lesson.items.slice(0,2))questions.push(['听示范，选出对应的韩文。',lesson.items.map(item=>item.front),lesson.items.indexOf(x),x.note,x.audio,x.front]);
 return questions.map((q,i)=>{const choices=[...q[1]],shift=i%choices.length;return [q[0],[...choices.slice(shift),...choices.slice(0,shift)],(q[2]-shift+choices.length)%choices.length,...q.slice(3)];});
}
export function lessonSession(state,id,light=false){
 const lesson=lessons[id],p=state.lessonProgress[id]||0;
 return {id,index:Math.min(p,lesson.items.length-1),quiz:state.quizProgress[id]||0,phase:!light&&p>=lesson.items.length?'quiz':'learn',light,questions:lessonQuestions(lesson)};
}
export function learnLessonItem(state,id,index,now=new Date()){
 const lesson=lessons[id],x=lesson.items[index];
 addCard(state,'basic:'+id+':'+index,x.front,x.back+'\n'+x.note,'basic',now);
 recordStudy(state,{kind:'basic',id:'basic:'+id+':'+index,title:lesson.title,front:x.front,back:x.back+'\n'+x.note},now);
 state.lessonProgress[id]=Math.max(state.lessonProgress[id]||0,index+1);
}
export function recordQuizAnswer(state,session,choice,now=new Date()){
 const q=session.questions[session.quiz],key=session.mistakeKeys?.[session.quiz];
 if(!q||!Number.isInteger(choice)||!q[1][choice])throw Error('题目数据格式有误。');
 if(choice!==q[2]){const entry=key?state.mistakes[key]:null;recordMistake(state,entry?.lessonId??session.id,entry?.questionIndex??session.quiz,q,choice,now);return false;}
 if(key)resolveMistake(state,key,now);
 else recordStudy(state,{kind:'basic',id:`${session.practiceOnly?'drill':'quiz'}:${session.id}:${session.quiz}`,title:(session.practiceOnly?'今日巩固':'小课练习')+' · '+lessons[session.id].title,front:q[0],back:'正确答案：'+q[1][q[2]]+'\n'+q[3]},now);
 return true;
}
export function warmupItems(lesson,id){
 if(id===0)return [
  {front:'아 어 · 어 아',audio:'아 어 어 아',back:'对比 a / eo',note:'先听一遍，再各读三遍。아 自然张口，어 保持不圆唇。'},
  {front:'오 우 · 우 오',audio:'오 우 우 오',back:'对比 o / u',note:'两者都圆唇；우 的嘴形比 오 收得更小。交替读三遍。'},
  {front:'아 오 · 어 우',audio:'아 오 어 우',back:'练习切换嘴形',note:'先慢读，再用均匀节奏读。注意从不圆唇切换到圆唇。'},
  {front:'아 어 오 우',audio:'아 어 오 우',back:'遮住提示，独立读出四个音',note:'先自己读，再听示范核对。能清楚读出后，再反过来读 우 오 어 아。'}
 ];
 return lesson.items.map(x=>({...x,note:x.note+' 先听一遍，跟读三遍，再遮住释义回想。'}));
}
export function practiceSegment(lines){
 if(!lines.length||lines.some(x=>!Number.isFinite(x.start)||!Number.isFinite(x.end)||x.start<0||x.end<=x.start))return null;
 return {start:Math.min(...lines.map(x=>x.start))/1000,end:Math.max(...lines.map(x=>x.end))/1000};
}
export function videoSource(song){return song.mvSource==='youtube'&&song.videoId?'youtube':song.mvSource==='bilibili'&&song.biliBvid?'bilibili':song.videoId?'youtube':song.biliBvid?'bilibili':null;}
