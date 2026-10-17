// Structure of the 90-day path (language-independent). Text lives in i18n/<lang>.js
window.CHAPTER_DEFS=[
{id:'bleu',color:'#3a6fd8',emoji:'🌞',levels:[['basic',1,7],['medium',8,14],['intense',15,21]]},
{id:'vert',color:'#2f9e6a',emoji:'📅',levels:[['basic',22,35],['medium',36,49],['intense',50,63]]},
{id:'orange',color:'#e07b2a',emoji:'🕰️',levels:[['medium',64,77],['complexe',78,90]]},
{id:'violet',color:'#7d4fc4',emoji:'⌚',levels:[]}];
// Days 8-90: PLACEHOLDER task schedule (keys into I18N[lang].ph.tasks), to replace with the book text
window.PH_SCHEDULE=(()=>{const m={},set=(k,ns)=>ns.forEach(n=>m[n]=k);
 set('walk',[8,12,36,40,44,48,64,68,72,76]);set('read',[9,13,37,41,45,49,65,69,73,77]);set('tidyroom',[10,14,38,42,46,66,70,74]);set('cook',[11,39,43,47,67,71,75]);
 set('journal',[15,19,51,55,59,63]);set('move',[16,20,52,56,60]);set('putoff',[17,21,53,57,61]);set('screen',[18,50,54,58,62]);
 set('ready',[22,26,30,34]);set('stretch',[23,27,31,35]);set('corner',[24,28,32]);set('air',[25,29,33]);
 set('plan',[78,82,86,90]);set('kind',[79,83,87]);set('habit',[80,84,88]);set('learn',[81,85,89]);return m})();
