'use strict';
const KEY='consistency-v1', app=document.getElementById('app');
const MOODS=['😊','🙂','😐','😕'];
let S=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||null}catch(e){return null}}
function fresh(){return {profile:null,days:{},reflections:{},bilans:{},synth:{},letter:'',jokers:3,usedJokers:[],settings:{morning:'08:00',evening:'21:00',notif:false},lastVisit:null}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
if(!S)S=fresh();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const chapOf=n=>CHAPTERS.find(c=>c.levels.some(l=>n>=l[2]&&n<=l[3]));
const levelOf=n=>{for(const c of CHAPTERS)for(const l of c.levels)if(n>=l[2]&&n<=l[3])return {c,l};};
const doneCount=()=>Object.values(S.days).filter(d=>d.done).length;
// Progress by completed days: next day = first one not completed
const nextDay=()=>{for(let n=1;n<=90;n++)if(!S.days[n]?.done)return n;return 91};
// A reflection break gates the next level until it is done
const pendingPause=()=>{for(const c of CHAPTERS)for(const l of c.levels){const k=c.id+'-'+l[0];const all=range(l[2],l[3]).every(n=>S.days[n]?.done);if(all&&!S.reflections[k])return {type:'reflect',c,l,k};}
 for(const c of CHAPTERS.slice(0,3)){const last=c.levels.at(-1)[3];if(S.days[last]?.done&&!S.bilans[c.id])return {type:'bilan',c};}return null};
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const today=()=>new Date().toISOString().slice(0,10);
function theme(c){document.body.style.setProperty('--c',c.color);document.body.style.setProperty('--l',c.light)}
function go(v,arg){location.hash=v+(arg?'/'+arg:'')}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
window.onhashchange=render;

function render(){
 if(!S.profile){document.getElementById('top').style.display='none';return onboarding()}
 document.getElementById('top').style.display='';
 const [v,a]=location.hash.slice(1).split('/');
 ({day:()=>dayView(+a),reflect:()=>reflectView(a),bilan:()=>bilanView(a),final:()=>finalView(a),journal:journalView,settings:settingsView}[v]||home)();
 window.scrollTo(0,0);
}

function onboarding(){theme(CHAPTERS[0]);let m='';
 app.innerHTML=`<h1>Welcome to Consistency 🌞</h1><p>A 90-day workbook you can start whenever you like. Your day 1 is today.</p>
 <div class="card"><label>Your first name<input id="o-name"></label>
 <label>Why I'm opening this workbook<textarea id="o-why" placeholder="What brings me here…"></textarea></label>
 <label>My commitment to myself<textarea id="o-eng">I commit to coming back every day, even for a single box. A missed day erases nothing.</textarea></label>
 <p>My mood today</p><div class="moods">${MOODS.map(x=>`<button data-m="${x}">${x}</button>`).join('')}</div>
 <button class="btn" id="o-go">Let's begin</button></div>`;
 app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{m=b.dataset.m;app.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
 document.getElementById('o-go').onclick=()=>{const name=document.getElementById('o-name').value.trim();if(!name)return alert('Just tell me your first name 🙂');
  S.profile={name,why:o('o-why'),engagement:o('o-eng'),mood:m,start:today()};S.lastVisit=today();save();go('home');render()};
}
const o=id=>document.getElementById(id).value;

function missedMsg(){const last=[...Object.values(S.days).filter(d=>d.done).map(d=>d.date),...S.usedJokers.map(j=>j.date),S.profile.start].sort().at(-1);
 const gap=Math.round((new Date(today())-new Date(last))/864e5);
 return gap>=2&&nextDay()<=90?`<div class="card"><h2>Pick it back up 💛</h2><p>It's been ${gap} days. Nothing is lost: your ${doneCount()} days are still here. We simply pick up again at day ${nextDay()}.</p>${S.jokers>0?`<button class="btn ghost" id="joker">Use a joker (${S.jokers} left)</button>`:''}</div>`:''}

function home(){const nd=nextDay(),dc=doneCount(),p=pendingPause();theme(chapOf(Math.min(nd,90))||CHAPTERS[3]);
 let h=`<p>Hello ${esc(S.profile.name)} 👋</p><div class="card"><div class="counter">${dc} / 90</div><div class="small">days completed — at your own pace</div><div class="bar"><i style="width:${dc/90*100}%"></i></div>
 ${p?`<button class="btn" onclick="go('${p.type}','${p.type==='reflect'?p.k:p.c.id}')">${p.type==='reflect'?'⏸️ Reflection break: '+p.l[1]:'📋 Chapter review: '+p.c.name}</button>`:nd<=90?`<button class="btn" onclick="go('day',${nd})">Day ${nd} →</button>`:`<button class="btn" onclick="go('final')">🟣 The 90 days →</button>`}</div>${missedMsg()}`;
 CHAPTERS.forEach((c,i)=>{h+=`<div class="card chap" style="border-color:${c.color}"><h2 style="color:${c.color}">${c.emoji} Chapter ${i+1} — ${c.name}</h2><div class="small">${c.desc} · time object: ${c.obj}</div>`;
  c.levels.forEach(l=>{h+=`<div class="lvl">${l[1]} · days ${l[2]}–${l[3]}${S.reflections[c.id+'-'+l[0]]?' · ⏸️ ✓':''}</div><div class="dots">`+range(l[2],l[3]).map(n=>{const d=S.days[n],open=d?.done||(n===nd&&!p);
   return `<div class="dot ${d?.done?'done':''} ${open?'':'lock'} ${n===nd?'cur':''}" style="border-color:${c.color};${d?.done?'background:'+c.color:''}" ${open?`onclick="go('day',${n})"`:''}>${d?.joker?'🃏':n}</div>`}).join('')+'</div>'});
  if(c.id==='violet')h+=`<div class="lvl">Synthesis · rereading · letter to myself · diploma</div>${nd>90&&!p?`<button class="btn" onclick="go('final')">Open</button>`:'<div class="small">🔒 Unlocks after day 90</div>'}`;
  h+='</div>'});
 app.innerHTML=h;const j=document.getElementById('joker');if(j)j.onclick=()=>{S.jokers--;S.lastVisit=today();
  // The joker protects: it just marks the "comeback" without counting a day as done
  const n=nextDay();S.usedJokers.push({date:today(),beforeDay:n});save();
  alert('Joker used 🃏 Your thread continues, nothing lost.');render()};
}

function dayView(n){const D=DAYS[n-1];if(!D)return home();const {c,l}=levelOf(n);theme(c);
 const open=S.days[n]?.done||n===nextDay();if(!open)return go('home');
 const s=S.days[n]||{checks:[false,false,false],wake:'',fill:'',line:'',mood:''};
 app.innerHTML=`<div class="small"><span class="chip">${c.emoji} ${c.name}</span><span class="chip">${l[1]}</span>${D.placeholder?'<span class="ph">placeholder content</span>':''}</div>
 <h1 style="color:${c.color}">Day ${n}</h1><p class="quote">${esc(D.intro)}</p>
 <div class="card"><h2>☀️ My little routine for today</h2>
 <label class="chk"><input type="checkbox" data-c="0" ${s.checks[0]?'checked':''}><span><b>I get up</b> — and put both feet on the floor.<br>Time: <input type="time" id="wake" value="${esc(s.wake)}" style="width:auto"></span></label>
 <label class="chk"><input type="checkbox" data-c="1" ${s.checks[1]?'checked':''}><span><b>I drink a big glass of water</b> — before coffee, before my phone.</span></label>
 <label class="chk"><input type="checkbox" data-c="2" ${s.checks[2]?'checked':''}><span><b>${esc(D.task[0])}</b> — ${esc(D.task[1])}${D.ideas?`<br><span class="small">(${esc(D.ideas)})</span>`:''}</span></label>
 <label>${esc(D.fill)}<input id="fill" value="${esc(s.fill)}"></label></div>
 <div class="card"><h2>🌙 Tonight</h2><label>In one line, how I felt today:<input id="line" value="${esc(s.line)}"></label>
 <p>My mood:</p><div class="moods">${MOODS.map(x=>`<button data-m="${x}" class="${s.mood===x?'on':''}">${x}</button>`).join('')}</div></div>
 <div class="quote">${c.emoji} <b>A word from ${c.obj}:</b><br>${D.motto.map(esc).join('<br>')}</div>
 <button class="btn" id="save">${s.done?'Update':'I finished my page ✓'}</button><button class="btn ghost" onclick="go('home')">Back to my path</button>
 <p class="small" style="text-align:right">${n} / 90</p>`;
 app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{s.mood=b.dataset.m;app.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
 document.getElementById('save').onclick=()=>{s.checks=[...app.querySelectorAll('[data-c]')].map(x=>x.checked);s.wake=o('wake');s.fill=o('fill');s.line=o('line');
  const first=!s.done;s.done=true;s.date=s.date||today();S.days[n]=s;S.lastVisit=today();save();
  if(first)alert(s.checks.some(Boolean)?`Day ${n} done 🌞 Well done.`:`Day ${n} done. You showed up, and that's what counts.`);go('home')};
}

function form(qs,store,key,title,c,sub){theme(c);const v=store[key]||{};
 app.innerHTML=`<h1 style="color:${c.color}">${title}</h1><p class="small">${sub}</p><div class="card">${qs.map((q,i)=>`<label>${esc(q)}<textarea data-q="${i}">${esc(v[i]||'')}</textarea></label>`).join('')}
 <button class="btn" id="ok">Save</button></div><button class="btn ghost" onclick="go('home')">Later</button>`;
 document.getElementById('ok').onclick=()=>{const r={};app.querySelectorAll('[data-q]').forEach(t=>r[t.dataset.q]=t.value);r.date=today();store[key]=r;save();go('home')}}
function reflectView(k){const [cid,lid]=k.split('-');const c=CHAPTERS.find(x=>x.id===cid),l=c.levels.find(x=>x[0]===lid);
 form(REFLECTION_Q,S.reflections,k,'⏸️ Reflection break — '+l[1],c,`You finished days ${l[2]} to ${l[3]}. Take a moment for yourself before moving on.`)}
function bilanView(cid){const c=CHAPTERS.find(x=>x.id===cid);form(BILAN_Q,S.bilans,cid,'📋 Review — '+c.name,c,'A whole chapter behind you. Look at the path.')}

function finalView(step){const c=CHAPTERS[3];theme(c);if(nextDay()<=90)return go('home');
 if(step==='synth')return form(SYNTH_Q,S,'synth','The big synthesis',c,'Reread your pages in the Journal, then write down what strikes you.');
 if(step==='letter'){app.innerHTML=`<h1 style="color:${c.color}">✉️ Letter to myself</h1><p class="small">To reread in 90 days.</p><div class="card"><textarea id="lt" style="min-height:240px">${esc(S.letter)}</textarea><button class="btn" id="ok">Save</button></div><button class="btn ghost" onclick="go('final')">Back</button>`;
  return document.getElementById('ok').onclick=()=>{S.letter=o('lt');save();go('final')}}
 if(step==='diplome'){app.innerHTML=`<div class="card diplome"><div style="font-size:3rem">🎓</div><h1>Diploma of Consistency</h1><p>Awarded to</p><h2 style="font-size:1.8rem;color:${c.color}">${esc(S.profile.name)}</h2>
  <p>for walking their 90 days, one step at a time.</p><p class="small">Started on ${new Date(S.profile.start).toLocaleDateString('en-US')} · finished on ${new Date().toLocaleDateString('en-US')}</p></div>
  <button class="btn" onclick="window.print()">Print</button><button class="btn ghost" onclick="go('final')">Back</button>`;return}
 app.innerHTML=`<h1 style="color:${c.color}">⌚ The 90 days</h1><p>${c.desc}</p>
 <button class="btn" onclick="go('final','synth')">Big synthesis & rereading ${S.synth?.date?'✓':''}</button>
 <button class="btn" onclick="go('journal')">Reread my pages</button>
 <button class="btn" onclick="go('final','letter')">Letter to myself ${S.letter?'✓':''}</button>
 <button class="btn" onclick="go('final','diplome')">🎓 My diploma</button>
 <div class="card"><b>My why, on day 1:</b><p>${esc(S.profile.why)}</p><b>My commitment:</b><p>${esc(S.profile.engagement)}</p></div>`}

function journalView(){theme(CHAPTERS[0]);const ds=Object.entries(S.days).filter(([k,d])=>d?.done).sort((a,b)=>a[0]-b[0]);
 const filled=new Set(Object.values(S.days).filter(d=>d?.done).map(d=>d.date));const t=new Date(),y=t.getFullYear(),m=t.getMonth();
 const first=(new Date(y,m,1).getDay()+6)%7,len=new Date(y,m+1,0).getDate();let cal='';for(let i=0;i<first;i++)cal+='<span></span>';
 for(let d=1;d<=len;d++){const iso=new Date(Date.UTC(y,m,d)).toISOString().slice(0,10);cal+=`<div style="${filled.has(iso)?'background:var(--c);color:#fff':''}">${d}</div>`}
 app.innerHTML=`<h1>Journal</h1><div class="card"><h2>${t.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h2><div class="cal">${cal}</div></div>`+
 (ds.length?ds.map(([n,d])=>{const c=chapOf(+n);return `<div class="card chap" style="border-color:${c.color}" onclick="go('day',${n})"><b>Day ${n}</b> ${d.mood||''} <span class="small">${new Date(d.date).toLocaleDateString('en-US')}</span><div>${esc(d.line||d.fill||'—')}</div></div>`}).join(''):'<p class="small">Your completed pages will appear here.</p>');}

function settingsView(){theme(CHAPTERS[0]);const st=S.settings;
 app.innerHTML=`<h1>Settings</h1><div class="card"><h2>Reminders</h2><label>Morning<input type="time" id="mo" value="${st.morning}"></label><label>Evening<input type="time" id="ev" value="${st.evening}"></label>
 <label class="chk"><input type="checkbox" id="nt" ${st.notif?'checked':''}><span>Turn on notifications <span class="small">(if your browser allows it; the app must be open or installed)</span></span></label><button class="btn" id="sv">Save</button></div>
 <div class="card"><h2>Jokers</h2><p>${S.jokers} joker(s) left. A joker protects your thread on a day you couldn't make it.</p></div>
 <div class="card"><h2>Start over</h2><p class="small">Clears your pages and starts again from day 1. Not a failure: a fresh start.</p><button class="btn ghost" id="rs">Restart the path</button></div>`;
 document.getElementById('sv').onclick=async()=>{st.morning=o('mo');st.evening=o('ev');st.notif=document.getElementById('nt').checked;
  if(st.notif&&'Notification'in window){const p=await Notification.requestPermission();if(p!=='granted'){st.notif=false;alert('Notifications not allowed — no problem, your workbook is waiting for you.')}}else if(st.notif){st.notif=false;alert('Notifications are not available in this browser.')}
  save();alert('Saved ✓')};
 document.getElementById('rs').onclick=()=>{if(confirm('Start over from day 1? Your current pages will be cleared.')){localStorage.removeItem(KEY);S=fresh();location.hash='';render()}};
}
// Reminders: checks every minute while the app is open
let lastNotif='';setInterval(()=>{const st=S.settings;if(!st?.notif||!S.profile||Notification.permission!=='granted')return;
 const hm=new Date().toTimeString().slice(0,5),k=today()+hm;if((hm===st.morning||hm===st.evening)&&k!==lastNotif){lastNotif=k;
 new Notification('Consistency',{body:hm===st.morning?`Day ${nextDay()} is waiting for you, gently ☀️`:'Tonight: one line, one mood 🌙',icon:'icons/icon.svg'})}},60000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
// Demo: ?demo=1 pre-fills a profile and 3 days (for tests/screenshots)
if(location.search.includes('demo=1')&&!S.profile){S.profile={name:'Alexandre',why:'Find a rhythm again',engagement:'Come back every day',mood:'🙂',start:today()};
 [1,2,3].forEach(n=>S.days[n]={checks:[true,true,n!==2],wake:'07:30',fill:'',line:'A good day',mood:'🙂',done:true,date:today()});save();}
render();
