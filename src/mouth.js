export const vowelMouths=[
 {letter:'ㅏ',sound:'아',roman:'a',width:68,height:52,lips:'不圆唇 · 大开口',tongue:'舌位低，舌头自然放低。',tip:'下巴放松，不要把嘴唇收成圆形。'},
 {letter:'ㅓ',sound:'어',roman:'eo',width:64,height:36,lips:'不圆唇 · 中开口',tongue:'舌位靠后，高度居中。',tip:'与ㅗ比较：保持嘴唇自然，不向前拢圆。'},
 {letter:'ㅗ',sound:'오',roman:'o',width:32,height:36,lips:'圆唇 · 中开口',tongue:'舌位靠后，高度居中。',tip:'嘴唇向前拢圆；不要读成不圆唇的ㅓ。'},
 {letter:'ㅜ',sound:'우',roman:'u',width:23,height:22,lips:'圆唇 · 小开口',tongue:'舌后部抬高。',tip:'比ㅗ收得更小、更紧，舌位也更高。'},
 {letter:'ㅡ',sound:'으',roman:'eu',width:83,height:10,lips:'不圆唇 · 小开口',tongue:'舌后部抬高，保持不圆唇。',tip:'先发ㅜ，再把嘴唇放平；别读成普通话“呃”。'},
 {letter:'ㅣ',sound:'이',roman:'i',width:86,height:12,lips:'展唇 · 小开口',tongue:'舌前部抬高，靠近硬腭但不接触。',tip:'接近“衣”的嘴形，不必用力咧嘴。'},
 {letter:'ㅐ',sound:'애',roman:'ae',width:78,height:38,lips:'不圆唇 · 开口较大',tongue:'舌位靠前，比ㅔ低。',tip:'传统区别中比ㅔ开口大；现代口语中两者常很接近。'},
 {letter:'ㅔ',sound:'에',roman:'e',width:76,height:25,lips:'不圆唇 · 中开口',tongue:'舌位靠前，高度居中。',tip:'传统区别中比ㅐ开口小；不要把e拖成英语双元音。'},
 {letter:'ㅚ',sound:'외',roman:'oe',width:34,height:25,lips:'圆唇 · 中开口',tongue:'单元音读法：舌位像ㅔ，嘴唇拢圆。',tip:'也允许从圆唇滑向ㅔ的we读法，不能只凭嘴形判断。'},
 {letter:'ㅟ',sound:'위',roman:'wi',width:26,height:16,lips:'圆唇 · 小开口',tongue:'单元音读法：舌位像ㅣ，嘴唇拢圆。',tip:'也允许w＋i的滑音读法；单元音近似“ü”的嘴形。'}
];
export const compoundMouths=[
 ['ㅑ','야','ya','이','아'],['ㅕ','여','yeo','이','어'],['ㅛ','요','yo','이','오'],['ㅠ','유','yu','이','우'],
 ['ㅒ','얘','yae','이','애'],['ㅖ','예','ye','이','에'],['ㅘ','와','wa','우','아'],['ㅙ','왜','wae','우','애'],
 ['ㅝ','워','wo','우','어'],['ㅞ','웨','we','우','에'],['ㅢ','의','ui','으','이']
];
function lips(v){return `<svg class="mouth-diagram" viewBox="0 0 120 88" role="img" aria-label="${v.letter}正面嘴形：${v.lips}"><path d="M55 10q5 5 10 0" fill="none" stroke="#c4b3a4" stroke-width="2"/><ellipse cx="60" cy="49" rx="${v.width/2+6}" ry="${v.height/2+5}" fill="#dcb2a7" stroke="#a06f69" stroke-width="1.5"/><ellipse cx="60" cy="49" rx="${v.width/2}" ry="${v.height/2}" fill="#503b3b"/><path d="M48 81h24" stroke="#d4c6b7" stroke-width="2" stroke-linecap="round"/></svg>`;}
export function mouthGuide(){return `<h2>看嘴形，听声音，再慢慢模仿。</h2><p>正面图只表示嘴唇开合与圆展；舌位请一起看文字提示。图中比例为学习示意，不是要求你量出固定开口。</p><div class="gentle">先练最容易混的两组：ㅓ / ㅗ（不圆唇 / 圆唇），ㅡ / ㅜ（放平 / 拢圆）。照镜子跟读，每次只比较一组。</div><h3 class="mouth-heading">01 · 10个单元音</h3><div class="mouth-grid">${vowelMouths.map(v=>`<article class="mouth-card"><div class="mouth-card-head"><h3 lang="ko">${v.letter} → ${v.sound}</h3><span>${v.roman}</span></div>${lips(v)}<strong>${v.lips}</strong><p>${v.tongue}</p><p class="helper">${v.tip}</p><button class="secondary" data-mouth-speak="${v.sound}" aria-label="听 ${v.sound} 的发音">▶ 听发音</button></article>`).join('')}</div><details class="mouth-details"><summary>02 · 11个复合元音：嘴形怎样滑动</summary><p class="helper">箭头表示一个音节内的连续过渡，不是先后念两个独立音节。起点音只帮助找嘴形，要轻短地滑到终点。</p><div class="mouth-grid">${compoundMouths.map(([letter,sound,roman,from,to])=>`<article class="mouth-card"><div class="mouth-card-head"><h3 lang="ko">${letter} → ${sound}</h3><span>${roman}</span></div><div class="mouth-transition"><figure>${lips(vowelMouths.find(v=>v.sound===from))}<figcaption lang="ko">${from} 的嘴形</figcaption></figure><span aria-label="滑向">→</span><figure>${lips(vowelMouths.find(v=>v.sound===to))}<figcaption lang="ko">${to} 的嘴形</figcaption></figure></div><button class="secondary" data-mouth-speak="${sound}" aria-label="听 ${sound} 的发音">▶ 听发音</button></article>`).join('')}</div></details><details class="mouth-details"><summary>03 · 辅音：嘴唇之外，还要看舌头和气流</summary><p class="helper">辅音不能只靠正面嘴形区分。以下先说明起音动作，完整音节中的嘴形还会跟随后面的元音变化。</p>${[
 ['ㅁ / ㅂ / ㅃ / ㅍ','双唇先闭合','ㅁ闭唇走鼻音；ㅂ轻放开；ㅃ起音绷紧；ㅍ放开时有明显送气。','마 바 빠 파'],
 ['ㄴ / ㄷ / ㄸ / ㅌ / ㄹ','舌尖到上齿龈','ㄴ从鼻腔出声；ㄷ、ㄸ、ㅌ先阻气再放开；ㄹ在词首音节中轻弹舌尖，不卷舌。','나 다 따 타 라'],
 ['ㅅ / ㅆ','双唇自然，舌前部留窄缝','气流摩擦通过；ㅆ起音更紧。后接ㅣ等音时，舌位和摩擦声会变化。','사 싸 시'],
 ['ㅈ / ㅉ / ㅊ','舌前部靠近硬腭前部','先阻住气流再摩擦放开；ㅉ更紧，ㅊ送气更明显，不卷舌。','자 짜 차'],
 ['ㄱ / ㄲ / ㅋ','舌后部抬向软腭','先挡住气流再放开；ㄲ更紧，ㅋ送气更明显。嘴唇本身不能显示这种区别。','가 까 카'],
 ['ㅇ / ㅎ','嘴形跟随后面的元音','ㅇ在音节开头不发辅音；收音ㅇ抬舌后部走鼻音ng。ㅎ轻呼气，不用力挤喉咙。','아 강 하']
 ].map(([letters,title,tip,sound])=>`<article class="knowledge-example"><h3 lang="ko">${letters}</h3><p><strong>${title}</strong>。${tip}</p><button class="secondary" data-mouth-speak="${sound}" aria-label="听 ${sound} 的发音">▶ 听对比：${sound}</button></article>`).join('')}</details><p class="helper">说明依据：<a href="https://m.korean.go.kr/front/page/pageView.do?mn_id=95&page_id=P000098" target="_blank" rel="noopener noreferrer">韩国国立国语院《标准发音法》 ↗</a>。示意图由本项目绘制；ㅚ、ㅟ也允许双元音读法。设备朗读仅供跟读，请结合原视频观察真人动作。</p>`;}
