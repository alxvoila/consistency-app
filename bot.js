/* Consistency: conversational onboarding companion (scripted, no backend).
   Voice: speechSynthesis to speak, SpeechRecognition to listen, always with chips + text field. */
(function(){
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const TTS='speechSynthesis'in window&&'SpeechSynthesisUtterance'in window;
let B=null;   // conversation state
const strip=s=>String(s).replace(/<[^>]+>/g,'').replace(/[→✓]/g,'').trim();
const norm=s=>strip(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}' ]+/gu,' ').replace(/\s+/g,' ').trim();
const syn=k=>t(k).split('|').map(norm).filter(Boolean);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const icMic='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="3" width="7" height="12" rx="3.5"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" fill="none"/></svg>';
const icSend='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>';
const icKey='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="none"/><path d="M6 10h1M9 10h1M12 10h1M15 10h1M18 10h0M7 14h10" fill="none"/></svg>';
const botFace=()=>`<svg class="bot-face-svg" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" class="fc"/><circle cx="68" cy="80" r="11" class="ft bot-eye"/><circle cx="132" cy="80" r="11" class="ft bot-eye"/><path class="fm bot-mouth" d="${mouth(78)}"/></svg>`;

// ---------- speech ----------
function pickVoice(){if(!TTS)return null;const vs=speechSynthesis.getVoices(),loc=L.locale.toLowerCase(),lg=loc.slice(0,2);
 return vs.find(v=>v.lang.toLowerCase().replace('_','-')===loc&&v.localService)||vs.find(v=>v.lang.toLowerCase().replace('_','-')===loc)||vs.find(v=>v.lang.toLowerCase().startsWith(lg))||null}
if(TTS)speechSynthesis.onvoiceschanged=()=>{};
let talkTimer=null;
function mouthTalk(on){const m=document.querySelector('.bot-mouth');if(!m)return;clearInterval(talkTimer);m.classList.toggle('open',on);
 if(!on||noMotion()){m.setAttribute('d',mouth(78));return}
 let k=0;talkTimer=setInterval(()=>{k+=.55;const o=10+22*Math.abs(Math.sin(k)*Math.sin(k*.37+1));m.setAttribute('d',`M66 128 Q100 ${(128+o).toFixed(1)} 134 128 Q100 ${(128+o*.3).toFixed(1)} 66 128Z`)},90)}
function speak(text){return new Promise(res=>{if(!B||B.mode!=='voice'||!TTS||B.mute)return res();
 try{speechSynthesis.cancel()}catch(e){}
 const u=new SpeechSynthesisUtterance(strip(text));u.lang=L.locale;const v=pickVoice();if(v)u.voice=v;u.rate=1;u.pitch=1.05;
 let done=false;const fin=()=>{if(done)return;done=true;clearTimeout(guard);mouthTalk(false);res()};
 const guard=setTimeout(fin,2500+strip(text).length*85);   // some browsers never fire onend
 u.onstart=()=>mouthTalk(true);u.onend=fin;u.onerror=fin;mouthTalk(true);speechSynthesis.speak(u)})}
function stopSpeak(){if(TTS)try{speechSynthesis.cancel()}catch(e){}mouthTalk(false)}
let rec=null;
function listen(manual){if(!B||B.mode!=='voice'||!SR||B.noMic||B.busy)return;stopListen();
 try{rec=new SR();rec.lang=L.locale;rec.interimResults=true;rec.maxAlternatives=1;rec.continuous=false}catch(e){B.noMic=true;return}
 const inp=document.getElementById('bin'),mic=document.getElementById('bmic');let final='',heard=false;
 rec.onstart=()=>{mic?.classList.add('on');mic?.setAttribute('aria-label',t('bot_listening'));if(inp)inp.placeholder=t('bot_listening')};
 rec.onresult=e=>{let s='';for(let i=e.resultIndex;i<e.results.length;i++){s+=e.results[i][0].transcript;if(e.results[i].isFinal)final+=e.results[i][0].transcript}heard=true;if(inp)inp.value=final||s};
 rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){if(manual){B.noMic=true;note(t('bot_denied'))}B.auto=false}};
 rec.onend=()=>{mic?.classList.remove('on');mic?.setAttribute('aria-label',t('bot_mic'));if(inp)inp.placeholder=t('bot_ph');rec=null;
  const said=(final||(heard&&inp?inp.value:'')).trim();if(said)submit(said)};
 try{rec.start()}catch(e){mic?.classList.remove('on')}}
function stopListen(){if(rec){try{rec.onend=null;rec.abort()}catch(e){}rec=null}document.getElementById('bmic')?.classList.remove('on')}

// ---------- the script ----------
const moodVals=[10,30,50,70,90];
function steps(){const d=B.d,nm=()=>esc(d.name||t('ob6_you'));
 return {
 hello:{say:()=>[t('bot_m1'),t('bot_explain_q')],chips:()=>[{id:'y',label:t('bot_c_explain'),syn:syn('bot_syn_yes')},{id:'n',label:t('bot_c_know'),syn:syn('bot_syn_no')}],
  on:a=>a.id==='n'?'name':(a.id==='y'?'explain':null)},
 explain:{say:()=>[t('intro1_lead'),t('bot_day'),t('intro2_small'),t('intro4_lead')],next:'name'},
 name:{say:()=>[t('bot_name_q')],free:true,name:true,
  on:a=>{const n=cleanName(a.text);if(!n)return {say:t('bot_name_err'),stay:true};d.name=n;return {say:t('bot_name_ok',{name:esc(n)}),go:'why'}}},
 why:{say:()=>[t('bot_why_q',{name:nm()})],free:true,chips:()=>[...t('bot_why_chips').split('|').map((s,i)=>({id:'w'+i,label:s,syn:[norm(s)]})),{id:'skip',label:t('bot_skip'),syn:syn('bot_syn_skip')}],
  on:a=>{d.why=a.id==='skip'?'':(a.label||a.text);return {say:a.id==='skip'?null:t('bot_why_ok'),go:'eng'}}},
 eng:{say:()=>[t('bot_eng_q'),`<i>${t('ob4_def')}</i>`],free:true,chips:()=>[{id:'keep',label:t('bot_eng_keep'),syn:syn('bot_syn_keep')}],
  on:a=>{const keep=a.id==='keep'&&(a.text===a.label||a.text.split(/\s+/).length<=3);d.eng=keep?t('ob4_def'):a.text;return {say:t('bot_eng_ok'),go:'mood'}}},
 mood:{say:()=>[t('bot_mood_q')],chips:()=>FEEL.map((s,i)=>({id:'m'+i,label:s,syn:[norm(s)]})),
  on:a=>{if(!a.id)return null;d.mood=moodVals[+a.id.slice(1)];return {say:t('bot_mood_ok'),go:'rem'}}},
 rem:{say:()=>[t('bot_rem_q')],chips:()=>[['m','bot_rem_m'],['e','bot_rem_e'],['b','bot_rem_b'],['n','bot_rem_n']].map(([id,k])=>({id,label:t(k),syn:syn('bot_syn_'+id)})),
  pick:a=>{const s=norm(a);const m=syn('bot_syn_m').some(x=>s.includes(x)),e=syn('bot_syn_e').some(x=>s.includes(x));return m&&e?'b':null},
  on:a=>{if(!a.id)return null;d.rem=a.id;return {say:t('bot_rem_ok'),go:'prog'}}},
 prog:{say:()=>[t('bot_prog_q')],chips:()=>[7,14,30,90].map(n=>({id:'p'+n,label:t('bot_p'+n),syn:syn('bot_syn_'+n)})),
  on:a=>{if(!a.id)return null;d.prog=+a.id.slice(1);return {say:t('bot_prog_ok'),go:'recap'}}},
 recap:{say:()=>[t('bot_recap',{name:nm(),prog:strip(t('bot_p'+d.prog)).replace(/\s*\(.*\)$/,'').replace(/（.*）$/,''),rem:strip(t('bot_rem_'+d.rem)).toLowerCase()})],
  chips:()=>[{id:'go',label:t('bot_go'),syn:syn('bot_syn_go')},{id:'re',label:t('bot_restart'),syn:syn('bot_syn_re')}],
  on:a=>a.id==='go'?(finish(),{end:true}):(a.id==='re'?(B.d={},'name'):null)},
 }}
function cleanName(txt){let s=strip(txt).replace(/[.!?,;:。！？，]+$/g,'').trim();
 for(const p of t('bot_name_pre').split('|').sort((a,b)=>b.length-a.length)){const re=new RegExp('^\\s*'+p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*','i');if(re.test(s)){s=s.replace(re,'');break}}
 s=s.replace(/^[,.\s]+/,'').trim();if(!s)return '';
 if(!L.cjk){const w=s.split(/\s+/).slice(0,3);s=w.map(x=>x.charAt(0).toLocaleUpperCase(L.locale)+x.slice(1)).join(' ')}
 return s.slice(0,40)}
function matchChip(text,chips){const s=' '+norm(text)+' ';let best=null,score=0;
 for(const c of chips){for(const y of [norm(c.label),...(c.syn||[])]){if(!y)continue;const hit=L.cjk?s.includes(y):(s.includes(' '+y+' ')||(y.length>3&&s.includes(y)));if(hit&&y.length>score){best=c;score=y.length}}}
 return best}

// ---------- UI ----------
function bubble(cls,html){const log=document.getElementById('blog');if(!log)return;log.querySelectorAll('.bm.cur').forEach(e=>e.classList.remove('cur'));
 const p=document.createElement('p');p.className=cls;p.innerHTML=html;log.appendChild(p);log.scrollTop=log.scrollHeight;return p}
function note(txt){bubble('bm note',esc(txt))}
async function botSay(msgs){B.busy=true;setInput(false);
 for(const m of msgs.filter(Boolean)){if(!B||!document.getElementById('blog'))return;
  if(B.mode==='text'&&!noMotion()){const ty=bubble('bm typing','<span></span><span></span><span></span>');await wait(Math.min(1400,350+strip(m).length*12));ty.remove()}
  bubble('bm cur',m);if(B.mode==='voice'&&TTS&&!B.mute)await speak(m);else await wait(noMotion()?150:320)}
 B.busy=false}
function setInput(on){const bar=document.getElementById('bbar');if(bar)bar.classList.toggle('off',!on);document.getElementById('bin')?.toggleAttribute('disabled',!on)}
function showChips(chips){const c=document.getElementById('bchips');if(!c)return;B.chips=chips||[];
 c.innerHTML=B.chips.map((x,i)=>`<button class="chip" data-i="${i}">${x.label}</button>`).join('');
 const lg=document.getElementById('blog');if(lg)lg.scrollTop=lg.scrollHeight;
 c.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const x=B.chips[+b.dataset.i];stopListen();submit(strip(x.label),x)})}
async function run(id){if(!B)return;const st=steps()[id];B.step=id;showChips([]);
 await botSay(st.say());if(!B||B.step!==id)return;
 if(st.next)return run(st.next);
 showChips(st.chips?st.chips():[]);setInput(true);
 const inp=document.getElementById('bin');if(inp){inp.value='';if(B.mode==='text'&&matchMedia('(pointer:fine)').matches)inp.focus()}
 if(B.mode==='voice'&&B.auto)listen(false)}
async function submit(text,chip){if(!B||B.busy||!text.trim())return;const st=steps()[B.step];stopListen();stopSpeak();
 let a={text:text.trim()};
 if(chip)a={...a,id:chip.id,label:strip(chip.label)};
 else if(st.chips){const ch=st.chips(),pid=st.pick?.(text),m=pid?ch.find(c=>c.id===pid):matchChip(text,ch);if(m)a={...a,id:m.id,label:strip(m.label)}}
 if(!a.id&&!st.free){bubble('um',esc(a.text));showChips(st.chips());await botSay([t('bot_huh')]);showChips(st.chips());setInput(true);if(B.mode==='voice'&&B.auto)listen(false);return}
 bubble('um',esc(a.id&&chip?a.label:a.text));showChips([]);document.getElementById('bin').value='';
 let r=st.on(a);if(r&&r.end)return;
 if(typeof r==='string')return run(r);
 if(!r)return run(B.step);
 if(r.say)await botSay([r.say]);
 return r.stay?run(B.step):run(r.go)}
function finish(){const d=B.d;stopListen();
 const prev=S.profile;
 S.profile=prev?{...prev,name:d.name||prev.name,why:d.why??prev.why,engagement:d.eng||prev.engagement,mood:d.mood??prev.mood,target:d.prog||prev.target}
  :{name:d.name,why:d.why||'',engagement:d.eng||t('ob4_def'),mood:d.mood??50,start:today(),target:d.prog||7};
 S.settings.moment=d.rem||'b';S.introSeen=true;S.botMode=B.mode;if(!prev)S.lastVisit=today();save();
 const bye=async()=>{await botSay([t('bot_bye')]);B=null;stopSpeak();location.hash='home';render()};bye()}

window.botView=function(){stopListen();stopSpeak();setTheme('b');document.body.classList.remove('stepping');
 const replay=!!S.profile;
 if(!B||!B.mode){B={mode:null,d:{},auto:true,noMic:!SR,replay};
  app.innerHTML=`<div class="bot bot-choice"><div class="bot-head">${langPicker()}</div>
  <div class="bot-face">${botFace()}</div><p class="sc">${t('bot_tag')}</p><h1 class="big">${t('bot_hello')}</h1><p class="lead">${t('bot_choose')}</p>
  <div class="bot-opts"><button class="bot-opt" id="bvoice"><b>${t('bot_talk')}</b><small>${t('bot_talk_d')}</small><span class="bo-ar" aria-hidden="true">→</span></button>
  <button class="bot-opt" id="btext"><b>${t('bot_write')}</b><small>${t('bot_write_d')}</small><span class="bo-ar" aria-hidden="true">→</span></button></div>
  <div class="bot-foot"><p class="bot-priv">${t('bot_note_voice')}</p>
  ${replay?`<button class="linkbtn" id="bclose">${t('bot_close')}</button>`:`<button class="linkbtn" id="bclassic">${t('bot_classic')}</button>`}</div></div>`;
  window.scrollTo(0,0);
  document.getElementById('bvoice').onclick=()=>{if(TTS){try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;u.lang=L.locale;speechSynthesis.speak(u)}catch(e){}}start('voice')};  // unlock iOS audio in the tap
  document.getElementById('btext').onclick=()=>start('text');
  const cl=document.getElementById('bclassic');if(cl)cl.onclick=()=>{B=null;go('intro')};
  const bc=document.getElementById('bclose');if(bc)bc.onclick=()=>{B=null;go('settings')};
  return}
 chat()};
function start(mode){B.mode=mode;chat(true)}
function chat(first){
 app.innerHTML=`<div class="bot bot-chat"><div class="bot-bar-top"><div class="bot-face sm">${botFace()}</div>
  <button class="bot-mode" id="bmode" aria-pressed="${B.mode==='voice'}"><span class="${B.mode==='voice'?'on':''}">${t('bot_mode_voice')}</span><span class="${B.mode==='text'?'on':''}">${t('bot_mode_text')}</span></button>
  ${B.replay?`<button class="x" id="bx" aria-label="${t('bot_close')}">×</button>`:''}</div>
  <div class="bot-log" id="blog" aria-live="polite"></div>
  <div class="bot-bar off" id="bbar"><div class="bot-chips" id="bchips"></div>
  <form class="bot-in" id="bform" autocomplete="off">${B.mode==='voice'&&SR&&!B.noMic?`<button type="button" class="bot-mic" id="bmic" aria-label="${t('bot_mic')}">${icMic}</button>`:''}
  <input id="bin" class="bot-field" placeholder="${t('bot_ph')}" aria-label="${t('bot_ph')}" enterkeyhint="send"><button class="bot-send" aria-label="${t('bot_send')}">${icSend}</button></form></div></div>`;
 {const lg=document.getElementById('blog'),pin=()=>{lg.scrollTop=lg.scrollHeight};if('ResizeObserver'in window)new ResizeObserver(pin).observe(lg);new MutationObserver(()=>requestAnimationFrame(pin)).observe(lg,{childList:true})}
 document.getElementById('bform').onsubmit=e=>{e.preventDefault();submit(document.getElementById('bin').value)};
 document.getElementById('bmic')?.addEventListener('click',()=>{if(rec)stopListen();else{stopSpeak();B.auto=true;listen(true)}});
 document.getElementById('bmode').onclick=()=>{stopListen();stopSpeak();const busy=B.busy;B.mode=B.mode==='voice'?'text':'voice';
  const html=document.getElementById('blog').innerHTML,chips=B.chips;chat(false);document.getElementById('blog').innerHTML=html;
  if(!busy){showChips(chips);setInput(true);if(B.mode==='voice'){if(!SR&&!B.warned){B.warned=1;note(t('bot_nomic'))}else listen(true)}}};
 document.getElementById('bx')?.addEventListener('click',()=>{stopListen();stopSpeak();B=null;go('settings')});
 if(!first)return;
 (async()=>{if(B.mode==='voice'){if(!TTS){B.mode='text';chat(false);note(t('bot_notts'))}else if(!SR){B.warned=1;note(t('bot_nomic'))}}
  run('hello')})()}
window.botReset=()=>{stopListen();stopSpeak();B=null};
})();
