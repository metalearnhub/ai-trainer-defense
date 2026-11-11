/* AI Trainer Tasker — task clock, gate reminders, rapid-hunt drafts and finding history.
   Everything is saved in this browser (localStorage) on every keystroke. */
(function(){
'use strict';
var P='cst.v1.',AHT=270;
var root=document.getElementById('app');
if(!root){root=document.createElement('div');root.id='app';document.body.appendChild(root)}
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
var UUID=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
function parseFeather(u){u=String(u||'');var m=u.match(/\/tasks\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);if(m)return m[1].toLowerCase();m=u.match(UUID);return m?m[0].toLowerCase():''}
function appKey(a){return String(a||'').toLowerCase().replace(/\s+/g,' ').trim()}
function hms(s){s=Math.max(0,Math.floor(s));return Math.floor(s/3600)+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function hm(s){s=Math.max(0,Math.floor(s));return Math.floor(s/3600)+':'+String(Math.floor(s/60)%60).padStart(2,'0')}
function parseTime(v){v=String(v||'').trim();var m=v.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);if(m)return(+m[1])*3600+(+m[2])*60+(+(m[3]||0));m=v.match(/^(\d{3,6})$/);if(m){var d=v.padStart(6,'0');return(+d.slice(0,2))*3600+(+d.slice(2,4))*60+(+d.slice(4,6))}m=v.match(/^(\d{1,2})$/);if(m)return(+m[1])*60;return null}
function day(ts){return new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}

/* ---------- storage ---------- */
var storageWarned=false;
function lsGet(k,d){try{var v=localStorage.getItem(P+k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(P+k,JSON.stringify(v));return true}catch(e){if(!storageWarned){storageWarned=true;toast('Not saved','Browser storage is full or blocked. Export a backup now.','crit')}return false}}
var IDX=lsGet('index',null)||{ids:[],cur:null,settings:{notify:false,sound:true}};
IDX.settings=IDX.settings||{notify:false,sound:true};
var TASKS={};
function loadTasks(){TASKS={};IDX.ids.forEach(function(id){var t=lsGet('t.'+id,null);if(t)TASKS[id]=t});IDX.ids=IDX.ids.filter(function(id){return TASKS[id]})}
loadTasks();
function saveIdx(){lsSet('index',IDX)}
var savedTimer=null;
function saveTask(t){t.updatedAt=Date.now();if(typeof queuePush==='function')queuePush(t.id);if(lsSet('t.'+t.id,t)){$$('[data-saved]').forEach(function(el){el.textContent='Saved '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})})}}
function cur(){return IDX.cur&&TASKS[IDX.cur]||null}
function allTasks(){return IDX.ids.map(function(id){return TASKS[id]}).filter(Boolean).sort(function(a,b){return b.createdAt-a.createdAt})}

/* ---------- clock ---------- */
function elapsed(t){var c=t.clock||{base:0,at:null};return c.base+(c.at?(Date.now()-c.at)/1000:0)}
function setElapsed(t,sec){t.clock.base=sec;if(t.clock.at)t.clock.at=Date.now()}
function running(t){return !!(t.clock&&t.clock.at)}
function pause(t){if(t.clock.at){t.clock.base=elapsed(t);t.clock.at=null}}
function resume(t){if(!t.clock.at)t.clock.at=Date.now()}

/* ---------- counts & rules (CheckSet guidelines, Nov 2026) ---------- */
function counts(t){var f=t.findings||[],d=f.filter(function(x){return x.status==='done'});var pre=t.pre||{};return{n:d.length+(+pre.l||0),b:d.filter(function(x){return x.type==='bug'}).length+(+pre.b||0),fr:d.filter(function(x){return x.type==='fr'}).length+(+pre.r||0),prog:f.filter(function(x){return x.status==='progress'}).length,draft:f.filter(function(x){return x.status==='draft'}).length+Math.max(0,(+pre.f||0)-(+pre.l||0)),all:f.length+Math.max(+pre.f||0,+pre.l||0),tracked:f.length}}
function planFound(m){return Math.min(30,30*m/255)}
function planFloor(m){return Math.min(20,20*m/255)}
function planLogged(m){return m<=30?0:Math.min(30,30*(m-30)/225)}
function lastActAgoMin(t){var e=elapsed(t),xs=[];(t.findings||[]).forEach(function(x){xs.push(x.at||0);if(x.doneAt!=null)xs.push(x.doneAt)});if(!xs.length)return e/60;return(e-Math.max.apply(null,xs))/60}
var OUT={active:['In progress','info'],mfr:['MFR · awaiting HDM','warn'],submitted:['Submitted','ok'],form:['MFR submitted','warn'],outdated:['Outdated · submitted','warn'],unclaimed:['Unclaimed','crit'],released:['Released','warn']};
var MFR_DOC='Include: finding count, Bug/FR split, workflows tested, what you tried and why you couldn\'t find more.';
/* CheckSet Operations & Strategy Handbook (Nov 2026): standard = 30+ inside AHT; anything under 30 goes through the Slack MFR workflow (the Minimum Findings Form); minimum 10.
   Checkpoints: triage window 0:00–0:45 (test freely, unclaim/release any time) · MFR 2:00 · AHT 4:30. */
var STAGES=[
  {id:'explore',a:0,b:45,n:'Triage',d:'Use the full 45 minutes: test the whole app freely and capture drafts. Unclaim or release before 0:45 if it won\'t boot, crashes or is unstable, or if it boots but clearly can\'t yield 20+ findings (too polished, too few workflows). No rating or tags.'},
  {id:'hunt',a:45,b:120,n:'Hunt',d:'Find and log. 2:00 checkpoint: under 5 → MFR and release; 5–9 → MFR and follow it.'},
  {id:'build',a:120,b:255,n:'Build',d:'Build toward 30+. Under 30 only goes in through the MFR workflow.'},
  {id:'wrap',a:255,b:270,n:'Wrap',d:'Runtime Quality and final checks. At 4:30: under 30 → Slack MFR workflow.'}
];
function stageFor(t,m){return t&&t.huntDone&&m<45?STAGES[1]:stageOf(m)}
function stageOf(m){for(var i=0;i<STAGES.length;i++)if(m<STAGES[i].b)return STAGES[i];return STAGES[STAGES.length-1]}
/* pace model: learns your own capture and logging times from this task */
function metrics(t){
  var e=elapsed(t)/60,c=counts(t),f=t.findings||[];
  var caps=f.map(function(x){return(x.at||0)/60}),lastCap=caps.length?Math.max.apply(null,caps):0;
  var from=(t.trackFrom||0)/60,avgCap=c.tracked?Math.max(.5,(Math.max(lastCap,from)-from)/c.tracked):null;
  var logs=f.filter(function(x){return x.status==='done'&&x.startAt!=null&&x.doneAt!=null&&x.doneAt>x.startAt}).map(function(x){return(x.doneAt-x.startAt)/60});
  var avgLog=logs.length?Math.max(1,logs.reduce(function(a,b){return a+b},0)/logs.length):null;
  var cap=avgCap||4,lg=avgLog||6,left=Math.max(0,255-e),needLog=Math.max(0,30-c.n),needFind=Math.max(0,30-c.all),queue=c.all-c.n;
  var capNeed=needFind*cap,logBudget=needLog?(left-capNeed)/needLog:0;
  var proj=c.n+Math.min(queue,left/lg)+Math.max(0,left-queue*lg)/(lg+cap);
  return{e:e,c:c,avgCap:avgCap,avgLog:avgLog,cap:cap,lg:lg,left:left,needLog:needLog,needFind:needFind,queue:queue,logBudget:logBudget,target:Math.max(1.5,logBudget),proj:Math.floor(proj),feasible:logBudget>=1.5,pf:planFound(e),pfl:planFloor(e),pl:planLogged(e)}
}
function oldestProg(t){var ps=(t.findings||[]).filter(function(x){return x.status==='progress'});ps.sort(function(a,b){return(a.startAt||0)-(b.startAt||0)});return ps[0]||null}
function first(f){return String(f.text||'').split('\n')[0].slice(0,60)||'(untitled)'}
function mmss(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}
function doNow(t){
  if(t.status!=='active')return null;var M=metrics(t),e=M.e,c=M.c;if(e>=AHT)return null;
  if(e<45&&!t.huntDone)return{tone:'info',h:'Triage window · '+mmss((45-e)*60)+' left',p:'Test the whole app freely and type what you see. Unstable, or clearly can\'t yield 20+ findings? Unclaim before 0:45. Plan: about '+Math.round(planFound(45))+' found by 0:45. Press Exploration done to start logging early.'};
  if(c.n>=30)return null;
  var pr=oldestProg(t);
  if(pr){var spent=(elapsed(t)-(pr.startAt||elapsed(t)))/60,tg=M.target;return spent<=tg?{tone:'info',h:'Finish “'+first(pr)+'” within '+mmss((tg-spent)*60),p:'Budget '+mmss(tg*60)+' a finding to reach 30 by 4:15. Write the summary, run Flow, log in Feather, then mark it Done.'}:{tone:'warn',h:'Over budget on “'+first(pr)+'” by '+mmss((spent-tg)*60),p:'Wrap it up and mark it Done, or move it back to Not started and take the next one.'}}
  if(c.draft)return{tone:'warn',h:'Start the next draft now',p:c.draft+' waiting. Click its circle to move it to In progress, then run Flow and log it in Feather.'};
  return{tone:'info',h:'Queue empty · capture the next finding',p:'You need '+M.needFind+' more found for 30. Budget about '+mmss(M.cap*60)+' to spot one.'};
}
function nextStep(t){
  var e=elapsed(t)/60,c=counts(t),n=c.n,F=c.all,ok=n>=30&&c.b>=5&&c.fr>=5;
  if(t.status==='submitted')return{tone:'ok',h:'Submitted',p:'Closed at '+hm(elapsed(t))+' with '+n+' findings.'};
  if(t.status==='form')return{tone:'warn',h:'MFR submitted',p:'Closed at '+hm(elapsed(t))+' with '+n+' findings, tested areas and limitations documented.'};
  if(t.status==='outdated')return{tone:'warn',h:'Outdated · submitted',p:'Submitted as soon as it went Outdated, as the handbook asks.'};
  if(t.status==='unclaimed')return{tone:'crit',h:'Unclaimed',p:'Unclaimed or released in Feather. No rating, scores or tags needed.'};
  if(t.status==='released')return{tone:'warn',h:'Released',p:'Closed after the MFR or HDM review.'};
  if(t.status==='mfr')return{tone:'warn',h:'MFR submitted · awaiting HDM',p:'Keep this task In Progress in Feather. You may start 1 more task while you wait. An approved MFR sends the task to the Review Layer; you never need a second one.'};
  if(ok)return{tone:'ok',h:'Ready to submit',p:'Complete the Runtime Quality assessment, run final checks, then submit in Feather.'};
  if(e>=AHT)return F>=10?{tone:'crit',h:'4:30 · stop and run the MFR workflow',p:'You have '+F+' found ('+n+' logged). Run the Slack MFR workflow (Minimum Findings Form) with the areas you tested and the environment\'s limitations.'}:{tone:'crit',h:'4:30 · under 10: start the MFR workflow',p:'Never a standard submission under 10. Start the MFR workflow in Slack. '+MFR_DOC};
  if(n>=30)return{tone:'warn',h:'30 logged but the mix is short',p:'You need '+(c.b<5?(5-c.b)+' more Bug'+(5-c.b>1?'s':''):'')+(c.b<5&&c.fr<5?' and ':'')+(c.fr<5?(5-c.fr)+' more FR'+(5-c.fr>1?'s':''):'')+'. If you can\'t find them, start the MFR workflow.'};
  if(e>=255)return{tone:'warn',h:'Wrap up · '+mmss((AHT-e)*60)+' to 4:30',p:F>=30?'Log the rest and submit.':F>=10?'Finish what\'s in progress, then prepare the MFR workflow: tested areas and limitations.':'Under 10: prepare the MFR workflow. '+MFR_DOC};
  if(e>=120&&F<5)return{tone:'crit',h:'Under 5 at 2:00 · start the MFR workflow',p:'Document your progress in the MFR workflow and release the task. Releasing a thin environment is the right call.'};
  if(e>=120&&F<10&&!t.mfrRun)return{tone:'warn',h:F+' found at 2:00 · start the MFR workflow',p:'With 5–9, start the MFR workflow and follow its outcome: keep working, or submit the MFR. Mark below when you\'ve run it.'};
  if(e<45&&!t.huntDone)return{tone:'info',h:'Triage window · '+mmss((45-e)*60)+' left to decide',p:'Test freely. Won\'t boot, crashes or unstable → tell your HDM in the POD thread and unclaim. Boots but clearly can\'t yield 20+ findings (too polished, too few workflows) → unclaim/release too. Before 0:45, no rating or tags.'};
  var pf=planFound(e),pfl=planFloor(e);
  if(F>=pf-1)return{tone:'ok',h:'On pace for 30+',p:'Found '+F+' (30-pace at this time: '+Math.round(pf)+') · logged '+n+'.'};
  if(F>=pfl-1)return{tone:'warn',h:'Behind 30 pace by '+Math.round(pf-F),p:'Found '+F+', 30-pace is '+Math.round(pf)+'. Standard work is 30+ inside AHT; under 30 only goes in through the MFR workflow. Switch to an untested workflow.'};
  return{tone:'warn',h:'Well behind 30 pace ('+F+' vs '+Math.round(pf)+')',p:'Switch workflows, or start the Slack MFR workflow if the app has run out. There is no penalty for starting it.'};
}
var GATES=[
  {id:'g35',m:35,t:'0:35',l:'10 min left · unstable or can\'t reach 20+? unclaim'},
  {id:'g45',m:45,t:'0:45',l:'Triage window closes · keep or release'},
  {id:'g110',m:110,t:'1:50',l:'10 min to the 2:00 checkpoint'},
  {id:'g120',m:120,t:'2:00',l:'MFR checkpoint · under 5 / 5–9'},
  {id:'g240',m:240,t:'4:00',l:'30 min left · check the mix'},
  {id:'g255',m:255,t:'4:15',l:'Wrap up · Runtime Quality'},
  {id:'g265',m:265,t:'4:25',l:'5 min to 4:30'},
  {id:'g270',m:270,t:'4:30',l:'Stop · under 30 → MFR workflow'}
];
function gateMessage(t,g){
  var c=counts(t),n=c.all,tail=' ('+c.all+' found · '+c.n+' logged · '+c.b+' Bugs · '+c.fr+' FRs)';
  if(g.id==='g35')return'10 minutes left in the 45-minute triage window. Unstable or broken, or can you see it won\'t yield 20+ findings (too polished, too few workflows)? Unclaim before 0:45. No rating or tags.'+tail;
  if(g.id==='g45')return'0:45: triage window closes. Broken, unstable or clearly short of 20+? Release now. Otherwise commit and keep going toward 30+.'+tail;
  if(g.id==='g110')return n>=5?'You\'re past 5, so the 2:00 checkpoint is clear. Keep building.'+tail:'You need 5 by 2:00, or the MFR workflow starts. Push on the main workflows now.'+tail;
  if(g.id==='g120')return n<5?'Under 5: start the MFR workflow, document your progress and release.'+tail:n<10?'5–9: start the MFR workflow and follow its outcome.'+tail:'Checkpoint clear. Keep building toward 30+.'+tail;
  if(g.id==='g240')return(n>=30?'30 found. Check you have 5+ Bugs and 5+ FRs.':'Last half hour. Push for 30+ and check the Bug/FR mix; if you\'ll land under 30, get the MFR workflow ready.')+tail;
  if(g.id==='g255')return(n>=30?'Stop hunting. Runtime Quality, final checks, submit.':n>=10?'Stop hunting. Prepare the MFR workflow: tested areas and limitations.':'Under 10: prepare the MFR workflow. '+MFR_DOC)+tail;
  if(g.id==='g265')return(n>=30?'Submit now.':'5 minutes left. Get the '+'MFR workflow'+' ready.')+tail;
  if(g.id==='g270')return(n>=10?'Stop. Run the Slack MFR workflow with tested areas and limitations.':'Stop. Under 10: start the MFR workflow.')+tail;
  return nextStep(t).p;
}

/* ---------- duplicates ---------- */
var STOP={'the':1,'and':1,'for':1,'with':1,'that':1,'this':1,'when':1,'from':1,'into':1,'does':1,'not':1,'are':1,'was':1,'but':1,'page':1,'user':1,'should':1,'can':1,'cannot':1,'click':1,'clicking':1,'after':1,'then':1,'open':1,'shows':1,'show':1,'there':1,'have':1,'has':1,'its':1,'you':1,'all':1,'any':1};
function toks(s){var o={};String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).forEach(function(w){if(w.length<3||STOP[w])return;w=w.replace(/(ing|ed|es|s)$/,'');if(w.length>=3)o[w]=1});return o}
function sim(a,b){var ka=Object.keys(a),kb=Object.keys(b);if(!ka.length||!kb.length)return{s:0,k:0};var k=0;ka.forEach(function(w){if(b[w])k++});return{s:2*k/(ka.length+kb.length),k:k}}
function pastFor(t){var key=appKey(t.app),out=[];allTasks().forEach(function(o){if(o.id===t.id||appKey(o.app)!==key)return;(o.findings||[]).forEach(function(f){out.push({f:f,task:o})})});return out}
function dupOf(t,f){if(String(f.text||'').trim().length<12)return null;var a=toks(ftxt(f)),best=null;pastFor(t).forEach(function(p){var r=sim(a,toks(ftxt(p.f)));if(r.k>=3&&r.s>=.5&&(!best||r.s>best.s))best={s:r.s,f:p.f,task:p.task}});(t.findings||[]).forEach(function(o){if(o.id===f.id)return;var r=sim(a,toks(ftxt(o)));if(r.k>=3&&r.s>=.6&&(!best||r.s>best.s))best={s:r.s,f:o,task:t,same:true}});return best}
function dupHtml(d){if(!d)return'';var first=String(d.f.text||'').split('\n')[0].slice(0,140);return'<div class="duphint">Possible duplicate'+(d.same?' in this task':' of '+esc(day(d.task.createdAt))+' · '+esc((d.task.featherId||'').slice(0,8)))+' ('+Math.round(d.s*100)+'% match): “'+esc(first)+'”</div>'}

/* ---------- notifications & sound ---------- */
var AC=null;
function beep(){if(!IDX.settings.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();[0,.18].forEach(function(d,i){var o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=i?880:660;g.gain.setValueAtTime(.0001,AC.currentTime+d);g.gain.exponentialRampToValueAtTime(.2,AC.currentTime+d+.02);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d+.16);o.connect(g).connect(AC.destination);o.start(AC.currentTime+d);o.stop(AC.currentTime+d+.18)})}catch(e){}}
function notifyOk(){return 'Notification' in window&&Notification.permission==='granted'&&IDX.settings.notify}
function alertUser(t,title,body,tone){
  toast(title,body,tone||'warn',t.id);beep();
  if(notifyOk()){try{var n=new Notification(title,{body:body,tag:'cst-'+t.id+'-'+title,requireInteraction:true});n.onclick=function(){window.focus();IDX.cur=t.id;saveIdx();render();n.close()}}catch(e){}}
}
function askPermission(){
  if(!('Notification' in window)){toast('Not supported','This browser can\'t show desktop notifications. In-app alerts and sound still work.','warn');return}
  Notification.requestPermission().then(function(p){IDX.settings.notify=p==='granted';saveIdx();render();
    if(p==='granted'){try{new Notification('AI Trainer Tasker reminders are on',{body:'You\'ll get a desktop alert at each gate: 0:35, 0:45, 1:50, 2:00, 4:00, 4:15, 4:25 and 4:30.'})}catch(e){}}
    else toast('Notifications blocked','Allow notifications for this site in Chrome\'s address bar (the icon left of the URL), then try again.','warn')})
}
function checkGates(){
  if(!sessOk())return;
  allTasks().forEach(function(t){
    if(t.status!=='active'||!running(t))return;
    t.fired=t.fired||{};var m=elapsed(t)/60,changed=false;
    GATES.forEach(function(g){if(m>=g.m&&!t.fired[g.id]){t.fired[g.id]=1;changed=true;if(m<g.m+10)alertUser(t,g.t+' · '+t.app+' · '+g.l,gateMessage(t,g),g.m>=255||g.id==='g45'?'crit':'warn')}});
    var c=counts(t),es=elapsed(t);
    if((m>=45||t.huntDone)&&c.n<30){var pr=oldestProg(t),M=metrics(t);
      if(pr){var spent=(es-(pr.startAt||es))/60;if(spent>=M.target&&!pr.w1){pr.w1=1;changed=true;alertUser(t,'Over budget · '+first(pr),'You\'ve spent '+mmss(spent*60)+' on it; budget is '+mmss(M.target*60)+'. Wrap it up and mark it Done.','warn')}else if(spent>=2*M.target&&!pr.w2){pr.w2=1;changed=true;alertUser(t,'Still on “'+first(pr)+'”','Twice the budget. Finish it or park it and start the next draft.','warn')}}
      else if(c.draft){var idleFrom=Math.max(t.huntDone?(t.huntAt||0):45*60,t.lastAct||0),idle=(es-idleFrom)/60;if(idle>=2&&(!t.nudgeAt||es-t.nudgeAt>=300)){t.nudgeAt=es;changed=true;alertUser(t,'Start the next finding · '+t.app,c.draft+' draft'+(c.draft>1?'s':'')+' waiting and nothing In progress for '+Math.round(idle)+' min. Move one to In progress, run Flow, log it in Feather.','warn')}}
    }
    if(c.n>=30&&c.b>=5&&c.fr>=5&&!t.fired.ready){t.fired.ready=1;changed=true;alertUser(t,'Ready to submit · '+t.app,'30 done with '+c.b+' Bugs and '+c.fr+' FRs. Runtime Quality, final checks, submit in Feather.','ok')}
    if(changed)saveTask(t);
  });
}
function markPastGates(t){t.fired=t.fired||{};var m=elapsed(t)/60;GATES.forEach(function(g){if(m>=g.m)t.fired[g.id]=1})}

/* ---------- toasts ---------- */
function toast(h,p,tone,tid){var box=$('#toasts');if(!box){box=document.createElement('div');box.id='toasts';box.className='toasts';box.setAttribute('aria-live','polite');document.body.appendChild(box)}
  var el=document.createElement('div');el.className='toast';el.innerHTML='<b>'+esc(h)+'</b>'+(p?'<span>'+esc(p)+'</span>':'')+'<button type="button">Dismiss</button>';
  el.querySelector('button').onclick=function(){el.remove()};box.appendChild(el);while(box.children.length>2)box.firstChild.remove();
  if(tone!=='crit'&&tone!=='warn')setTimeout(function(){el.remove()},2600)}

/* ---------- view state ---------- */
var VIEW={mode:IDX.cur?'task':'empty',filter:'all',addType:'bug',q:'',pastQ:'',editHead:false,confirmDel:null,sync:false,newErr:''};
if(IDX.cur&&!TASKS[IDX.cur]){IDX.cur=null;VIEW.mode='empty'}

/* ---------- render ---------- */
function render(){
  if(!sessOk()){root.innerHTML=authScreen();var ae=$('#aCode')||$('#aEmail');if(ae&&!ae.value)ae.focus();return}
  var t=cur(),keep={};['main','fscroll','tright'].forEach(function(id){var el=$('#'+id);if(el)keep[id]=el.scrollTop});
  root.innerHTML='<div class="app'+(IDX.settings.noside?' noside':'')+'">'+(IDX.settings.noside?'<button class="btn sm sideopen" data-a="collapse" aria-label="Show task list">»</button>':'')+sideHtml()+'<main class="main" id="main">'+(VIEW.mode==='lib'?libHtml():VIEW.mode!=='new'&&t?taskHtml(t):'<div class="wrap">'+(VIEW.mode==='new'?newHtml():emptyHtml())+'</div>')+'</main></div>';
  $$('.f textarea').forEach(grow);
  Object.keys(keep).forEach(function(id){var el=$('#'+id);if(el)el.scrollTop=keep[id]});
  syncBits();tick();
}
function sideHtml(){
  var q=VIEW.q.toLowerCase(),ts=allTasks().filter(function(t){if(!q)return true;return(t.app+' '+(t.featherId||'')+' '+(t.findings||[]).map(function(f){return f.text+' '+(f.rub?RF.map(function(k){return f.rub[k.k]||''}).join(' '):'')}).join(' ')+' '+(t.notes||'')).toLowerCase().indexOf(q)>=0});
  var act=ts.filter(function(t){return t.status==='active'||t.status==='mfr'}),hist=ts.filter(function(t){return!(t.status==='active'||t.status==='mfr')});
  var item=function(t){var c=counts(t);return'<button class="titem" data-a="open" data-id="'+t.id+'" aria-current="'+(t.id===IDX.cur&&VIEW.mode==='task')+'"><b>'+esc(t.app||'Untitled app')+'</b><span>'+hm(elapsed(t))+' · '+c.n+'/30 · '+OUT[t.status][0]+'</span><span>'+day(t.createdAt)+(t.featherId?' · '+t.featherId.slice(0,8):'')+'</span></button>'};
  var notif='Notification' in window?(Notification.permission==='granted'&&IDX.settings.notify?'Desktop reminders on':Notification.permission==='denied'?'Reminders blocked in Chrome':'Turn on desktop reminders'):'Desktop reminders unsupported';
  return'<aside class="side" id="side"><button class="btn sm ghost sidecollapse" data-a="collapse" aria-label="Hide task list">«</button><div class="brand"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2" y="2" width="24" height="24" rx="7" stroke="currentColor" stroke-width="2"/><path d="M8 14.5l4 4 8-9" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><div><b>AI Trainer Tasker</b><span class="lab">AHT 4:30 · 30 findings</span></div></div>'+
  '<div class="search"><button class="btn pri" data-a="new" style="width:100%;justify-content:center;margin-bottom:8px">New task</button><button class="btn" data-a="lib" aria-current="'+(VIEW.mode==='lib')+'" style="width:100%;justify-content:center;margin-bottom:8px">Rubric library · '+allRubrics().length+'</button><input class="in" id="tq" data-in="q" placeholder="Search tasks and findings" value="'+esc(VIEW.q)+'" aria-label="Search tasks and findings"></div>'+
  '<nav class="tlist" aria-label="Tasks">'+(act.length?'<div class="tgroup lab">Active</div>'+act.map(item).join(''):'')+(hist.length?'<div class="tgroup lab">History · '+hist.length+'</div>'+hist.map(item).join(''):'')+(!ts.length?'<p class="muted" style="padding:8px 10px;margin:0;font-size:13px">'+(q?'Nothing matches.':'No tasks yet.')+'</p>':'')+'</nav>'+
  '<div class="sidefoot"><span class="synclab" id="syncLab"></span><button class="btn sm" data-a="notify">'+notif+'</button><label class="row" style="font-size:12.5px"><input type="checkbox" id="snd" data-in="sound"'+(IDX.settings.sound?' checked':'')+'> Sound with each alert</label><div class="row"><button class="btn sm" data-a="export">Export backup</button><button class="btn sm ghost" data-a="signout">Sign out</button><label class="btn sm" for="imp">Import</label><input type="file" id="imp" accept="application/json" hidden></div></div></aside>';
}
function emptyHtml(){return'<div class="card empty"><h1 style="margin:0;font-size:22px">Start a task</h1><p class="muted" style="margin:0;max-width:56ch">Paste the Feather link, match the clock to Hubstaff, and log findings as you hunt. Every character saves as you type. Desktop reminders tell you what to do at 0:35, 0:45, 2:00 and 4:30.</p><button class="btn pri" data-a="new">New task</button></div>'}
function newHtml(){
  var apps={};allTasks().forEach(function(t){if(t.app)apps[t.app]=1});
  var act=allTasks().filter(function(t){return t.status==='active'}),mfr=allTasks().filter(function(t){return t.status==='mfr'});
  var warn=act.length>=1&&!mfr.length?'<div class="banner">You already have an active task. Standard is 1 at a time; a second is allowed only while the first waits on an MFR or HDM review. New experts: 1 only.</div>':act.length+mfr.length>=2?'<div class="banner">You have 2 tasks open. That is the max, and only while one waits on an MFR or HDM review.</div>':'';
  return'<div class="row"><button class="btn sm mobtoggle" data-a="menu">Tasks</button></div><form class="card form" id="newForm" autocomplete="off"><h1 style="margin:0;font-size:22px">New task</h1>'+warn+
  '<label for="nApp">App name<input class="in" id="nApp" list="appList" placeholder="e.g. Salesforce clone" required><datalist id="appList">'+Object.keys(apps).map(function(a){return'<option value="'+esc(a)+'">'}).join('')+'</datalist><span class="hint" id="nAppHint">Same name as before lets the app check your past findings for duplicates.</span></label>'+
  '<label for="nUrl">Feather link<input class="in mono" id="nUrl" placeholder="https://…/tasks/625cc481-e437-496e-8393-1ff6a0fe5970"><span class="hint" id="nUrlHint">The task ID after /tasks/ is pulled out for you.</span></label>'+
  '<label for="nTime">Hubstaff time on this task, as it shows right now<input class="in mono" id="nTime" placeholder="0:00:00" style="max-width:160px" inputmode="numeric"><span class="hint">Type it while Hubstaff keeps running: 1:23:45, 1:23 or just 12345. The seconds you take to type are added. Leave empty for 0:00:00.</span></label>'+
  '<label class="row" style="flex-direction:row;font-weight:500"><input type="checkbox" id="nRun" checked> Hubstaff is running now</label>'+'<label class="row" style="flex-direction:row;font-weight:500"><input type="checkbox" id="nAdd"> Additional task (partly done by a former expert)</label>'+'<label class="row" style="flex-direction:row;font-weight:500"><input type="checkbox" id="nLate" data-a="lateToggle"> I already started this task (forgot to log it here)</label>'+'<fieldset class="late" id="lateBox" hidden><legend class="lab">Work done before tracking</legend><p class="hint" style="margin:0">Hubstaff time is required above. These counts are added to your totals; findings you add here are tracked as usual.</p><div class="lgrid"><label for="nPreF">Found so far<input class="in mono" id="nPreF" type="number" min="0" value="0"></label><label for="nPreL">Logged in Feather<input class="in mono" id="nPreL" type="number" min="0" value="0"></label><label for="nPreB">…of those, Bugs<input class="in mono" id="nPreB" type="number" min="0" value="0"></label><label for="nPreR">…of those, FRs<input class="in mono" id="nPreR" type="number" min="0" value="0"></label></div><label class="row" style="flex-direction:row;font-weight:500"><input type="checkbox" id="nHunt"> The 45-minute triage window is used up (the clock starts at 0:45 or your Hubstaff time, whichever is later)</label></fieldset>'+
  '<p class="hint err" id="nErr">'+esc(VIEW.newErr)+'</p><div class="row"><button class="btn pri" type="submit">Start task</button><button class="btn" type="button" data-a="cancelNew">Cancel</button></div></form>';
}
function taskHtml(t){
  var c=counts(t),s=nextStep(t),e=elapsed(t),act=t.status==='active',past=pastFor(t),key=appKey(t.app);
  var ageD=(Date.now()-t.createdAt)/864e5,nb='';if(act&&ageD>=1)nb+='<div class="banner"><span>Claimed '+Math.floor(ageD)+' day'+(ageD>=2?'s':'')+' ago. Finish within 1–2 days; tasks held 3–4 days can be extracted automatically.</span></div>';if(t.additional&&act)nb+='<div class="banner"><span><b>Additional task.</b> Review the existing findings and reviewer feedback first, delete the flawed ones, keep the valid ones. You can\'t unclaim it yourself: open a POD ticket asking an HDM to remove it.</span></div>';if(act&&!notifyOk()&&'Notification' in window&&Notification.permission!=='denied')nb='<div class="banner"><span>Desktop reminders are off. Turn them on so Chrome alerts you at each gate.</span><button class="btn sm" data-a="notify">Turn on</button></div>';
  var head='<div class="thead"><div style="display:flex;flex-direction:column;gap:6px;min-width:0"><div class="row"><button class="btn sm mobtoggle" data-a="menu">Tasks</button><span class="pill '+OUT[t.status][1]+'">'+OUT[t.status][0]+'</span><span class="lab">Claimed '+day(t.createdAt)+'</span></div>'+
    (VIEW.editHead?'<form class="row" id="headForm"><input class="in" id="eApp" value="'+esc(t.app)+'" aria-label="App name" style="max-width:260px"><input class="in mono" id="eUrl" value="'+esc(t.featherUrl||'')+'" placeholder="Feather link" aria-label="Feather link" style="max-width:420px"><button class="btn sm pri" type="submit">Save</button><button class="btn sm" type="button" data-a="editHead">Cancel</button></form>':
    '<h1>'+esc(t.app||'Untitled app')+'</h1><div class="row">'+(t.featherId?'<span class="fid"><code title="Feather task ID">'+esc(t.featherId)+'</code><button class="btn sm ghost" data-a="copyId">Copy</button></span>':'<span class="muted">No Feather ID</span>')+(t.featherUrl?'<a class="btn sm" href="'+esc(t.featherUrl)+'" target="_blank" rel="noopener">Open in Feather ↗</a>':'')+'<button class="btn sm ghost" data-a="editHead">Edit</button></div>')+
    '</div><div class="row">'+(act?'<button class="btn sm" data-a="end" data-s="submitted"'+(c.n>=30?'':' title="Usually after 30 findings with 5 Bugs and 5 FRs"')+'>Mark submitted</button><button class="btn sm" data-a="end" data-s="mfr">MFR submitted</button><button class="btn sm" data-a="end" data-s="outdated" title="Task went Outdated: submit it right away">Outdated · submitted</button><button class="btn sm danger" data-a="end" data-s="unclaimed">'+(t.additional?'Removed by HDM':'Unclaimed / released')+'</button>'+(elapsed(t)>=120*60&&counts(t).all<10&&!t.mfrRun?'<button class="btn sm" data-a="mfrRun">I ran the MFR workflow</button>':''):t.status==='mfr'?'<button class="btn sm" data-a="end" data-s="active">HDM: keep working</button><button class="btn sm" data-a="end" data-s="released">HDM closed it</button>':'<button class="btn sm" data-a="end" data-s="active">Reopen</button>')+(VIEW.confirmDel===t.id?'<button class="btn sm danger" data-a="delTask">Confirm delete task</button>':'<button class="btn sm ghost danger" data-a="delTask">Delete</button>')+'</div></div>';
  var tk=[0,45,90,180,240,270];
  var clock='<div class="card"><div class="clockcard"><div><div class="lab">AHT · synced to Hubstaff</div><div class="clock" id="clk">'+hms(e)+'<small> / 4:30:00</small></div><div class="lab" id="left" style="margin-top:6px">'+(e<AHT*60?hm(AHT*60-e)+' left':'Over AHT by '+hm(e-AHT*60))+'</div></div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;min-width:0"><div class="bar" aria-hidden="true"><i id="clkBar" style="width:'+Math.min(100,e/(AHT*60)*100)+'%"></i>'+[45,90,180,240].map(function(m){return'<u style="left:'+(m/AHT*100)+'%"></u>'}).join('')+'</div><div class="ticks">'+tk.map(function(m){return'<span style="left:'+(m/AHT*100)+'%">'+hm(m*60)+'</span>'}).join('')+'</div>'+
    '<div class="row">'+(t.status==='active'||t.status==='mfr'?'<button class="btn sm '+(running(t)?'':'pri')+'" data-a="run">'+(running(t)?'Pause (Hubstaff stopped)':'Resume (Hubstaff running)')+'</button>'+(elapsed(t)<45*60&&!t.huntDone?'<button class="btn sm" data-a="huntDone">Exploration done</button>':'')+'<button class="btn sm" data-a="sync">Sync to Hubstaff</button><button class="btn sm" data-a="nudge" data-d="-60">−1 min</button><button class="btn sm" data-a="nudge" data-d="60">+1 min</button>':'')+'</div>'+
    (VIEW.sync?'<form class="row" id="syncForm"><label for="syncIn" class="hint">Look at Hubstaff and type its time</label><input class="in mono" id="syncIn" placeholder="1:23:45" inputmode="numeric" style="width:120px"><button class="btn sm pri" type="submit">Set</button><button class="btn sm" type="button" data-a="sync">Cancel</button><span class="hint" style="flex-basis:100%">No need to stop Hubstaff. The seconds you take to type are added automatically.</span></form>':'')+
    '</div></div><div class="counts"><div><b>'+c.all+'</b><span>found</span></div><div><b id="cN">'+c.n+'<small class="muted" style="font-size:14px">/30</small></b><span>logged (Done)</span></div><div><b style="color:var(--bug)">'+c.b+'</b><span>Bugs · min 5</span></div><div><b style="color:var(--fr)">'+c.fr+'</b><span>FRs · min 5</span></div><div><b>'+c.prog+'</b><span>in progress</span></div><div><b>'+c.draft+'</b><span>not started</span></div><div><b>'+(e>=300?(c.n/(e/3600)).toFixed(1):'—')+'</b><span>done / hour</span></div></div></div>';
  var fl=(t.findings||[]).filter(function(f){return VIEW.filter==='all'||f.status===VIEW.filter});
  var findings='<div class="card"><div class="row"><span class="lab">Findings · rapid hunt</span><span class="sp"></span><div class="seg" role="group" aria-label="Filter">'+[['all','All '+c.all],['draft','Draft '+c.draft],['progress','In progress '+c.prog],['done','Done '+c.n]].map(function(x){return'<button type="button" class="all" data-a="filter" data-f="'+x[0]+'" aria-pressed="'+(VIEW.filter===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>'+
    (t.pre||VIEW.editPre?'<div class="prebar">'+(VIEW.editPre?'<form class="row" id="preForm"><span class="lab">Before tracking</span><label class="hint">Found <input class="in mono sm" id="pF" type="number" min="0" value="'+((t.pre||{}).f||0)+'"></label><label class="hint">Logged <input class="in mono sm" id="pL" type="number" min="0" value="'+((t.pre||{}).l||0)+'"></label><label class="hint">Bugs <input class="in mono sm" id="pB" type="number" min="0" value="'+((t.pre||{}).b||0)+'"></label><label class="hint">FRs <input class="in mono sm" id="pR" type="number" min="0" value="'+((t.pre||{}).r||0)+'"></label><button class="btn sm pri" type="submit">Save</button><button class="btn sm" type="button" data-a="editPre">Cancel</button></form>':'<span class="lab">Before tracking</span><span>'+(t.pre.f||0)+' found · '+(t.pre.l||0)+' logged ('+(t.pre.b||0)+' Bugs, '+(t.pre.r||0)+' FRs) · included in your totals</span><button class="btn sm ghost" data-a="editPre">Edit</button>')+'</div>':'<div class="prebar quiet"><button class="btn sm ghost" data-a="editPre">+ Add findings made before tracking</button></div>')+'<form class="addbar" id="addForm"><div class="seg" role="group" aria-label="Type">'+[['bug','Bug'],['fr','FR'],['unk','?']].map(function(x){return'<button type="button" class="'+x[0]+'" data-a="addType" data-t="'+x[0]+'" aria-pressed="'+(VIEW.addType===x[0])+'">'+x[1]+'</button>'}).join('')+'</div><input class="in" id="addIn" placeholder="'+(VIEW.addType==='fr'?'Page: Capability should …':'Page: Component failure when trigger')+'  (Enter adds a draft)" aria-label="New draft finding"><button class="btn pri" type="submit">Add</button></form>'+
    '<div class="row hint"><span>Circle: not started → in progress (running Flow) → done (logged in Feather). Found counts every finding; logged counts Done.</span><span class="sp"></span><span class="saved" data-saved></span></div>'+
    '<div class="fscroll" id="fscroll">'+(VIEW.filter==='all'?groupedHtml(t,fl,c):'<div class="flist">'+(fl.length?fl.map(function(f){return fHtml(t,f)}).join(''):'<p class="muted" style="margin:0">Nothing in this filter.</p>')+'</div>')+'</div></div>';
  var gates='<div class="next '+s.tone+'" id="next"><span class="lab">Rule check</span><h2>'+esc(s.h)+'</h2><p>'+esc(s.p)+'</p></div><div class="card" id="strat">'+stratHtml(t)+'</div>'+
    '<div class="card"><span class="lab">Gates</span><div class="gates" id="gates">'+gatesHtml(e)+'</div></div>';
  var notes='<div class="card"><div class="row"><span class="lab">Scratch notes</span><span class="sp"></span><span class="saved" data-saved></span></div><textarea class="in notes" id="notes" data-in="notes" placeholder="Workflows to try, things to re-check, real-app comparisons…" aria-label="Scratch notes">'+esc(t.notes||'')+'</textarea></div>';
  var pq=VIEW.pastQ.toLowerCase(),pl=past.filter(function(p){return!pq||String(p.f.text).toLowerCase().indexOf(pq)>=0});
  var nTasks={};past.forEach(function(p){nTasks[p.task.id]=1});
  var pastHtml='<div class="card"><span class="lab">Past findings on '+esc(t.app||'this app')+'</span>'+(past.length?'<p class="hint" style="margin:0">'+Object.keys(nTasks).length+' earlier task'+(Object.keys(nTasks).length>1?'s':'')+', '+past.length+' findings. Drafts that match one get an amber flag.</p><input class="in" data-in="pastQ" id="pastQ" placeholder="Search past findings" value="'+esc(VIEW.pastQ)+'" aria-label="Search past findings"><div class="past">'+pl.slice(0,200).map(function(p){var first=String(p.f.text||'').split('\n')[0];return'<div class="pf '+p.f.type+'"><div class="m">'+day(p.task.createdAt)+' · '+(p.f.type==='bug'?'Bug':p.f.type==='fr'?'FR':'?')+' · '+(p.f.status==='done'?'done':p.f.status)+'</div>'+esc(first||'(empty)')+'</div>'}).join('')+'</div>':'<p class="hint" style="margin:0">'+(key?'First task on this app. Next time you claim it, this list shows what you already filed.':'Name the app to compare with earlier tasks.')+'</p>')+'</div>';
  return'<div class="tview"><section class="tcenter" aria-label="Findings">'+findings.replace('<div class="card">','<div class="card fcard">')+'</section><aside class="tright" id="tright" aria-label="Task, clock and rules"><div class="rtop">'+nb+head+'<div class="mbar" id="mbar">'+mbarHtml(t)+'</div>'+clock+'</div><div class="rrest">'+gates+notes+pastHtml+'</div></aside></div>';
}
function mbarHtml(t){
  var e=elapsed(t),m=e/60,st=stageFor(t,m),c=counts(t),dn=doNow(t),nx=null;for(var i=0;i<GATES.length;i++)if(GATES[i].m>m){nx=GATES[i];break}
  var segs=STAGES.map(function(x){var w=(x.b-x.a)/AHT*100,on=x===st,pct=on?Math.min(100,(m-x.a)/(x.b-x.a)*100):m>=x.b?100:0;return'<div class="seg2'+(on?' on':m>=x.b?' past':'')+'" style="flex:'+w+' 1 0"><i style="width:'+pct+'%"></i><b>'+x.n+'</b><span>'+hm(x.a*60)+'–'+hm(x.b*60)+'</span></div>'}).join('');
  return'<div class="mrow"><div class="mclock"><span class="lab">AHT · '+(running(t)?'running':'paused')+'</span><b class="mono">'+hms(e)+'</b><span class="mono muted">'+(e<AHT*60?hm(AHT*60-e)+' left of 4:30':'over AHT by '+hm(e-AHT*60))+'</span></div>'+
  '<div class="mstage"><div class="segs">'+segs+'</div><div class="mnow"><span class="pill info">Stage · '+st.n+'</span><span class="mdesc">'+esc(st.d)+'</span><span class="mono mends">'+(m<st.b?'ends in '+mmss((st.b-m)*60):'')+'</span></div></div>'+
  '<div class="mcount"><div><b class="mono">'+c.all+'</b><span>found</span></div><div><b class="mono">'+c.n+'</b><span>logged</span></div><div><b class="mono">'+(nx?nx.t:'—')+'</b><span>'+(nx?'next gate · '+mmss((nx.m-m)*60):'no gates left')+'</span></div></div></div>'+
  (dn?'<div class="mdo '+dn.tone+'"><span class="lab">Do now</span><b>'+esc(dn.h)+'</b><span>'+esc(dn.p)+'</span></div>':'');
}
function stratHtml(t){
  var M=metrics(t),c=M.c,tone=function(a,b){return a>=b-1?'ok':'warn'};
  if(t.status!=='active')return'<span class="lab">Pace</span><p class="hint" style="margin:0">Found '+c.all+' · logged '+c.n+' in '+hm(elapsed(t))+'. Average capture '+(M.avgCap?mmss(M.avgCap*60):'—')+', average log '+(M.avgLog?mmss(M.avgLog*60):'—')+'.</p>';
  var verdict=c.n>=30?'Logged 30.':M.feasible?'On track: about '+Math.min(30,M.proj)+(M.proj>=30?'+':'')+' logged by 4:15 at your pace.':'Short: about '+M.proj+' logged by 4:15 at your pace. Speed up, or plan the MFR workflow (under 30 at 4:30).';
  return'<span class="lab">Your pace · learned from this task</span>'+
  '<div class="sgrid"><div class="'+tone(c.all,M.pf)+'"><b class="mono">'+c.all+' / '+Math.round(M.pf)+'</b><span>found / plan now</span></div><div class="'+tone(c.n,M.pl)+'"><b class="mono">'+c.n+' / '+Math.round(M.pl)+'</b><span>logged / plan now</span></div>'+
  '<div><b class="mono">'+(M.avgCap?mmss(M.avgCap*60):'—')+'</b><span>avg to capture one</span></div><div><b class="mono">'+(M.avgLog?mmss(M.avgLog*60):'—')+'</b><span>avg to log one</span></div>'+
  '<div class="'+(c.n>=30?'':M.feasible?'ok':'crit')+'"><b class="mono">'+(c.n>=30?'—':M.feasible?mmss(M.target*60):'under 1:30')+'</b><span>budget per remaining finding</span></div><div><b class="mono">'+(c.n>=30?c.n:M.proj>=30?'30+':M.proj)+'</b><span>projected logged at 4:15</span></div></div>'+
  '<p class="hint" style="margin:0">'+esc(verdict)+(M.avgLog?'':' Logging time is estimated at 6:00 until you finish your first In progress → Done.')+'</p>';
}
function groupedHtml(t,fl,c){
  if(!fl.length)return'<p class="muted" style="margin:0">No findings yet. Type what you see above and press Enter.</p>';
  var by=function(st){return fl.filter(function(f){return f.status===st})};
  var pr=by('progress'),dr=by('draft'),dn=by('done'),open=!!IDX.settings.showDone,h='';
  var sec=function(label,list){return list.length?'<div class="ghead"><span class="lab">'+label+' · '+list.length+'</span></div><div class="flist">'+list.map(function(f){return fHtml(t,f)}).join('')+'</div>':''};
  h+=sec('In progress',pr)+sec('Not started',dr);
  if(!pr.length&&!dr.length)h+='<p class="muted" style="margin:0">Everything is done. Add the next finding above.</p>';
  if(dn.length)h+='<button type="button" class="donebar" data-a="toggleDone" aria-expanded="'+open+'"><span class="lab">Done · '+dn.length+'</span><span class="sp"></span><span>'+(open?'Hide':'Show')+'</span></button>'+(open?'<div class="flist">'+dn.map(function(f){return fHtml(t,f)}).join('')+'</div>':'');
  return h}
function gatesHtml(e){return GATES.map(function(g,i){var m=e/60,nx=GATES[i+1];var st=m>=g.m&&(!nx||m<nx.m)?'now':m>=g.m?'past':'';return'<div class="gate '+st+'"><span class="t">'+g.t+'</span><i></i><span>'+esc(g.l)+'</span></div>'}).join('')}
function fHtml(t,f){
  var d=dupOf(t,f);
  return'<div class="f '+f.status+(d?' dup':'')+'" data-fid="'+f.id+'"><button class="st '+f.status+'" data-a="cycle" data-id="'+f.id+'" aria-label="Status: '+f.status+'. Click to change">'+(f.status==='done'?'<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>':'')+'</button>'+
  '<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><div class="fh"><button class="chip '+f.type+'" data-a="ftype" data-id="'+f.id+'">'+(f.type==='bug'?'BUG':f.type==='fr'?'FR':'TYPE?')+'</button><span class="lab">'+(f.status==='draft'?'Not started':f.status==='progress'?'In progress':'Done')+' · found at '+hm(f.at||0)+(f.status==='done'&&f.startAt!=null&&f.doneAt!=null?' · logged in '+mmss(f.doneAt-f.startAt):'')+'</span>'+(f.status==='progress'?'<span class="ftimer" data-ft="'+f.id+'"></span>':'')+'<span class="sp"></span>'+(VIEW.confirmDel===f.id?'<button class="btn sm danger" data-a="delF" data-id="'+f.id+'">Confirm delete</button>':'<button class="btn sm ghost" data-a="delF" data-id="'+f.id+'" aria-label="Delete finding">Delete</button>')+'</div>'+
  '<textarea data-in="ftext" data-id="'+f.id+'" rows="2" aria-label="Finding notes" placeholder="First line: summary. Then steps, expected vs actual…">'+esc(f.text||'')+'</textarea><div class="fmtbox">'+fmtHint(f)+'</div><div class="dupbox">'+dupHtml(d)+'</div>'+rubCardHtml(t,f)+'</div></div>';
}
function fmtHint(f){
  var line=String(f.text||'').split('\n')[0].trim();if(line.length<8||f.status==='draft')return'';
  if(/^(bug|fr|feature request|p[0-2])\b/i.test(line))return'<div class="fmthint">Start with the page name, not “Bug”, “FR” or a priority.</div>';
  var i=line.indexOf(':');
  if(i<2)return'<div class="fmthint">Summary format: '+(f.type==='fr'?'Page: Capability should …':'Page: Component failure when trigger')+'</div>';
  if(/^\s*[^:]+\s-\s/.test(line.slice(0,i+1)))return'<div class="fmthint">Use a colon after the page name, not a dash.</div>';
  if(f.type==='fr'&&!/\bshould\b/i.test(line.slice(i+1)))return'<div class="fmthint">FR summaries say what it should do: “Page: Capability should …”</div>';
  return'';
}
function grow(el){el.style.height='auto';el.style.height=el.scrollHeight+'px'}

/* ---------- tick ---------- */
var lastMin=-1;
function tick(){
  var t=cur();
  if(t&&VIEW.mode==='task'){var e=elapsed(t),c=$('#clk'),b=$('#clkBar'),l=$('#left');
    if(c)c.innerHTML=hms(e)+'<small> / 4:30:00</small>';if(b)b.style.width=Math.min(100,e/(AHT*60)*100)+'%';if(l)l.textContent=e<AHT*60?hm(AHT*60-e)+' left':'Over AHT by '+hm(e-AHT*60);
    document.title=hm(e)+' · '+counts(t).n+'/30 · '+(t.app||'Task')+' · AI Trainer Tasker';
    var m=Math.floor(e/60);if(m!==lastMin){lastMin=m;var nx=$('#next');if(nx){var s=nextStep(t);nx.className='next '+s.tone;nx.innerHTML='<span class="lab">Rule check</span><h2>'+esc(s.h)+'</h2><p>'+esc(s.p)+'</p>'}}var gb=$('#gates');if(gb)gb.innerHTML=gatesHtml(e);
    var mb=$('#mbar');if(mb)mb.innerHTML=mbarHtml(t);
    if(Math.floor(e)%5===0){var sg=$('#strat');if(sg)sg.innerHTML=stratHtml(t)}
    var M=null;$$('[data-ft]').forEach(function(el){var f=findF(t,el.dataset.ft);if(!f)return;M=M||metrics(t);var sp=e-(f.startAt||e),tg=M.target*60;el.textContent=mmss(sp)+' / '+mmss(tg);el.className='ftimer'+(sp>tg?' over':'')});
  }else document.title='AI Trainer Tasker';
}
setInterval(tick,1000);
setInterval(checkGates,15000);
document.addEventListener('visibilitychange',function(){if(!document.hidden){checkGates();tick()}});

/* ---------- actions ---------- */
function openTask(id){IDX.cur=id;saveIdx();VIEW.mode='task';VIEW.editHead=false;VIEW.sync=false;VIEW.confirmDel=null;VIEW.pastQ='';var sd=$('#side');if(sd)sd.classList.remove('open');render();var m=$('#main');if(m)m.scrollTop=0}
document.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,t=cur();
  if(a!=='delF'&&a!=='delTask')VIEW.confirmDel=null;
  if(a==='new'){VIEW.mode='new';VIEW.newErr='';render();var i=$('#nApp');if(i)i.focus();return}
  if(a==='cancelNew'){VIEW.mode=cur()?'task':'empty';render();return}
  if(a==='open'){openTask(b.dataset.id);return}
  if(a==='menu'){var sd=$('#side');if(sd)sd.classList.toggle('open');return}
  if(a==='notify'){askPermission();return}
  if(a==='export'){exportData();return}
  if(a==='mfrRun'&&t){t.mfrRun=true;saveTask(t);render();toast('MFR workflow noted','Follow its outcome: keep working, or submit the MFR.','ok');return}
  if(a==='authBack'){VIEWAUTH.sent=false;VIEWAUTH.err='';render();return}
  if(a==='authResend'){authSubmit(true);return}
  if(a==='signout'){api({action:'signout'}).catch(function(){});signOutLocal('');return}
  if(a==='lateToggle'){var lb=$('#lateBox');if(lb)lb.hidden=!b.checked;return}
  if(a==='huntDone'&&t){t.huntDone=true;t.huntAt=elapsed(t);saveTask(t);render();toast('Exploration done','Stage moved to Log: In progress → Flow → Feather.','ok');return}
  if(a==='editPre'&&t){VIEW.editPre=!VIEW.editPre;render();return}
  if(a==='collapse'){IDX.settings.noside=!IDX.settings.noside;saveIdx();render();return}
  if(!t)return;
  if(a==='copyId'){var done=function(){toast('Copied',t.featherId,'ok')};if(navigator.clipboard)navigator.clipboard.writeText(t.featherId).then(done,function(){prompt('Copy the Feather ID',t.featherId)});return}
  if(a==='editHead'){VIEW.editHead=!VIEW.editHead;render();return}
  if(a==='run'){running(t)?pause(t):resume(t);t.clockU=Date.now();saveTask(t);render();return}
  if(a==='sync'){VIEW.sync=!VIEW.sync;VIEW.syncT0=null;render();var si=$('#syncIn');if(si)si.focus();return}
  if(a==='nudge'){setElapsed(t,Math.max(0,elapsed(t)+(+b.dataset.d)));t.clockU=Date.now();markPastGates(t);saveTask(t);render();return}
  if(a==='toggleDone'){IDX.settings.showDone=!IDX.settings.showDone;saveIdx();render();return}
  if(a==='filter'){VIEW.filter=b.dataset.f;render();return}
  if(a==='addType'){VIEW.addType=b.dataset.t;var ai0=$('#addIn');if(ai0)ai0.placeholder=(VIEW.addType==='fr'?'Page: Capability should …':'Page: Component failure when trigger')+'  (Enter adds a draft)';$$('[data-a="addType"]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});var ai=$('#addIn');if(ai)ai.focus();return}
  if(a==='cycle'){var f=findF(t,b.dataset.id);if(f.status==='progress'){openRub(t,f,'done');return}f.status=f.status==='draft'?'progress':f.status==='progress'?'done':'draft';var now=elapsed(t);if(f.status==='progress'){f.startAt=now;f.w1=0;f.w2=0}if(f.status==='done'){f.doneAt=now;if(f.startAt==null)f.startAt=now}if(f.status==='draft'){delete f.doneAt;delete f.startAt}t.lastAct=now;f.u=Date.now();saveTask(t);render();if(f.status==='done')toast('Logged · '+counts(t).n+' done','Find it under Done at the bottom of the list.','ok');checkGates();return}
  if(a==='ftype'){var g=findF(t,b.dataset.id);g.type=g.type==='bug'?'fr':g.type==='fr'?'unk':'bug';g.u=Date.now();saveTask(t);render();return}
  if(a==='delF'){if(VIEW.confirmDel!==b.dataset.id){VIEW.confirmDel=b.dataset.id;render();return}t.findings=t.findings.filter(function(x){return x.id!==b.dataset.id});(t.delF=t.delF||[]).push(b.dataset.id);VIEW.confirmDel=null;saveTask(t);render();toast('Finding deleted','','ok');return}
  if(a==='delTask'){if(VIEW.confirmDel!==t.id){VIEW.confirmDel=t.id;render();return}try{localStorage.removeItem(P+'t.'+t.id)}catch(e){}delete TASKS[t.id];IDX.ids=IDX.ids.filter(function(x){return x!==t.id});var did=t.id;IDX.cur=null;saveIdx();VIEW.mode='empty';VIEW.confirmDel=null;render();pushDelete(did);toast('Task deleted','','ok');return}
  if(a==='end'){var s=b.dataset.s;t.clockU=Date.now();if(s==='active'){t.status='active';resume(t)}else{pause(t);t.status=s;t.endedAt=Date.now()}saveTask(t);render();
    toast(s==='mfr'?'MFR submitted':s==='submitted'?'Marked submitted':s==='form'?'MFR submitted':s==='outdated'?'Outdated task submitted':s==='unclaimed'?'Marked unclaimed':s==='released'?'Released':'Back in progress',s==='mfr'?'Keep it In Progress in Feather. You may start 1 more task while you wait.':'','ok');return}
});
function findF(t,id){return(t.findings||[]).find(function(x){return x.id===id})}
var dupTimers={};
document.addEventListener('input',function(ev){
  var el=ev.target,k=el.dataset&&el.dataset.in;if(!k)return;var t=cur();
  if(k==='q'){VIEW.q=el.value;var pos=el.selectionStart;var side=$('#side');var tmp=document.createElement('div');tmp.innerHTML=sideHtml();side.replaceWith(tmp.firstChild);var nq=$('#tq');nq.focus();nq.setSelectionRange(pos,pos);return}
  if(k==='sound'){IDX.settings.sound=el.checked;saveIdx();return}
  if(!t)return;
  if(k==='notes'){t.notes=el.value;t.notesU=Date.now();saveTask(t);return}
  if(k==='pastQ'){VIEW.pastQ=el.value;var p=el.selectionStart;render();var pi=$('#pastQ');if(pi){pi.focus();pi.setSelectionRange(p,p)}return}
  if(k==='ftext'){var f=findF(t,el.dataset.id);if(!f)return;f.text=el.value;f.u=Date.now();saveTask(t);grow(el);clearTimeout(dupTimers[f.id]);dupTimers[f.id]=setTimeout(function(){var card=el.closest('.f');if(!card)return;var fb=card.querySelector('.fmtbox');if(fb)fb.innerHTML=fmtHint(f);var d=dupOf(t,f);card.classList.toggle('dup',!!d);card.querySelector('.dupbox').innerHTML=dupHtml(d)},400)}
});
document.addEventListener('change',function(ev){if(ev.target.id==='imp'&&ev.target.files[0])importData(ev.target.files[0])});
document.addEventListener('submit',function(ev){
  var f=ev.target;ev.preventDefault();var t=cur();
  if(f.id==='authForm'){authSubmit(false);return}
  if(f.id==='preForm'&&t){var nv=function(id){return Math.max(0,parseInt($(id).value,10)||0)};t.pre={f:nv('#pF'),l:nv('#pL'),b:nv('#pB'),r:nv('#pR')};if(t.pre.l>t.pre.f)t.pre.f=t.pre.l;VIEW.editPre=false;saveTask(t);render();return}
  if(f.id==='newForm'){
    var app=$('#nApp').value.trim(),url=$('#nUrl').value.trim(),fid=parseFeather(url),sec=$('#nTime').value.trim()?parseTime($('#nTime').value):0;if(sec!=null&&$('#nRun').checked&&VIEW.syncT0)sec+=(Date.now()-VIEW.syncT0)/1000;VIEW.syncT0=null;
    if(!app){VIEW.newErr='Enter the app name.';$('#nErr').textContent=VIEW.newErr;return}
    if(sec==null){$('#nErr').textContent='Enter the Hubstaff time as h:mm or h:mm:ss, for example 0:12:30.';return}
    var late=$('#nLate').checked,hunt45=late&&$('#nHunt').checked;if(hunt45&&sec!=null&&sec<45*60)sec=45*60;if(late&&!hunt45&&!$('#nTime').value.trim()){$('#nErr').textContent='Enter the time Hubstaff shows for this task. It is required when the task is already started.';$('#nTime').focus();return}
    var num=function(id){return Math.max(0,parseInt($(id).value,10)||0)},pre=late?{f:num('#nPreF'),l:num('#nPreL'),b:num('#nPreB'),r:num('#nPreR')}:null;
    if(pre&&pre.l>pre.f)pre.f=pre.l;if(pre&&pre.b+pre.r>pre.l){$('#nErr').textContent='Bugs plus FRs can\'t be more than the number logged.';return}
    var ex=fid&&allTasks().find(function(x){return x.featherId===fid});
    if(ex){$('#nErr').innerHTML='This Feather task is already logged. <button class="btn sm" type="button" data-a="open" data-id="'+ex.id+'">Open it</button>';return}
    var nt={id:uid(),app:app,featherUrl:url,featherId:fid,createdAt:Date.now(),status:'active',clock:{base:sec,at:$('#nRun').checked?Date.now():null},clockU:Date.now(),findings:[],notes:'',fired:{},trackFrom:sec,additional:$('#nAdd').checked||undefined,pre:pre||undefined,huntDone:hunt45?true:undefined,huntAt:hunt45?45*60:undefined};
    markPastGates(nt);TASKS[nt.id]=nt;IDX.ids.push(nt.id);IDX.cur=nt.id;saveIdx();saveTask(nt);VIEW.mode='task';VIEW.filter='all';
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
    render();var ai=$('#addIn');if(ai)ai.focus();
    var prior=pastFor(nt).length;if(prior)toast('You\'ve tested '+app+' before',prior+' past findings are listed on the right. New drafts that match get flagged.','info');
    return}
  if(!t)return;
  if(f.id==='addForm'){var inp=$('#addIn'),v=inp.value.trim();if(!v)return;t.findings=t.findings||[];t.findings.unshift({id:uid(),type:VIEW.addType,status:'draft',text:v,at:elapsed(t),createdAt:Date.now(),u:Date.now()});saveTask(t);if(VIEW.filter==='done'||VIEW.filter==='progress')VIEW.filter='all';render();var ni=$('#addIn');if(ni)ni.focus();return}
  if(f.id==='syncForm'){var s=parseTime($('#syncIn').value);if(s!=null&&running(t)&&VIEW.syncT0)s+=(Date.now()-VIEW.syncT0)/1000;VIEW.syncT0=null;if(s==null){toast('Check the time','Use h:mm or h:mm:ss, for example 1:23:45.','warn');return}setElapsed(t,s);t.clockU=Date.now();markPastGates(t);VIEW.sync=false;saveTask(t);render();toast('Synced to Hubstaff','Clock now '+hms(elapsed(t))+(running(t)?' and running.':' (paused).'),'ok');return}
  if(f.id==='headForm'){t.app=$('#eApp').value.trim()||t.app;t.featherUrl=$('#eUrl').value.trim();t.featherId=parseFeather(t.featherUrl);VIEW.editHead=false;saveTask(t);render();return}
});
document.addEventListener('input',function(ev){
  if((ev.target.id==='syncIn'||ev.target.id==='nTime')&&!VIEW.syncT0)VIEW.syncT0=Date.now();
  if(ev.target.id==='nUrl'){var id=parseFeather(ev.target.value),h=$('#nUrlHint');if(!h)return;if(!ev.target.value.trim()){h.className='hint';h.textContent='The task ID after /tasks/ is pulled out for you.';return}
    var ex=id&&allTasks().find(function(x){return x.featherId===id});h.className='hint '+(id&&!ex?'ok':'err');h.textContent=id?(ex?'Already logged: '+ex.app+', '+day(ex.createdAt)+'.':'Task ID: '+id):'No task ID found. It looks like 625cc481-e437-496e-8393-1ff6a0fe5970.'}
  if(ev.target.id==='nApp'){var key=appKey(ev.target.value),n=0,tk=0,h2=$('#nAppHint');allTasks().forEach(function(x){if(appKey(x.app)===key){tk++;n+=(x.findings||[]).length}});if(h2)h2.textContent=key&&tk?'You\'ve tested this app '+tk+' time'+(tk>1?'s':'')+' ('+n+' findings). They\'ll be checked for duplicates.':'Same name as before lets the app check your past findings for duplicates.'}
});
document.addEventListener('keydown',function(ev){
  var tag=(document.activeElement&&document.activeElement.tagName)||'';
  if(['INPUT','TEXTAREA','SELECT'].indexOf(tag)>=0||ev.metaKey||ev.ctrlKey||ev.altKey)return;
  if((ev.key==='n'||ev.key==='N')&&VIEW.mode==='task'){var ai=$('#addIn');if(ai){ev.preventDefault();ai.focus()}}
});
window.addEventListener('storage',function(ev){if(!ev.key||ev.key.indexOf(P)!==0||!document.hidden)return;IDX=lsGet('index',IDX);loadTasks();render()});

/* ---------- rubric records: the real rubric you filed, split by field ---------- */
var RF=[
  {k:'summary',l:'Summary',re:/^(issue |finding )?(summary|title)$/},
  {k:'prio',l:'Priority',re:/^(priority|severity)( level)?$/},
  {k:'type',l:'Issue Type',re:/^(issue |finding )?(type|classification|category)( of finding)?$|^bug or feature request$/},
  {k:'path',l:'Page or Workflow',re:/^(page|workflow|location|path|breadcrumb|page or workflow|page workflow|page section|page or section|section)$/},
  {k:'steps',l:'Reproduction Steps',re:/^(steps|reproduction steps|steps to reproduce|repro steps|reproduction)$/},
  {k:'expected',l:'Expected Behavior',re:/^expected( behavior| behaviour| result| outcome)?$/},
  {k:'actual',l:'Actual Behavior',re:/^actual( behavior| behaviour| result| outcome)?$/},
  {k:'why',l:'Priority Justification',re:/^(priority justification|justification|why( the)? (classification|it) is valid|why valid|rationale|classification justification|why)$/},
  {k:'video',l:'Video Evidence',re:/^(video( evidence| link)?|evidence|recording|screen recording|loom)$/}
];
var RFK={};RF.forEach(function(x){RFK[x.k]=x});
var FORMK=['summary','prio','type','path','steps','expected','actual','video'];/* Priority Justification is parsed only so it doesn't spill into Actual; not kept */
var KEEP=RF.filter(function(x){return x.k!=='why'});
function rfFor(label){var n=String(label||'').toLowerCase().replace(/[^a-z ]+/g,' ').replace(/\s+/g,' ').trim();if(!n||n.length>45)return null;for(var i=0;i<RF.length;i++)if(RF[i].re.test(n))return RF[i];return null}
function normType(v){v=String(v||'').toLowerCase();return/feature|\bfr\b|request/.test(v)?'fr':/bug|defect/.test(v)?'bug':''}
function normPrio(v){var m=String(v||'').toUpperCase().match(/P\s?([0-2])/);return m?'P'+m[1]:''}
function parseRubric(raw){
  var out={},cur=null,buf=[],hits=0,lines=String(raw||'').replace(/\r/g,'').split('\n');
  function flush(){if(cur){var v=buf.join('\n').replace(/^\s+|\s+$/g,'');out[cur.k]=out[cur.k]?out[cur.k]+'\n'+v:v}buf=[]}
  lines.forEach(function(line){
    var clean=line.replace(/^\s*(#{1,6}\s*|>\s*|[-*•]\s+)/,'').replace(/\*\*|__/g,'');
    var m=clean.match(/^\s*([^:]{2,45}?)\s*:\s*(.*)$/),f=null,rest='';
    if(m){f=rfFor(m[1]);rest=m[2]}
    if(!f&&clean.trim().length<=45&&!/^\s*\d+[.)]/.test(clean)){f=rfFor(clean);rest=''}
    if(f){flush();cur=f;hits++;if(rest)buf.push(rest)}else if(cur)buf.push(line);else buf.push(line);
  });
  if(cur)flush();else{var all=buf.join('\n').trim();buf=[];if(all){var ls=all.split('\n');out.summary=ls[0].trim();if(ls.length>1)out.actual=ls.slice(1).join('\n').trim()}}
  if(out.type)out.type=normType(out.type)||out.type;if(out.prio)out.prio=normPrio(out.prio)||out.prio;
  return{fields:out,hits:hits};
}
function rubText(r){return r?[r.summary,r.path,r.actual,r.expected].filter(Boolean).join(' '):''}
function ftxt(f){return f.rub?rubText(f.rub):String(f.text||'')}
function normPath(p){return String(p||'').toLowerCase().replace(/\s*(->|→|>|\/)\s*/g,'>').replace(/[^a-z0-9>]+/g,' ').trim()}
function rubMatches(rub,selfTask,selfFid){
  var a=toks(rub.summary),aa=toks(rub.actual),np=normPath(rub.path),out=[];
  allTasks().forEach(function(t){(t.findings||[]).forEach(function(f){
    if(t.id===selfTask&&f.id===selfFid)return;
    var r=f.rub||{summary:String(f.text||'').split('\n')[0],actual:String(f.text||'').split('\n').slice(1).join(' '),type:f.type};
    var s1=sim(a,toks(r.summary)),s2=sim(aa,toks(r.actual)),pe=np&&np===normPath(r.path);
    if(!((s1.k>=3&&s1.s>=.5)||(s2.k>=4&&s2.s>=.5)||(pe&&s1.k>=2&&s1.s>=.35)))return;
    var sc=Math.max(s1.s,s2.s*.9)+(pe?.15:0),kind='dup',why='';
    var ta=rub.type||'',tb=r.type||f.type||'';
    if(ta&&tb&&ta!=='unk'&&tb!=='unk'&&ta!==tb){kind='conflict';why='filed as '+(tb==='bug'?'Bug':'FR')+' there, '+(ta==='bug'?'Bug':'FR')+' here'}
    else if(rub.prio&&r.prio&&rub.prio!==r.prio){kind='conflict';why=r.prio+' there, '+rub.prio+' here'}
    out.push({t:t,f:f,r:r,s:Math.min(1,sc),kind:kind,why:why,same:t.id===selfTask,path:pe});
  })});
  return out.sort(function(x,y){return y.s-x.s}).slice(0,6);
}
function matchesHtml(ms){
  if(!ms.length)return'<p class="hint ok" style="margin:0">No duplicates or conflicts across your recorded work.</p>';
  return ms.map(function(m){var lab=m.kind==='conflict'?'Conflict':m.same?'Duplicate in this task':'Possible duplicate';
    return'<div class="rmatch '+m.kind+'"><b>'+lab+' · '+Math.round(m.s*100)+'%'+(m.path?' · same page/workflow':'')+'</b>'+(m.why?'<span>'+esc(m.why)+'</span>':'')+'<span class="m">'+esc(m.t.app||'Untitled')+' · '+day(m.t.createdAt)+(m.t.featherId?' · '+esc(m.t.featherId.slice(0,8)):'')+'</span><span>'+esc(String(m.r.summary||'').slice(0,160))+'</span></div>'}).join('');
}
var RUB=null;
function openRub(t,f,mode){
  RUB={tid:t.id,fid:f.id,mode:mode,fields:JSON.parse(JSON.stringify(f.rub||{})),raw:(f.rub&&f.rub.raw)||''};
  if(!f.rub){RUB.fields.type=f.type==='fr'?'fr':f.type==='bug'?'bug':''}if(RUB.fields.type==='fr')RUB.fields.steps='N/A';
  var el=$('#rubModal');if(el)el.remove();el=document.createElement('div');el.id='rubModal';el.className='rmodal';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','rubTitle');
  document.body.appendChild(el);drawRub();var r=$('#rubRaw');if(r)r.focus();
}
function rubField(k){var x=RFK[k],v=RUB.fields[k]||'';
  if(k==='type')return'<label class="rf"><span class="lab">Issue Type</span><select class="in" data-rf="type"><option value="">—</option><option value="bug"'+(v==='bug'?' selected':'')+'>Bug</option><option value="fr"'+(v==='fr'?' selected':'')+'>Feature request</option></select></label>';
  if(k==='prio')return'<label class="rf"><span class="lab">Priority</span><select class="in" data-rf="prio"><option value="">—</option>'+['P0','P1','P2'].map(function(p){return'<option'+(v===p?' selected':'')+'>'+p+'</option>'}).join('')+'</select></label>';
  if(k==='steps'&&RUB.fields.type==='fr')return'<label class="rf wide"><span class="lab">Reproduction Steps</span><textarea class="in" rows="1" data-rf="steps" readonly aria-readonly="true">N/A</textarea><span class="hint">Feature requests always use N/A. Set Issue Type to Bug to write steps.</span></label>';
  var big=/steps|expected|actual/.test(k);
  return'<label class="rf'+(big?' wide':'')+(k==='summary'||k==='path'||k==='video'?' wide':'')+'"><span class="lab">'+x.l+'</span>'+(big?'<textarea class="in" rows="3" data-rf="'+k+'">'+esc(v)+'</textarea>':'<input class="in" data-rf="'+k+'" value="'+esc(v)+'">')+'</label>';
}
function drawRub(){
  var el=$('#rubModal');if(!el||!RUB)return;var t=TASKS[RUB.tid],f=t&&findF(t,RUB.fid);if(!f){closeRub();return}
  var done=RUB.mode==='done';
  el.innerHTML='<div class="rsheet"><div class="row"><div style="min-width:0"><h2 id="rubTitle" style="margin:0;font-size:18px">'+(done?'Record the rubric you filed':'Rubric record')+'</h2><p class="hint" style="margin:2px 0 0">'+esc(t.app||'')+' · '+esc(String(f.text||'').split('\n')[0].slice(0,90))+'</p></div><span class="sp"></span><button class="btn sm ghost" data-a="rubCancel" aria-label="Close">✕</button></div>'+
  '<label class="rf wide"><span class="lab">Paste the full rubric from Feather</span><textarea class="in" id="rubRaw" rows="5" placeholder="Paste everything you submitted: Summary, Priority, Issue Type, Page or Workflow, Reproduction Steps, Expected Behavior, Actual Behavior…">'+esc(RUB.raw)+'</textarea><span class="hint" id="rubParse">'+(RUB.raw?parseNote():'Fields fill in automatically when you paste. Check them before saving.')+'</span></label>'+
  '<div class="rchecks"><span class="lab">Duplicates and conflicts</span><div id="rubChecks">'+matchesHtml(rubMatches(RUB.fields,RUB.tid,RUB.fid))+'</div></div>'+
  '<div class="rgrid" id="rubGrid">'+FORMK.map(rubField).join('')+'</div>'+
  '<div class="row rfoot" style="flex-wrap:wrap;gap:8px"><span class="hint" id="rubErr" style="color:var(--crit)"></span><span class="sp"></span>'+(done?'<button class="btn" data-a="rubSkip">Done without rubric</button><button class="btn" data-a="rubCancel">Keep in progress</button>':'<button class="btn" data-a="rubCancel">Cancel</button>')+'<button class="btn pri" data-a="rubSave">'+(done?'Save rubric · mark Done':'Save rubric')+'</button></div></div>';
  $$('#rubGrid textarea').forEach(grow);
}
function parseNote(){var p=parseRubric(RUB.raw);return p.hits?'Split into '+p.hits+' field'+(p.hits>1?'s':'')+'. Check them below.':'No field labels found. First line went to Summary and the rest to Actual; adjust below.'}
function closeRub(){var el=$('#rubModal');if(el)el.remove();RUB=null}
function refreshRubChecks(){var c=$('#rubChecks');if(c&&RUB)c.innerHTML=matchesHtml(rubMatches(RUB.fields,RUB.tid,RUB.fid))}
function markDone(t,f){var now=elapsed(t);f.status='done';f.doneAt=now;if(f.startAt==null)f.startAt=now;t.lastAct=now;f.u=Date.now()}
function saveRub(skip){
  if(!RUB)return;var t=TASKS[RUB.tid],f=t&&findF(t,RUB.fid);if(!f){closeRub();return}var done=RUB.mode==='done';
  if(!skip){var r=RUB.fields;if(r.type==='fr')r.steps='N/A';if(!String(r.summary||'').trim()){$('#rubErr').textContent='Add at least the Summary.';var s=$('[data-rf="summary"]');if(s)s.focus();return}
    var keep={};KEEP.forEach(function(x){if(String(r[x.k]||'').trim())keep[x.k]=String(r[x.k]).trim()});keep.raw=RUB.raw;keep.at=Date.now();keep.app=t.app;f.rub=keep;
    if(keep.type==='bug'||keep.type==='fr')f.type=keep.type}
  if(done)markDone(t,f);else f.u=Date.now();
  saveTask(t);closeRub();render();
  if(done)toast('Logged · '+counts(t).n+' done',skip?'No rubric recorded. Add it later from the finding.':'Rubric recorded for history and duplicate checks.','ok');else toast('Rubric saved','','ok');
  if(done)checkGates();
}
document.addEventListener('input',function(ev){
  if(!RUB)return;var el=ev.target;
  if(el.id==='rubRaw'){RUB.raw=el.value;var p=parseRubric(el.value),keepType=RUB.fields.type;RUB.fields=p.fields;if(!RUB.fields.type&&keepType)RUB.fields.type=keepType;if(RUB.fields.type==='fr')RUB.fields.steps='N/A';
    $('#rubGrid').innerHTML=FORMK.map(rubField).join('');$$('#rubGrid textarea').forEach(grow);$('#rubParse').textContent=el.value?parseNote():'';refreshRubChecks();return}
  if(el.dataset&&el.dataset.rf){RUB.fields[el.dataset.rf]=el.value;if(el.tagName==='TEXTAREA')grow(el);clearTimeout(RUB.tm);RUB.tm=setTimeout(refreshRubChecks,300)}
});
document.addEventListener('change',function(ev){if(RUB&&ev.target.dataset&&ev.target.dataset.rf){var k=ev.target.dataset.rf;RUB.fields[k]=ev.target.value;if(k==='type'){if(ev.target.value==='fr')RUB.fields.steps='N/A';else if(RUB.fields.steps==='N/A'){var ps=RUB.raw?parseRubric(RUB.raw).fields.steps:'';RUB.fields.steps=ps&&ps!=='N/A'?ps:''}$('#rubGrid').innerHTML=FORMK.map(rubField).join('');$$('#rubGrid textarea').forEach(grow)}refreshRubChecks()}});
document.addEventListener('keydown',function(ev){if(!RUB)return;if(ev.key==='Escape'){ev.preventDefault();if(!RUB.raw)closeRub()}else if(ev.key==='Enter'&&(ev.metaKey||ev.ctrlKey)){ev.preventDefault();saveRub(false)}},true);
function rubCardHtml(t,f){
  if(f.status!=='done')return f.rub?'<div class="rubline"><span class="lab">Rubric on file</span><button class="btn sm ghost" data-a="rubEdit" data-id="'+f.id+'">View</button></div>':'';
  if(!f.rub)return'<div class="rubline warn"><span>No rubric recorded yet.</span><button class="btn sm" data-a="rubEdit" data-id="'+f.id+'">Add rubric</button></div>';
  var r=f.rub;return'<div class="rubcard"><div class="row" style="gap:6px;flex-wrap:wrap">'+(r.prio?'<span class="pill info">'+esc(r.prio)+'</span>':'')+'<b style="min-width:0;overflow-wrap:anywhere">'+esc(r.summary||'')+'</b><span class="sp"></span><button class="btn sm ghost" data-a="rubEdit" data-id="'+f.id+'">Rubric</button></div>'+(r.path?'<span class="m">'+esc(r.path)+'</span>':'')+'</div>';
}
/* ---------- rubric library: every recorded rubric, searchable ---------- */
function allRubrics(){var out=[];allTasks().forEach(function(t){(t.findings||[]).forEach(function(f){if(f.rub)out.push({t:t,f:f,r:f.rub})})});return out.sort(function(a,b){return(b.r.at||0)-(a.r.at||0)})}
function libFiltered(){var q=(VIEW.libQ||'').toLowerCase(),ty=VIEW.libType||'all',ap=VIEW.libApp||'';
  return allRubrics().filter(function(x){if(ty!=='all'&&(x.r.type||x.f.type)!==ty)return false;if(ap&&appKey(x.t.app)!==ap)return false;if(!q)return true;
    return(KEEP.map(function(k){return x.r[k.k]||''}).join(' ')+' '+x.t.app+' '+(x.t.featherId||'')).toLowerCase().indexOf(q)>=0})}
function libListHtml(){var xs=libFiltered();if(!xs.length)return'<p class="hint">'+(allRubrics().length?'No rubric matches.':'No rubrics recorded yet. Mark a finding Done and paste the rubric you filed.')+'</p>';
  return xs.slice(0,300).map(function(x){var r=x.r,ty=r.type||x.f.type;return'<details class="libitem"><summary><span class="chip '+ty+'">'+(ty==='bug'?'BUG':ty==='fr'?'FR':'?')+'</span>'+(r.prio?'<span class="pill info">'+esc(r.prio)+'</span>':'')+'<b>'+esc(r.summary||'(no summary)')+'</b><span class="m">'+esc(x.t.app||'')+' · '+day(x.t.createdAt)+'</span></summary><div class="libbody">'+
    KEEP.filter(function(k){return k.k!=='summary'&&k.k!=='type'&&k.k!=='prio'&&r[k.k]}).map(function(k){return'<div class="libf"><div class="row"><span class="lab">'+k.l+'</span><span class="sp"></span><button class="btn sm ghost" data-a="copyRf" data-t="'+x.t.id+'" data-f="'+x.f.id+'" data-k="'+k.k+'">Copy</button></div><div class="libv">'+esc(r[k.k])+'</div></div>'}).join('')+
    '<div class="row" style="gap:8px"><button class="btn sm" data-a="open" data-id="'+x.t.id+'">Open task</button><button class="btn sm ghost" data-a="copyRf" data-t="'+x.t.id+'" data-f="'+x.f.id+'" data-k="raw">Copy full rubric</button></div></div></details>'}).join('')}
function libHtml(){var all=allRubrics(),apps={};all.forEach(function(x){apps[appKey(x.t.app)]=x.t.app});var bugs=all.filter(function(x){return(x.r.type||x.f.type)==='bug'}).length;
  return'<div class="wrap lib"><div class="card"><div class="row"><h1 style="margin:0;font-size:22px">Rubric library</h1><span class="sp"></span><button class="btn sm" data-a="libCsv">Export CSV</button><button class="btn sm ghost" data-a="libClose">Back</button></div>'+
  '<p class="hint" style="margin:0">'+all.length+' rubric'+(all.length===1?'':'s')+' recorded · '+bugs+' Bugs · '+(all.length-bugs)+' FRs · '+Object.keys(apps).length+' app'+(Object.keys(apps).length===1?'':'s')+'. New rubrics are checked against all of these for duplicates and conflicts.</p>'+
  '<div class="row" style="gap:8px;flex-wrap:wrap"><input class="in" id="libQ" placeholder="Search every field: summary, page, steps, expected, actual…" value="'+esc(VIEW.libQ||'')+'" style="flex:1;min-width:220px" aria-label="Search rubrics"><select class="in" id="libType" style="width:auto" aria-label="Type"><option value="all">All types</option><option value="bug"'+(VIEW.libType==='bug'?' selected':'')+'>Bugs</option><option value="fr"'+(VIEW.libType==='fr'?' selected':'')+'>FRs</option></select><select class="in" id="libApp" style="width:auto" aria-label="App"><option value="">All apps</option>'+Object.keys(apps).sort().map(function(k){return'<option value="'+esc(k)+'"'+(VIEW.libApp===k?' selected':'')+'>'+esc(apps[k])+'</option>'}).join('')+'</select></div></div><div class="liblist" id="libList">'+libListHtml()+'</div></div>'}
function libCsv(){var cols=['app','feather_id','task_date'].concat(KEEP.map(function(k){return k.k}));var q=function(v){return'"'+String(v==null?'':v).replace(/"/g,'""')+'"'};
  var rows=[cols.join(',')].concat(allRubrics().map(function(x){return[x.t.app,x.t.featherId||'',new Date(x.t.createdAt).toISOString().slice(0,10)].concat(KEEP.map(function(k){return x.r[k.k]||''})).map(q).join(',')}));
  var blob=new Blob([rows.join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rubric-library-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
document.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
  if(a==='rubSave'){saveRub(false);return}if(a==='rubSkip'){saveRub(true);return}if(a==='rubCancel'){closeRub();return}
  if(a==='rubEdit'){var t=cur(),f=t&&findF(t,b.dataset.id);if(f)openRub(t,f,'edit');return}
  if(a==='lib'){VIEW.mode='lib';var sd=$('#side');if(sd)sd.classList.remove('open');render();var m=$('#main');if(m)m.scrollTop=0;return}
  if(a==='libClose'){VIEW.mode=cur()?'task':'empty';render();return}
  if(a==='libCsv'){libCsv();return}
  if(a==='copyRf'){var tt=TASKS[b.dataset.t],ff=tt&&findF(tt,b.dataset.f);if(!ff||!ff.rub)return;var v=b.dataset.k==='raw'?(ff.rub.raw||KEEP.map(function(k){return ff.rub[k.k]?k.l+': '+ff.rub[k.k]:''}).filter(Boolean).join('\n\n')):ff.rub[b.dataset.k];
    try{navigator.clipboard.writeText(v||'').then(function(){toast('Copied','','ok')},function(){toast('Copy blocked','Select the text and copy it instead.','warn')})}catch(e){toast('Copy blocked','Select the text and copy it instead.','warn')}return}
});
document.addEventListener('input',function(ev){if(ev.target.id==='libQ'){VIEW.libQ=ev.target.value;var l=$('#libList');if(l)l.innerHTML=libListHtml()}});
document.addEventListener('change',function(ev){if(ev.target.id==='libType'){VIEW.libType=ev.target.value;$('#libList').innerHTML=libListHtml()}if(ev.target.id==='libApp'){VIEW.libApp=ev.target.value;$('#libList').innerHTML=libListHtml()}});

/* ---------- backup ---------- */
function exportData(){var data={app:'AI Trainer Tasker',version:1,exportedAt:new Date().toISOString(),tasks:allTasks()};var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ai-trainer-tasker-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);toast('Backup exported',allTasks().length+' tasks saved to your Downloads.','ok')}
function importData(file){var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result),n=0;(d.tasks||[]).forEach(function(t){if(!t||!t.id)return;var mine=TASKS[t.id];if(!mine||(t.updatedAt||0)>(mine.updatedAt||0)){TASKS[t.id]=t;if(IDX.ids.indexOf(t.id)<0)IDX.ids.push(t.id);lsSet('t.'+t.id,t);if(sessOk())pushQ[t.id]=1;n++}});saveIdx();render();pushNow();toast('Backup imported',n+' task'+(n===1?'':'s')+' added or updated.','ok')}catch(e){toast('Import failed','That file is not an AI Trainer Tasker backup.','crit')}};r.readAsText(file)}

var LOGO='<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2" y="2" width="24" height="24" rx="7" stroke="currentColor" stroke-width="2"/><path d="M8 14.5l4 4 8-9" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* ---------- cloud sync: your Supabase store, reached with the key in the gated PayMeGPT page ---------- */
var SYNC_URL='https://qbubwemdvwflxvxwesrl.supabase.co/functions/v1/tasker';
var SESSION=lsGet('session',null),VIEWAUTH={email:lsGet('lastEmail',''),sent:false,busy:false,err:''};
function sessOk(){return!!(SESSION&&SESSION.token&&Date.parse(SESSION.expires_at)>Date.now())}
var SYNC={state:'syncing',at:null,err:'',since:''},pushQ={},pushTimer=null,pendingRender=false,busy=false;
function api(body,auth){var h={'content-type':'application/json'};if(auth!==false&&SESSION)h['x-tk-session']=SESSION.token;return fetch(SYNC_URL,{method:'POST',headers:h,body:JSON.stringify(body)}).then(function(r){return r.json().catch(function(){return{}}).then(function(d){if(r.status===401&&d.error==='signed out'){signOutLocal('Your session ended. Sign in again.')}if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d})})}
function signOutLocal(msg){SESSION=null;try{localStorage.removeItem(P+'session')}catch(e){}VIEWAUTH.sent=false;render();if(msg)toast('Signed out',msg,'warn')}
function mergeTask(a,b){
  if(!a)return b;if(!b)return a;
  var newer=(b.updatedAt||0)>(a.updatedAt||0)?b:a,older=newer===a?b:a,m=JSON.parse(JSON.stringify(newer)),tomb={},fs={};
  (a.delF||[]).concat(b.delF||[]).forEach(function(id){tomb[id]=1});m.delF=Object.keys(tomb);
  [older,newer].forEach(function(t){(t.findings||[]).forEach(function(f){var c=fs[f.id];if(!c||(f.u||0)>=(c.u||0))fs[f.id]=f})});
  m.findings=Object.keys(fs).filter(function(id){return!tomb[id]}).map(function(id){return JSON.parse(JSON.stringify(fs[id]))}).sort(function(x,y){return(y.createdAt||0)-(x.createdAt||0)});
  var nA=a.notesU||0,nB=b.notesU||0;m.notes=nB>nA?b.notes:a.notes;m.notesU=Math.max(nA,nB);
  var cA=a.clockU||0,cB=b.clockU||0;m.clock=JSON.parse(JSON.stringify(cB>cA?b.clock:a.clock));m.clockU=Math.max(cA,cB);
  m.fired=Object.assign({},a.fired||{},b.fired||{});m.updatedAt=Math.max(a.updatedAt||0,b.updatedAt||0);
  return m;
}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function storeLocal(t){TASKS[t.id]=t;if(IDX.ids.indexOf(t.id)<0)IDX.ids.push(t.id);lsSet('t.'+t.id,t)}
function dropLocal(id){if(!TASKS[id])return;delete TASKS[id];IDX.ids=IDX.ids.filter(function(x){return x!==id});try{localStorage.removeItem(P+'t.'+id)}catch(e){}if(IDX.cur===id){IDX.cur=null;VIEW.mode='empty'}}
function applyRows(rows){var changed=false;(rows||[]).forEach(function(row){
  if(row.updated_at&&row.updated_at>SYNC.since)SYNC.since=row.updated_at;
  if(row.deleted){if(TASKS[row.id]){dropLocal(row.id);changed=true}return}
  var loc=TASKS[row.id],m=mergeTask(loc,row.data);if(!loc||!same(loc,m)){storeLocal(m);changed=true}
  if(loc&&!same(m,row.data))pushQ[row.id]=1});
  if(changed)saveIdx();return changed}
function pull(full){
  if(!sessOk()||busy)return Promise.resolve();busy=true;
  return api({action:'list',since:full?'':SYNC.since}).then(function(d){
    var changed=applyRows(d.rows);if(full)allTasks().forEach(function(t){pushQ[t.id]=1});
    busy=false;if(changed)softRender();return pushNow();
  }).catch(function(e){busy=false;fail(e)});
}
function fail(e){SYNC.state=navigator.onLine===false?'offline':'error';SYNC.err=e&&e.message||String(e);syncBits()}
function queuePush(id){if(!sessOk())return;pushQ[id]=1;clearTimeout(pushTimer);pushTimer=setTimeout(pushNow,1200);SYNC.state='pending';syncBits()}
function pushNow(){
  if(!sessOk())return Promise.resolve();var ids=Object.keys(pushQ);
  if(!ids.length){SYNC.state='synced';SYNC.at=Date.now();syncBits();return Promise.resolve()}
  pushQ={};
  return api({action:'get',ids:ids}).then(function(d){
    var remote={};(d.rows||[]).forEach(function(x){remote[x.id]=x});var rows=[],changed=false;
    ids.forEach(function(id){var loc=TASKS[id],r=remote[id];
      if(!loc){rows.push({id:id,data:{id:id},deleted:true});return}
      if(r&&r.deleted){dropLocal(id);changed=true;return}
      var m=r?mergeTask(loc,r.data):loc;if(!same(m,loc)){storeLocal(m);changed=true}
      if(!r||!same(m,r.data))rows.push({id:id,data:m,deleted:false})});
    if(changed){saveIdx();softRender()}
    return rows.length?api({action:'put',rows:rows}):null;
  }).then(function(){SYNC.state='synced';SYNC.at=Date.now();SYNC.err='';syncBits()})
  .catch(function(e){ids.forEach(function(id){pushQ[id]=1});fail(e)});
}
function pushDelete(id){if(!sessOk())return;pushQ[id]=1;pushNow()}
function typing(){var a=document.activeElement;return!!(a&&root.contains(a)&&/^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName))}
function softRender(){if(typing()){pendingRender=true;return}pendingRender=false;render()}
document.addEventListener('focusout',function(){setTimeout(function(){if(pendingRender&&!typing())softRender()},300)});
window.addEventListener('online',function(){pull(false)});
document.addEventListener('visibilitychange',function(){if(!document.hidden)pull(false)});
setInterval(function(){if(!document.hidden)pull(false);else if(Object.keys(pushQ).length)pushNow()},15000);
function syncLabel(){
  if(!sessOk())return'Signed out.';
  if(SYNC.state==='synced')return'Synced '+new Date(SYNC.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' across your devices';
  if(SYNC.state==='pending'||SYNC.state==='syncing')return'Syncing…';
  if(SYNC.state==='offline')return'Offline. Saved here; syncs when you\'re back online.';
  return'Sync problem: '+SYNC.err+'. Saved on this device.';
}
function syncBits(){var el=$('#syncLab');if(el){el.textContent=syncLabel();el.className='synclab '+(sessOk()?(SYNC.state==='synced'?'ok':SYNC.state==='error'?'err':''):'')}}
function initCloud(){if(sessOk())pull(true)}
setInterval(function(){if(SESSION&&!sessOk())signOutLocal('24 hours passed. Sign in again with your email.')},60000);
function authScreen(){
  var a=VIEWAUTH;
  return'<div class="gate-wrap"><form class="card form" id="authForm" autocomplete="on"><div class="brand" style="padding:0">'+LOGO+'<div><b>AI Trainer Tasker</b><span class="lab">Private · email sign-in</span></div></div>'+
  (!a.sent?'<p class="hint" style="margin:0">Enter your email. A 6-digit code is sent from hello@dijaedadula.com. You stay signed in for 24 hours on this device.</p><label for="aEmail">Email<input class="in" id="aEmail" type="email" autocomplete="email" required value="'+esc(a.email)+'"></label><p class="hint err" id="aErr">'+esc(a.err)+'</p><div class="row"><button class="btn pri" type="submit"'+(a.busy?' disabled':'')+'>'+(a.busy?'Sending…':'Send code')+'</button></div>':
  '<p class="hint" style="margin:0">Code sent to <b>'+esc(a.email)+'</b>. Check your inbox and spam. It expires in 10 minutes.</p><label for="aCode">6-digit code<input class="in mono" id="aCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required style="font-size:22px;letter-spacing:.3em"></label><p class="hint err" id="aErr">'+esc(a.err)+'</p><div class="row"><button class="btn pri" type="submit"'+(a.busy?' disabled':'')+'>'+(a.busy?'Checking…':'Sign in')+'</button><button class="btn" type="button" data-a="authBack">Use another email</button><button class="btn ghost" type="button" data-a="authResend">Send a new code</button></div>')+
  '</form></div>';
}
function authSubmit(resend){
  var a=VIEWAUTH;if(a.busy)return;
  if(!a.sent||resend){var em=resend?a.email:($('#aEmail').value||'').trim().toLowerCase();if(!em)return;a.email=em;lsSet('lastEmail',em);a.busy=true;a.err='';render();
    api({action:'code',email:em},false).then(function(){a.sent=true;a.busy=false;a.err='';render();var c=$('#aCode');if(c)c.focus()}).catch(function(e){a.busy=false;a.err=e.message;render()});return}
  var code=($('#aCode').value||'').replace(/\D/g,'');if(code.length<6){a.err='Enter all 6 digits.';render();return}
  a.busy=true;a.err='';render();
  api({action:'verify',email:a.email,code:code},false).then(function(d){a.busy=false;a.sent=false;SESSION={token:d.token,expires_at:d.expires_at,email:d.email};lsSet('session',SESSION);VIEW.mode=cur()?'task':'empty';render();toast('Signed in','Syncing across your devices for the next 24 hours.','ok');pull(true)})
  .catch(function(e){a.busy=false;a.err=e.message;render();var c=$('#aCode');if(c)c.focus()});
}

render();initCloud();checkGates();
var boot=document.getElementById('bootMsg');if(boot)boot.remove();
})();
