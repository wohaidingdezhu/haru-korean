import {recordStudy} from './core.js';
export function mistakeList(state,all=false){return Object.entries(state.mistakes).map(([id,entry])=>({...entry,id})).filter(x=>all||!x.resolvedAt).sort((a,b)=>b.lastWrongAt.localeCompare(a.lastWrongAt));}
export function recordMistake(state,lessonId,questionIndex,question,choice,now=new Date()){
 if(!Number.isInteger(lessonId)||lessonId<0||lessonId>=14||!Number.isInteger(questionIndex)||questionIndex<0||questionIndex>=8||!Number.isInteger(choice)||!question[1]?.[choice])throw Error('题目数据格式有误。');
 if(choice===question[2])return;
 const id=lessonId+':'+questionIndex,old=state.mistakes[id];
 state.mistakes[id]={lessonId,questionIndex,question:structuredClone(question),wrongAnswer:question[1][choice],count:(old?.count||0)+1,lastWrongAt:now.toISOString(),resolvedAt:null};
}
export function resolveMistake(state,id,now=new Date()){
 const entry=state.mistakes[id];if(!entry)throw Error('找不到这道错题。');entry.resolvedAt=now.toISOString();
 recordStudy(state,{kind:'basic',id:'mistake:'+id,title:'错题巩固',front:entry.question[0],back:'正确答案：'+entry.question[1][entry.question[2]]+'\n'+entry.question[3]},now);
}
