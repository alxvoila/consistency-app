// Builds structured drafts from src/<lang>.txt (days 8-90) + current i18n days 1-7 (book text).
// Output: days-<lang>.json, days-<lang>.js (drop-in `days:[...]` array, same shape as i18n), days-<lang>.md
const fs=require('fs'),path=require('path');global.window={};
const LANGS=['fr','en','es','pt','zh'];LANGS.forEach(l=>require(path.join('..','i18n',l+'.js')));
const LV=[['bleu','basic',1,7],['bleu','medium',8,14],['bleu','intense',15,21],['vert','basic',22,35],['vert','medium',36,49],['vert','intense',50,63],['orange','medium',64,77],['orange','complexe',78,90]];
const lvl=n=>LV.find(x=>n>=x[2]&&n<=x[3]);
const H={fr:['Jour','Intro','Tâche','Idées','Une ligne','Le mot de','Contenu du livre (jours 1 à 7)','Cahier Consistency · les 90 jours'],en:['Day','Intro','Task','Ideas','One line','A word from','Book text (days 1 to 7)','Consistency notebook · the 90 days'],es:['Día','Intro','Tarea','Ideas','Una línea','Te dice','Texto del libro (días 1 a 7)','Cuaderno Consistency · los 90 días'],pt:['Dia','Intro','Tarefa','Ideias','Uma linha','Mensagem de','Texto do livro (dias 1 a 7)','Caderno Consistency · os 90 dias'],zh:['第','开场','任务','灵感','一句话','来自','书中原文（第1至7天）','Consistency 手册 · 90天']};
for(const l of LANGS){const L=window.I18N[l];
 const src=fs.readFileSync(path.join(__dirname,'src',l+'.txt'),'utf8').trim().split('\n');
 const days=L.days.slice(0,7).map((d,i)=>({n:i+1,source:'book',...JSON.parse(JSON.stringify(d))}));
 for(const line of src){const [n,intro,t0,t1,w,ideas,fill,m1,m2]=line.split('|');days.push({n:+n,source:'draft',intro,task:[t0,t1,w],ideas,fill,motto:[m1,m2]})}
 if(days.length!==90||days.some((d,i)=>d.n!==i+1))throw new Error(l+' bad numbering');
 days.forEach(d=>{const [c,lv]=lvl(d.n).slice(0,2);d.chapter=c;d.level=lv});
 const bad=JSON.stringify(days).match(/[\u2013\u2014]/g);if(bad)console.warn(l,'DASHES FOUND',bad.length);
 fs.writeFileSync(path.join(__dirname,`days-${l}.json`),JSON.stringify(days,null,1));
 const plain=days.map(({intro,task,ideas,fill,motto})=>({intro,task,ideas,fill,motto}));
 fs.writeFileSync(path.join(__dirname,`days-${l}.js`),`// DRAFT ${l}: 90 days, same shape as I18N.${l}.days (intro, task:[title,subtitle,bigWord], ideas, fill, motto:[2]).\n// Not wired into the app yet.\nwindow.DAYS_DRAFT=window.DAYS_DRAFT||{};window.DAYS_DRAFT.${l}=${JSON.stringify(plain)};\n`);
 const h=H[l];let md=`# ${h[7]}\n\n`;let cur='';
 for(const d of days){const c={...L.chapters[d.chapter],emoji:{bleu:'🌞',vert:'📅',orange:'🕰️'}[d.chapter]},key=d.chapter+d.level;
  if(key!==cur){cur=key;md+=`\n---\n\n## ${c.name} · ${L.levels[d.level]} (${lvl(d.n)[2]}-${lvl(d.n)[3]})`+`\n\n`}
  const title=l==='zh'?`第${d.n}天`:`${h[0]} ${d.n}`;
  md+=`### ${title} · ${d.task[2]}${d.source==='book'?`  _(${h[6]})_`:''}\n\n> ${d.intro}\n\n**${d.task[0]}**${L.ui.sep_colon}${d.task[1]}\n\n*${d.ideas}*\n\n✍️ ${d.fill}\n\n${c.emoji} ${(s=>s[0].toUpperCase()+s.slice(1))(L.ui.d_word_from.replace("{obj}",c.obj))}${L.ui.sep_colon}*${d.motto[0]}* ${d.motto[1]}\n\n<p align="right">${d.n} / 90</p>\n\n`}
 fs.writeFileSync(path.join(__dirname,`days-${l}.md`),md);
 console.log(l,'ok',days.length)}
