'use strict';

const $ = (id) => document.getElementById(id);
const ui = { room:$('room'), sprite:$('character-sprite'), character:$('character-button'), speech:$('speech-text'), action:$('action-button'), quest:$('quest-text'), overline:$('quest-overline'), label:$('room-label'), stars:$('sparkle-field'), cake:$('cake-wrap'), particles:$('particles') };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const settings = window.BIRTHDAY_GIFT || {};
const gift = Object.freeze({
  friend: typeof settings.friend === 'string' ? settings.friend.trim().slice(0,20) : '',
  sender: typeof settings.sender === 'string' ? settings.sender.trim().slice(0,20) : '',
  message: typeof settings.message === 'string' && settings.message.trim() ? settings.message.trim().slice(0,1000) : '생일 진짜 많이 축하해 ♡',
});
let state = 'asleep', collected = new Set(), candles = [true,true,true], soundOn = false, audioContext, musicTimer, toastTimer;
let pendingTimers = [], waveFrame = false;
const schedule = (fn, ms) => { const id=setTimeout(fn,ms); pendingTimers.push(id); return id; };
const poseDescriptions = {sleep:'노란 옷을 입고 자고 있는 양갈래 머리 캐릭터',wake:'눈을 비비며 일어나는 캐릭터',wave:'웃으며 손을 흔드는 캐릭터',wave2:'반갑게 인사하는 캐릭터',happy:'신나게 폴짝 뛰는 캐릭터',blow:'소원을 빌며 촛불을 부는 캐릭터'};

function applyGift(){
  if(gift.friend){$('main-title').replaceChildren(document.createTextNode(gift.friend+', '),Object.assign(document.createElement('span'),{textContent:'오늘의 주인공!'}));}
  else{$('main-title').replaceChildren(document.createTextNode('오늘은, '),Object.assign(document.createElement('span'),{textContent:'당신이 주인공!'}));}
  $('letter-title').textContent=(gift.friend?gift.friend+', ':'')+'생일 축하해!';
  $('letter-to').textContent=gift.friend?gift.friend+'에게.':'Zㅏ기에게.';
  $('letter-body').textContent=gift.message;
  $('letter-from').textContent=gift.sender?gift.sender+' ♡':'조교시간에 만들고 있는 무례한 대학원생이 ♡';
  document.title=(gift.friend?gift.friend+'에게, ':'')+'파티파티';
}
function setPose(pose){ui.sprite.dataset.pose=pose;ui.sprite.setAttribute('aria-label',poseDescriptions[pose]);}
function setState(next){state=next;ui.room.dataset.state=next;drawRoom();}
function say(text){ui.speech.textContent=text;ui.speech.style.whiteSpace='pre-line';}
function setLabel(text){ui.label.replaceChildren(document.createElement('i'),document.createTextNode(text));}
function setAction(text,disabled=false){ui.action.querySelector('span').textContent=text;ui.action.disabled=disabled;}
function setQuest(overline,text){ui.overline.textContent=overline;ui.quest.textContent=text;}
function setStep(n,complete=false){for(let i=1;i<=3;i++){const el=$('step-'+i);el.classList.toggle('active',i===n&&!complete);el.classList.toggle('completed',i<n||complete);if(i===n&&!complete)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');}}
function showToast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}

function wake(){
  if(state!=='asleep')return;
  setState('waking');ui.room.setAttribute('aria-busy','true');ui.character.className='character-button';setPose('wake');
  $('sleep-z').hidden=true;$('tap-hint').hidden=true;
  say('마 누가왔노?');setLabel('합법적쉬었음청년이 기지개 켜는 중');setQuest('JUST A LITTLE STRETCH','눈을 비비고, 기지개 쭈우욱.');setAction('일어나는 중…',true);
  tone(523,.09,0);tone(659,.12,.14);
  schedule(()=>{setState('greeting');ui.room.removeAttribute('aria-busy');setPose('wave');ui.character.className='character-button awake';ui.character.setAttribute('aria-label','캐릭터와 인사하기');
    say((gift.friend?gift.friend+', 왔구나!':'또 농땡이 피는 거니?')+'\n생일 축하해 ♡');setLabel('백수 발견');setQuest('A LITTLE SURPRISE FOR YOU','이거 봐봐');setAction('파티 준비하러 가기');$('room-caption').textContent='the best day starts with you';heartPop();
  },1050);
}
function startStars(){
  if(state!=='greeting')return;
  setState('stars');setStep(2);say('반짝이는 별 5개를 모아라 마!\n뭐 나온다.');setLabel('생일 별 0 / 5');setQuest('COLLECT A LITTLE HAPPINESS','방 안에 반짝이는 별을 톡톡 눌러 봐.');setAction('생일 별 0 / 5',true);
  const places=[[16,37],[73,31],[7,64],[80,66],[47,4]];
  places.forEach(([x,y],i)=>{const b=document.createElement('button');b.className='collect-star';b.style.left=x+'%';b.style.top=y+'%';b.style.animationDelay=(-i*.28)+'s';b.setAttribute('aria-label',(i+1)+'번째 생일 별 모으기');b.innerHTML='<svg aria-hidden="true"><use href="#i-star"/></svg>';b.addEventListener('click',()=>collectStar(b,i));ui.stars.append(b);});
  $('room-caption').textContent='five little stars, one big wish';
}
function collectStar(button,index){
  if(state!=='stars'||collected.has(index))return;
  collected.add(index);button.disabled=true;button.classList.add('collected');tone(523+collected.size*100,.18);
  const point=document.createElement('span');point.className='collected-label';point.textContent='+1';point.style.left=button.style.left;point.style.top=button.style.top;ui.stars.append(point);
  schedule(()=>{button.remove();point.remove();},800);
  setLabel('생일 별 '+collected.size+' / 5');setAction('생일 별 '+collected.size+' / 5',true);
  setPose('happy');schedule(()=>{if(state==='stars')setPose('wave');},300);
  if(collected.size===5){say('마 빠르네잉;;!\n얍얍');setQuest('QUEST COMPLETE!','작은 별들이 생일 케이크가 되는 중…');schedule(showCake,750);}
}
function showCake(){
  setState('cake');setStep(3);ui.stars.replaceChildren();ui.cake.hidden=false;setPose('wave');setLabel('소원을 빌 준비 완료');say('생일 케이크 도착!\n소원을 빌고 촛불을 꺼 봐.');setQuest('MAKE A WISH','마음속으로 소원을 빌고, 세 번 후— 불어 줘.');setAction('후— 촛불 끄기');drawCake();$('room-caption').textContent='make a wish, keep it close';
  tone(523,.16);tone(659,.16,.15);tone(784,.25,.3);
}
function blowCandle(index){
  if(state!=='cake'||!candles[index])return;
  candles[index]=false;const btn=document.querySelector('[data-candle="'+index+'"]');btn.disabled=true;btn.setAttribute('aria-label',(index+1)+'번째 촛불 꺼짐');setPose('blow');drawCake();tone(350,.2);
  const out=candles.filter(v=>!v).length;
  $('cake-canvas').setAttribute('aria-label',out===3?'촛불이 모두 꺼진 생일 케이크':'촛불 '+(3-out)+'개가 켜진 생일 케이크');
  if(out<3){say(out===1?'후— 연애하자\n두 개 더 불ㅇ러ㅏ':'후우— 들숨에 건강 날숨에 재력\n마지막 하나 남았어.');setAction('후— 몬스타엑스1 너무 추억이고요 ('+out+'/3)');schedule(()=>{if(state==='cake')setPose('wave2');},450);}
  else{say('후우우—!\n네 소원이 이루어지길 ♡');setAction('소원을 보내는 중…',true);schedule(celebrate,650);}
}
function celebrate(){
  setState('wish');setStep(3,true);setLabel('오늘의 행복 +100');setPose('happy');ui.character.className='character-button jumping';$('celebration-banner').hidden=false;
  say('생일 정말 많이 축하해!\n 우뜌뜌듀듇 ♡');setQuest('HAPPY BIRTHDAY, DEAR YOU','마지막으로, 너에게 꼭 전하고 싶은 말이 있어.');setAction('너에게 온 편지 열기');$('room-caption').textContent='a wish for all your happy days';$('gentle-note').textContent='엥';
  confetti();happyTune();schedule(()=>{ui.character.className='character-button awake';},4000);
}
function openLetter(){setState('letter');applyGift();$('letter-dialog').showModal();setAction('생일 편지 다시 읽기');say('마!!!\n뭘 또 다시 읽어');}
function reset(){
  pendingTimers.forEach(clearTimeout);pendingTimers=[];collected=new Set();candles=[true,true,true];setState('asleep');setPose('sleep');ui.character.className='character-button sleeping';ui.character.setAttribute('aria-label','자는 캐릭터 깨우기');ui.room.removeAttribute('aria-busy');
  $('sleep-z').hidden=false;$('tap-hint').hidden=false;ui.cake.hidden=true;$('celebration-banner').hidden=true;ui.stars.replaceChildren();ui.particles.replaceChildren();
  document.querySelectorAll('[data-candle]').forEach((b,i)=>{b.disabled=false;b.setAttribute('aria-label',(i+1)+'번째 촛불 끄기');});
  say('마 벌써 연말이네예…\n망했다예… zZ');setLabel('꿈나라에 접속 중');setQuest('YOUR FIRST QUEST','쉿! 아빠 잔다');setAction('쉬었음청년 깨우기');setStep(1);$('room-caption').textContent='a little nap before the party';$('gentle-note').textContent='엥';
}
ui.action.addEventListener('click',()=>{if(state==='asleep')wake();else if(state==='greeting')startStars();else if(state==='cake')blowCandle(candles.indexOf(true));else if(state==='wish'||state==='letter')openLetter();});
ui.character.addEventListener('click',()=>{if(state==='asleep')wake();else if(state!=='waking'){heartPop();tone(784,.12);}});
document.querySelectorAll('[data-candle]').forEach(btn=>btn.addEventListener('click',()=>blowCandle(Number(btn.dataset.candle))));
$('restart-button').addEventListener('click',()=>{if(state==='asleep'){showToast('토익할 시간이다 일어나자 ');}else $('restart-dialog').showModal();});
$('confirm-restart').addEventListener('click',()=>{$('restart-dialog').close();reset();ui.action.focus();});
document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
function heartPop(){
  const p=document.createElement('span');p.className='heart-pop';p.innerHTML='<svg><use href="#i-heart"/></svg>';p.style.left=(state==='cake'||state==='wish'||state==='letter'?'36%':'50%');p.style.top='57%';p.style.setProperty('--drift',(Math.random()*50-25)+'px');ui.particles.append(p);schedule(()=>p.remove(),1500);
}
function confetti(){
  const colors=['#d995a8','#aec69c','#e4bd65','#c0a5ca','#91bdb5','#efb792'];
  for(let i=0;i<(reducedMotion?12:65);i++){const p=document.createElement('span');p.className='confetti';p.style.left=Math.random()*100+'%';p.style.background=colors[i%colors.length];p.style.animationDelay=Math.random()*1.6+'s';p.style.animationDuration=(2.8+Math.random()*1.5)+'s';p.style.setProperty('--drift',(Math.random()*180-90)+'px');if(reducedMotion){p.style.top=(10+Math.random()*70)+'%';}ui.particles.append(p);schedule(()=>p.remove(),6500);}
}

// Sound is opt-in and begins only after a deliberate user click.
function ensureAudio(){if(!audioContext){const AudioClass=window.AudioContext||window.webkitAudioContext;if(!AudioClass)return false;audioContext=new AudioClass();}audioContext.resume().catch(()=>{});return true;}
function tone(freq,duration=.14,delay=0,type='sine',volume=.055){
  if(!soundOn||!audioContext||document.hidden)return;
  const o=audioContext.createOscillator(),g=audioContext.createGain(),at=audioContext.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.015);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(audioContext.destination);o.start(at);o.stop(at+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};
}
const tune=[523,0,659,784,880,784,659,0,587,0,659,784,659,523,440,0,523,659,784,0,880,1047,880,784,659,0,587,659,523,0,0,0];
let musicIndex=0;
function startMusic(){clearInterval(musicTimer);musicIndex=0;musicTimer=setInterval(()=>{const note=tune[musicIndex%tune.length];if(note)tone(note,.34,0,'sine',.026);if(musicIndex%8===0)tone([261.63,220,174.61,196][Math.floor(musicIndex/8)%4],1.1,0,'triangle',.018);musicIndex++;},330);}
function happyTune(){[523,659,784,1047,880,1047].forEach((n,i)=>tone(n,.25,i*.16,'triangle',.045));}
$('sound-button').addEventListener('click',()=>{if(!soundOn&&!ensureAudio()){showToast('이 브라우저에서는 소리를 재생할 수 없어요.');return;}soundOn=!soundOn;$('sound-button').setAttribute('aria-pressed',String(soundOn));$('sound-button').setAttribute('aria-label',soundOn?'배경 음악 끄기':'배경 음악 켜기');$('sound-button').querySelector('use').setAttribute('href',soundOn?'#i-sound':'#i-mute');$('sound-label').textContent=soundOn?'소리 켜짐':'소리 꺼짐';if(soundOn){tone(659,.15);startMusic();}else{clearInterval(musicTimer);audioContext?.suspend();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audioContext?.suspend();else if(soundOn)audioContext?.resume().catch(()=>{});});
setInterval(()=>{if(!reducedMotion&&!document.hidden&&['greeting','stars','letter'].includes(state)){waveFrame=!waveFrame;setPose(waveFrame?'wave':'wave2');}},850);

// A deliberately low-resolution room: all scenery shares the character's pixel grid.
const roomCtx=$('room-canvas').getContext('2d');
function drawRoom(){
  const c=roomCtx;c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=false;
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const line=(x,y,x2,y2,color)=>{c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x+.5,y+.5);c.lineTo(x2+.5,y2+.5);c.stroke();};
  const cloud=(x,y)=>{r(x+4,y,15,3,'#fff9e8');r(x,y+3,26,5,'#fff9e8');r(x+3,y+8,19,2,'#fff9e8');};
  const leaf=(x,y,color)=>{r(x+3,y,5,2,color);r(x,y+2,11,5,color);r(x+3,y+7,6,2,color);};
  const heart=(x,y,color,s=1)=>{['0110110','1111111','1111111','0111110','0011100','0001000'].forEach((row,dy)=>[...row].forEach((v,dx)=>{if(v==='1')r(x+dx*s,y+dy*s,s,s,color);}));};
  const star=(x,y,col)=>{r(x+2,y,2,8,col);r(x,y+3,6,2,col);};
  r(0,0,384,176,'#f7efd7');
  for(let x=0;x<384;x+=24)r(x,0,11,127,'#f2e8cb');
  for(let y=30;y<126;y+=24)for(let x=12;x<384;x+=24){r(x,y,1,2,'#e5dcc0');r(x-1,y+1,3,1,'#e5dcc0');}
  r(0,123,384,3,'#c7b492');r(0,126,384,3,'#eedec0');r(0,129,384,47,'#e8d9b8');
  [143,159,174].forEach(y=>{r(0,y,384,1,'#d3c09b');r(0,y+1,384,1,'#eee1c5');});
  for(let x=14;x<384;x+=63){r(x,130,1,13,'#d9c8a5');r(x+29,144,1,15,'#d9c8a5');r(x+6,160,1,14,'#d9c8a5');r(x+10,136,14,1,'#dfcfab');}
  // Sunlit, four-pane window and scalloped pink curtains.
  r(65,33,86,82,'#bea47c');r(68,36,80,74,'#f6f3d8');r(72,40,72,66,'#cee6da');
  r(76,44,27,28,'#d5e8dc');r(111,44,29,28,'#c8e0d4');cloud(79,53);cloud(114,78);
  r(120,48,9,9,'#f9dda1');r(122,46,5,13,'#f9dda1');r(118,50,13,5,'#f9dda1');
  r(72,97,72,9,'#a5bf9c');r(72,92,16,9,'#b3c8a0');r(76,89,10,4,'#b3c8a0');r(114,97,30,9,'#91b693');r(125,93,19,5,'#91b693');
  r(106,39,4,69,'#f2e4c3');r(71,73,74,4,'#f2e4c3');r(65,110,88,5,'#aa8e6c');r(63,108,92,3,'#e4cba5');
  r(59,30,98,3,'#a58d71');r(60,33,13,48,'#e7bdba');r(62,33,3,49,'#f0cfca');r(69,33,3,44,'#dba6a8');r(59,75,10,9,'#e7bdba');r(59,80,8,4,'#dba6a8');
  r(144,33,13,48,'#e7bdba');r(146,33,3,49,'#f0cfca');r(153,33,3,48,'#dba6a8');r(149,76,9,8,'#e7bdba');r(150,81,8,3,'#dba6a8');
  for(let x=60;x<156;x+=12){r(x,33,12,7,'#eac2bf');r(x+2,40,8,3,'#eac2bf');}
  // Little things on a wooden shelf.
  r(274,76,67,4,'#b49a78');r(278,80,3,7,'#c6af8b');r(333,80,3,7,'#c6af8b');r(283,48,26,28,'#c3a780');r(286,51,20,22,'#fff7db');r(289,54,14,16,'#e9d8bf');heart(289,58,'#d5929c',2);
  r(317,66,11,10,'#d7b896');r(315,65,15,3,'#bc9c7a');r(321,53,2,13,'#94a27c');leaf(311,54,'#aab88b');leaf(321,50,'#a3b08b');r(319,45,7,7,'#e4acb0');r(321,47,3,3,'#f5dba7');
  r(264,71,6,5,'#e2c695');r(266,62,2,10,'#b6bd91');star(264,57,'#d6b879');
  // Bunting, drawn on the same pixel grid.
  const flagColors=['#d7a4ab','#b7c59e','#e9cd8b','#b4cac2','#ceb2c8'];
  let prev=[10,12];for(let x=10,i=0;x<384;x+=23,i++){const y=Math.round(12+Math.sin((x/384)*Math.PI)*15);line(prev[0],prev[1],x,y,'#bba68a');if(i>0&&i<16){const color=flagColors[i%5];r(x-10,y,11,3,color);r(x-9,y+3,9,3,color);r(x-7,y+6,5,3,color);r(x-6,y+9,3,2,color);}prev=[x,y];}
  // Potted plant, books and floor presents frame the stage.
  r(30,108,3,28,'#9aa477');leaf(22,108,'#a7b88b');leaf(31,101,'#9bad82');leaf(19,96,'#91a47c');leaf(31,88,'#b0bd94');leaf(24,82,'#a2b58b');r(20,130,24,5,'#bd9c7a');r(23,135,18,17,'#d1b18b');r(25,135,4,14,'#dec29c');r(24,151,16,2,'#b89773');
  r(53,137,31,7,'#cbb2bd');r(55,138,26,2,'#f2e2df');r(57,130,24,7,'#b0bc97');r(60,131,19,2,'#e4e9cb');r(55,145,31,3,'#c8b18a');
  r(315,130,25,23,'#dab1bb');r(312,128,31,6,'#e7c2c8');r(325,128,5,25,'#fff1ce');r(319,123,9,5,'#f5dcae');r(329,123,9,5,'#f5dcae');r(320,121,6,3,'#efd39f');r(332,121,5,3,'#efd39f');
  r(343,138,21,20,'#bbc4a1');r(341,136,25,5,'#c9d2b3');r(352,136,4,22,'#f8e4b6');r(347,132,7,4,'#e5cc9d');r(355,132,7,4,'#e5cc9d');
  // Soft oval rug, stepped edges rather than antialiased shapes.
  const rugRows=[[0,54],[3,69],[6,79],[9,85],[13,89],[18,88],[23,82],[27,72],[30,56]];
  rugRows.forEach(([dy,half],i)=>{const h=i<rugRows.length-1?rugRows[i+1][0]-dy:3;r(193-half,133+dy,half*2,h,'#aebd96');});
  r(130,138,125,2,'#cbd2ad');r(118,143,150,2,'#bfcba3');r(119,155,148,2,'#9eaf88');r(137,162,111,2,'#99ab82');
  // Small cream cushion at the edge of the rug.
  r(114,141,31,10,'#d4c3a5');r(117,137,26,13,'#f5e6bf');r(120,135,20,3,'#f7ebce');r(119,148,22,3,'#e5d2ac');r(120,138,19,1,'#fff2d6');
  const festive=['wish','letter'].includes(state);if(festive){[[168,54],[229,59],[245,102],[155,101],[57,76],[355,50]].forEach(([x,y],i)=>star(x,y,i%2?'#d7a4a3':'#d7b974'));heart(226,118,'#d39a9f');}
  // Tiny wall sparkles and the paper tag on the right.
  star(236,83,'#d9c797');star(178,65,'#dbc99d');r(349,90,15,20,'#c3af8e');r(350,91,13,18,'#f8edcf');heart(353,96,'#d7a5a5');
}

let cakeFrame=0;
function drawCake(){
  const c=$('cake-canvas').getContext('2d');c.clearRect(0,0,112,92);c.imageSmoothingEnabled=false;
  const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  r(9,83,94,4,'#97a58c');r(4,79,104,4,'#becbb0');r(9,76,94,4,'#e5e8ca');
  r(17,42,78,35,'#ac806e');r(19,44,74,31,'#dfa9ae');r(21,64,70,7,'#edbfc1');r(21,69,70,3,'#f7d1c9');
  r(16,40,80,8,'#b58c77');r(20,35,72,9,'#b58c77');r(22,37,68,9,'#fff1cc');r(18,42,76,8,'#fff1cc');
  [22,38,56,73,86].forEach((x,i)=>r(x,48,i===4?6:9,i%2?7:11,'#fff1cc'));
  r(29,35,10,4,'#d98d91');r(70,35,10,4,'#d98d91');r(31,32,6,4,'#d98d91');r(72,32,6,4,'#d98d91');r(33,31,3,3,'#94a16f');r(74,31,3,3,'#94a16f');
  [34,54,74].forEach((x,i)=>{r(x,20,5,19,'#b589a4');r(x+1,21,3,17,['#d1b4d6','#9cbcb0','#e5b9ad'][i]);r(x+1,25,3,2,'#fff2da');r(x+1,32,3,2,'#fff2da');r(x+2,17,1,3,'#90725a');
    if(candles[i]){const f=(cakeFrame+i)%2;r(x,8+f,5,8,'#e7ac55');r(x+1,5+f,3,4,'#e7ac55');r(x+1,10+f,3,6,'#ffdf83');r(x+2,12+f,1,4,'#fff7cb');}
    else{r(x+2,10,2,4,'#c7bba666');r(x+3,7,3,3,'#c7bba644');}
  });
  r(49,58,3,3,'#9d7567');r(62,58,3,3,'#9d7567');r(54,65,6,2,'#b88180');r(42,62,5,2,'#e68f9b');r(67,62,5,2,'#e68f9b');
}
setInterval(()=>{if(state==='cake'&&!document.hidden){cakeFrame++;drawCake();}},350);
applyGift();drawRoom();
