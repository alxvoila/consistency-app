// Writes content-drafts (days + others) into i18n/<lang>.js. Idempotent on the original structure.
const fs=require('fs'),path=require('path');global.window={};
for(const l of ['fr','en','es','pt','zh']){
 const f=path.join(__dirname,'..','i18n',l+'.js');let s=fs.readFileSync(f,'utf8');
 require(path.join(__dirname,'days-'+l+'.js'));const days=window.DAYS_DRAFT[l];
 const o=JSON.parse(fs.readFileSync(path.join(__dirname,'others',l+'.json'),'utf8'));
 const J=x=>JSON.stringify(x);
 const block='pauses:{\n'+Object.entries(o.pauses).map(([k,v])=>` ${J(k)}:${J(v)}`).join(',\n')+'},\n'
  +'bilans:{\n'+Object.entries(o.bilans).map(([k,v])=>` ${k}:${J(v)}`).join(',\n')+'},\n'
  +'finals:{\n'+Object.entries(o.finals).map(([k,v])=>` ${k}:${J(v)}`).join(',\n')+'},\n'
  +'days:[\n'+days.map(J).join(',\n')+'],\n';
 const a=s.indexOf('\nrefl:['),b=s.indexOf('\nui:{');if(a<0||b<0)throw new Error(l+': markers not found');
 s=s.slice(0,a+1)+block+s.slice(b+1);
 s=s.replace(/ph_badge:"[^"]*",/,'');
 for(const [k,v] of Object.entries(o.ui)){const re=new RegExp('\\b'+k+':"[^"]*"');s=re.test(s)?s.replace(re,k+':'+J(v)):s.replace('\nui:{','\nui:{'+k+':'+J(v)+',')}
 fs.writeFileSync(f,s);console.log(l,'written')}
