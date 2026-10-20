'use strict';
// Consistency v3: one question per screen, black & white, smiley sliders.
const KEY='consistency-v1', app=document.getElementById('app');
const MOOD_MAP={'😊':85,'🙂':68,'😐':50,'😕':25};
let S=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||null}catch(e){return null}}
function fresh(){return {profile:null,days:{},reflections:{},bilans:{},synth:{},letter:'',jokers:3,usedJokers:[],settings:{morning:'08:00',evening:'21:00',notif:false},lastVisit:null}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
if(!S)S=fresh();
// ---------- i18n ----------
const LANGS=['en','fr','es','zh','pt'];
const detectLang=()=>{for(const x of (navigator.languages||[navigator.language||'en'])){const c=String(x).toLowerCase().slice(0,2);if(LANGS.includes(c))return c}return 'en'};
let L=I18N.en,CHAPTERS=[],DAYS=[],FEEL=[],ENERGY=[];
const fill=(str,v)=>String(str).replace(/\{(\w+)\}/g,(m,x)=>v&&v[x]!=null?v[x]:m);
const t=(k,v)=>fill(L.ui[k]??I18N.en.ui[k]??k,v);
function buildData(){FEEL=L.feel;ENERGY=L.energy;
 CHAPTERS=CHAPTER_DEFS.map(d=>Object.assign({},d,L.chapters[d.id],{levels:d.levels.map(([id,a,b])=>[id,L.levels[id],a,b])}));
 DAYS=Array.from({length:90},(_,i)=>Object.assign({n:i+1},L.days[i]))}
function setLang(code){if(!I18N[code])code='en';S.lang=code;L=I18N[code];buildData();
 document.documentElement.lang={zh:'zh-CN',pt:'pt-BR'}[code]||code;document.body.classList.toggle('cjk',!!L.cjk);
 if(L.cjk&&!document.getElementById('cjkfont')){const k=document.createElement('link');k.id='cjkfont';k.rel='stylesheet';k.href='https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600&family=Noto+Serif+SC:wght@400;700;900&display=swap';document.head.appendChild(k)}
 document.querySelectorAll('[data-go]').forEach(b=>b.textContent=t('nav_'+({home:'path',journal:'journal',settings:'settings'}[b.dataset.go])))}
{const q=new URLSearchParams(location.search).get('lang');if(q&&LANGS.includes(q))S.lang=q;}
if(!S.lang)S.lang=S.profile?'en':detectLang();
setLang(S.lang);
const star=(cx,cy,r,rot=0)=>{let p='';for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2+rot,rr=i%2?r*.4:r;p+=(i?'L':'M')+(cx+rr*Math.cos(a)).toFixed(2)+' '+(cy+rr*Math.sin(a)).toFixed(2)}return `<path d="${p}Z" fill="#FFDE00"/>`};
const FLAGS={
 en:'<rect width="40" height="40" fill="#fff"/><rect y="0.00" width="40" height="5.81" fill="#B22234"/><rect y="11.43" width="40" height="5.81" fill="#B22234"/><rect y="22.86" width="40" height="5.81" fill="#B22234"/><rect y="34.29" width="40" height="5.81" fill="#B22234"/><rect width="21" height="22.86" fill="#3C3B6E"/><circle cx="6" cy="6" r="1.1" fill="#fff"/><circle cx="12" cy="6" r="1.1" fill="#fff"/><circle cx="18" cy="6" r="1.1" fill="#fff"/><circle cx="6" cy="12" r="1.1" fill="#fff"/><circle cx="12" cy="12" r="1.1" fill="#fff"/><circle cx="18" cy="12" r="1.1" fill="#fff"/><circle cx="6" cy="18" r="1.1" fill="#fff"/><circle cx="12" cy="18" r="1.1" fill="#fff"/><circle cx="18" cy="18" r="1.1" fill="#fff"/>',
 fr:'<rect width="14" height="40" fill="#0055A4"/><rect x="13" width="14" height="40" fill="#fff"/><rect x="26" width="14" height="40" fill="#EF4135"/>',
 es:'<rect width="40" height="40" fill="#AA151B"/><rect y="10" width="40" height="20" fill="#F1BF00"/>',
 zh:'<rect width="40" height="40" fill="#EE1C25"/>'+star(12,14,6)+star(21,7,2,.6)+star(25,11,2,.9)+star(25,17,2,0)+star(21,21,2,.4),
 pt:'<rect width="40" height="40" fill="#FF0000"/><rect width="17" height="40" fill="#006600"/><circle cx="17" cy="20" r="7" fill="#FFDE00" stroke="#003399" stroke-width="1.5"/><path d="M14 16h6v5a3 3 0 0 1-6 0z" fill="#fff" stroke="#FF0000" stroke-width="1.2"/>'};
const langPicker=()=>`<div class="langs" role="group" aria-label="${t('language')}">${["fr","en","es","pt","zh"].map(c=>`<button data-lang="${c}" class="flag ${c===S.lang?'on':''}" aria-label="${I18N[c].name}" title="${I18N[c].name}" aria-pressed="${c===S.lang}"><svg viewBox="0 0 40 40" aria-hidden="true">${FLAGS[c]}</svg></button>`).join('')}</div>`;
document.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(!b)return;e.stopPropagation();setLang(b.dataset.lang);save();render()},true);
// Shrink huge words that would overflow narrow screens (long FR/PT words, etc.)
function fitText(){app.querySelectorAll('.huge,.big,.q').forEach(el=>{el.style.fontSize='';let fs=parseFloat(getComputedStyle(el).fontSize),g=0;
 while(el.scrollWidth>el.clientWidth+1&&fs>22&&g++<40){fs-=3;el.style.fontSize=fs+'px'}})}
new MutationObserver(()=>requestAnimationFrame(fitText)).observe(app,{childList:true});
if(document.fonts)document.fonts.ready.then(fitText);addEventListener('resize',fitText);
// Migration: old emoji moods -> 0..100 slider values
const moodNum=m=>typeof m==='number'?m:(m in MOOD_MAP?MOOD_MAP[m]:null);
(function migrate(){if(S.profile&&typeof S.profile.mood==='string')S.profile.mood=moodNum(S.profile.mood);
 for(const d of Object.values(S.days||{}))if(d&&typeof d.mood==='string')d.mood=moodNum(d.mood);save()})();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const chapOf=n=>CHAPTERS.find(c=>c.levels.some(l=>n>=l[2]&&n<=l[3]));
const levelOf=n=>{for(const c of CHAPTERS)for(const l of c.levels)if(n>=l[2]&&n<=l[3])return {c,l};};
const doneCount=()=>Object.values(S.days).filter(d=>d?.done).length;
const nextDay=()=>{for(let n=1;n<=90;n++)if(!S.days[n]?.done)return n;return 91};
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const pendingPause=()=>{for(const c of CHAPTERS)for(const l of c.levels){const k=c.id+'-'+l[0];if(range(l[2],l[3]).every(n=>S.days[n]?.done)&&!S.reflections[k])return {type:'reflect',c,l,k};}
 for(const c of CHAPTERS.slice(0,3)){const last=c.levels.at(-1)[3];if(S.days[last]?.done&&!S.bilans[c.id])return {type:'bilan',c};}return null};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}; // local calendar date
const fmt=d=>new Date(typeof d==='string'&&d.length===10?d+'T12:00':d).toLocaleDateString(L.locale,{month:'short',day:'numeric',year:'numeric'});
function go(v,arg){location.hash=v+(arg!=null?'/'+arg:'')}
window.go=go;
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
function setTheme(t){document.body.classList.remove('w','b');document.body.classList.add(t);document.querySelector('meta[name=theme-color]').content=t==='b'?'#000000':'#ffffff'}

// ---------- Smiley ----------
const mouth=v=>`M60 135 Q100 ${(135+(v-50)*0.9).toFixed(1)} 140 135`;
const labOf=(v,L)=>L[Math.min(4,Math.floor(v/20))];
const faceSvg=(v,cls='')=>`<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" class="fc"/><circle cx="68" cy="80" r="11" class="ft"/><circle cx="132" cy="80" r="11" class="ft"/><path class="fm" d="${mouth(v)}"/></svg>`;
function slider(v,L){v=v==null?50:v;return `<div class="slider"><div class="face">${faceSvg(v)}<div class="lab">${labOf(v,L)}</div></div>
 <input type="range" min="0" max="100" value="${v}" aria-label="${L[0]} / ${L[4]}" data-l="${L.join('|')}"><div class="ends sc"><span>${L[0]}</span><span>${L[4]}</span></div></div>`}
function wireSliders(root){root.querySelectorAll('.slider input').forEach(r=>{const w=r.closest('.slider'),p=w.querySelector('.fm'),lb=w.querySelector('.lab'),L=r.dataset.l.split('|');
 r.addEventListener('input',()=>{p.setAttribute('d',mouth(+r.value));lb.textContent=labOf(+r.value,L)})})}

// ---------- Stepper ----------
// step: {t:'w'|'b', h:()=>html, save?(sec), valid?(sec)->msg, foot?:'yn'|'none', cta?, onYes/onNo}
function stepper(steps,{start=+(new URLSearchParams(location.search).get('step')||0),onExit=()=>go('home'),exitLabel=''}={}){let i=start;document.body.classList.add('stepping');
 function show(dir){const st=steps[i];setTheme(st.t);
  const dots=steps.length>1?`<div class="dots">${steps.map((_,k)=>`<i class="${k===i?'on':k<i?'past':''}"></i>`).join('')}</div>`:'<span></span>';
  const back=i>0?`<button class="btn ghost back" data-a="back" aria-label="${t('back')}">←</button>`:'';
  const foot=st.foot==='none'?'':st.foot==='yn'?`<div class="foot">${back}<button class="btn no" data-a="no">${t('skipped')}</button><button class="btn ok" data-a="yes">${t('done_btn')}</button></div>`
   :`<div class="foot">${back}<button class="btn ${st.ok?'ok':''}" data-a="next">${st.cta||t('next')}</button></div>`;
  app.innerHTML=`<section class="s ${st.t} in-${dir}"><div class="top">${dots}${exitLabel?`<button class="x sc" data-a="exit" style="font-size:11px">${exitLabel}</button>`:`<button class="x" data-a="exit" aria-label="${t('close')}">✕</button>`}</div><div class="body">${st.h()}</div>${foot}</section>`;
  const sec=app.firstElementChild;wireSliders(sec);window.scrollTo(0,0);
  sec.addEventListener('click',e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(!a)return;
   if(a==='exit'){st.save?.(sec);onExit()}else if(a==='back')prev();else if(a==='next')next();
   else if(a==='yes'){st.onYes?.();advance()}else if(a==='no'){st.onNo?.();advance()}});
  sec.querySelectorAll('input.field').forEach(f=>f.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();next()}}));
  let x0=null,y0=0;sec.addEventListener('touchstart',e=>{if(e.target.closest('input,textarea,button')){x0=null;return}x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  sec.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;
   if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){dx<0?(st.foot!=='yn'&&next()):prev()}},{passive:true});
  st.on?.(sec)}
 function cur(){return app.firstElementChild}
 function advance(){const st=steps[i];st.save?.(cur());if(i<steps.length-1){i++;show('r')}}
 function next(){const st=steps[i],m=st.valid?.(cur());if(m)return toast(m);st.save?.(cur());if(st.final)return st.final();if(i<steps.length-1){i++;show('r')}}
 function prev(){if(i>0){steps[i].save?.(cur());i--;show('l')}}
 show('n')}
const val=(sec,sel)=>sec.querySelector(sel)?.value??'';

// ---------- Router ----------
function render(){document.body.classList.remove('stepping');
 const top=document.getElementById('top');
 const hv=location.hash.slice(1).split('/')[0];
 if(hv==='intro'){top.style.display='none';return introView()}
 if(hv==='signup'&&!S.profile){top.style.display='none';return onboarding()}
 if(hv==='bot'||!S.profile){top.style.display='none';return botView()}
 top.style.display='';const [v,a]=location.hash.slice(1).split('/');
 top.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('on',b.dataset.go===(v||'home')||(!v&&b.dataset.go==='home')));
 ({day:()=>dayView(+a),reflect:()=>reflectView(a),bilan:()=>bilanView(a),final:()=>finalView(a),journal:journalView,settings:settingsView}[v]||home)();
}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
window.onhashchange=render;


// ---------- Intro: what is Consistency? ----------
const reveal=s=>(L.cjk?[s]:s.split(' ')).map((w,i)=>`<span class="rv" style="animation-delay:${i*.12}s">${esc(w)}</span>`).join(' ');
const noMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let introTimer=null;
function introView(){clearInterval(introTimer);
 const done=()=>{clearInterval(introTimer);S.introSeen=true;save();if(S.profile)go('settings');else go('signup')};
 const path=[['7',t('days'),'#3a6fd8',7],['14',t('days'),'#2f9e6a',14],['1',t('month'),'#e07b2a',27],['90',t('days'),'#7d4fc4',0]];
 const sp=L.cjk?'':' ';
 stepper([
  {t:'w',h:()=>`${langPicker()}<p class="sc rv">${t('intro1_tag')}</p><h1 class="huge">${reveal(t('intro1_word'))}</h1><p class="sc rv" style="animation-delay:.4s">${t('intro1_cap')}</p>
   <p class="lead rv" style="animation-delay:.6s">${t('intro1_lead')}</p>`},
  {t:'b',h:()=>`<p class="sc">${t('intro2_tag')}</p><h1 class="huge"><span id="cnt">0</span><span class="serif" style="font-size:.3em;font-weight:400;letter-spacing:0">${sp}${t('days')}</span></h1>
   <div class="path" style="margin-top:18px">${path.map((r,i)=>`<div class="prow rv" style="animation-delay:${.25+i*.25}s"><span class="serif"><b>${r[0]}</b>${sp}${r[1]}</span><span class="pd">${Array.from({length:Math.min(r[3]||1,14)},(_,k)=>`<i style="background:${r[2]};animation-delay:${.4+i*.25+k*.03}s"></i>`).join('')}</span></div>`).join('')}</div>
   <p class="small">${t('intro2_small')}</p>`,
   on:sec=>{const c=sec.querySelector('#cnt');if(noMotion()){c.textContent=90;return}let v=0;introTimer=setInterval(()=>{v=Math.min(90,v+3);c.textContent=v;if(v>=90)clearInterval(introTimer)},28)}},
  {t:'w',h:()=>`<p class="sc">${t('intro3_tag')}</p><h1 class="big">${reveal(t('intro3_word'))}</h1>
   <div class="steps">${['a','b','c','d'].map((k,i)=>`<div class="rv" style="animation-delay:${.3+i*.2}s"><span class="sc muted">${t('i3_'+k)}</span><span class="serif">${t('i3_'+k+'d')}</span></div>`).join('')}</div>
   <div class="face rv intro-face" style="animation-delay:1.1s">${faceSvg(50)}</div>`,
   on:sec=>{if(noMotion())return;const p=sec.querySelector('.fm');let k=0;introTimer=setInterval(()=>{k+=.05;p.setAttribute('d',mouth(50+48*Math.sin(k)))},40)}},
  {t:'b',h:()=>`<p class="sc">${t('intro4_tag')}</p><h1 class="big">${reveal(t('intro4_word'))}</h1><p class="lead rv" style="animation-delay:.8s">${t('intro4_lead')}</p>`},
  {t:'w',h:()=>`<p class="sc">${t('intro5_tag')}</p><h1 class="huge">${reveal(t('intro5_word'))}</h1><p class="sc rv" style="animation-delay:.3s">${t('intro5_cap')}</p><p class="lead rv" style="animation-delay:.5s">${t('intro5_lead')}</p>`,
   cta:S.profile?t('back_path'):t('begin'),ok:true,final:done}
 ],{onExit:done,exitLabel:t('skip')});
}

// ---------- Onboarding ----------
function onboarding(){const p={name:'',why:'',engagement:t('ob4_def'),mood:50};
 stepper([
  {t:'b',h:()=>`<p class="sc">${t('ob1_tag')}</p><h1 class="huge">${t('ob1_word')}</h1><p class="lead">${t('ob1_lead')}</p>`,cta:t('lets_go')},
  {t:'w',h:()=>`<p class="sc">${t('ob2_tag')}</p><h2 class="q">${t('ob2_q')}</h2><input class="field" id="f" autocomplete="given-name" value="${esc(p.name)}" placeholder="${t('ob2_ph')}">`,
   valid:s=>val(s,'#f').trim()?'':t('ob2_err'),save:s=>p.name=val(s,'#f').trim()},
  {t:'b',h:()=>`<p class="sc">${t('ob3_tag')}</p><h2 class="q">${t('ob3_q')}</h2><textarea class="field" id="f" placeholder="${t('ob3_ph')}">${esc(p.why)}</textarea>`,save:s=>p.why=val(s,'#f')},
  {t:'w',h:()=>`<p class="sc">${t('ob4_tag')}</p><h2 class="q">${t('ob4_q')}</h2><textarea class="field" id="f">${esc(p.engagement)}</textarea>`,save:s=>p.engagement=val(s,'#f')},
  {t:'b',h:()=>`<p class="sc">${t('ob5_tag')}</p><h2 class="q">${t('ob5_q')}</h2>${slider(p.mood,FEEL)}`,save:s=>p.mood=+val(s,'input[type=range]')},
  {t:'w',h:()=>`<p class="sc">${t('ob6_tag')}</p><h1 class="huge">${esc(p.name)||t('ob6_you')}.</h1><p class="lead">${t('ob6_lead')}</p>`,cta:t('ob6_cta'),ok:true,
   final:()=>{S.profile={name:p.name,why:p.why,engagement:p.engagement,mood:p.mood,start:today()};S.lastVisit=today();save();location.hash='home';render()}}
 ],{onExit:()=>{}});
}

// ---------- Home / path ----------
function missedCard(){const last=[...Object.values(S.days).filter(d=>d?.done).map(d=>d.date),...S.usedJokers.map(j=>j.date),S.profile.start].sort().at(-1);
 const gap=Math.round((new Date(today())-new Date(last))/864e5);
 return gap>=2&&nextDay()<=90?`<div class="card"><p class="sc">${t('miss_tag')}</p><h2 class="q" style="font-size:30px">${t('miss_q')}</h2><p class="lead">${t('miss_lead',{gap,done:doneCount(),next:nextDay()})}</p>
 ${S.jokers>0?`<button class="btn ghost" id="joker">${t('joker_btn',{n:S.jokers})}</button>`:''}</div>`:''}
const MILESTONES=[7,14,30,90];
// Current milestone: the chosen target until it is reached (then a "next" offer); legacy profiles follow their progress.
function goalOf(dc){const tg=S.profile.target;
 if(MILESTONES.includes(tg)){const next=MILESTONES.find(m=>m>tg)||90;return {n:tg,reached:dc>=tg&&tg<90,next}}
 const n=MILESTONES.find(m=>m>dc)||90;return {n,reached:false,next:MILESTONES.find(m=>m>n)||90}}
function home(){setTheme('w');const nd=nextDay(),dc=doneCount(),p=pendingPause(),jk=new Set(S.usedJokers.map(j=>j.beforeDay));
 const cta=p?`<button class="btn" onclick="go('${p.type}','${p.type==='reflect'?p.k:p.c.id}')">${p.type==='reflect'?t('cta_reflect',{level:p.l[1]}):t('cta_bilan',{name:p.c.name})}</button>`
  :nd<=90?`<button class="btn" onclick="go('day',${nd})">${t('cta_day',{n:nd})}</button>`:`<button class="btn" onclick="go('final')">${t('cta_final')}</button>`;
 const G=goalOf(dc),reached=G.reached;
 let h=`<div class="page"><section class="blk w"><p class="sc">${t('hello',{name:esc(S.profile.name)})}</p><h1 class="huge">${Math.min(dc,G.n)}<span class="serif" style="font-size:.32em;font-weight:400;letter-spacing:0"> / ${G.n}</span></h1>
  <p class="small">${G.n<90?t('goal_small',{n:G.n}):t('days_done')}</p><div class="bar"><i style="width:${Math.min(1,dc/G.n)*100}%"></i></div>
  ${G.n<90?`<p class="sc muted goal-total">${t('goal_total',{d:dc})}</p>`:''}
  ${reached?`<div class="goal-done"><p class="sc">${t('goal_done_tag')}</p><h2 class="q">${t('goal_done_word',{n:G.n})}</h2><p class="lead">${t('goal_done_lead')}</p><button class="btn ghost" id="gnext">${t('goal_next',{n:G.next})}</button></div>`:''}
  ${cta}${missedCard()}</section>`;
 CHAPTERS.forEach((c,i)=>{const th=i%2?'w':'b';h+=`<section class="blk ${th}"><p class="sc">${t('chapter_n',{n:i+1,obj:esc(c.obj)})}</p><h2 class="big">${esc(c.short)}</h2><p class="small">${esc(c.desc)}</p>`;
  c.levels.forEach(l=>{h+=`<div class="lvl sc"><span>${l[1]}</span><span>${l[2]}-${l[3]}${S.reflections[c.id+'-'+l[0]]?t('pause_done'):''}</span></div><div class="grid">`+range(l[2],l[3]).map(n=>{const d=S.days[n],done=d?.done,open=done||(n===nd&&!p);
   return `<button class="d ${done?'done':''} ${!done&&jk.has(n)&&n!==nd?'jk':''} ${open?'':'lock'} ${n===nd&&!p?'cur':''}" ${open?`onclick="go('day',${n})"`:'disabled'} aria-label="${t('day_n',{n})}">${n}</button>`}).join('')+'</div>'});
  if(c.id==='violet')h+=`<p class="lead" style="margin-top:20px">${t('violet_list')}</p>${nd>90&&!p?`<button class="btn" style="margin-top:16px" onclick="go('final')">${t('open')}</button>`:`<p class="sc muted" style="margin-top:14px">${t('unlocks')}</p>`}`;
  h+='</section>'});
 app.innerHTML=h+'</div>';window.scrollTo(0,0);
 const gn=document.getElementById('gnext');if(gn)gn.onclick=()=>{S.profile.target=G.next;save();render()};
 const j=document.getElementById('joker');if(j)j.onclick=()=>{S.jokers--;S.lastVisit=today();S.usedJokers.push({date:today(),beforeDay:nextDay()});save();toast(t('joker_used'));render()};
}

// ---------- Day flow ----------
function dayView(n){const D=DAYS[n-1];if(!D)return home();const {c,l}=levelOf(n);
 if(!(S.days[n]?.done||n===nextDay()))return go('home');
 const s=Object.assign({checks:[false,false,false],wake:'',fill:'',line:'',mood:50,energy:50},S.days[n]||{});
 if(typeof s.mood!=='number')s.mood=moodNum(s.mood)??50;
 const draft=()=>{S.days[n]=s;save()};
 const tag=x=>`<p class="sc">${t('d_tag',{n,x})}</p>`;
 const word=D.task[2]||D.task[0];
 stepper([
  {t:'w',h:()=>`${tag(esc(c.name)+' · '+l[1])}<h1 class="huge">${t('d_huge',{n})}</h1><p class="lead">${esc(D.intro)}</p>`,cta:t('begin')},
  {t:'w',h:()=>`${tag(t('d_morning'))}<h2 class="q">${t('d_energy_q')}</h2>${slider(s.energy,ENERGY)}`,save:x=>{s.energy=+val(x,'input[type=range]');draft()}},
  {t:'b',foot:'yn',h:()=>`${tag(t('d_routine',{i:1}))}<h2 class="q">${t('r1')}${t('sep_comma')}<i>${t('r1d')}</i></h2><p class="sc muted">${t('d_time')}</p><input type="time" class="field" id="wake" value="${esc(s.wake)}">`,
   save:x=>{s.wake=val(x,'#wake');draft()},onYes:()=>s.checks[0]=true,onNo:()=>s.checks[0]=false},
  {t:'w',foot:'yn',h:()=>`${tag(t('d_routine',{i:2}))}<h2 class="q">${t('d_water_q')}</h2>`,onYes:()=>s.checks[1]=true,onNo:()=>s.checks[1]=false},
  {t:'b',foot:'yn',h:()=>`${tag(t('d_routine',{i:3}))}<h1 class="big">${esc(word)}${L.cjk?'':'.'}</h1><h2 class="q" style="font-size:26px">${esc(D.task[0])}${t('sep_colon')}<i>${esc(D.task[1])}</i></h2>${D.ideas?`<p class="small">${esc(D.ideas)}</p>`:''}`,onYes:()=>s.checks[2]=true,onNo:()=>s.checks[2]=false},
  {t:'w',h:()=>`${tag(t('d_write'))}<h2 class="q">${esc(D.fill)}</h2><input class="field" id="f" value="${esc(s.fill)}" placeholder="${t('d_write_ph')}">`,save:x=>{s.fill=val(x,'#f');draft()}},
  {t:'b',h:()=>`${tag(t('d_tonight'))}<h2 class="q">${t('d_line_q')}</h2><input class="field" id="f" value="${esc(s.line)}" placeholder="${t('d_line_ph')}">`,save:x=>{s.line=val(x,'#f');draft()}},
  {t:'b',h:()=>`${tag(t('d_tonight'))}<h2 class="q">${t('d_feel_q')}</h2>${slider(s.mood,FEEL)}`,save:x=>{s.mood=+val(x,'input[type=range]');draft()}},
  {t:'w',h:()=>`${tag(t('d_word_from',{obj:esc(c.obj)}))}<p class="sc">${c.emoji}</p>${D.motto.map((m,k)=>`<p class="${k?'lead':'quote'}">${esc(m)}</p>`).join('')}`},
  {t:'b',h:()=>`<p class="sc">${n} / 90</p><h1 class="huge">${t('d_done')}</h1><p class="lead">${s.checks.some(Boolean)?t('d_done_yes'):t('d_done_no')}</p>`,
   cta:s.done?t('d_update'):t('d_finish'),ok:true,
   final:()=>{const first=!s.done;s.done=true;s.date=s.date||today();S.days[n]=s;S.lastVisit=today();save();if(first)toast(t('d_toast',{n}));go('home')}}
 ]);
}

// ---------- Question forms (reflection, review, synthesis) ----------
// A question is a string (free text) or {q, s:[5 slider labels]} (smiley slider, stored 0..100).
const FINALS=['synth','relire','next'];
function qflow(qs,store,key,label,title,sub){const v=Object.assign({},store[key]||{});const back=FINALS.includes(key)?'final':'home';
 const steps=[{t:'b',h:()=>`<p class="sc">${esc(label)}</p><h1 class="big">${esc(title)}</h1><p class="lead">${esc(sub)}</p>`,cta:t('begin')}];
 qs.forEach((q,i)=>{const sl=typeof q==='object',tx=sl?q.q:q,tg=`<p class="sc">${t('q_of',{label:esc(label),i:i+1,n:qs.length})}</p><h2 class="q">${esc(tx)}</h2>`;
  steps.push(sl?{t:i%2?'b':'w',h:()=>tg+slider(typeof v[i]==='number'?v[i]:50,q.s),save:x=>v[i]=+val(x,'input[type=range]')}
   :{t:i%2?'b':'w',h:()=>tg+`<textarea class="field" id="f">${esc(typeof v[i]==='string'?v[i]:'')}</textarea>`,save:x=>v[i]=val(x,'#f')})});
 steps.at(-1).cta=t('save_ok');steps.at(-1).ok=true;steps.at(-1).final=()=>{v.date=today();store[key]=v;save();toast(t('saved'));go(back)};
 stepper(steps,{onExit:()=>go(back)})}
function reflectView(k){const [cid,lid]=k.split('-');const c=CHAPTERS.find(x=>x.id===cid),l=c?.levels.find(x=>x[0]===lid),P=L.pauses[k];if(!l||!P)return go('home');
 qflow(P.qs,S.reflections,k,t('refl_label'),P.w,fill(P.sub,{a:l[2],b:l[3],level:l[1]}))}
function bilanView(cid){const c=CHAPTERS.find(x=>x.id===cid),B=L.bilans[cid];if(!c||!B)return go('home');qflow(B.qs,S.bilans,cid,t('bilan_label',{name:c.name}),B.w,B.sub)}

// ---------- Diploma: classic grande école parchment with a red wax seal ----------
const fmtLong=d=>new Date(typeof d==='string'&&d.length===10?d+'T12:00':d).toLocaleDateString(L.locale,{day:'numeric',month:'long',year:'numeric'});
const roman=n=>{let r='';for(const [v,s] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=v){r+=s;n-=v}return r};
function guillocheTile(){let p='';for(let j=0;j<6;j++){const ph=j*Math.PI/3;let d='';for(let i=0;i<=48;i++){const x=i*6/48,y=3.5+2.7*Math.sin(x*2*Math.PI/6+ph);d+=(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)}p+=`<path d="${d}"/>`}
 for(let j=0;j<3;j++){const ph=j*2*Math.PI/3;let d='';for(let i=0;i<=48;i++){const x=i*6/48,y=3.5+1.3*Math.sin(x*4*Math.PI/6+ph);d+=(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)}p+=`<path d="${d}" opacity=".7"/>`}return p}
function rosette(cx,cy,R){let d='';const k=11,r=R*.42;for(let i=0;i<=440;i++){const a=i/440*2*Math.PI,x=cx+(R-r)*Math.cos(a)+r*.9*Math.cos((R-r)/r*a*1.0+a*k),y=cy+(R-r)*Math.sin(a)+r*.9*Math.sin(a*k+(R-r)/r*a);d+=(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)}return `<path d="${d}"/>`}
function dipFrame(){
 const scroll=`<path d="M17 2.4C20.5 2.4 22.6 3.6 22.4 5.4C22.2 6.9 20.2 7.2 19.6 6C19.2 5.1 20 4.4 20.7 4.8"/><path d="M22.4 4.8C24 3.6 25.6 3.4 27.5 3.8" opacity=".75"/><path d="M12.5 5.6C14.6 5.4 16.4 6.4 16.6 8.2" opacity=".8"/>`;
 const corner=`<g class="orn"><path d="M2.4 2.4H17M2.4 2.4V17" stroke-width=".6"/><path d="M2.4 13.2A10.8 10.8 0 0 0 13.2 2.4" /><path d="M2.4 9A6.6 6.6 0 0 0 9 2.4" opacity=".8"/>
  ${scroll}<g transform="matrix(0 1 1 0 0 0)">${scroll}</g>
  <circle cx="5.3" cy="5.3" r="1.1" class="fl"/><circle cx="5.3" cy="5.3" r="2.2" fill="none" stroke="#7a5b22" stroke-width=".3"/>
  <path d="M10.4 8.6L11.6 10.4L10.4 12.2L9.2 10.4Z" transform="rotate(-45 10.4 10.4)" class="fl"/></g>`;
 const C=(x,y,sx,sy)=>`<g transform="translate(${x} ${y}) scale(${sx} ${sy})">${corner}</g>`;
 const band=(x,y,w,rot)=>`<g transform="translate(${x} ${y})${rot?' rotate(90)':''}"><rect width="${w}" height="7" fill="url(#dGu)"/></g>`;
 const rose=(x,y)=>`<g transform="translate(${x} ${y})"><rect x="-3.5" y="-3.5" width="7" height="7" fill="#f6eed6"/><g class="gu">${rosette(0,0,3.1)}</g><circle r=".7" class="fl"/></g>`;
 return `<svg class="dip-frame" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">
 <defs>
  <radialGradient id="dPaper" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#fdf9ec"/><stop offset=".65" stop-color="#f6edd3"/><stop offset="1" stop-color="#e9d8ae"/></radialGradient>
  <filter id="dGrain" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".9 .6" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .34  0 0 0 0 .16  0 0 0 -1.1 .95"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="dBlot" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .4  0 0 0 0 .18  0 0 0 -2.4 1.25"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <pattern id="dGu" width="6" height="7" patternUnits="userSpaceOnUse"><g class="gu">${guillocheTile()}</g></pattern>
 </defs>
 <rect width="210" height="297" fill="url(#dPaper)"/>
 <rect width="210" height="297" filter="url(#dBlot)" opacity=".35"/>
 <rect width="210" height="297" filter="url(#dGrain)" opacity=".22"/>
 <g class="ln"><rect x="6" y="6" width="198" height="285" stroke-width="1.1"/><rect x="8" y="8" width="194" height="281" stroke-width=".3"/>
 <rect x="10" y="10" width="190" height="277" stroke-width=".35"/><rect x="17" y="17" width="176" height="263" stroke-width=".35"/></g>
 ${band(10,10,190)}${band(10,280,190)}${band(17,10,277,1)}${band(200,10,277,1)}
 ${rose(13.5,13.5)}${rose(196.5,13.5)}${rose(13.5,283.5)}${rose(196.5,283.5)}
 <g class="ln"><rect x="20" y="20" width="170" height="257" stroke-width=".6"/><rect x="21.6" y="21.6" width="166.8" height="253.8" stroke-width=".2"/></g>
 ${C(21.6,21.6,1,1)}${C(188.4,21.6,-1,1)}${C(21.6,275.4,1,-1)}${C(188.4,275.4,-1,-1)}
 </svg>`}
function waxSeal(year){
 let d='';const N=90;for(let i=0;i<=N;i++){const a=i/N*2*Math.PI,r=30+1.5*Math.sin(5*a+1)+1.1*Math.sin(9*a+2.3)+.8*Math.sin(14*a+.4)+.5*Math.sin(23*a+1.7);d+=(i?'L':'M')+(60+r*Math.cos(a)).toFixed(2)+' '+(52+r*Math.sin(a)).toFixed(2)}d+='Z';
 const ring=`CONSISTENCY ✦ ${roman(year)} ✦ `;
 return `<svg class="dip-seal" viewBox="0 0 120 122" role="img" aria-label="Consistency">
 <defs>
  <linearGradient id="sRib" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4f070c"/><stop offset=".35" stop-color="#9c1820"/><stop offset=".55" stop-color="#c22a31"/><stop offset="1" stop-color="#5a080e"/></linearGradient>
  <radialGradient id="sH" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8c8c8c"/><stop offset=".64" stop-color="#8c8c8c"/><stop offset=".77" stop-color="#c8c8c8"/><stop offset=".88" stop-color="#ababab"/><stop offset=".96" stop-color="#707070"/><stop offset="1" stop-color="#4a4a4a"/></radialGradient>
  <filter id="sWax" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
   <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="h"/>
   <feTurbulence type="fractalNoise" baseFrequency=".18" numOctaves="2" seed="3" result="tn"/><feColorMatrix in="tn" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .09 0 0 0 0" result="tna"/><feComposite in="h" in2="tna" operator="arithmetic" k2="1" k3="1" k4="-.04" result="h2"/><feGaussianBlur in="h2" stdDeviation=".6" result="hb"/>
   <feDiffuseLighting in="hb" surfaceScale="4.5" diffuseConstant="1.05" lighting-color="#fff" result="dif"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting>
   <feSpecularLighting in="hb" surfaceScale="4.5" specularConstant=".6" specularExponent="30" lighting-color="#ffd8cc" result="spec"><feDistantLight azimuth="225" elevation="40"/></feSpecularLighting>
   <feFlood flood-color="#b3151d"/><feComposite in2="dif" operator="arithmetic" k1="1.18" k4="-.02" result="lit"/>
   <feComposite in="lit" in2="spec" operator="arithmetic" k2="1" k3=".55" result="all"/>
   <feComposite in="all" in2="SourceAlpha" operator="in" result="wax"/>
   <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="sh"/><feOffset in="sh" dx="1.2" dy="1.8" result="sho"/>
   <feColorMatrix in="sho" values="0 0 0 0 .25  0 0 0 0 .08  0 0 0 0 .03  0 0 0 .42 0" result="shc"/>
   <feMerge><feMergeNode in="shc"/><feMergeNode in="wax"/></feMerge>
  </filter>
  <filter id="sRibF" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx=".8" dy="1.2" stdDeviation="1" flood-color="#3a1a05" flood-opacity=".35"/></filter>
  <path id="sRing" d="M60 52m-16.6 0a16.6 16.6 0 1 1 33.2 0a16.6 16.6 0 1 1 -33.2 0"/>
 </defs>
 <g filter="url(#sRibF)">
  <path d="M53 58L66 62L47 118L42.5 110L34 115.5Z" fill="url(#sRib)"/><path d="M53 58L59.5 60L43 113L42.5 110Z" fill="#fff" opacity=".12"/>
  <path d="M67 58L54 62L73 118L77.5 110L86 115.5Z" fill="url(#sRib)"/><path d="M67 58L72 59.5L85 114L77.5 110Z" fill="#000" opacity=".15"/>
 </g>
 <g filter="url(#sWax)">
  <path d="${d}" fill="url(#sH)"/>
  <circle cx="60" cy="52" r="22.4" fill="#555"/>
  <circle cx="60" cy="52" r="22.4" fill="none" stroke="#9a9a9a" stroke-width=".7"/>
  <circle cx="60" cy="52" r="14.6" fill="none" stroke="#a0a0a0" stroke-width=".55"/>
  <text font-family="'Playfair Display',Georgia,serif" font-weight="700" font-size="5.4" fill="#ababab" letter-spacing=".6"><textPath href="#sRing" textLength="102" lengthAdjust="spacing">${ring}</textPath></text>
  <circle cx="60" cy="52" r="8.4" fill="none" stroke="#b0b0b0" stroke-width="2"/>
  <circle cx="56.9" cy="49.6" r="1.25" fill="#b0b0b0"/><circle cx="63.1" cy="49.6" r="1.25" fill="#b0b0b0"/>
  <path d="M55.6 54.2Q60 58.6 64.4 54.2" fill="none" stroke="#b0b0b0" stroke-width="1.5" stroke-linecap="round"/>
 </g>
 </svg>`}
function diplomaHtml(name,start,end){const nm=String(name||'').trim()||t('ob6_you'),a=fmtLong(start),b=fmtLong(end),yr=new Date(end+'T12:00').getFullYear()||new Date().getFullYear();
 const rule=`<svg class="dip-rule" viewBox="0 0 120 6" aria-hidden="true"><path d="M2 3H50M70 3H118" stroke="#8b6b2e" stroke-width=".5"/><path d="M60 .6L62.4 3L60 5.4L57.6 3Z" fill="#8b6b2e"/><circle cx="53.5" cy="3" r=".9" fill="#8b6b2e"/><circle cx="66.5" cy="3" r=".9" fill="#8b6b2e"/></svg>`;
 return `<div class="dip-sheet" id="dipSheet">${dipFrame()}
 <div class="dip-in">
  <p class="dip-motto">Dies post diem</p>
  <p class="dip-of">${t('dip_of')}</p>
  <h1 class="dip-title">Consistency</h1>
  ${rule}
  <p class="dip-aw">${t('dip_awarded')}</p>
  <h2 class="dip-nm" id="dipName"><span>${esc(nm)}</span></h2>
  <p class="dip-for">${t('dip_for2')}</p>
  <p class="dip-span dip-fit" data-f="3.9">${t('dip_span',{a,b})}</p>
  <p class="dip-men dip-fit" data-f="3">${t('dip_mention')}</p>
  <p class="dip-iss">${t('dip_issued',{d:b})}<sup>*</sup></p>
  <div class="dip-sigs"><div class="dip-sig"><svg viewBox="0 0 60 16" class="dip-sign" aria-hidden="true"><path d="M3 11C6 4 9 3 9.5 6S7 13 9 12.5 14 6 16 7.5 15 12 17.5 11.5 22 7 24 8.6 23 12.6 26 11.6C29 10.6 31 6.5 33.5 7.6S32 12.6 35.5 12C40 11 44 8 47 8.8S50 11.5 57 9.6" fill="none" stroke="#1f2a44" stroke-width=".9" stroke-linecap="round"/></svg><span class="dip-line"></span><p>${t('dip_sig1')}</p></div>
   <div class="dip-sig"><span class="dip-sign"></span><span class="dip-line"></span><p>${t('dip_sig2')}</p></div></div>
  <p class="dip-note">${t('dip_note')}</p>
 </div>
 ${waxSeal(yr)}
 </div>`}
function fitDipName(){document.querySelectorAll('.dip-fit').forEach(p=>{let f=parseFloat(p.dataset.f);p.style.fontSize=f+'cqw';while(p.scrollWidth>p.clientWidth+1&&f>2.6){f-=.1;p.style.fontSize=f+'cqw'}});const el=document.getElementById('dipName');if(!el)return;const s=el.firstElementChild;let f=8.6;el.style.fontSize=f+'cqw';
 while(s.offsetWidth>el.clientWidth&&f>4.2){f-=.2;el.style.fontSize=f+'cqw'}if(s.offsetWidth>el.clientWidth)el.classList.add('wrap')}

// ---------- The 90 days ----------
function finalView(step){if(nextDay()<=90)return go('home');
 if(FINALS.includes(step)){const F=L.finals[step];return qflow(F.qs,S,step,F.label,F.w,F.sub)}
 if(step==='letter')return stepper([{t:'b',h:()=>`<p class="sc">${t('letter_tag')}</p><h2 class="q">${t('letter_q')}</h2><p class="small">${t('letter_lead')}</p><textarea class="field" id="f" style="min-height:240px" placeholder="${t('letter_ph')}">${esc(S.letter)}</textarea>`,
  cta:t('save_ok'),ok:true,final:()=>{S.letter=val(app,'#f');save();toast(t('saved'));go('final')}}],{onExit:()=>go('final')});
 if(step==='diplome'){setTheme('w');const start=S.profile.start||S.days[1]?.date||today(),end=S.days[90]?.date||today();
  app.innerHTML=`<div class="page dip-page"><section class="blk w">${diplomaHtml(S.profile.name,start,end)}
  <div class="dip-actions"><button class="btn" onclick="window.print()">${t('print')}</button><button class="btn ghost" style="margin-top:10px" onclick="go('final')">${t('back')}</button></div></section></div>`;
  fitDipName();(document.fonts?.ready||Promise.resolve()).then(fitDipName);window.scrollTo(0,0);return}
 const c4=CHAPTERS[3];
 setTheme('b');app.innerHTML=`<div class="page"><section class="blk b"><p class="sc">${t('f_tag',{obj:esc(c4.obj)})}</p><h1 class="huge">90.</h1><p class="lead" style="margin-top:22px">${esc(c4.desc)}</p><p class="small">${t('f_story')}</p>
  <div style="margin-top:24px"><button class="btn ghost" onclick="go('final','synth')">${t('f_synth')} ${S.synth?.date?'✓':'→'}</button></div>
  <button class="btn ghost" style="margin-top:10px" onclick="go('final','relire')">${t('f_relire')} ${S.relire?.date?'✓':'→'}</button>
  <button class="btn ghost" style="margin-top:10px" onclick="go('journal')">${t('f_reread')}</button>
  <button class="btn ghost" style="margin-top:10px" onclick="go('final','next')">${t('f_next')} ${S.next?.date?'✓':'→'}</button>
  <button class="btn ghost" style="margin-top:10px" onclick="go('final','letter')">${t('f_letter')} ${S.letter?'✓':'→'}</button>
  <button class="btn" style="margin-top:10px" onclick="go('final','diplome')">${t('f_dip')}</button>
  <div class="card"><p class="sc">${t('f_why')}</p><p class="quote" style="font-size:20px">${esc(S.profile.why)||'…'}</p><p class="sc" style="margin-top:18px">${t('f_commit')}</p><p class="lead">${esc(S.profile.engagement)}</p></div></section></div>`}

// ---------- Journal ----------
function journalView(){setTheme('w');const ds=Object.entries(S.days).filter(([k,d])=>d?.done).sort((a,b)=>a[0]-b[0]);
 const filled=new Set(ds.map(([,d])=>d.date)),jk=new Set(S.usedJokers.map(j=>j.date));const now=new Date(),y=now.getFullYear(),m=now.getMonth();
 const wd=Array.from({length:7},(_,i)=>new Date(2024,0,1+i).toLocaleDateString(L.locale,{weekday:'narrow'}));
 const first=(new Date(y,m,1).getDay()+6)%7,len=new Date(y,m+1,0).getDate();let cal=wd.map(x=>`<div class="sc" style="color:var(--mut)">${x}</div>`).join('');
 for(let i=0;i<first;i++)cal+='<span></span>';
 for(let d=1;d<=len;d++){const iso=new Date(Date.UTC(y,m,d)).toISOString().slice(0,10);cal+=`<div class="${filled.has(iso)?'on':jk.has(iso)?'jk':''} ${iso===today()?'td':''}">${d}</div>`}
 app.innerHTML=`<div class="page"><section class="blk w"><p class="sc">${t('j_tag')}</p><h1 class="big">${t('j_title')}</h1><p class="sc" style="margin-top:26px">${now.toLocaleDateString(L.locale,{month:'long',year:'numeric'})}</p><div class="cal">${cal}</div>
 <p class="small" style="margin-top:12px"><span style="color:var(--ok)">●</span> ${t('j_done')} &nbsp; <span style="color:var(--no)">●</span> ${t('j_joker')}</p></section>
 <section class="blk b">${ds.length?ds.map(([n,d])=>`<button class="entry" onclick="go('day',${n})"><span class="sc muted">${t('day_n',{n})} · ${fmt(d.date)}</span><br><span class="serif">${esc(d.line||d.fill||'…')}</span>
  ${typeof d.mood==='number'?`<span style="float:right">${faceSvg(d.mood,'mini')}</span>`:''}</button>`).join(''):`<h2 class="q">${t('j_empty')}</h2>`}</section></div>`;window.scrollTo(0,0)}

// ---------- Settings ----------
function settingsView(){setTheme('b');const st=S.settings;
 app.innerHTML=`<div class="page"><section class="blk b"><p class="sc">${t('s_tag')}</p><h1 class="big">${t('s_word')}</h1>
 <p class="sc" style="margin-top:30px">${t('language')}</p>${langPicker()}
 <p class="sc" style="margin-top:30px">${t('s_rem')}</p><div class="toggle"><span class="serif" style="font-size:22px">${t('s_morning')}</span><input type="time" class="field" id="mo" value="${st.morning}"></div>
 <div class="toggle"><span class="serif" style="font-size:22px">${t('s_evening')}</span><input type="time" class="field" id="ev" value="${st.evening}"></div>
 <label class="toggle"><span>${t('s_notif')}<br><span class="small">${t('s_notif_d')}</span></span><input type="checkbox" id="nt" ${st.notif?'checked':''} style="width:24px;height:24px;accent-color:#1fa463"></label>
 <button class="btn" id="sv" style="margin-top:20px">${t('s_save')}</button></section>
 <section class="blk w"><p class="sc">${t('s_jokers')}</p><h2 class="big">${S.jokers}</h2><p class="lead">${t('s_jokers_d')}</p></section>
 <section class="blk w"><p class="sc">${t('s_about')}</p><button class="btn ghost" onclick="go('intro')">${t('s_what')}</button><button class="btn ghost" style="margin-top:10px" onclick="botReset();go('bot')">${t('bot_replay')}</button></section>
 <section class="blk b"><p class="sc">${t('s_restart')}</p><p class="lead">${t('s_restart_d')}</p><button class="btn no" id="rs" style="margin-top:16px">${t('s_restart_btn')}</button></section></div>`;window.scrollTo(0,0);
 document.getElementById('sv').onclick=async()=>{st.morning=val(app,'#mo');st.evening=val(app,'#ev');st.notif=document.getElementById('nt').checked;
  if(st.notif&&'Notification'in window){const p=await Notification.requestPermission();if(p!=='granted'){st.notif=false;toast(t('s_denied'))}}else if(st.notif){st.notif=false;toast(t('s_na'))}
  save();toast(t('saved'))};
 document.getElementById('rs').onclick=()=>{if(confirm(t('s_confirm'))){const lang=S.lang;localStorage.removeItem(KEY);S=fresh();S.lang=lang;S.introSeen=true;save();location.hash='';render()}};
}

// Reminders while the app is open
let lastNotif='';setInterval(()=>{const st=S.settings;if(!st?.notif||!S.profile||!('Notification'in window)||Notification.permission!=='granted')return;
 const hm=new Date().toTimeString().slice(0,5),k=today()+hm;if((hm===st.morning||hm===st.evening)&&k!==lastNotif){lastNotif=k;
 new Notification('Consistency',{body:hm===st.morning?t('n_morning',{n:nextDay()}):t('n_evening'),icon:'icons/icon.svg'})}},60000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
// Demo: ?demo=1 pre-fills a profile and 3 days
if(location.search.includes('demo=1')&&!S.profile){S.profile={name:'Alexandre',why:'Find a rhythm again',engagement:'Come back every day',mood:68,start:today()};
 [1,2,3].forEach(n=>S.days[n]={checks:[true,true,n!==2],wake:'07:30',fill:'',line:['A good day','Slow start, but I did it','Felt lighter'][n-1],mood:[68,45,85][n-1],energy:60,done:true,date:today()});save();}
render();
