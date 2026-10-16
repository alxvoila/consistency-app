'use strict';
// Consistency v3 — one question per screen, black & white, smiley sliders.
const KEY='consistency-v1', app=document.getElementById('app');
const MOOD_MAP={'😊':85,'🙂':68,'😐':50,'😕':25};
const FEEL=['Rough','Meh','Okay','Good','Great'], ENERGY=['Drained','Low','Okay','Good','Charged'];
let S=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||null}catch(e){return null}}
function fresh(){return {profile:null,days:{},reflections:{},bilans:{},synth:{},letter:'',jokers:3,usedJokers:[],settings:{morning:'08:00',evening:'21:00',notif:false},lastVisit:null}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
if(!S)S=fresh();
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
const today=()=>new Date().toISOString().slice(0,10);
const fmt=d=>new Date(typeof d==='string'&&d.length===10?d+'T12:00':d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
function go(v,arg){location.hash=v+(arg!=null?'/'+arg:'')}
window.go=go;
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
function setTheme(t){document.body.classList.remove('w','b');document.body.classList.add(t);document.querySelector('meta[name=theme-color]').content=t==='b'?'#000000':'#ffffff'}

// ---------- Smiley ----------
const mouth=v=>`M60 135 Q100 ${(135+(v-50)*0.9).toFixed(1)} 140 135`;
const labOf=(v,L)=>L[Math.min(4,Math.floor(v/20))];
const faceSvg=(v,cls='')=>`<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" class="fc"/><circle cx="68" cy="80" r="11" class="ft"/><circle cx="132" cy="80" r="11" class="ft"/><path class="fm" d="${mouth(v)}"/></svg>`;
function slider(v,L){v=v==null?50:v;return `<div class="slider"><div class="face">${faceSvg(v)}<div class="lab">${labOf(v,L)}</div></div>
 <input type="range" min="0" max="100" value="${v}" aria-label="${L[0]} to ${L[4]}" data-l="${L.join('|')}"><div class="ends sc"><span>${L[0]}</span><span>${L[4]}</span></div></div>`}
function wireSliders(root){root.querySelectorAll('.slider input').forEach(r=>{const w=r.closest('.slider'),p=w.querySelector('.fm'),lb=w.querySelector('.lab'),L=r.dataset.l.split('|');
 r.addEventListener('input',()=>{p.setAttribute('d',mouth(+r.value));lb.textContent=labOf(+r.value,L)})})}

// ---------- Stepper ----------
// step: {t:'w'|'b', h:()=>html, save?(sec), valid?(sec)->msg, foot?:'yn'|'none', cta?, onYes/onNo}
function stepper(steps,{start=+(new URLSearchParams(location.search).get('step')||0),onExit=()=>go('home'),exitLabel=''}={}){let i=start;document.body.classList.add('stepping');
 function show(dir){const st=steps[i];setTheme(st.t);
  const dots=steps.length>1?`<div class="dots">${steps.map((_,k)=>`<i class="${k===i?'on':k<i?'past':''}"></i>`).join('')}</div>`:'<span></span>';
  const back=i>0?`<button class="btn ghost back" data-a="back" aria-label="Back">←</button>`:'';
  const foot=st.foot==='none'?'':st.foot==='yn'?`<div class="foot">${back}<button class="btn no" data-a="no">Skipped</button><button class="btn ok" data-a="yes">Done ✓</button></div>`
   :`<div class="foot">${back}<button class="btn ${st.ok?'ok':''}" data-a="next">${st.cta||'Next →'}</button></div>`;
  app.innerHTML=`<section class="s ${st.t} in-${dir}"><div class="top">${dots}${exitLabel?`<button class="x sc" data-a="exit" style="font-size:11px">${exitLabel}</button>`:`<button class="x" data-a="exit" aria-label="Close">✕</button>`}</div><div class="body">${st.h()}</div>${foot}</section>`;
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
 if(hv==='intro'||(!S.profile&&!S.introSeen)){top.style.display='none';return introView()}
 if(!S.profile){top.style.display='none';return onboarding()}
 top.style.display='';const [v,a]=location.hash.slice(1).split('/');
 top.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('on',b.dataset.go===(v||'home')||(!v&&b.dataset.go==='home')));
 ({day:()=>dayView(+a),reflect:()=>reflectView(a),bilan:()=>bilanView(a),final:()=>finalView(a),journal:journalView,settings:settingsView}[v]||home)();
}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
window.onhashchange=render;


// ---------- Intro: what is Consistency? ----------
const reveal=t=>t.split(' ').map((w,i)=>`<span class="rv" style="animation-delay:${i*.12}s">${esc(w)}</span>`).join(' ');
const noMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let introTimer=null;
function introView(){clearInterval(introTimer);
 const done=()=>{clearInterval(introTimer);S.introSeen=true;save();if(S.profile)go('settings');else{location.hash='';render()}};
 const path=[['7','days','#3a6fd8',7],['14','days','#2f9e6a',14],['1','month','#e07b2a',27],['90','days','#7d4fc4',0]];
 stepper([
  {t:'w',h:()=>`<p class="sc rv">A 90-day notebook</p><h1 class="huge">${reveal('Come back.')}</h1><p class="sc rv" style="animation-delay:.4s">Not more. Just back.</p>
   <p class="lead rv" style="animation-delay:.6s">Consistency helps you build a steady rhythm, a few minutes a day. It doesn't ask you to be perfect — only to return, one day after another.</p>`},
  {t:'b',h:()=>`<p class="sc">The path · it grows as you do</p><h1 class="huge"><span id="cnt">0</span><span class="serif" style="font-size:.3em;font-weight:400;letter-spacing:0"> days</span></h1>
   <div class="path" style="margin-top:18px">${path.map((r,i)=>`<div class="prow rv" style="animation-delay:${.25+i*.25}s"><span class="serif"><b>${r[0]}</b> ${r[1]}</span><span class="pd">${Array.from({length:Math.min(r[3]||1,14)},(_,k)=>`<i style="background:${r[2]};animation-delay:${.4+i*.25+k*.03}s"></i>`).join('')}</span></div>`).join('')}</div>
   <p class="small">7 days, then 14, then a month — each in levels that grow, from Basic to Intense. Then a pause to look back at your 90 days.</p>`,
   on:sec=>{const c=sec.querySelector('#cnt');if(noMotion()){c.textContent=90;return}let v=0;introTimer=setInterval(()=>{v=Math.min(90,v+3);c.textContent=v;if(v>=90)clearInterval(introTimer)},28)}},
  {t:'w',h:()=>`<p class="sc">How a day works</p><h1 class="big">${reveal('One page.')}</h1>
   <div class="steps"><div class="rv" style="animation-delay:.3s"><span class="sc muted">Morning</span><span class="serif">How's your energy?</span></div>
   <div class="rv" style="animation-delay:.5s"><span class="sc muted">Three tiny actions</span><span class="serif">Get up · drink water · one small task</span></div>
   <div class="rv" style="animation-delay:.7s"><span class="sc muted">One line</span><span class="serif">Write it if you feel like it</span></div>
   <div class="rv" style="animation-delay:.9s"><span class="sc muted">Tonight</span><span class="serif">Slide to say how it felt</span></div></div>
   <div class="face rv intro-face" style="animation-delay:1.1s">${faceSvg(50)}</div>`,
   on:sec=>{if(noMotion())return;const p=sec.querySelector('.fm');let t=0;introTimer=setInterval(()=>{t+=.05;p.setAttribute('d',mouth(50+48*Math.sin(t)))},40)}},
  {t:'b',h:()=>`<p class="sc">The one rule</p><h1 class="big">${reveal('A missed day erases nothing.')}</h1><p class="lead rv" style="animation-delay:.8s">Just turn the page and pick it back up. Your days stay counted. Three jokers protect your thread when life gets in the way.</p>`},
  {t:'w',h:()=>`<p class="sc">Start any day of the year</p><h1 class="huge">${reveal('Today.')}</h1><p class="sc rv" style="animation-delay:.3s">Your day 1 is today</p><p class="lead rv" style="animation-delay:.5s">No calendar to wait for, no Monday to start on. Just a few minutes — we begin here.</p>`,
   cta:S.profile?'Back to my path →':'Begin →',ok:true,final:done}
 ],{onExit:done,exitLabel:'Skip'});
}

// ---------- Onboarding ----------
function onboarding(){const p={name:'',why:'',engagement:'I commit to coming back every day, even for a single box. A missed day erases nothing.',mood:50};
 stepper([
  {t:'b',h:()=>`<p class="sc">Welcome to Consistency</p><h1 class="huge">Begin.</h1><p class="lead">A 90-day workbook you can start any day of the year. Your day 1 is today.</p>`,cta:"Let's go →"},
  {t:'w',h:()=>`<p class="sc">01 · About you</p><h2 class="q">What's your <i>first name?</i></h2><input class="field" id="f" autocomplete="given-name" value="${esc(p.name)}" placeholder="Your first name">`,
   valid:s=>val(s,'#f').trim()?'':'Just tell me your first name 🙂',save:s=>p.name=val(s,'#f').trim()},
  {t:'b',h:()=>`<p class="sc">02 · Your why</p><h2 class="q">Why are you opening <i>this workbook?</i></h2><textarea class="field" id="f" placeholder="What brings me here…">${esc(p.why)}</textarea>`,save:s=>p.why=val(s,'#f')},
  {t:'w',h:()=>`<p class="sc">03 · Commitment</p><h2 class="q">My promise <i>to myself.</i></h2><textarea class="field" id="f">${esc(p.engagement)}</textarea>`,save:s=>p.engagement=val(s,'#f')},
  {t:'b',h:()=>`<p class="sc">04 · Right now</p><h2 class="q">How do you <i>feel</i> today?</h2>${slider(p.mood,FEEL)}`,save:s=>p.mood=+val(s,'input[type=range]')},
  {t:'w',h:()=>`<p class="sc">Day 1 starts now</p><h1 class="huge">${esc(p.name)||'You'}.</h1><p class="lead">One small step a day. A missed day erases nothing.</p>`,cta:'Start my path ✓',ok:true,
   final:()=>{S.profile={name:p.name,why:p.why,engagement:p.engagement,mood:p.mood,start:today()};S.lastVisit=today();save();location.hash='home';render()}}
 ],{onExit:()=>{}});
}

// ---------- Home / path ----------
function missedCard(){const last=[...Object.values(S.days).filter(d=>d?.done).map(d=>d.date),...S.usedJokers.map(j=>j.date),S.profile.start].sort().at(-1);
 const gap=Math.round((new Date(today())-new Date(last))/864e5);
 return gap>=2&&nextDay()<=90?`<div class="card"><p class="sc">Pick it back up</p><h2 class="q" style="font-size:30px">Nothing is <i>lost.</i></h2><p class="lead">It's been ${gap} days. Your ${doneCount()} days are still here. We simply pick up again at day ${nextDay()}.</p>
 ${S.jokers>0?`<button class="btn ghost" id="joker">Use a joker · ${S.jokers} left</button>`:''}</div>`:''}
function home(){setTheme('w');const nd=nextDay(),dc=doneCount(),p=pendingPause(),jk=new Set(S.usedJokers.map(j=>j.beforeDay));
 const cta=p?`<button class="btn" onclick="go('${p.type}','${p.type==='reflect'?p.k:p.c.id}')">${p.type==='reflect'?'Reflection break · '+p.l[1]:'Chapter review · '+p.c.name} →</button>`
  :nd<=90?`<button class="btn" onclick="go('day',${nd})">Day ${nd} →</button>`:`<button class="btn" onclick="go('final')">The 90 days →</button>`;
 let h=`<div class="page"><section class="blk w"><p class="sc">Hello ${esc(S.profile.name)}</p><h1 class="huge">${dc}<span class="serif" style="font-size:.32em;font-weight:400;letter-spacing:0"> / 90</span></h1>
  <p class="small">days completed — at your own pace</p><div class="bar"><i style="width:${dc/90*100}%"></i></div>${cta}${missedCard()}</section>`;
 CHAPTERS.forEach((c,i)=>{const t=i%2?'w':'b';h+=`<section class="blk ${t}"><p class="sc">Chapter ${i+1} · ${esc(c.obj)}</p><h2 class="big">${esc(c.name.replace(/^The /,''))}</h2><p class="small">${esc(c.desc)}</p>`;
  c.levels.forEach(l=>{h+=`<div class="lvl sc"><span>${l[1]}</span><span>${l[2]}–${l[3]}${S.reflections[c.id+'-'+l[0]]?' · pause ✓':''}</span></div><div class="grid">`+range(l[2],l[3]).map(n=>{const d=S.days[n],done=d?.done,open=done||(n===nd&&!p);
   return `<button class="d ${done?'done':''} ${!done&&jk.has(n)&&n!==nd?'jk':''} ${open?'':'lock'} ${n===nd&&!p?'cur':''}" ${open?`onclick="go('day',${n})"`:'disabled'} aria-label="Day ${n}">${n}</button>`}).join('')+'</div>'});
  if(c.id==='violet')h+=`<p class="lead" style="margin-top:20px">Synthesis · rereading · letter to myself · diploma</p>${nd>90&&!p?`<button class="btn" style="margin-top:16px" onclick="go('final')">Open →</button>`:'<p class="sc muted" style="margin-top:14px">Unlocks after day 90</p>'}`;
  h+='</section>'});
 app.innerHTML=h+'</div>';window.scrollTo(0,0);
 const j=document.getElementById('joker');if(j)j.onclick=()=>{S.jokers--;S.lastVisit=today();S.usedJokers.push({date:today(),beforeDay:nextDay()});save();toast('Joker used · your thread continues, nothing lost.');render()};
}

// ---------- Day flow ----------
function dayView(n){const D=DAYS[n-1];if(!D)return home();const {c,l}=levelOf(n);
 if(!(S.days[n]?.done||n===nextDay()))return go('home');
 const s=Object.assign({checks:[false,false,false],wake:'',fill:'',line:'',mood:50,energy:50},S.days[n]||{});
 if(typeof s.mood!=='number')s.mood=moodNum(s.mood)??50;
 const draft=()=>{S.days[n]=s;save()};
 const ph=D.placeholder?'<span class="ph">placeholder content</span>':'';
 const tag=(x)=>`<p class="sc">Day ${n} · ${x}</p>`;
 const items=[['I get up','and put both feet on the floor.'],['I drink a big glass of water','before coffee, before my phone.'],D.task];
 const vb=(D.task[0].replace(/^I\s+/,'').split(/\s+/)[0]||'Today').replace(/[^\w']/g,''),theWord=vb.charAt(0).toUpperCase()+vb.slice(1);
 stepper([
  {t:'w',h:()=>`${tag(esc(c.name)+' · '+l[1])}${ph}<h1 class="huge">Day<br>${n}.</h1><p class="lead">${esc(D.intro)}</p>`,cta:'Begin →'},
  {t:'w',h:()=>`${tag('Morning')}<h2 class="q">How's your energy this <i>morning?</i></h2>${slider(s.energy,ENERGY)}`,save:x=>{s.energy=+val(x,'input[type=range]');draft()}},
  {t:'b',foot:'yn',h:()=>`${tag('Routine · 1 of 3')}<h2 class="q">${items[0][0]} — <i>${items[0][1]}</i></h2><p class="sc muted">What time?</p><input type="time" class="field" id="wake" value="${esc(s.wake)}">`,
   save:x=>{s.wake=val(x,'#wake');draft()},onYes:()=>s.checks[0]=true,onNo:()=>s.checks[0]=false},
  {t:'w',foot:'yn',h:()=>`${tag('Routine · 2 of 3')}<h2 class="q">Did you drink a big glass of <i>water</i> — before your phone?</h2>`,onYes:()=>s.checks[1]=true,onNo:()=>s.checks[1]=false},
  {t:'b',foot:'yn',h:()=>`${tag('Routine · 3 of 3')}<h1 class="big">${esc(theWord)}.</h1><h2 class="q" style="font-size:26px">${esc(D.task[0])} — <i>${esc(D.task[1])}</i></h2>${D.ideas?`<p class="small">${esc(D.ideas)}</p>`:''}`,onYes:()=>s.checks[2]=true,onNo:()=>s.checks[2]=false},
  {t:'w',h:()=>`${tag('Write one line')}<h2 class="q">${esc(D.fill)}</h2><input class="field" id="f" value="${esc(s.fill)}" placeholder="Just a few words…">`,save:x=>{s.fill=val(x,'#f');draft()}},
  {t:'b',h:()=>`${tag('Tonight')}<h2 class="q">In one line, how <i>did I feel</i> today?</h2><input class="field" id="f" value="${esc(s.line)}" placeholder="One line is enough…">`,save:x=>{s.line=val(x,'#f');draft()}},
  {t:'b',h:()=>`${tag('Tonight')}<h2 class="q">How did today <i>feel?</i></h2>${slider(s.mood,FEEL)}`,save:x=>{s.mood=+val(x,'input[type=range]');draft()}},
  {t:'w',h:()=>`${tag('A word from '+esc(c.obj))}<p class="sc">${c.emoji}</p>${D.motto.map((m,k)=>`<p class="${k?'lead':'quote'}">${esc(m)}</p>`).join('')}`},
  {t:'b',h:()=>`<p class="sc">${n} / 90</p><h1 class="huge">Done.</h1><p class="lead">${s.checks.some(Boolean)?'Well done. Tomorrow the shadow moves forward one step. So do you.':"You showed up, and that's what counts."}</p>`,
   cta:s.done?'Update my page ✓':'I finished my page ✓',ok:true,
   final:()=>{const first=!s.done;s.done=true;s.date=s.date||today();S.days[n]=s;S.lastVisit=today();save();if(first)toast(`Day ${n} done ✓`);go('home')}}
 ]);
}

// ---------- Question forms (reflection, review, synthesis) ----------
function qflow(qs,store,key,label,title,sub){const v=Object.assign({},store[key]||{});
 const steps=[{t:'b',h:()=>`<p class="sc">${esc(label)}</p><h1 class="big">${esc(title)}</h1><p class="lead">${esc(sub)}</p>`,cta:'Begin →'}];
 qs.forEach((q,i)=>steps.push({t:i%2?'b':'w',h:()=>`<p class="sc">${esc(label)} · ${i+1} of ${qs.length}</p><h2 class="q">${esc(q)}</h2><textarea class="field" id="f">${esc(v[i]||'')}</textarea>`,save:x=>v[i]=val(x,'#f')}));
 steps.at(-1).cta='Save ✓';steps.at(-1).ok=true;steps.at(-1).final=()=>{v.date=today();store[key]=v;save();toast('Saved ✓');go(key==='synth'?'final':'home')};
 stepper(steps,{onExit:()=>go(key==='synth'?'final':'home')})}
function reflectView(k){const [cid,lid]=k.split('-');const c=CHAPTERS.find(x=>x.id===cid),l=c?.levels.find(x=>x[0]===lid);if(!l)return go('home');
 qflow(REFLECTION_Q,S.reflections,k,'Reflection break','Pause.',`You finished days ${l[2]} to ${l[3]} (${l[1]}). Take a moment for yourself before moving on.`)}
function bilanView(cid){const c=CHAPTERS.find(x=>x.id===cid);if(!c)return go('home');qflow(BILAN_Q,S.bilans,cid,'Chapter review · '+c.name,'Look back.','A whole chapter behind you. Look at the path.')}

// ---------- The 90 days ----------
function finalView(step){if(nextDay()<=90)return go('home');
 if(step==='synth'){S.synth=S.synth||{};return qflow(SYNTH_Q,S,'synth','The big synthesis','Reread.','Reread your pages in the Journal, then write down what strikes you.')}
 if(step==='letter')return stepper([{t:'b',h:()=>`<p class="sc">To reread in 90 days</p><h2 class="q">Dear <i>me,</i></h2><textarea class="field" id="f" style="min-height:260px">${esc(S.letter)}</textarea>`,
  cta:'Save ✓',ok:true,final:()=>{S.letter=val(app,'#f');save();toast('Saved ✓');go('final')}}],{onExit:()=>go('final')});
 if(step==='diplome'){setTheme('w');app.innerHTML=`<div class="page"><section class="blk w"><div class="diploma"><p class="sc">Diploma of</p><h1 class="big">Consistency</h1><p class="sc" style="margin-top:28px">Awarded to</p>
  <h2 class="q" style="font-size:44px"><i>${esc(S.profile.name)}</i></h2><p class="lead" style="margin:16px auto">for walking their 90 days, one step at a time.</p><p class="small">Started ${fmt(S.profile.start)} · finished ${fmt(new Date())}</p></div>
  <button class="btn" onclick="window.print()">Print</button><button class="btn ghost" style="margin-top:10px" onclick="go('final')">Back</button></section></div>`;return}
 setTheme('b');app.innerHTML=`<div class="page"><section class="blk b"><p class="sc">Chapter 4 · the watch</p><h1 class="huge">90.</h1><p class="lead">${esc(CHAPTERS[3].desc)}</p>
  <div style="margin-top:24px"><button class="row btn ghost" onclick="go('final','synth')">Big synthesis ${S.synth?.date?'✓':'→'}</button></div>
  <button class="btn ghost" style="margin-top:10px" onclick="go('journal')">Reread my pages →</button>
  <button class="btn ghost" style="margin-top:10px" onclick="go('final','letter')">Letter to myself ${S.letter?'✓':'→'}</button>
  <button class="btn" style="margin-top:10px" onclick="go('final','diplome')">My diploma →</button>
  <div class="card"><p class="sc">My why, on day 1</p><p class="quote" style="font-size:20px">${esc(S.profile.why)||'—'}</p><p class="sc" style="margin-top:18px">My commitment</p><p class="lead">${esc(S.profile.engagement)}</p></div></section></div>`}

// ---------- Journal ----------
function journalView(){setTheme('w');const ds=Object.entries(S.days).filter(([k,d])=>d?.done).sort((a,b)=>a[0]-b[0]);
 const filled=new Set(ds.map(([,d])=>d.date)),jk=new Set(S.usedJokers.map(j=>j.date));const t=new Date(),y=t.getFullYear(),m=t.getMonth();
 const first=(new Date(y,m,1).getDay()+6)%7,len=new Date(y,m+1,0).getDate();let cal=['M','T','W','T','F','S','S'].map(x=>`<div class="sc" style="color:var(--mut)">${x}</div>`).join('');
 for(let i=0;i<first;i++)cal+='<span></span>';
 for(let d=1;d<=len;d++){const iso=new Date(Date.UTC(y,m,d)).toISOString().slice(0,10);cal+=`<div class="${filled.has(iso)?'on':jk.has(iso)?'jk':''} ${iso===today()?'td':''}">${d}</div>`}
 app.innerHTML=`<div class="page"><section class="blk w"><p class="sc">Your pages</p><h1 class="big">Journal.</h1><p class="sc" style="margin-top:26px">${t.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</p><div class="cal">${cal}</div>
 <p class="small" style="margin-top:12px"><span style="color:var(--ok)">●</span> page done &nbsp; <span style="color:var(--no)">●</span> joker used</p></section>
 <section class="blk b">${ds.length?ds.map(([n,d])=>`<button class="entry" onclick="go('day',${n})"><span class="sc muted">Day ${n} · ${fmt(d.date)}</span><br><span class="serif">${esc(d.line||d.fill||'—')}</span>
  ${typeof d.mood==='number'?`<span style="float:right">${faceSvg(d.mood,'mini')}</span>`:''}</button>`).join(''):'<h2 class="q">Your completed pages <i>will appear here.</i></h2>'}</section></div>`;window.scrollTo(0,0)}

// ---------- Settings ----------
function settingsView(){setTheme('b');const st=S.settings;
 app.innerHTML=`<div class="page"><section class="blk b"><p class="sc">Settings</p><h1 class="big">Gently.</h1>
 <p class="sc" style="margin-top:30px">Reminders</p><div class="toggle"><span class="serif" style="font-size:22px">Morning</span><input type="time" class="field" id="mo" value="${st.morning}"></div>
 <div class="toggle"><span class="serif" style="font-size:22px">Evening</span><input type="time" class="field" id="ev" value="${st.evening}"></div>
 <label class="toggle"><span>Notifications<br><span class="small">If your browser allows it; the app must be open or installed.</span></span><input type="checkbox" id="nt" ${st.notif?'checked':''} style="width:24px;height:24px;accent-color:#1fa463"></label>
 <button class="btn" id="sv" style="margin-top:20px">Save</button></section>
 <section class="blk w"><p class="sc">Jokers</p><h2 class="big">${S.jokers}</h2><p class="lead">joker(s) left. A joker protects your thread on a day you couldn't make it.</p></section>
 <section class="blk w"><p class="sc">About</p><button class="btn ghost" onclick="go('intro')">What is Consistency? →</button></section>
 <section class="blk b"><p class="sc">Start over</p><p class="lead">Clears your pages and starts again from day 1. Not a failure: a fresh start.</p><button class="btn no" id="rs" style="margin-top:16px">Restart the path</button></section></div>`;window.scrollTo(0,0);
 document.getElementById('sv').onclick=async()=>{st.morning=val(app,'#mo');st.evening=val(app,'#ev');st.notif=document.getElementById('nt').checked;
  if(st.notif&&'Notification'in window){const p=await Notification.requestPermission();if(p!=='granted'){st.notif=false;toast('Notifications not allowed — no problem.')}}else if(st.notif){st.notif=false;toast('Notifications are not available here.')}
  save();toast('Saved ✓')};
 document.getElementById('rs').onclick=()=>{if(confirm('Start over from day 1? Your current pages will be cleared.')){localStorage.removeItem(KEY);S=fresh();location.hash='';render()}};
}

// Reminders while the app is open
let lastNotif='';setInterval(()=>{const st=S.settings;if(!st?.notif||!S.profile||!('Notification'in window)||Notification.permission!=='granted')return;
 const hm=new Date().toTimeString().slice(0,5),k=today()+hm;if((hm===st.morning||hm===st.evening)&&k!==lastNotif){lastNotif=k;
 new Notification('Consistency',{body:hm===st.morning?`Day ${nextDay()} is waiting for you, gently.`:'Tonight: one line, one feeling.',icon:'icons/icon.svg'})}},60000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
// Demo: ?demo=1 pre-fills a profile and 3 days
if(location.search.includes('demo=1')&&!S.profile){S.profile={name:'Alexandre',why:'Find a rhythm again',engagement:'Come back every day',mood:68,start:today()};
 [1,2,3].forEach(n=>S.days[n]={checks:[true,true,n!==2],wake:'07:30',fill:'',line:['A good day','Slow start, but I did it','Felt lighter'][n-1],mood:[68,45,85][n-1],energy:60,done:true,date:today()});save();}
render();
