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
function saveTask(t){t.updatedAt=Date.now();syncHist(t);if(typeof queuePush==='function')queuePush(t.id);if(lsSet('t.'+t.id,t)){$$('[data-saved]').forEach(function(el){el.textContent='Saved '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})})}}
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
function realC(t){var f=(t.findings||[]).filter(function(x){return x.real});return{all:f.length,need:f.filter(function(x){return x.real==='need'}).length,done:f.filter(function(x){return x.real==='done'}).length}}
function planFound(m,T){T=T||30;return Math.min(T,T*m/255)}
function hasAvg(t){return!!(t&&t.avg>0)}
function tgt(t){return hasAvg(t)?Math.min(30,t.avg):30}
function planFloor(m){return Math.min(20,20*m/255)}
function planLogged(m){return m<=30?0:Math.min(30,30*(m-30)/225)}
function lastActAgoMin(t){var e=elapsed(t),xs=[];(t.findings||[]).forEach(function(x){xs.push(x.at||0);if(x.doneAt!=null)xs.push(x.doneAt)});if(!xs.length)return e/60;return(e-Math.max.apply(null,xs))/60}
var OUT={active:['In progress','info'],mfr:['MFR · awaiting review','warn'],submitted:['Submitted','ok'],form:['MFR submitted','warn'],lfs:['Submitted · LFS','warn'],outdated:['Outdated · submitted','warn'],unclaimed:['Unclaimed','crit'],released:['Released','warn'],rework:['Rework · corrections','warn']};
var MFR_DOC='Name the app limitation and the workflows you tested. Be specific and truthful: "could not find more" does not say what stopped you.';
var RD_URL='https://reviewnexus.vercel.app/expert/apps',RD_FROM=Date.parse('2026-11-21T00:00:00+08:00');
function rdRequired(t){return(t.endedAt||Date.now())>=RD_FROM}
/* Nov 21 2026: the MFR is replaced by the LFS (Low Finding Submission) in Review Desk. Every task is logged in Review Desk before it is submitted or released in Feather.
   Target reached (or 30) → submit any time · before 2:00 keep working or release · 2:00 below target: under 10 found → release, 10+ → keep going · 4:30 below target → submit with an LFS. */
var STAGES=[
  {id:'explore',a:0,b:45,n:'Triage',d:'Use the full 45 minutes: test the whole app freely and capture drafts. Unclaim or release before 0:45 if it won\'t boot, crashes or is unstable, or if it boots but clearly can\'t yield 20+ findings: a low-yield runtime (high-fidelity clone with low defect density, or limited workflow coverage). No rating or tags.'},
  {id:'hunt',a:45,b:120,n:'Hunt',d:'Find and log. Can\'t reach the target? Log an early release in Review Desk, then unclaim in Feather. 2:00 checkpoint: under 10 found → log the release and release.'},
  {id:'build',a:120,b:255,n:'Build',d:'Build toward the target (goal 30). 10+ found at 2:00 means keep going until the target or 4:30.'},
  {id:'wrap',a:255,b:270,n:'Wrap',d:'Runtime Quality and final checks. At 4:30 below the target: write the limitation and submit with an LFS.'}
];
function stageFor(t,m){var S=stagesNow();return t&&t.huntDone&&m<45?S[S.length===STAGES.length?1:0]:stageOf(m)}
function stageOf(m){var S=stagesNow();for(var i=0;i<S.length;i++)if(m<S[i].b)return S[i];return S[S.length-1]}
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
  return{e:e,c:c,avgCap:avgCap,avgLog:avgLog,cap:cap,lg:lg,left:left,needLog:needLog,needFind:needFind,queue:queue,logBudget:logBudget,target:Math.max(1.5,logBudget),proj:Math.floor(proj),feasible:logBudget>=1.5,pf:planFound(e,tgt(t)),pfl:planFloor(e),pl:planLogged(e)}
}
function oldestProg(t){var ps=(t.findings||[]).filter(function(x){return x.status==='progress'&&!x.block});ps.sort(function(a,b){return(a.startAt||0)-(b.startAt||0)});return ps[0]||null}
function first(f){return String(f.text||'').split('\n')[0].slice(0,60)||'(untitled)'}
function mmss(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}
function doNow(t){
  if(t.status!=='active')return null;var M=metrics(t),e=M.e,c=M.c;if(e>=AHT)return null;
  if(triOn()&&e<45&&!t.huntDone)return{tone:'info',h:'Triage window · '+mmss((45-e)*60)+' left',p:'Test the whole app freely and type what you see. Unstable, or clearly can\'t yield 20+ findings? Unclaim before 0:45. Plan: about '+Math.round(planFound(45))+' found by 0:45. Press Exploration done to start logging early.'};
  if(c.n>=30)return null;
  var pr=oldestProg(t);
  if(pr){var spent=(elapsed(t)-(pr.startAt||elapsed(t)))/60,tg=M.target;return spent<=tg?{tone:'info',h:'Finish “'+first(pr)+'” within '+mmss((tg-spent)*60),p:'Budget '+mmss(tg*60)+' a finding to reach 30 by 4:15. Write the summary, run Flow, log in Feather, then mark it Done.'}:{tone:'warn',h:'Over budget on “'+first(pr)+'” by '+mmss((spent-tg)*60),p:'Wrap it up and mark it Done, or move it back to Not started and take the next one.'}}
  if(c.draft)return{tone:'warn',h:'Start the next draft now',p:c.draft+' waiting. Click its circle to move it to In progress, then run Flow and log it in Feather.'};
  return{tone:'info',h:'Queue empty · capture the next finding',p:'You need '+M.needFind+' more found for 30. Budget about '+mmss(M.cap*60)+' to spot one.'};
}
function nextStep(t){
  var e=elapsed(t)/60,c=counts(t),n=c.n,F=c.all,T=tgt(t),ok=n>=30&&c.b>=5&&c.fr>=5;
  if(t.status==='submitted')return{tone:'ok',h:'Submitted',p:'Closed at '+hm(elapsed(t))+' with '+n+' findings.'};
  if(t.status==='lfs')return{tone:'warn',h:'Submitted with an LFS',p:'Closed at '+hm(elapsed(t))+' with '+n+' findings and your limitation and tested workflows written up. LFS use is tracked; the reviewer checks it was justified.'};
  if(t.status==='form')return{tone:'warn',h:'MFR submitted',p:'Closed at '+hm(elapsed(t))+' with '+n+' findings, tested areas and limitations documented.'};
  if(t.status==='outdated')return{tone:'warn',h:'Outdated · submitted',p:'Submitted as soon as it went Outdated, as the handbook asks. Log it in Review Desk first (App guide, Outdated tab: link, findings, hours, minutes, Log outdated task), then submit in Feather. No Check and no LFS.'};
  if(t.status==='unclaimed')return{tone:'crit',h:'Unclaimed',p:'Released in Review Desk and unclaimed in Feather. No rating, scores or tags needed.'};
  if(t.status==='released')return{tone:'warn',h:'Released',p:'Closed after review.'};
  if(t.status==='rework'){var fx=(t.findings||[]).filter(function(x){return x.fix}),lf=fx.filter(function(x){return x.fix==='todo'}).length;return{tone:'warn',h:fx.length?(lf?'Rework · '+lf+' of '+fx.length+' still to fix':'Rework · all '+fx.length+' fixed · resubmit'):'Rework · flag the items to fix',p:'Mark each item the reviewer named with Needs fix (Done list), correct it in Feather and Flow, then mark it Fixed. When all are fixed, resubmit in Feather and click Corrections done · resubmitted. Do not create a second Review Desk log: in My tasks open the task, reply to the feedback and click Mark as reworked once fixed. Corrections are task work: keep Hubstaff running.'}}
  if(t.status==='mfr')return{tone:'warn',h:'MFR submitted · awaiting review',p:'Older MFR task (before the LFS). Keep it In Progress in Feather until the review answers. Approved → submit as-is. New tasks use the LFS: no approval, no waiting.'};
  if(ok)return{tone:'ok',h:'Ready to submit',p:'Complete the Runtime Quality assessment and final checks. Log it in Review Desk, then submit in Feather.'};
  if(n>=T)return{tone:'ok',h:'Target reached ('+n+'/'+T+') · submit any time',p:'Log the task in Review Desk, then submit in Feather. The goal is still 30: keep going if time allows, then Runtime Quality, final checks and submit within 4:30.'};
  if(e>=AHT)return{tone:'crit',h:'4:30 · below the target ('+n+'/'+T+') · submit with an LFS',p:'Write the app limitation and the workflows you tested (specific and truthful; one sentence is enough: your reviewer and HDMs read it). Log it in Review Desk as an LFS, then submit in Feather immediately. No HDM approval, no waiting. V2 still needs 5 Bugs and 5 FRs: if you can\'t meet it, report the limitation and ask #titan-nexus-reviewdesk or your HDM. Never manufacture findings. Keep Hubstaff running for everything you still do; a small overage is fine.'};
  if(n>=30)return{tone:'warn',h:'30 logged but the mix is short',p:'You need '+(c.b<5?(5-c.b)+' more Bug'+(5-c.b>1?'s':''):'')+(c.b<5&&c.fr<5?' and ':'')+(c.fr<5?(5-c.fr)+' more FR'+(5-c.fr>1?'s':''):'')+'. If you can\'t find them, report the limitation honestly and ask #titan-nexus-reviewdesk or your HDM. Never manufacture findings.'};
  if(e>=255)return{tone:'warn',h:'Wrap up · '+mmss((AHT-e)*60)+' to 4:30',p:F>=T?'Log the rest, then Runtime Quality and submit.':'Finish what\'s in progress, then write the LFS: the app limitation and the workflows you tested. '+MFR_DOC};
  if(e>=120&&F<10)return{tone:'crit',h:'Under 10 at 2:00 · log the release and release',p:'After 2:00 below the target with under 10 findings: click Log the release in Review Desk, then release in Feather. No MFR, no approval.'};
  var pf=planFound(e,T),pfl=planFloor(e);
  if(e>=60&&e<120&&F<pf-1)return{tone:'warn',h:'Behind pace for the target ('+F+' vs '+Math.round(pf)+') · 10 needed by 2:00',p:'Before 2:00 you can release freely: log an early release in Review Desk, then unclaim in Feather. At 2:00 with under 10 you release anyway. Think you can still make it? Switch to an untested workflow.'};
  if(F>=pf-1)return{tone:'ok',h:'On pace for '+(T<30?T+' (app target)':'30+'),p:'Found '+F+' (pace for '+T+' at this time: '+Math.round(pf)+') · logged '+n+'. Need 10 found by 2:00.'};
  if(F>=pfl-1)return{tone:'warn',h:'Behind pace by '+Math.round(pf-F),p:'Found '+F+', pace for '+T+' is '+Math.round(pf)+'. Switch to an untested workflow. Need 10 found by 2:00, or the task is released.'};
  return{tone:'warn',h:'Well behind pace ('+F+' vs '+Math.round(pf)+')',p:'Switch workflows. If the app has run out or fails, log an early release in Review Desk and unclaim in Feather: before 2:00 that is allowed.'};
}
var GATES=[
  {id:'g30',m:30,t:'0:30',l:'Release check · can it reach the target?'},
  {id:'g110',m:110,t:'1:50',l:'10 min to the 2:00 checkpoint · 10 found?'},
  {id:'g120',m:120,t:'2:00',l:'Checkpoint · under 10 found → log the release and release'},
  {id:'g240',m:240,t:'4:00',l:'30 min left · target reached? check the mix'},
  {id:'g255',m:255,t:'4:15',l:'Wrap up · Runtime Quality'},
  {id:'g265',m:265,t:'4:25',l:'5 min to 4:30'},
  {id:'g270',m:270,t:'4:30',l:'Stop hunting · below target → submit with an LFS'}
];
function triOn(){return false}
function gatesNow(){return triOn()?GATES:GATES.filter(function(g){return g.id!=='g35'&&g.id!=='g45'})}
var STAGES_NOTRI=null;function stagesNow(){if(triOn())return STAGES;if(!STAGES_NOTRI){var h=STAGES[1];STAGES_NOTRI=[{id:'hunt',a:0,b:h.b,n:h.n,d:h.d}].concat(STAGES.slice(2))}return STAGES_NOTRI}

function gateMessage(t,g){
  var c=counts(t),n=c.all,T=tgt(t),tail=' ('+c.all+' found · '+c.n+' logged · '+c.b+' Bugs · '+c.fr+' FRs · target '+T+')',R=c.n>=T||c.n>=30;
  if(g.id==='g30')return'0:30 is the ideal time to decide. Can this app reach its target ('+T+')? If clearly not (broken, unstable, too few workflows), log an early release in Review Desk, then unclaim in Feather. No rating or tags.'+tail;
  if(g.id==='g110')return(n>=10?'You have 10+, so the 2:00 checkpoint is clear. Keep building toward '+T+'.':'10 minutes to 2:00 and under 10 found. Below the target with under 10 at 2:00, you release. Push on the main workflows now, or release early.')+tail;
  if(g.id==='g120')return(R?'Target reached. Log it in Review Desk and submit in Feather, or push toward 30.':n<10?'Under 10 at 2:00: click Log the release in Review Desk, then release in Feather.':'Checkpoint clear (10+). Keep building toward '+T+' (goal 30) until 4:30.')+tail;
  if(g.id==='g240')return(R?'Target reached. Submit when ready, or push toward 30 before 4:30.':'Last half hour. Push for the target ('+T+') and check the Bug/FR mix. If you\'ll land short, start writing the LFS: the app limitation and the workflows you tested. Expect to go significantly over 4:30? Flag your HDM now.')+tail;
  if(g.id==='g255')return(R?'Stop hunting. Runtime Quality, final checks, log in Review Desk and submit.':'Stop hunting. Write the LFS: the limitation and the workflows you tested. '+MFR_DOC)+tail;
  if(g.id==='g265')return(R?'Submit now.':'5 minutes left. Have the LFS written.')+tail;
  if(g.id==='g270')return(R?'4:30. Log it in Review Desk and submit in Feather if you haven\'t. Keep Hubstaff on while you finish.':'4:30 below the target: log it in Review Desk as an LFS with the limitation and tested workflows, then submit in Feather immediately. No HDM approval. Keep Hubstaff on while you finish.')+tail;
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
    gatesNow().forEach(function(g){if(m>=g.m&&!t.fired[g.id]){t.fired[g.id]=1;changed=true;if(m<g.m+10)alertUser(t,g.t+' · '+t.app+' · '+g.l,gateMessage(t,g),g.m>=255||g.id==='g45'?'crit':'warn')}});
    var c=counts(t),es=elapsed(t);
    if((m>=45||t.huntDone)&&c.n<30){var pr=oldestProg(t),M=metrics(t);
      if(pr){var spent=(es-(pr.startAt||es))/60;if(spent>=M.target&&!pr.w1){pr.w1=1;changed=true;alertUser(t,'Over budget · '+first(pr),'You\'ve spent '+mmss(spent*60)+' on it; budget is '+mmss(M.target*60)+'. Wrap it up and mark it Done. Stuck? Mark why on the finding: Flow slow, recording, Flow validation or environment.','warn')}else if(spent>=2*M.target&&!pr.w2){pr.w2=1;changed=true;alertUser(t,'Still on “'+first(pr)+'”','Twice the budget. Can\'t move forward? Mark why on the finding (Flow slow, recording, Flow validation, environment), or park it and start the next draft.','warn')}}
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
  var ae0=document.activeElement,aeId=ae0&&ae0.id&&/^(fq|tvq|tvfq)$/.test(ae0.id)?ae0.id:'',aeP=aeId?ae0.selectionStart:0,t=cur(),keep={},ai0=$('#addIn'),aiv=ai0?ai0.value:'',aif=ai0&&document.activeElement===ai0,aic=ai0?ai0.selectionStart:0;['main','fscroll','tright'].forEach(function(id){var el=$('#'+id);if(el)keep[id]=el.scrollTop});
  root.innerHTML='<div class="app'+(IDX.settings.noside?' noside':'')+'">'+(IDX.settings.noside?'<button class="btn sm sideopen" data-a="collapse" aria-label="Show task list">»</button>':'')+sideHtml()+'<main class="main" id="main">'+(VIEW.mode==='tasks'?tvHtml():VIEW.mode==='lib'?libHtml():VIEW.mode==='guide'?guideHtml():VIEW.mode!=='new'&&t?taskHtml(t):'<div class="wrap">'+(VIEW.mode==='new'?newHtml():emptyHtml())+'</div>')+'</main></div>';
  $$('.f textarea').forEach(grow);var ai1=$('#addIn');if(ai1){if(aiv)ai1.value=aiv;grow(ai1);if(aif){ai1.focus();try{ai1.setSelectionRange(aic,aic)}catch(e){}}}
  Object.keys(keep).forEach(function(id){var el=$('#'+id);if(el)el.scrollTop=keep[id]});
  if(aeId){var ae1=$('#'+aeId);if(ae1){ae1.focus();try{ae1.setSelectionRange(aeP,aeP)}catch(e){}}}
  syncBits();tick();
}
function sideHtml(){
  var q=VIEW.q.toLowerCase(),ts=allTasks().filter(function(t){if(!q)return true;return(t.app+' '+(t.featherId||'')+' '+(t.findings||[]).map(function(f){return f.text+' '+(f.rub?RF.map(function(k){return f.rub[k.k]||''}).join(' '):'')}).join(' ')+' '+(t.notes||'')).toLowerCase().indexOf(q)>=0});
  var act=ts.filter(function(t){return t.status==='active'||t.status==='mfr'||t.status==='rework'}),hist=ts.filter(function(t){return!(t.status==='active'||t.status==='mfr'||t.status==='rework')});
  var item=function(t){var c=counts(t);return'<button class="titem" data-a="open" data-id="'+t.id+'" aria-current="'+(t.id===IDX.cur&&VIEW.mode==='task')+'"><b>'+esc(t.app||'Untitled app')+'</b><span>'+hm(elapsed(t))+' · '+c.n+'/30 · '+OUT[t.status][0]+'</span><span>'+day(t.createdAt)+(t.featherId?' · '+t.featherId.slice(0,8):'')+'</span>'+(mfrCount(t)?'<span class="rbadge mb">MFR ×'+mfrCount(t)+(reworkCount(t)?' · rework ×'+reworkCount(t):'')+'</span>':'')+(realC(t).need?'<span class="rbadge">Real-app evidence needed · '+realC(t).need+'</span>':'')+'</button>'};
  var notif='Notification' in window?(Notification.permission==='granted'&&IDX.settings.notify?'Desktop reminders on':Notification.permission==='denied'?'Reminders blocked in Chrome':'Turn on desktop reminders'):'Desktop reminders unsupported';
  return'<aside class="side" id="side"><button class="btn sm ghost sidecollapse" data-a="collapse" aria-label="Hide task list">«</button><div class="brand"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2" y="2" width="24" height="24" rx="7" stroke="currentColor" stroke-width="2"/><path d="M8 14.5l4 4 8-9" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><div><b>AI Trainer Tasker</b><span class="lab">AHT 4:30 · 30 findings</span></div></div>'+
  '<div class="search"><button class="btn pri" data-a="new" style="width:100%;justify-content:center;margin-bottom:8px">New task</button><button class="btn" data-a="tv" aria-current="'+(VIEW.mode==='tasks')+'" style="width:100%;justify-content:center;margin-bottom:8px">All tasks &amp; findings · '+allTasks().length+'</button><button class="btn" data-a="lib" aria-current="'+(VIEW.mode==='lib')+'" style="width:100%;justify-content:center;margin-bottom:8px">Rubric library · '+allRubrics().length+'</button><button class="btn ghost" data-a="guide" aria-current="'+(VIEW.mode==='guide')+'" style="width:100%;justify-content:center;margin-bottom:8px">Guide · rules &amp; workflow</button><input class="in" id="tq" data-in="q" placeholder="Search tasks and findings" value="'+esc(VIEW.q)+'" aria-label="Search tasks and findings"></div>'+
  '<nav class="tlist" aria-label="Tasks">'+(act.length?'<div class="tgroup lab">Active</div>'+act.map(item).join(''):'')+(hist.length?'<div class="tgroup lab">History · '+hist.length+'</div>'+hist.map(item).join(''):'')+(!ts.length?'<p class="muted" style="padding:8px 10px;margin:0;font-size:13px">'+(q?'Nothing matches.':'No tasks yet.')+'</p>':'')+'</nav>'+
  '<div class="sidefoot"><span class="synclab" id="syncLab"></span><button class="btn sm" data-a="notify">'+notif+'</button><label class="row" style="font-size:12.5px"><input type="checkbox" id="snd" data-in="sound"'+(IDX.settings.sound?' checked':'')+'> Sound with each alert</label><label class="row" style="font-size:12.5px"><input type="checkbox" id="tipsOn"'+(IDX.settings.noTips?'':' checked')+'> Show tooltips</label><label class="row" style="font-size:12.5px"><input type="checkbox" id="focusOn"'+(IDX.settings.full?'':' checked')+'> Focus view (simple panel)</label><div class="row"><button class="btn sm" data-a="export">Export backup</button><button class="btn sm ghost" data-a="signout">Sign out</button><label class="btn sm" for="imp">Import</label><input type="file" id="imp" accept="application/json" hidden></div></div></aside>';
}
function emptyHtml(){return'<div class="card empty"><h1 style="margin:0;font-size:22px">Start a task</h1><p class="muted" style="margin:0;max-width:56ch">Paste the Feather link, match the clock to Hubstaff, and log findings as you hunt. Every character saves as you type. Desktop reminders tell you what to do at 0:35, 0:45, 2:00 and 4:30.</p><button class="btn pri" data-a="new">New task</button></div>'}
function newHtml(){
  var apps={};allTasks().forEach(function(t){if(t.app)apps[t.app]=1});
  var act=allTasks().filter(function(t){return t.status==='active'}),mfr=allTasks().filter(function(t){return t.status==='mfr'});
  var warn=act.length>=1&&!mfr.length?'<div class="banner">You already have an active task. Standard is 1 at a time; a second is allowed only while the first waits on an MFR or HDM review. New experts: 1 only.</div>':act.length+mfr.length>=2?'<div class="banner">You have 2 tasks open. That is the max, and only while one waits on an MFR or HDM review.</div>':mfr.length?'<div class="banner">'+esc(mfr[0].app)+' is waiting on its MFR. You may claim ONE new task, from a different app.</div>':'';
  return'<div class="row"><button class="btn sm mobtoggle" data-a="menu">Tasks</button></div><form class="card form" id="newForm" autocomplete="off"><h1 style="margin:0;font-size:22px">New task</h1>'+warn+
  '<label for="nApp">App name<input class="in" id="nApp" list="appList" placeholder="e.g. Salesforce clone" required><datalist id="appList">'+Object.keys(apps).map(function(a){return'<option value="'+esc(a)+'">'}).join('')+'</datalist><span class="hint" id="nAppHint">Same name as before lets the app check your past findings for duplicates.</span></label>'+
  '<label for="nAvg">App target from Review Desk<input class="in mono" id="nAvg" type="number" min="1" max="30" placeholder="e.g. 15" style="max-width:160px"><span class="hint">Check the app in Review Desk (App guide) before you claim. The target is a floor: reach it and you can submit any time, even before 4:30. Leave it empty if the app is unlisted: it defaults to 30. Below the target at 4:30 → submit with an LFS.</span></label><label for="nUrl">Feather link<input class="in mono" id="nUrl" placeholder="https://…/tasks/625cc481-e437-496e-8393-1ff6a0fe5970"><span class="hint" id="nUrlHint">The task ID after /tasks/ is pulled out for you.</span></label>'+
  '<label for="nTime">Hubstaff total for today, right now (optional)<input class="in mono" id="nTime" placeholder="1:03:50" style="max-width:160px" inputmode="numeric"><span class="hint">Hubstaff counts your whole day, so this is not the task\'s time. The task clock starts at 0:00; this number is only a reference point, so later syncs add just the time Hubstaff gains while this task runs.</span></label>'+
  '<label class="row" style="flex-direction:row;font-weight:500"><input type="checkbox" id="nRun" checked> Hubstaff is running now</label>'+'<label class="row" style="flex-direction:row;font-weight:500"><input type="checkbox" id="nAdd"> Additional task (partly done by a former expert)</label>'+'<label class="row" style="flex-direction:row;font-weight:500"><input type="checkbox" id="nLate" data-a="lateToggle"> I already started this task (forgot to log it here)</label>'+'<fieldset class="late" id="lateBox" hidden><legend class="lab">Work done before tracking</legend><label for="nSpent">Time already spent on this task<input class="in mono" id="nSpent" placeholder="0:20:00" style="max-width:160px" inputmode="numeric"><span class="hint">Your best estimate. The task clock starts here.</span></label><p class="hint" style="margin:0">Enter the time you already spent on this task (or pick a triage option below). These counts are added to your totals; findings you add here are tracked as usual.</p><div class="lgrid"><label for="nPreF">Found so far<input class="in mono" id="nPreF" type="number" min="0" value="0"></label><label for="nPreL">Logged in Feather<input class="in mono" id="nPreL" type="number" min="0" value="0"></label><label for="nPreB">…of those, Bugs<input class="in mono" id="nPreB" type="number" min="0" value="0"></label><label for="nPreR">…of those, FRs<input class="in mono" id="nPreR" type="number" min="0" value="0"></label></div><label for="nTri">45-minute triage window<select class="in" id="nTri"><option value="">Not finished yet</option><option value="today">Finished today: Hubstaff already includes it</option><option value="earlier">Finished on an earlier day: add 0:45 to today\'s Hubstaff time</option></select><span class="hint">Worked on another day? Pick the last option so the 0:45 is counted.</span></label></fieldset>'+
  '<p class="hint err" id="nErr">'+esc(VIEW.newErr)+'</p><div class="row"><button class="btn pri" type="submit">Start task</button><button class="btn" type="button" data-a="cancelNew">Cancel</button></div></form>';
}
function taskHtml(t){
  var c=counts(t),s=nextStep(t),e=elapsed(t),act=t.status==='active',past=pastFor(t),key=appKey(t.app);
  var ageD=(Date.now()-t.createdAt)/864e5,nb='';if(act&&ageD>=1)nb+='<div class="banner'+(ageD>=3?' crit':'')+'"><span>Claimed '+Math.floor(ageD)+' day'+(ageD>=2?'s':'')+' ago. 1 day is ideal, 2 is OK, 3 is the maximum: on day 4 it is unclaimed automatically and moved to Additional Tasks.</span></div>';if(t.additional&&act)nb+='<div class="banner"><span><b>Additional task.</b> Treat it as an empty task: reuse existing findings that are valid, or delete everything and start fresh. Old reviewer comments are optional to read.</span></div>';var rc=realC(t);if((act||t.status==='rework')&&rc.need)nb+='<div class="banner crit"><span><b>'+rc.need+' finding'+(rc.need===1?'':'s')+' compare'+(rc.need===1?'s':'')+' with the real app</b> and still '+(rc.need===1?'needs a':'need a')+' comparison screenshot or recording in Feather.</span><button class="btn sm" data-a="filter" data-f="realneed">Show them</button></div>';if(act&&!notifyOk()&&'Notification' in window&&Notification.permission!=='denied')nb='<div class="banner"><span>Desktop reminders are off. Turn them on so Chrome alerts you at each gate.</span><button class="btn sm" data-a="notify">Turn on</button></div>';
  var head='<div class="thead"><div style="display:flex;flex-direction:column;gap:6px;min-width:0"><div class="row"><button class="btn sm mobtoggle" data-a="menu">Tasks</button><span class="pill '+OUT[t.status][1]+'">'+OUT[t.status][0]+'</span><span class="lab">Claimed '+day(t.createdAt)+'</span></div>'+
    (VIEW.editHead?'<form class="row" id="headForm"><input class="in" id="eApp" value="'+esc(t.app)+'" aria-label="App name" style="max-width:260px"><input class="in mono" id="eUrl" value="'+esc(t.featherUrl||'')+'" placeholder="Feather link" aria-label="Feather link" style="max-width:420px"><input class="in mono" id="eAvg" type="number" min="1" max="30" value="'+(t.avg||'')+'" placeholder="App avg" aria-label="App average" style="max-width:100px"><button class="btn sm pri" type="submit">Save</button><button class="btn sm" type="button" data-a="editHead">Cancel</button></form>':
    '<h1>'+esc(t.app||'Untitled app')+'</h1><div class="row">'+(t.featherId?'<span class="fid"><code title="Feather task ID">'+esc(t.featherId)+'</code><button class="btn sm ghost" data-a="copyId">Copy</button></span>':'<span class="muted">No Feather ID</span>')+(t.featherUrl?'<a class="btn sm" href="'+esc(t.featherUrl)+'" target="_blank" rel="noopener">Open in Feather ↗</a>':'')+'<button class="btn sm ghost" data-a="editHead">Edit</button></div>')+
    '</div><div class="row">'+(act?'<button class="btn sm" data-a="end" data-s="submitted"'+(c.n>=30?'':' title="Usually after 30 findings with 5 Bugs and 5 FRs"')+'>Mark submitted</button><button class="btn sm" data-a="end" data-s="lfs" title="4:30 and below the target: submit with an LFS (limitation + tested workflows). No approval, no waiting.">Submitted with LFS</button><button class="btn sm" data-a="end" data-s="outdated" title="Task went Outdated: submit it right away">Outdated · submitted</button><button class="btn sm danger" data-a="end" data-s="unclaimed">'+(t.additional?'Removed by HDM':'Unclaimed / released')+'</button>':t.status==='mfr'?'<button class="btn sm pri" data-a="end" data-s="submitted">Approved · submitted as-is</button><button class="btn sm" data-a="end" data-s="rework">Corrections requested</button><button class="btn sm" data-a="end" data-s="active">HDM: keep working</button><button class="btn sm" data-a="end" data-s="released">HDM closed it</button>':t.status==='rework'?'<button class="btn sm pri" data-a="end" data-s="resubmit">Corrections done · resubmitted</button><button class="btn sm" data-a="end" data-s="submitted">Approved · submitted</button>':(t.status==='submitted'?'<button class="btn sm" data-a="end" data-s="rework">Sent back for rework</button>':'')+'<button class="btn sm" data-a="end" data-s="active">Reopen</button>')+'<button class="btn sm" data-a="breakdown">Time breakdown</button>'+(VIEW.confirmDel===t.id?'<button class="btn sm danger" data-a="delTask">Confirm delete task</button>':'<button class="btn sm ghost danger" data-a="delTask">Delete</button>')+'</div></div>';
  var tk=[0,45,120,270];
  var clock='<div class="card"><div class="clockcard"><div><div class="lab">AHT · synced to Hubstaff</div><div class="clock" id="clk">'+hms(e)+'<small> / 4:30:00</small></div><div class="lab" id="left" style="margin-top:6px">'+(e<AHT*60?hm(AHT*60-e)+' left':'Over AHT by '+hm(e-AHT*60))+'</div></div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;min-width:0"><div class="bar" aria-hidden="true"><i id="clkBar" style="width:'+Math.min(100,e/(AHT*60)*100)+'%"></i>'+[45,120,255].map(function(m){return'<u style="left:'+(m/AHT*100)+'%"></u>'}).join('')+'</div><div class="ticks">'+tk.map(function(m){return'<span style="left:'+(m/AHT*100)+'%">'+hm(m*60)+'</span>'}).join('')+'</div>'+
    '<div class="row">'+(t.status==='active'||t.status==='mfr'||t.status==='rework'?'<button class="btn sm '+(running(t)?'':'pri')+'" data-a="run">'+(running(t)?'Pause (Hubstaff stopped)':'Resume (Hubstaff running)')+'</button>'+(triOn()&&elapsed(t)<45*60&&!t.huntDone?'<button class="btn sm" data-a="huntDone">Triage done</button>':'')+'<button class="btn sm" data-a="sync">Sync to Hubstaff</button><button class="btn sm'+(t.offset?' ghost':'')+'" data-a="prior">'+(t.offset?'Earlier days '+hm(t.offset)+' · edit':'+ Earlier-day time')+'</button><button class="btn sm" data-a="nudge" data-d="-60">−1 min</button><button class="btn sm" data-a="nudge" data-d="60">+1 min</button>':'')+'</div>'+
    (VIEW.prior?'<form class="row" id="priorForm"><label for="priorIn" class="hint">Time spent on this task on earlier days (not in today\'s Hubstaff)</label><input class="in mono" id="priorIn" value="'+hms(t.offset||2700)+'" inputmode="numeric" style="width:120px"><button class="btn sm pri" type="submit">Set</button><button class="btn sm" type="button" data-a="prior">Cancel</button><span class="hint" style="flex-basis:100%">Added to the AHT clock now and on every Hubstaff sync. Use 0:00:00 to remove it.</span></form>':'')+(VIEW.sync?'<form class="row" id="syncForm"><label for="syncIn" class="hint">Hubstaff total for today, right now</label><input class="in mono" id="syncIn" placeholder="3:12:40" inputmode="numeric" style="width:120px"><label for="syncTask" class="hint">or set this task\'s time</label><input class="in mono" id="syncTask" placeholder="0:42:00" inputmode="numeric" style="width:110px"><button class="btn sm pri" type="submit">Set</button><button class="btn sm" type="button" data-a="sync">Cancel</button><span class="hint" style="flex-basis:100%">Hubstaff counts your whole day, so the app only adds what Hubstaff gained since the last reference while this task ran. After a pause (another task, a break), the first sync just sets a new reference. Typing time is added for you.</span></form>':'')+
    '</div></div><div class="counts"><div><b>'+c.all+'</b><span>found</span></div><div><b id="cN">'+c.n+'<small class="muted" style="font-size:14px">/30</small></b><span>logged (Done)</span></div><div><b style="color:var(--bug)">'+c.b+'</b><span>Bugs · min 5</span></div><div><b style="color:var(--fr)">'+c.fr+'</b><span>FRs · min 5</span></div><div><b>'+c.prog+'</b><span>in progress</span></div><div><b>'+c.draft+'</b><span>not started</span></div><div><b>'+(e>=300?(c.n/(e/3600)).toFixed(1):'—')+'</b><span>done / hour</span></div></div></div>';
  var fl=(t.findings||[]).filter(function(f){if(!(VIEW.filter==='all'||(VIEW.filter==='real'?!!f.real:VIEW.filter==='realneed'?f.real==='need':f.status===VIEW.filter)))return false;if(VIEW.ftype&&VIEW.ftype!=='all'&&fType(f)!==VIEW.ftype)return false;var pp=fPrio(f);if(VIEW.fprio&&VIEW.fprio!=='all'&&(VIEW.fprio==='none'?pp:pp!==VIEW.fprio))return false;if(VIEW.fq&&(ftxt(f)).toLowerCase().indexOf(VIEW.fq.toLowerCase())<0)return false;return true}).slice().sort(function(x,y){var a=(x.createdAt||0)-(y.createdAt||0)||(x.at||0)-(y.at||0);return VIEW.filter==='draft'?a:-a});
  var findings='<div class="card"><div class="row"><span class="lab">Findings · rapid hunt</span><span class="sp"></span><div class="seg" role="group" aria-label="Filter">'+[['all','All '+c.all],['draft','Draft '+c.draft],['progress','In progress '+c.prog],['done','Done '+c.n]].concat(realC(t).all?[['real','Real app '+realC(t).all],['realneed','Evidence needed '+realC(t).need]]:[]).map(function(x){return'<button type="button" class="all" data-a="filter" data-f="'+x[0]+'" aria-pressed="'+(VIEW.filter===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>'+
    (function(){var n=(t.findings||[]).length;if(!n)return'';var act=(VIEW.ftype&&VIEW.ftype!=='all')||(VIEW.fprio&&VIEW.fprio!=='all')||VIEW.fq||VIEW.filter!=='all';return'<div class="row fbar"><input class="in" id="fq" data-vk="fq" placeholder="Search this task\'s findings" value="'+esc(VIEW.fq||'')+'" aria-label="Search findings in this task"><select class="in tvsel" data-vk="ftype" aria-label="Type">'+[['all','All types'],['bug','Bugs'],['fr','FRs'],['unk','Untyped']].map(function(o){return tvOpt(o[0],VIEW.ftype||'all',o[1])}).join('')+'</select><select class="in tvsel" data-vk="fprio" aria-label="Priority">'+[['all','All priorities'],['P0','P0'],['P1','P1'],['P2','P2'],['none','No priority yet']].map(function(o){return tvOpt(o[0],VIEW.fprio||'all',o[1])}).join('')+'</select>'+(act?'<span class="hint">Showing '+fl.length+' of '+n+'</span><button type="button" class="btn sm ghost" data-a="fReset">Clear</button>':'')+'</div>'})()+
    (t.pre||VIEW.editPre?'<div class="prebar">'+(VIEW.editPre?'<form class="row" id="preForm"><span class="lab">Before tracking</span><label class="hint">Found <input class="in mono sm" id="pF" type="number" min="0" value="'+((t.pre||{}).f||0)+'"></label><label class="hint">Logged <input class="in mono sm" id="pL" type="number" min="0" value="'+((t.pre||{}).l||0)+'"></label><label class="hint">Bugs <input class="in mono sm" id="pB" type="number" min="0" value="'+((t.pre||{}).b||0)+'"></label><label class="hint">FRs <input class="in mono sm" id="pR" type="number" min="0" value="'+((t.pre||{}).r||0)+'"></label><button class="btn sm pri" type="submit">Save</button><button class="btn sm" type="button" data-a="editPre">Cancel</button></form>':'<span class="lab">Before tracking</span><span>'+(t.pre.f||0)+' found · '+(t.pre.l||0)+' logged ('+(t.pre.b||0)+' Bugs, '+(t.pre.r||0)+' FRs) · included in your totals</span><button class="btn sm ghost" data-a="editPre">Edit</button>')+'</div>':'<div class="prebar quiet"><button class="btn sm ghost" data-a="editPre">+ Add findings made before tracking</button></div>')+'<form class="addbar" id="addForm"><div class="seg" role="group" aria-label="Type">'+[['bug','Bug'],['fr','FR'],['unk','?']].map(function(x){return'<button type="button" class="'+x[0]+'" data-a="addType" data-t="'+x[0]+'" aria-pressed="'+(VIEW.addType===x[0])+'">'+x[1]+'</button>'}).join('')+'</div><button type="button" class="btn sm realtog" data-a="addReal" aria-pressed="'+!!VIEW.addReal+'" title="Tag new findings as real-app only: the clone doesn\'t have it, so the reviewer needs a real screenshot or recording">Real app</button><textarea class="in addta" id="addIn" rows="1" placeholder="'+(VIEW.addType==='fr'?'Page: Capability should …':'Page: Component failure when trigger')+'  (Enter adds a draft · Shift+Enter new line)" aria-label="New draft finding"></textarea><button class="btn pri" type="submit">Add</button></form>'+
    (focusOn()?'<div class="row hint" style="justify-content:flex-end"><span class="saved" data-saved></span></div>':'<div class="row hint"><span>Circle: not started → in progress (running Flow) → done (logged in Feather). Found counts every finding; logged counts Done.</span><span class="sp"></span><span class="saved" data-saved></span></div>')+
    '<div class="fscroll" id="fscroll">'+(VIEW.filter==='all'?groupedHtml(t,fl,c):'<div class="flist">'+(fl.length?fl.map(function(f){return fHtml(t,f)}).join(''):'<p class="muted" style="margin:0">Nothing in this filter.</p>')+'</div>')+'</div></div>';
  var gates='<div class="next '+s.tone+'" id="next"><div class="row"><span class="lab">Rule check</span><span class="sp"></span><button class="btn sm ghost" data-a="guide" data-g="clock" data-tip="Open the guide at the clock-vs-count table.">Guide</button></div><h2>'+esc(s.h)+'</h2><p>'+esc(s.p)+'</p></div><div class="card" id="strat">'+stratHtml(t)+'</div>'+
    '<div class="card"><span class="lab">Gates</span><div class="gates" id="gates">'+gatesHtml(e)+'</div></div>';
  var notes='<div class="card"><div class="row"><span class="lab">Scratch notes</span><span class="sp"></span><span class="saved" data-saved></span></div><textarea class="in notes" id="notes" data-in="notes" placeholder="Workflows to try, things to re-check, real-app comparisons…" aria-label="Scratch notes">'+esc(t.notes||'')+'</textarea></div>';
  notes+=histHtml(t);
  var pq=VIEW.pastQ.toLowerCase(),pl=past.filter(function(p){return!pq||String(p.f.text).toLowerCase().indexOf(pq)>=0});
  var nTasks={};past.forEach(function(p){nTasks[p.task.id]=1});
  var pastHtml='<div class="card"><span class="lab">Past findings on '+esc(t.app||'this app')+'</span>'+(past.length?'<p class="hint" style="margin:0">'+Object.keys(nTasks).length+' earlier task'+(Object.keys(nTasks).length>1?'s':'')+', '+past.length+' findings. Drafts that match one get an amber flag.</p><input class="in" data-in="pastQ" id="pastQ" placeholder="Search past findings" value="'+esc(VIEW.pastQ)+'" aria-label="Search past findings"><div class="past">'+pl.slice(0,200).map(function(p){var first=String(p.f.text||'').split('\n')[0];return'<div class="pf '+p.f.type+'"><div class="m">'+day(p.task.createdAt)+' · '+(p.f.type==='bug'?'Bug':p.f.type==='fr'?'FR':'?')+' · '+(p.f.status==='done'?'done':p.f.status)+'</div>'+esc(first||'(empty)')+'</div>'}).join('')+'</div>':'<p class="hint" style="margin:0">'+(key?'First task on this app. Next time you claim it, this list shows what you already filed.':'Name the app to compare with earlier tasks.')+'</p>')+'</div>';
  var center='<section class="tcenter" aria-label="Findings">'+findings.replace('<div class="card">','<div class="card fcard">')+'</section>';
  if(focusOn())return'<div class="tview focus">'+center+'<aside class="tright" id="tright" aria-label="AHT, counts and pace">'+focusPanel(t,{nb:nb,head:head,clock:clock,gates:gates,notes:notes,pastHtml:pastHtml})+'</aside></div>';
  return'<div class="tview"><section class="tcenter" aria-label="Findings">'+findings.replace('<div class="card">','<div class="card fcard">')+'</section><aside class="tright" id="tright" aria-label="Task, clock and rules"><div class="rtop">'+nb+head+tgtStrip(t)+'<div class="mbar" id="mbar">'+mbarHtml(t)+'</div>'+clock+'</div><div class="rrest">'+gates+notes+pastHtml+'</div></aside></div>';
}
function mbarHtml(t){
  var e=elapsed(t),m=e/60,st=stageFor(t,m),c=counts(t),dn=doNow(t),nx=null,GN=gatesNow();for(var i=0;i<GN.length;i++)if(GN[i].m>m){nx=GN[i];break}
  var segs=stagesNow().map(function(x){var w=(x.b-x.a)/AHT*100,on=x===st,pct=on?Math.min(100,(m-x.a)/(x.b-x.a)*100):m>=x.b?100:0;return'<div class="seg2'+(on?' on':m>=x.b?' past':'')+'" style="flex:'+w+' 1 0"><i style="width:'+pct+'%"></i><b>'+x.n+'</b><span>'+hm(x.a*60)+'–'+hm(x.b*60)+'</span></div>'}).join('');
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
  var pr=by('progress'),dr=by('draft').slice().sort(function(x,y){return(x.createdAt||0)-(y.createdAt||0)||(x.at||0)-(y.at||0)}),dn=by('done'),open=!!IDX.settings.showDone||t.status==='rework',h='';
  var sec=function(label,list){return list.length?'<div class="ghead"><span class="lab">'+label+' · '+list.length+'</span></div><div class="flist">'+list.map(function(f){return fHtml(t,f)}).join('')+'</div>':''};
  h+=sec('In progress',pr)+sec('Not started',dr);
  if(!pr.length&&!dr.length)h+='<p class="muted" style="margin:0">Everything is done. Add the next finding above.</p>';
  if(dn.length)h+='<button type="button" class="donebar" data-a="toggleDone" aria-expanded="'+open+'"><span class="lab">Done · '+dn.length+'</span><span class="sp"></span><span>'+(open?'Hide':'Show')+'</span></button>'+(open?'<div class="flist">'+dn.map(function(f){return fHtml(t,f)}).join('')+'</div>':'');
  return h}
function gatesHtml(e){var GN=gatesNow();return GN.map(function(g,i){var m=e/60,nx=GN[i+1];var st=m>=g.m&&(!nx||m<nx.m)?'now':m>=g.m?'past':'';return'<div class="gate '+st+'"><span class="t">'+g.t+'</span><i></i><span>'+esc(g.l)+'</span></div>'}).join('')}
function fHtml(t,f){
  var d=dupOf(t,f);
  return'<div class="f '+f.status+(d?' dup':'')+(f.real==='need'?' realneed':'')+'" data-fid="'+f.id+'"><button class="st '+f.status+'" data-a="cycle" data-id="'+f.id+'" aria-label="Status: '+f.status+'. Click to change">'+(f.status==='done'?'<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>':'')+'</button>'+
  '<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><div class="fh"><button class="chip '+f.type+'" data-a="ftype" data-id="'+f.id+'">'+(f.type==='bug'?'BUG':f.type==='fr'?'FR':'TYPE?')+'</button><span class="lab">'+(f.status==='draft'?'Not started':f.status==='progress'?'In progress':'Done')+' · found at '+hm(f.at||0)+(f.status==='done'&&f.doneAt!=null?' · logged at '+hms(f.doneAt)+(f.startAt!=null&&f.doneAt>f.startAt?' ('+mmss(f.doneAt-f.startAt)+' to log)':''):'')+'</span>'+(f.status==='progress'?'<span class="ftimer" data-ft="'+f.id+'"></span>':'')+(t.status==='rework'&&f.status==='done'?(f.fix==='todo'?'<span class="pill crit">Needs fix</span><button class="btn sm pri" data-a="fixF" data-id="'+f.id+'" data-v="done">Mark fixed</button>':f.fix==='done'?'<span class="pill ok">Fixed</span><button class="btn sm ghost" data-a="fixF" data-id="'+f.id+'" data-v="todo">Undo</button>':'<button class="btn sm ghost" data-a="fixF" data-id="'+f.id+'" data-v="todo">Needs fix</button>'):'')+(f.real==='need'?'<span class="pill warn" title="'+(f.realAuto?'Auto-tagged: the rubric compares with the real app. ':'')+'Add a real-app screenshot or recording to the Feather task, then tap Evidence added.">Real app · needs comparison screenshot/recording</span><button class="btn sm pri" data-a="realTag" data-id="'+f.id+'" data-v="done">Evidence added</button><button class="btn sm ghost" data-a="realTag" data-id="'+f.id+'" data-v="">Not real app</button>':f.real==='done'?'<span class="pill ok" title="Real app only: evidence added to the Feather task">Real app · evidence added</span><button class="btn sm ghost" data-a="realTag" data-id="'+f.id+'" data-v="need">Undo</button>':'<button class="btn sm ghost" data-a="realTag" data-id="'+f.id+'" data-v="need" title="Mark as real-app only: the clone doesn\'t have it">+ Real app</button>')+'<span class="sp"></span>'+(VIEW.confirmDel===f.id?'<button class="btn sm danger" data-a="delF" data-id="'+f.id+'">Confirm delete</button>':'<button class="btn sm ghost" data-a="delF" data-id="'+f.id+'" aria-label="Delete finding">Delete</button>')+'</div>'+
  '<textarea data-in="ftext" data-id="'+f.id+'" rows="2" aria-label="Finding notes" placeholder="First line: summary. Then steps, expected vs actual…">'+esc(f.text||'')+'</textarea><div class="fmtbox">'+fmtHint(f)+'</div><div class="dupbox">'+dupHtml(d)+'</div>'+stuckHtml(t,f)+rubCardHtml(t,f)+'</div></div>';
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
    var m=Math.floor(e/60);if(m!==lastMin){lastMin=m;var nx=$('#next');if(nx){var s=nextStep(t);nx.className='next '+s.tone;nx.innerHTML='<div class="row"><span class="lab">Rule check</span><span class="sp"></span><button class="btn sm ghost" data-a="guide" data-g="clock" data-tip="Open the guide at the clock-vs-count table.">Guide</button></div><h2>'+esc(s.h)+'</h2><p>'+esc(s.p)+'</p>'}}var gb=$('#gates');if(gb)gb.innerHTML=gatesHtml(e);
    var mb=$('#mbar');if(mb)mb.innerHTML=mbarHtml(t);
    var hd=$('#hud');if(hd){hd.className='hud heat-'+heatOf(t).cls;hd.innerHTML=hudInner(t)}var hr=$('#hrule');if(hr&&Math.floor(e)%15===0){var tmp=document.createElement('div');tmp.innerHTML=hruleHtml(t);hr.replaceWith(tmp.firstChild)}
    if(Math.floor(e)%5===0){var sg=$('#strat');if(sg)sg.innerHTML=stratHtml(t)}
    var M=null;$$('[data-ft]').forEach(function(el){var f=findF(t,el.dataset.ft);if(!f)return;M=M||metrics(t);var sp=e-(f.startAt||e),tg=M.target*60;el.textContent=mmss(sp)+' / '+mmss(tg);el.className='ftimer'+(sp>tg?' over':'');var sk=document.querySelector('[data-stuck="'+f.id+'"]');if(sk)sk.classList.toggle('over',sp>tg)});
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
  if(a==='rdLog'&&t){t.rd=t.rd?0:Date.now();saveTask(t);render();return}
  if(a==='mfrRun'&&t){t.mfrRun=true;logEv(t,'mfrRun');saveTask(t);render();toast('MFR workflow noted','Follow its outcome: keep working, or submit the MFR.','ok');return}
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
  if(a==='avgEdit'){VIEW.avgEdit=!VIEW.avgEdit;render();if(VIEW.avgEdit){var q=$('#qAvg');if(q)q.focus()}return}
  if(a==='avgClear'){var t=cur();if(t){delete t.avg;VIEW.avgEdit=false;saveTask(t);render()}return}
  if(a==='run'){if(running(t)){pause(t);if(t.hub)t.hub.cont=false}else resume(t);t.clockU=Date.now();saveTask(t);render();return}
  if(a==='prior'){VIEW.prior=!VIEW.prior;VIEW.sync=false;render();var pi=$('#priorIn');if(pi){pi.focus();pi.select()}return}
  if(a==='sync'){VIEW.prior=false;VIEW.sync=!VIEW.sync;VIEW.syncT0=null;render();var si=$('#syncIn');if(si)si.focus();return}
  if(a==='nudge'){setElapsed(t,Math.max(0,elapsed(t)+(+b.dataset.d)));t.clockU=Date.now();markPastGates(t);saveTask(t);render();return}
  if(a==='toggleDone'){IDX.settings.showDone=!IDX.settings.showDone;saveIdx();render();return}
  if(a==='filter'){VIEW.filter=b.dataset.f;render();return}
  if(a==='addReal'){VIEW.addReal=!VIEW.addReal;b.setAttribute('aria-pressed',!!VIEW.addReal);var ai2=$('#addIn');if(ai2)ai2.focus();return}
  if(a==='realTag'){var t=cur(),f=t&&findF(t,b.dataset.id);if(f){if(b.dataset.v){f.real=b.dataset.v;delete f.realNo}else{delete f.real;delete f.realAuto;f.realNo=1}f.u=Date.now();saveTask(t);if(VIEW.filter==='real'&&!realC(t).all||VIEW.filter==='realneed'&&!realC(t).need)VIEW.filter='all';render()}return}
  if(a==='addType'){VIEW.addType=b.dataset.t;var ai0=$('#addIn');if(ai0)ai0.placeholder=(VIEW.addType==='fr'?'Page: Capability should …':'Page: Component failure when trigger')+'  (Enter adds a draft · Shift+Enter new line)';$$('[data-a="addType"]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});var ai=$('#addIn');if(ai)ai.focus();return}
  if(a==='cycle'){var f=findF(t,b.dataset.id);if(f.status==='progress'){openRub(t,f,'done');return}f.status=f.status==='draft'?'progress':f.status==='progress'?'done':'draft';var now=elapsed(t);if(f.status==='progress'){f.startAt=now;f.w1=0;f.w2=0}if(f.status==='done'){f.doneAt=now;if(f.startAt==null)f.startAt=now}if(f.status==='draft'){delete f.doneAt;delete f.startAt}t.lastAct=now;f.u=Date.now();saveTask(t);render();if(f.status==='done')toast('Logged · '+counts(t).n+' done','Find it under Done at the bottom of the list.','ok');checkGates();return}
  if(a==='ftype'){var g=findF(t,b.dataset.id);g.type=g.type==='bug'?'fr':g.type==='fr'?'unk':'bug';g.u=Date.now();saveTask(t);render();return}
  if(a==='delF'){if(VIEW.confirmDel!==b.dataset.id){VIEW.confirmDel=b.dataset.id;render();return}t.findings=t.findings.filter(function(x){return x.id!==b.dataset.id});(t.delF=t.delF||[]).push(b.dataset.id);VIEW.confirmDel=null;saveTask(t);render();toast('Finding deleted','','ok');return}
  if(a==='delTask'){if(VIEW.confirmDel!==t.id){VIEW.confirmDel=t.id;render();return}try{localStorage.removeItem(P+'t.'+t.id)}catch(e){}delete TASKS[t.id];IDX.ids=IDX.ids.filter(function(x){return x!==t.id});var did=t.id;IDX.cur=null;saveIdx();VIEW.mode='empty';VIEW.confirmDel=null;render();pushDelete(did);toast('Task deleted','','ok');return}
  if(a==='end'){var s=b.dataset.s,was=t.status;if({submitted:1,lfs:1,unclaimed:1,released:1,outdated:1}[s]&&rdRequired(t)&&!t.rd&&VIEW.rdWarnId!==t.id){VIEW.rdWarnId=t.id;toast('Not logged in Review Desk yet','Log it there first (Review Desk records it, Feather does the submit/unclaim), then tick Logged in Review Desk. Click again to close the task anyway.','warn');return}t.clockU=Date.now();if(s==='rework'){t.reworkFrom=was==='mfr'?'mfr':'submitted';t.status='rework';t.reworks=(t.reworks||0)+1;resume(t);IDX.settings.showDone=true;saveIdx();saveTask(t);render();toast('Corrections requested','Flag each item the reviewer named with "Needs fix", correct it in Feather and Flow, then mark it Fixed. Keep Hubstaff on: corrections are tracked time.','warn');return}if(s==='resubmit'){pause(t);t.status=t.reworkFrom==='mfr'?'mfr':'submitted';t.endedAt=Date.now();saveTask(t);render();toast('Resubmitted',t.status==='mfr'?'Back to awaiting review.':'Marked submitted again.','ok');return}if(s==='active'){t.status='active';resume(t)}else{pause(t);t.status=s;t.endedAt=Date.now()}saveTask(t);render();
    toast(s==='lfs'?'Submitted with LFS':s==='mfr'?'MFR submitted':s==='submitted'?'Marked submitted':s==='form'?'MFR submitted':s==='outdated'?'Outdated task submitted':s==='unclaimed'?'Marked unclaimed':s==='released'?'Released':'Back in progress',s==='lfs'?'Log it in Review Desk as an LFS (limitation + tested workflows), then submit in Feather now. No approval; you can start your next task.':s==='mfr'?'Keep it In Progress in Feather. You may claim ONE new task from a different app. No reply in 12 hours? Contact your pod leads.':s==='submitted'&&t.status==='mfr'?'Approved MFR: submitted as-is.':'','ok');return}
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
  if(f.id==='preForm'&&t){var nv=function(id){return Math.max(0,parseInt($(id).value,10)||0)};var old=t.pre||{},np={f:nv('#pF'),l:nv('#pL'),b:nv('#pB'),r:nv('#pR')},note=[];
    if(np.l>np.f){if(np.f<(+old.f||0)||np.l===(+old.l||0)){np.l=np.f;note.push('Logged lowered to '+np.f+' to match Found.')}else{np.f=np.l;note.push('Found raised to '+np.l+' to match Logged.')}}
    if(np.b+np.r>np.l){var over=np.b+np.r-np.l,cut=Math.min(np.r,over);np.r-=cut;np.b-=Math.min(np.b,over-cut);note.push('Bugs and FRs trimmed to fit '+np.l+' logged.')}
    if(!np.f&&!np.l&&!np.b&&!np.r)delete t.pre;else t.pre=np;VIEW.editPre=false;saveTask(t);render();toast('Before-tracking counts saved',note.join(' ')||(t.pre?t.pre.f+' found · '+t.pre.l+' logged':'Cleared.'),'ok');return}
  if(f.id==='newForm'){
    var app=$('#nApp').value.trim(),url=$('#nUrl').value.trim(),fid=parseFeather(url),hubTxt=$('#nTime').value.trim(),hub=hubTxt?parseTime(hubTxt):null;if(hub!=null&&$('#nRun').checked&&VIEW.syncT0)hub+=(Date.now()-VIEW.syncT0)/1000;VIEW.syncT0=null;
    if(!app){VIEW.newErr='Enter the app name.';$('#nErr').textContent=VIEW.newErr;return}
    if(hubTxt&&hub==null){$('#nErr').textContent='Enter Hubstaff\'s total as h:mm or h:mm:ss, for example 1:03:50.';return}
    var late=$('#nLate').checked,tri=late?$('#nTri').value:'',hunt45=!!tri,off=tri==='earlier'?45*60:0,spTxt=late?$('#nSpent').value.trim():'',sec=spTxt?parseTime(spTxt):0;
    if(spTxt&&sec==null){$('#nErr').textContent='Enter the time already spent as h:mm or h:mm:ss, for example 0:20:00.';$('#nSpent').focus();return}
    if(late&&!spTxt&&!hunt45){$('#nErr').textContent='Enter the time you already spent on this task.';$('#nSpent').focus();return}
    sec+=off;if(tri==='today'&&sec<45*60)sec=45*60;
    var num=function(id){return Math.max(0,parseInt($(id).value,10)||0)},pre=late?{f:num('#nPreF'),l:num('#nPreL'),b:num('#nPreB'),r:num('#nPreR')}:null;
    if(pre&&pre.l>pre.f)pre.f=pre.l;if(pre&&pre.b+pre.r>pre.l){$('#nErr').textContent='Bugs plus FRs can\'t be more than the number logged.';return}
    var mfrSame=allTasks().find(function(x){return x.status==='mfr'&&appKey(x.app)===appKey(app)});if(false&&mfrSame){$('#nErr').textContent='Your task waiting on the MFR is on '+mfrSame.app+'. The extra task while you wait must be from a different app.';return}
    var ex=fid&&allTasks().find(function(x){return x.featherId===fid});
    if(ex){$('#nErr').innerHTML='This Feather task is already logged. <button class="btn sm" type="button" data-a="open" data-id="'+ex.id+'">Open it</button>';return}
    var nt={id:uid(),app:app,featherUrl:url,featherId:fid,createdAt:Date.now(),status:'active',clock:{base:sec,at:$('#nRun').checked?Date.now():null},clockU:Date.now(),findings:[],notes:'',fired:{},trackFrom:sec,additional:$('#nAdd').checked||undefined,pre:pre||undefined,huntDone:hunt45?true:undefined,huntAt:hunt45?45*60:undefined,offset:off||undefined,avg:(function(){var v=parseInt(($('#nAvg')||{}).value,10);return v>0?Math.min(30,v):undefined})(),hub:hub!=null?{h:hub,e:sec,cont:$('#nRun').checked}:undefined};
    markPastGates(nt);TASKS[nt.id]=nt;IDX.ids.push(nt.id);IDX.cur=nt.id;saveIdx();saveTask(nt);VIEW.mode='task';VIEW.filter='all';
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
    render();var ai=$('#addIn');if(ai)ai.focus();
    var prior=pastFor(nt).length;if(prior)toast('You\'ve tested '+app+' before',prior+' past findings are listed on the right. New drafts that match get flagged.','info');
    return}
  if(!t)return;
  if(f.id==='addForm'){var inp=$('#addIn'),v=inp.value.trim();if(!v)return;inp.value='';t.findings=t.findings||[];t.findings.push({id:uid(),type:VIEW.addType,status:'draft',real:VIEW.addReal?'need':undefined,text:v,at:elapsed(t),createdAt:Date.now(),u:Date.now()});saveTask(t);if(VIEW.filter==='done'||VIEW.filter==='progress')VIEW.filter='all';render();var ni=$('#addIn');if(ni)ni.focus();return}
  if(f.id==='syncForm'){var hv=$('#syncIn').value.trim(),tv=($('#syncTask')||{value:''}).value.trim(),H=hv?parseTime(hv):null,T=tv?parseTime(tv):null,adj=running(t)&&VIEW.syncT0?(Date.now()-VIEW.syncT0)/1000:0;VIEW.syncT0=null;
    if((hv&&H==null)||(tv&&T==null)||(!hv&&!tv)){toast('Check the time','Use h:mm or h:mm:ss, for example 1:23:45.','warn');return}
    if(H!=null)H+=adj;var msg;
    if(T!=null){setElapsed(t,T+adj);msg='Task clock set to '+hms(elapsed(t))+'.';if(H!=null)t.hub={h:H,e:elapsed(t),cont:running(t)}}
    else{var A=t.hub;if(A&&A.cont!==false&&running(t)&&H>=A.h){var ne=A.e+(H-A.h);setElapsed(t,ne);msg='Task clock '+hms(ne)+' (Hubstaff added '+hm(H-A.h)+' since the last reference).'}else msg='Reference set at Hubstaff '+hms(H)+'. The task clock stays at '+hms(elapsed(t))+'; from now on syncing adds only what Hubstaff gains while this task runs.';t.hub={h:H,e:elapsed(t),cont:running(t)}}
    t.clockU=Date.now();markPastGates(t);VIEW.sync=false;saveTask(t);render();toast('Synced',msg,'ok');return}
  if(f.id==='priorForm'){var nv=parseTime($('#priorIn').value);if(nv==null){toast('Check the time','Use h:mm or h:mm:ss, for example 0:45:00.','warn');return}var old=t.offset||0;setElapsed(t,Math.max(0,elapsed(t)+nv-old));if(t.hub)t.hub.e+=nv-old;if(nv)t.offset=nv;else delete t.offset;if(elapsed(t)>=45*60&&!t.huntDone){t.huntDone=true;t.huntAt=45*60}t.clockU=Date.now();markPastGates(t);VIEW.prior=false;saveTask(t);render();toast(nv?'Earlier-day time added':'Earlier-day time removed','AHT clock now '+hms(elapsed(t))+'. Syncs to Hubstaff keep adding '+hm(nv)+'.','ok');return}
  if(f.id==='avgForm'){var t=cur(),av=parseInt(($('#qAvg')||{}).value,10);if(t){if(av>0)t.avg=Math.min(30,av);else delete t.avg;VIEW.avgEdit=false;saveTask(t);render()}return}
  if(f.id==='headForm'){var av=parseInt(($('#eAvg')||{}).value,10);if(av>0)t.avg=Math.min(30,av);else delete t.avg;t.app=$('#eApp').value.trim()||t.app;t.featherUrl=$('#eUrl').value.trim();t.featherId=parseFeather(t.featherUrl);VIEW.editHead=false;saveTask(t);render();return}
});
document.addEventListener('input',function(ev){
  if((ev.target.id==='syncIn'||ev.target.id==='syncTask'||ev.target.id==='nTime')&&!VIEW.syncT0)VIEW.syncT0=Date.now();
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
var FORMK=['summary','prio','type','path','steps','expected','actual'];/* Priority Justification is parsed only so it doesn't spill into Actual; not kept */
var KEEP=RF.filter(function(x){return x.k!=='why'&&x.k!=='video'});/* video is parsed so a pasted link doesn't spill into Actual; not kept */
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
function markDone(t,f){closeBlock(t,f);var now=elapsed(t);f.status='done';f.doneAt=now;if(f.startAt==null)f.startAt=now;t.lastAct=now;f.u=Date.now()}
function saveRub(skip){
  if(!RUB)return;var t=TASKS[RUB.tid],f=t&&findF(t,RUB.fid);if(!f){closeRub();return}var done=RUB.mode==='done';
  if(!skip){var r=RUB.fields;if(r.type==='fr')r.steps='N/A';if(!String(r.summary||'').trim()){$('#rubErr').textContent='Add at least the Summary.';var s=$('[data-rf="summary"]');if(s)s.focus();return}
    var keep={};KEEP.forEach(function(x){if(String(r[x.k]||'').trim())keep[x.k]=String(r[x.k]).trim()});keep.raw=RUB.raw;keep.at=Date.now();keep.app=t.app;f.rub=keep;
    if(keep.type==='bug'||keep.type==='fr')f.type=keep.type}
  if(!skip)autoReal(t);
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

/* ---------- in-app guide: rules + exact workflow (read-only, opened from the sidebar) ---------- */
var GUIDE_SRC='Review Desk expert guide and LFS announcement (Nov 21 2026), CheckSet Operations & Strategy Handbook (Nov 2026), Office Hours of Nov 9, 12 and 16, Miguel\'s Hubstaff post, and your HDM confirmations.';
function gTable(head,rows){return'<div class="gtable"><table><thead><tr>'+head.map(function(h){return'<th>'+h+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return'<tr>'+r.map(function(c){return'<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}
function gSec(id,title,body){return'<section class="gsec" id="g-'+id+'"><h2>'+title+'</h2>'+body+'</section>'}
function flowChart(){
  var E='var(--muted)',I='var(--fg)',Q='var(--muted)';
  var box=function(cx,y,w,h,c){return'<rect x="'+(cx-w/2)+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="'+(c||'none')+'" fill-opacity="'+(c?0.14:1)+'" stroke="'+(c||E)+'" stroke-width="'+(c?2:1.25)+'"/>'};
  var dia=function(cx,cy,hw,hh){return'<polygon points="'+(cx-hw)+','+cy+' '+cx+','+(cy-hh)+' '+(cx+hw)+','+cy+' '+cx+','+(cy+hh)+'" fill="none" stroke="'+E+'" stroke-width="1.25"/>'};
  var tx=function(x,y,t,o){o=o||{};return'<text x="'+x+'" y="'+y+'" text-anchor="'+(o.a||'middle')+'" font-size="'+(o.s||13)+'" font-weight="'+(o.w||400)+'" fill="'+(o.c||I)+'">'+t+'</text>'};
  var B='var(--crit)',W='var(--warn)',G='var(--ok)';
  return'<svg class="flowchart" viewBox="0 0 760 760" role="img" aria-label="Task workflow: every task ends by release, LFS or submit"><defs><marker id="fc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+E+'"/></marker></defs>'+
  tx(24,30,'Every task is logged in Review Desk, then ends: release, LFS or submit',{a:'start',s:15,w:600})+tx(24,52,'Red leaves the task · amber is an LFS · green is submitted · log in Review Desk first',{a:'start',s:11.5,c:Q})+
  '<g fill="none" stroke="'+E+'" stroke-width="1.25"><path d="M250 136V162" marker-end="url(#fc-arrow)"/><path d="M360 196H430" marker-end="url(#fc-arrow)"/><path d="M250 230V266" marker-end="url(#fc-arrow)"/><path d="M360 300H430" marker-end="url(#fc-arrow)"/><path d="M250 334V370" marker-end="url(#fc-arrow)"/><path d="M250 426V452" marker-end="url(#fc-arrow)"/><path d="M360 486H430" marker-end="url(#fc-arrow)"/><path d="M250 520V546" marker-end="url(#fc-arrow)"/><path d="M360 590H430" marker-end="url(#fc-arrow)"/><path d="M250 634V660" marker-end="url(#fc-arrow)"/><path d="M360 694H430" marker-end="url(#fc-arrow)"/><path d="M140 694H60V398H120" marker-end="url(#fc-arrow)"/></g>'+
  box(250,80,260,56)+tx(250,104,'Claim the task',{w:600})+tx(250,122,'Check the app target in Review Desk',{s:11.5,c:Q})+
  dia(250,196,110,34)+tx(250,200,'Reach the target?')+
  box(575,168,290,56,B)+tx(575,192,'Release before 2:00',{w:600})+tx(575,210,'Log the release, then unclaim · ideally by 0:30',{s:11.5})+
  dia(250,300,110,34)+tx(250,304,'Still workable?')+
  box(575,272,290,56,B)+tx(575,296,'Release the task',{w:600})+tx(575,314,'Environment broken or unusable',{s:11.5})+
  box(250,370,260,56)+tx(250,394,'Test and file findings',{w:600})+tx(250,412,'Goal 30 · target = Review Desk floor',{s:11.5,c:Q})+
  dia(250,486,110,34)+tx(250,490,'2:00 · 10+ found?')+
  box(575,450,290,72,W)+tx(575,474,'Under 10 at 2:00: release',{w:600})+tx(575,490,'Log the release, then unclaim in Feather',{s:11.5})+tx(575,506,'10+: keep going to target or 4:30',{s:11.5})+
  dia(250,590,110,44)+tx(250,586,'Target or')+tx(250,602,'30+ reached?')+
  box(575,554,290,72,G)+tx(575,578,'Submit in Feather',{w:600})+tx(575,594,'Log it, submit any time',{s:11.5})+tx(575,610,'if time allows · before 4:30',{s:11.5})+
  dia(250,694,110,34)+tx(250,698,'Reached 4:30?')+
  box(575,654,290,80,W)+tx(575,678,'Stop at 4:30',{w:600})+tx(575,696,'Below target: LFS',{s:11.5})+tx(575,712,'limitation + tested workflows',{s:11.5})+
  tx(395,188,'no',{s:11.5,c:Q})+tx(258,252,'yes',{a:'start',s:11.5,c:Q})+tx(395,292,'no',{s:11.5,c:Q})+tx(258,356,'yes',{a:'start',s:11.5,c:Q})+tx(395,478,'no',{s:11.5,c:Q})+tx(258,538,'yes',{a:'start',s:11.5,c:Q})+tx(395,582,'yes',{s:11.5,c:Q})+tx(258,652,'no',{a:'start',s:11.5,c:Q})+tx(395,686,'yes',{s:11.5,c:Q})+tx(66,560,'no: keep testing',{a:'start',s:11.5,c:Q})+
  '</svg>'}
function guideHtml(){
  var nav=[['glance','At a glance'],['chart','Workflow chart'],['flow','Step by step'],['clock','Clock vs count'],['exits','Exits'],['rubric','Writing findings'],['evidence','Evidence and real-app findings'],['filter','Rank and filter'],['time','Time tracking'],['queue','Holding time and queue']];
  return'<div class="wrap guide"><div class="card"><div class="row"><h1 style="margin:0;font-size:22px">Guide · rules and workflow</h1><span class="sp"></span><button class="btn sm ghost" data-a="guideClose">Back</button></div><p class="hint" style="margin:0">Source: '+GUIDE_SRC+' The app\'s alerts and rule checks follow exactly this.</p>'+
  '<nav class="gnav" aria-label="Guide sections">'+nav.map(function(n){return'<button class="btn sm ghost" data-a="gjump" data-g="'+n[0]+'">'+n[1]+'</button>'}).join('')+'</nav></div>'+
  gSec('glance','At a glance',gTable(['Rule','Number','What it means'],[
    ['Goal','<b>30</b> valid findings','Always aim for 30 inside the 4:30 AHT'],
    ['App target','Review Desk · App guide','A floor, not a ceiling. Reach it → <b>submit any time</b>, even before 4:30. Unlisted apps default to 30. At 30, submit'],
    ['Review Desk','Every task','Log every submission, <b>LFS</b> and release there first. Review Desk doesn\'t act in Feather: then submit or unclaim in Feather'],
    ['Early release','Before 2:00','App fails or target unrealistic? Log an early release, then unclaim. No rating or tags'],
    ['2:00 checkpoint','Under 10 found','Click Log the release, then release in Feather. 10+ → continue until the target or 4:30'],
    ['AHT','4:30','Stop hunting. Below target → write the limitation and tested workflows, Submit with an LFS, submit in Feather immediately'],
    ['Holding time','1 day ideal · 3 max','Day 4: auto-unclaimed into Additional Tasks'],
    ['Unsure','Any time','Ask #titan-nexus-reviewdesk (platform) or your HDM. Keep Hubstaff on']]))+
  gSec('chart','Workflow chart','<div class="fcwrap">'+flowChart()+'</div><p class="hint">Follow the arrows from the top. Until you reach the target or 4:30, you loop back to testing.</p>')+
  gSec('flow','The workflow, step by step','<ol class="gsteps">'+[
    ['Before claiming','Look up the app on the expert dashboard (log in with your micro1 email). Note its average, or "Contact your HDM". Start with easier apps.'],
    ['Claim','One active task. Start Hubstaff, then New task here: paste the Feather link and enter the app target from Review Desk.'],
    ['By 0:30 · Release check','Explore the main workflows. Broken, unstable, or clearly can\'t reach the target? Log an early release in Review Desk, then unclaim in Feather. If the app itself is broken, also use Report an app problem in Review Desk: HDMs see it, so there is no need to tell them yourself. No rating, scores or tags.'],
    ['Before 2:00 · Release freely','Still struggling? Keep testing, or log an early release and unclaim. Nothing blocks you.'],
    ['Hunt and log','Each finding: draft → In progress (write it, run Flow, log in Feather) → Done (paste the rubric you filed).'],
    ['2:00 · Checkpoint','Under 10 found → Log the release, release. 10 or more → keep building to the target or 4:30.'],
    ['Target reached','Complete the quality checks and the V2 mix, Submit task in Review Desk, then submit in Feather. Keep finding valid issues if feasible; at 30, submit.'],
    ['4:15 · Wrap','Stop hunting. Runtime Quality and final checks.'],
    ['4:30 · Stop hunting','Target reached → submit. Below it → write the limitation and tested workflows, Submit with an LFS, submit in Feather immediately. No HDM approval. Keep Hubstaff on for everything you still do.']].map(function(s){return'<li><b>'+s[0]+'</b><span>'+s[1]+'</span></li>'}).join('')+'</ol>')+
  gSec('clock','Clock vs count',gTable(['Hubstaff time','Your count or state','Action','Where'],[
    ['0:00–0:30','Broken or unstable','Report an app problem in Review Desk (HDMs see it); log the release if you give the task back. No rating or tags','Review Desk, Feather'],
    ['Before 2:00','App fails or target unrealistic','Log an early release, then unclaim','Review Desk, Feather'],
    ['2:00','Under 10 found, below target','Log the release, then release','Review Desk, Feather'],
    ['2:00','10+ found, below target','Keep going until the target or 4:30','Feather'],
    ['Any time','Target reached','Log it, submit (before 4:30 is fine)','Review Desk, Feather'],
    ['Up to 4:30','30+ with 5+ Bugs and 5+ FRs (V2)','Runtime Quality, final checks, submit','Review Desk, Feather'],
    ['4:30','Below the target','Submit with an LFS, then submit in Feather immediately. Hubstaff stays on','Review Desk, Feather'],
    ['Before 4:30','Expect to go significantly over','Flag your HDM early. Keep tracking','POD thread'],
    ['Any time','Task shows Outdated','Submit it now, no extra review','Feather'],['Any time','App crash, load or sign-in failure','Report an app problem (one per app per day; doesn\'t count against you). It does not release the task','Review Desk']])+'<p class="hint">An LFS names the app limitation and the workflows you tested, specific and truthful. "Could not find more" is not enough. It isn\'t automatic acceptance: the reviewer checks validity, evidence, coverage, the target and your explanation.</p>')+
  gSec('exits','Exits and special cases',
    '<h3>Release (log it, then unclaim)</h3><p>Before 2:00: release any time the app fails or the target isn\'t realistic. At 2:00 with under 10 findings: release. Click <b>Log the release</b> in Review Desk (task link, app, reason, time spent), then unclaim in Feather. Never rate runtime quality, fill scores or add do_not_recommend tags.</p>'+
    '<h3>Broken app or environment</h3><p><b>Report an app problem</b> is for a problem with the app itself, not one task: it won\'t load, keeps breaking, you can\'t get in, or the environment reset. Pick the app and the problem (explain Other, one sentence); no task link needed. HDMs see it, it doesn\'t count against you, and you no longer need to tell your HDM yourself. One report per app per day is kept; another updates it. <b>If you are giving a task back because of it, use Release a task instead</b> (reasons: App won\'t load, App keeps crashing or breaking, Can\'t sign in or missing access, Environment reset during the task, Won\'t reach the app\'s target, Under 10 findings after 2 hours, Other), then unclaim in Feather.</p>'+
    '<h3>Submit when the target is reached</h3><p>Log it in Review Desk, then submit in Feather. You can submit before 4:30. The target is a floor: keep finding valid issues when feasible; at 30, submit.</p>'+
    '<h3>LFS · Low Finding Submission (replaces the MFR)</h3><ol><li>Use it at 4:30 below the target, with 10+ findings found.</li><li>Write the app limitation and the workflows you tested; one sentence is enough: your reviewer and HDMs read it. Be specific and truthful. Example shape: "Payments only allows viewing records; tested invoice creation, customer search, filters and exports, but payment creation and editing are unavailable". Use your own observations.</li><li>In Review Desk click <b>Submit with an LFS</b>, then submit in Feather <b>immediately</b>. No HDM approval. Don\'t leave it In Progress waiting; you can move to your next task.</li><li>Every LFS is tracked, and the reviewer checks it. V2 still needs 5 Bugs and 5 FRs. If you can\'t meet it, report the limitation and ask #titan-nexus-reviewdesk or your HDM. Never manufacture findings.</li></ol><p class="hint">Each task can be logged once. Logged something wrong? Ask your HDM to remove that record, then log it again.</p>'+
    '<h3>Rework</h3><p>Correct and resubmit in Feather as usual. Don\'t create a second Review Desk log: the next review updates the outcome. Read the reviewer\'s feedback in My tasks and reply there.</p>'+
    '<h3>Runtime Findings V2: what a finding needs</h3><ul><li>Every issue needs a screen recording or screenshot, an issue type (Bug or Feature Request) and a priority (P0, P1 or P2). Leave Tags empty.</li><li>At least 5 Bugs and 5 FRs. After that the rest may be either type. There is no quota per priority: a task of all P1s is fine, the goal is the number of findings.</li><li>Exclusions: when one applies, only a justified P0 (core workflow) or P1 (related to the core workflow) qualifies. P2 findings outside the exclusions must not be reported.</li><li><b>Real-app comparison:</b> there is no longer a limit per task. A capability confirmed in the original app but entirely missing from the clone counts as a Feature Request only if it blocks a core workflow (P0) or directly affects a related one (P1). Explain the impact in Expected and Actual. These count toward the total and the FR minimum.</li><li>Claim a task when it shows Ready, then wait for Open before you start. A secondary API or documentation error does not mean the main application is unavailable.</li></ul>'+
    '<h3>Where to ask</h3><p>Platform questions (access, navigation, errors, how to use Review Desk): #titan-nexus-reviewdesk. Questions about a task\'s feedback: comment on that task in Review Desk, so the reviewer and HDMs can answer there.</p>'+
    '<h3>Reusing findings</h3><p>Only reuse findings if you last worked on that app at least one week ago. The Tasker warns you when you claim an app you touched recently.</p>'+
    '<h3>Normal submission (30+)</h3><p>30+ valid, at least 5 Bugs and 5 FRs. Runtime Quality, final checks, submit in Feather before 4:30.</p>'+
    '<h3>Outdated</h3><p>If the status changes to Outdated while you work, submit it as it is. In Review Desk open the <b>Outdated</b> tab (App guide), enter the task link, findings, hours and minutes (app optional) and click <b>Log outdated task</b>, then submit it in Feather. No Check and no LFS.</p>'+
    '<h3>Additional tasks</h3><p>Tasks auto-released after 3 days, sometimes with old findings or reviewer comments. Treat it as an empty task: reuse valid existing findings or delete everything and start fresh. Comments are optional to read.</p>'+
    '<h3>Task from the instructions page that already shows findings</h3><p>Treat it as a brand-new task.</p>')+
  gSec('rubric','Writing findings',gTable(['Field','Rule'],[
    ['Summary','Page or section, then a colon. Bug: what fails and when (<code>Chats: Only first names are displayed for selected contacts when sharing</code>). FR: what it should do (<code>Profile menu: Add account should open the add account flow</code>). Short and to the point'],
    ['Priority','P0 core task blocked · P1 core support or severe UX · P2 everything else. Focus on P0/P1 functionality; avoid cosmetic P2s'],
    ['Issue Type','Bug: implemented but broken. FR: missing compared with the real app'],
    ['Page or Workflow','Every click to reach it, with arrows: <code>Home -> Chats -> Select any chat -> Plus icon -> Contact</code>. Use the exact names shown in the app'],
    ['Reproduction Steps','Bugs only: numbered, same path in more detail. FR: N/A'],
    ['Actual Behavior','Short description of what you see now'],
    ['Expected Behavior','How it should work once implemented correctly. A P2 or "unnecessary issue" reported as P1: justify here why it matters to a core workflow']]))+
  gSec('evidence','Evidence and real-app findings','<ul><li>Screenshot or a short video. More than 3 screenshots → use a video. Aim for <b>15–45 seconds</b>.</li><li>The evidence must show exactly what the summary describes, following the workflow.</li><li>Never show your real or expert email; use a dummy like <code>name@test.com</code>. Flow checks for personal info but can misfire on apps like a Gmail clone.</li><li><b>No limit on real-app findings</b>, as long as the real app is open in a browser tab and shown in the evidence next to the clone.</li><li>Real app paywalled or restricted: ask in your POD thread what evidence is allowed.</li><li>AI may polish wording only; never generate findings or fake evidence.</li></ul>')+
  gSec('filter','Rank and filter (Unnecessary Issues)','<ul><li><b>External website</b>: broke after leaving the app\'s domain → skip.</li><li><b>Says unavailable</b> (⊘ cursor, "Not implemented", "Coming soon") → out, unless it\'s P0/P1: then report it and justify the impact in Expected Behavior.</li><li><b>Missing prerequisite</b>: do the prerequisite and retest.</li><li><b>Known limitation</b>: already in the release notes → skip.</li></ul>')+
  gSec('time','Time tracking (Hubstaff policy)','<ul><li><b>Working = Hubstaff running.</b> Never pause it just to stay under 4:30. All task work is tracked and paid, including the LFS write-up.</li><li>Worked off the clock? Send your HDM the task ID and your best estimate.</li><li>A small overage is fine. Expect to go significantly over? Flag your HDM early and keep tracking.</li><li>Same step keeps pushing you over? Send the task ID and a breakdown (Time breakdown button).</li></ul>')+
  gSec('queue','Holding time and queue','<ul><li>1 active task. With the LFS there is no waiting: submit in Feather right after logging it, then start your next one.</li><li><b>Finish in 1 day</b> (2 is OK, 3 is the maximum). A task in progress 4+ days is unclaimed automatically and moved to Additional Tasks.</li><li>The task sheet is updated daily around Office Hours (about 9–10 AM PST) and again about 12 hours later. A link that doesn\'t open may just be mid-update.</li><li>Primary POD first. Engineering &amp; Data experts may also claim Healthcare; Creative &amp; Design experts may also claim Commercial.</li></ul><p class="hint">Sources: Office Hours Nov 9, Nov 12 and Nov 16, Miguel\'s Hubstaff post, and your HDM confirmations.</p>')+
  '</div>';
}
document.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
  if(a==='guide'){VIEW.mode='guide';var sd=$('#side');if(sd)sd.classList.remove('open');render();var m=$('#main');if(m)m.scrollTop=0;if(b.dataset.g){var g=$('#g-'+b.dataset.g);if(g)g.scrollIntoView({block:'start'})}return}
  if(a==='guideClose'){VIEW.mode=cur()?'task':'empty';render();return}
  if(a==='gjump'){var s=$('#g-'+b.dataset.g);if(s)s.scrollIntoView({behavior:'smooth',block:'start'});return}
});

/* ---------- tooltips: hover or focus any control, stage, gate or number ---------- */
var STAGE_TIP={Triage:'0:00–0:45. Test the whole app freely. Unclaim or release before 0:45 if it won\'t boot, is unstable, or clearly can\'t yield 20+ findings.',Hunt:'0:45–2:00. Find and log. 2:00 checkpoint: under 10 → log the release and release; 10+ → keep going.',Build:'2:00–4:15. Build toward the target (goal 30) with 5+ Bugs and 5+ FRs. 10+ found at 2:00 → continue.',Wrap:'4:15–4:30. Stop hunting: Runtime Quality, final checks, submit. Below the target at 4:30 → submit with an LFS.'};
var TIPS=[
  ['[data-a="new"]','Start tracking a task you just claimed. Paste the Feather link and match the clock to Hubstaff.'],
  ['[data-a="lib"]','Every rubric you\'ve recorded, searchable by field. New rubrics are checked against all of them for duplicates and conflicts.'],
  ['.side [data-a="guide"]','The CheckSet rules and the exact task workflow, as the app enforces them.'],
  ['#tq','Search app names, Feather IDs, finding notes, rubric fields and scratch notes.'],
  ['.titem','Open this task. Shows AHT used, logged out of 30, and status.'],
  ['#syncLab','Cloud sync. Tasks and rubrics sync across your signed-in devices.'],
  ['[data-a="notify"]','Desktop alerts at every gate, even while you work in another tab.'],
  ['label:has(#snd)','Play a short sound with each alert.'],
  ['label:has(#tipsOn)','Show these explanations when you hover or focus a control.'],
  ['[data-a="export"]','Download every task, finding and rubric as a JSON backup.'],
  ['label[for="imp"]','Restore from a JSON backup. Newer edits win when merging.'],
  ['[data-a="signout"]','Sign out on this device. Your data stays in the cloud.'],
  ['[data-a="collapse"]','Hide or show the task list.'],
  ['.thead .pill','Status of this task in the app. Change it with the buttons on the right.'],
  ['[data-a="copyId"]','Copy the Feather task ID.'],
  ['.thead a[target]','Open this task in Feather in a new tab.'],
  ['[data-a="editHead"]','Edit the app name or Feather link.'],
  ['[data-s="submitted"]','You submitted in Feather: 30+ valid, 5+ Bugs, 5+ FRs, Runtime Quality and final checks done.'],
  ['[data-s="lfs"]','4:30 and below the target: log it in Review Desk as an LFS (limitation + tested workflows), then submit in Feather immediately. No approval.'],
  ['[data-s="mfr"]','Older MFR task awaiting review. Keep it In Progress in Feather until it is answered.'],
  ['[data-a="rdLog"]','Tick when you have logged this task in Review Desk. Every submission, LFS and release must be logged there first.'],
  ['[data-s="outdated"]','The task went Outdated while you worked. Submit it right away, no extra review.'],
  ['[data-s="unclaimed"]',function(el){return/Removed/.test(el.textContent)?'Additional tasks can\'t be unclaimed by you. Mark this once an HDM removes it through your POD ticket.':'You unclaimed or released it: in the 45-minute window, or after an MFR. No rating, scores or tags.'}],
  ['[data-s="active"]',function(el){return/HDM/.test(el.textContent)?'Your HDM answered the MFR with keep working. Back to In progress.':'Move this task back to In progress.'}],
  ['[data-s="rework"]','The reviewer or HDM asked for corrections. Flag the items, fix them, then resubmit. The clock resumes: corrections are tracked time.'],
  ['[data-s="resubmit"]','All corrections are made and you resubmitted. Goes back to awaiting review (MFR) or submitted.'],
  ['[data-a="fixF"]','Flag this finding as needing a correction, or mark it fixed.'],
  ['[data-s="released"]','Your HDM closed or released the task after the MFR.'],
  ['.thead [data-s="submitted"].pri','Your MFR was approved (by the HDM or FLOW-AI Approval) and you submitted the task as-is in Feather.'],
  ['[data-a="breakdown"]','A copyable time breakdown for your HDM: AHT, overage, blocked time by reason (Flow slow, recording, Flow validation, environment) and your slowest findings.'],
  ['[data-a="delTask"]','Delete this task from the app on all devices. Feather is not affected.'],
  ['.mclock','Elapsed AHT, mirrored from Hubstaff. 4:30 is the ceiling.'],
  ['.hclock','AHT, synced to Hubstaff. Colour heats up as the next checkpoint nears: blue (30+ min away), amber (under 30), red (under 10), dark red past 4:30.'],
  ['.hbar','Progress to 4:30, with checkpoint marks.'],
  ['.hnums > div:nth-child(1)','Drafts: captured, not started.'],
  ['.hnums > div:nth-child(2)','Working: findings you are writing up now (rubric, Flow, Feather).'],
  ['.hnums > div:nth-child(3)','Logged out of your target: the app target from Review Desk (or 30 when unlisted). Reach it and you can submit any time. Below it at 4:30 → LFS. The goal is still 30.'],
  ['label[for="nAvg"]','The app\'s average approved findings, from the expert dashboard. It becomes this task\'s target. Leave empty if it says Contact your HDM.'],
  ['#eAvg','App target from Review Desk. Empty = 30.'],
  ['.hpace','Found so far vs the pace needed to reach your target (app target, or 30) by 4:15.'],
  ['[data-a="details"]','Show the full dashboard: stages, gates, pace analytics, notes and past findings.'],
  ['[data-a="actions"]','Status buttons: submitted, LFS, Outdated, unclaimed, time breakdown, edit.'],
  ['label:has(#focusOn)','Simple panel with only the clock, counts, pace and the current rule. Turn off for the full dashboard.'],
  ['label:has(#triOn)','Show the 0:00–0:45 triage stage and its 0:35 / 0:45 alerts. Off: the first checkpoint is 2:00.'],
  ['.seg2',function(el){var n=(el.querySelector('b')||{}).textContent;return STAGE_TIP[n]||''}],
  ['.mnow .pill','The stage you are in now. Its rule is shown beside it.'],
  ['.mends','Time left in this stage.'],
  ['.mcount > div:nth-child(1)','Found: every finding captured (drafts, in progress, done) plus before-tracking found.'],
  ['.mcount > div:nth-child(2)','Logged: findings marked Done (in Feather). A standard submission needs 30+.'],
  ['.mcount > div:nth-child(3)','The next gate and how long until its alert.'],
  ['.mdo','Do now: the single next action, from your pace and the rules.'],
  ['#next','Rule check: what the rules say to do right now, based on your time and count.'],
  ['#clk','AHT clock. It runs while Hubstaff runs. Pause it when you stop Hubstaff.'],
  ['#left','Time left until the 4:30 ceiling.'],
  ['.clockcard .bar','Progress toward 4:30. Marks at 0:45 (triage closes), 2:00 (release checkpoint) and 4:15 (wrap up).'],
  ['[data-a="run"]','Pause only when you stop working. Never pause Hubstaff (or this clock) just to stay under 4:30: all task work is tracked and paid.'],
  ['[data-a="huntDone"]','Triage finished early? Start the Hunt stage now.'],
  ['[data-a="sync"]','Type Hubstaff\'s total for today. The app adds only what Hubstaff gained since the last reference while this task ran. Or set the task\'s time directly.'],
  ['[data-a="nudge"]','Adjust the clock by one minute.'],
  ['.counts > div:nth-child(1)','Found: every finding captured so far, plus before-tracking found.'],
  ['.counts > div:nth-child(2)','Logged: findings marked Done. A standard submission needs 30+.'],
  ['.counts > div:nth-child(3)','Logged Bugs. A standard submission needs at least 5.'],
  ['.counts > div:nth-child(4)','Logged feature requests. A standard submission needs at least 5.'],
  ['.counts > div:nth-child(5)','Findings you are writing up now (rubric, Flow, Feather).'],
  ['.counts > div:nth-child(6)','Drafts captured but not started.'],
  ['.counts > div:nth-child(7)','Logged per hour of AHT. About 7 an hour reaches 30 by 4:15.'],
  ['.sgrid > div:nth-child(1)','Found vs the 30-by-4:15 plan at this minute. Green when on or ahead.'],
  ['.sgrid > div:nth-child(2)','Logged vs the plan at this minute. The plan starts logging after 0:30.'],
  ['.sgrid > div:nth-child(3)','Average time between captures, learned from this task.'],
  ['.sgrid > div:nth-child(4)','Average time from In progress to Done: rubric, Flow and Feather.'],
  ['.sgrid > div:nth-child(5)','Time you can spend on each remaining finding and still log 30 by 4:15. Red under 1:30.'],
  ['.sgrid > div:nth-child(6)','Where you land by 4:15 at your current pace.'],
  ['.gate',function(el){var t=(el.querySelector('.t')||{}).textContent,l=(el.querySelectorAll('span')[1]||{}).textContent;return'Gate '+t+': '+l+'. You get a desktop alert here.'}],
  ['#notes','Private scratch notes for this task. Synced.'],
  ['#pastQ','Search findings from your earlier tasks on this same app.'],
  ['.pf','A finding from an earlier task on this app. Drafts that match get an amber flag.'],
  ['[data-a="filter"]',function(el){var f=el.dataset.f;return{all:'Show everything, grouped: In progress, Not started, then Done.',draft:'Drafts captured but not started.',progress:'Findings being written up now.',done:'Findings logged in Feather.'}[f]}],
  ['[data-a="addType"][data-t="bug"]','New drafts are Bugs: implemented but broken.'],
  ['[data-a="addType"][data-t="fr"]','New drafts are feature requests: missing compared with the real app.'],
  ['[data-a="addType"][data-t="unk"]','Not sure yet. Click the type chip on the finding later to decide.'],
  ['#addIn','Type what you see and press Enter to save a draft. Summary format: Page: Component failure (Bug) or Page: Capability should … (FR).'],
  ['.prebar [data-a="editPre"]','Counts from work done before you started tracking here. Included in your totals.'],
  ['label:has(#pF)','Findings you found before tracking, logged or not.'],
  ['label:has(#pL)','Of those, how many are already logged in Feather.'],
  ['label:has(#pB)','Of the logged ones, how many are Bugs.'],
  ['label:has(#pR)','Of the logged ones, how many are feature requests.'],
  ['.st[data-a="cycle"]',function(el){return el.classList.contains('draft')?'Not started. Click to start writing it up (In progress).':el.classList.contains('progress')?'In progress. Click when it\'s logged in Feather; you\'ll paste the rubric you filed.':'Done. Click to move it back to Not started.'}],
  ['.chip[data-a="ftype"]','Click to switch: Bug → FR → unsure.'],
  ['.ftimer','Time on this finding vs your per-finding budget.'],
  ['[data-a="block"][data-k="slow"]','Flow is taking too long to finish. Pauses this finding\'s budget alerts and shows what to do meanwhile.'],
  ['[data-a="block"][data-k="rec"]','The Flow recording failed or isn\'t clean and you\'re re-recording. Count each attempt.'],
  ['[data-a="retryF"]','Count another attempt (re-record or retry). After two, park it and move on.'],
  ['[data-a="block"][data-k="flow"]','Flow is rejecting or not validating this finding. Pauses its budget alerts and shows what to do.'],
  ['[data-a="block"][data-k="env"]','The clone is blocking reproduction: crash, error, screen won\'t load. Pauses its budget alerts and shows what to do.'],
  ['[data-a="unblock"]','The blocker is gone. Continue writing this finding up.'],
  ['[data-a="parkF"]','Move it back to Not started so you can work on the next draft.'],
  ['.duphint','Looks like an earlier finding. Check before you file it to avoid a duplicate.'],
  ['.fmthint','Summary format check: page name, a colon, then the failure or the "should".'],
  ['[data-a="rubEdit"]','View or edit the rubric recorded for this finding.'],
  ['.donebar','Show or hide findings already logged.'],
  ['[data-a="delF"]','Delete this finding on all devices.'],
  ['#rubRaw','Paste the whole rubric. Labels like Summary:, Priority: and Issue Type: are split into the fields below.'],
  ['#rubChecks','Compared with every recorded rubric. Duplicate: the same issue again. Conflict: the same issue with a different type or priority.'],
  ['label:has([data-rf="summary"])','Page or section, a colon, then the failure (Bug) or what it should do (FR). No Bug/FR/P1 prefix.'],
  ['label:has([data-rf="prio"])','P0 core task blocked · P1 core support or severe UX · P2 everything else.'],
  ['label:has([data-rf="type"])','Bug: implemented but broken. Feature request: missing compared with the real app. FR sets steps to N/A.'],
  ['label:has([data-rf="path"])','Tab -> Group -> Object -> Workflow.'],
  ['label:has([data-rf="steps"])','Start by opening the app, numbered 1, 2, 3. Feature requests are always N/A.'],
  ['label:has([data-rf="expected"])','The [control] on [location] should [action], allowing the user to [outcome].'],
  ['label:has([data-rf="actual"])','Defect, baseline, plain why, impact on the user. Never "I tested".'],
  ['[data-a="rubSave"]','Save the rubric to this finding\'s history and mark it Done. Ctrl+Enter.'],
  ['[data-a="rubSkip"]','Mark Done now and add the rubric later from the finding.'],
  ['.rsheet [data-a="rubCancel"]','Close without saving. The finding stays In progress.'],
  ['#libQ','Search every recorded field: summary, page, steps, expected and actual.'],
  ['#libType','Show only Bugs or only feature requests.'],
  ['#libApp','Show rubrics from one app.'],
  ['[data-a="libCsv"]','Download all recorded rubrics as a spreadsheet.'],
  ['[data-a="copyRf"]',function(el){return el.dataset.k==='raw'?'Copy everything you pasted for this rubric.':'Copy this field.'}],
  ['label[for="nApp"]','Use the same name every time you claim this app, so past findings are checked for duplicates.'],
  ['label[for="nUrl"]','The task ID after /tasks/ is pulled out and checked against tasks you already logged.'],
  ['label[for="nTime"]','Hubstaff\'s total for today. Used only as a reference so later syncs add just the time gained on this task. The task clock starts at 0:00.'],
  ['label[for="nSpent"]','Time you already spent on this task before tracking it here.'],
  ['label:has(#nRun)','Leave on if Hubstaff is running, so the clock runs too.'],
  ['label:has(#nAdd)','Only for tasks from the Additional Tasks queue: review existing findings first; only an HDM can remove it. A task opened from the instructions page that already shows old findings is NOT this: treat it as a new task.'],
  ['label:has(#nLate)','You worked on it before opening it here. Enter the time already spent and what you already found.'],
  ['label[for="nTri"]','Finished today: the clock starts at 0:45 or your Hubstaff time, whichever is later. Earlier day: 0:45 is added on top of today\'s Hubstaff time.'],
  ['[data-a="prior"]','Time you spent on this task on earlier days. It is added to the AHT clock and to every Hubstaff sync, so today\'s Hubstaff time plus earlier days equals your real AHT.'],
  ['label[for="nPreF"]','Findings you found before tracking, logged or not.'],
  ['label[for="nPreL"]','Of those, how many are already logged in Feather.']
];
var tipEl=null,tipTimer=null,tipFor=null,tipBusy=false;
function applyTips(){if(tipBusy)return;tipBusy=true;try{TIPS.forEach(function(x){var els;try{els=document.querySelectorAll(x[0])}catch(e){return}els.forEach(function(el){var v=typeof x[1]==='function'?x[1](el):x[1];if(v&&el.getAttribute('data-tip')!==v){el.setAttribute('data-tip',v);if(el.hasAttribute('title'))el.removeAttribute('title')}})})}finally{tipBusy=false}}
function tipsOn(){return!IDX.settings.noTips}
var tipXY=null;document.addEventListener('mousemove',function(ev){tipXY=[ev.clientX,ev.clientY]},{passive:true});
function showTip(el){if(!tipsOn())return;if(!el.isConnected){if(!tipXY)return;var u=document.elementFromPoint(tipXY[0],tipXY[1]);el=u&&u.closest('[data-tip]');if(!el)return}var v=el.getAttribute('data-tip');if(!v)return;if(!tipEl){tipEl=document.createElement('div');tipEl.id='tipbox';tipEl.className='tipbox';tipEl.setAttribute('role','tooltip');document.body.appendChild(tipEl)}
  tipEl.textContent=v;tipEl.style.left='0px';tipEl.style.top='0px';tipEl.classList.add('on');var r=el.getBoundingClientRect(),w=tipEl.offsetWidth,h=tipEl.offsetHeight,vw=window.innerWidth,vh=window.innerHeight;
  var x=Math.max(8,Math.min(vw-w-8,r.left+r.width/2-w/2)),y=r.bottom+8;if(y+h>vh-8)y=Math.max(8,r.top-h-8);tipEl.style.left=x+'px';tipEl.style.top=y+'px';tipFor=el}
function hideTip(){clearTimeout(tipTimer);tipFor=null;if(tipEl)tipEl.classList.remove('on')}
document.addEventListener('mouseover',function(ev){var el=ev.target.closest&&ev.target.closest('[data-tip]');if(el===tipFor)return;clearTimeout(tipTimer);if(!el){hideTip();return}tipTimer=setTimeout(function(){showTip(el)},350)});
document.addEventListener('focusin',function(ev){var el=ev.target.closest&&ev.target.closest('[data-tip]');if(el&&ev.target.matches(':focus-visible'))showTip(el)});
document.addEventListener('focusout',hideTip);document.addEventListener('scroll',function(){tipFor=null;if(tipEl)tipEl.classList.remove('on')},true);document.addEventListener('mousedown',hideTip);document.addEventListener('keydown',function(ev){if(ev.key==='Escape')hideTip()});
var tipObs=new MutationObserver(function(){clearTimeout(applyTips.t);applyTips.t=setTimeout(applyTips,40)});tipObs.observe(document.body,{childList:true,subtree:true});
document.addEventListener('change',function(ev){if(ev.target.id==='tipsOn'){IDX.settings.noTips=!ev.target.checked;saveIdx();if(!ev.target.checked)hideTip()}});

/* ---------- stuck on a finding: Flow validation vs Environment ---------- */
var STUCK={
  slow:{l:'Flow is taking too long',s:'Flow slow',g:'Don\'t sit idle while Flow runs: capture the next draft in the clone meanwhile. If it\'s still running at about twice your budget, refresh Flow once. If it stalls again, park this finding and come back to it. Tell your HDM in the POD thread if Flow stays slow; it eats AHT.'},
  rec:{l:'Recording failed · re-recording',s:'Recording',g:'Re-record once, cleanly: neutral start screen, do the action, hold 3–5 s on the failure, the same action on a working control, no logos or account info. Count each attempt below. After two failed attempts, park it and come back after your next finding; if recordings keep failing, tell your HDM in the POD thread.'},
  flow:{l:'Flow validation issue',s:'Flow validation',g:'Flow is rejecting or not validating this finding. Re-check the summary format (Page: …), required fields, and N/A steps for FRs, then retry once. Still failing? Park it, start the next draft, and tell your HDM in the POD thread if it keeps happening.'},
  env:{l:'Environment issue',s:'Environment',g:'The clone is blocking reproduction (crash, error, screen won\'t load). Reload and retry once. Still broken? Capture what you see, park this one and test another workflow. If the whole app is down, report an app problem in Review Desk.'}};
var STUCK_ORDER=['slow','rec','flow','env'];
function stuckHtml(t,f){
  if(f.status!=='progress')return'';
  if(f.block){var S=STUCK[f.block.k]||STUCK.flow,n=f.block.n||0;return'<div class="stuck on '+f.block.k+'"><b>Blocked · '+S.l+'</b><span>'+esc(S.g)+'</span><div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm" data-a="retryF" data-id="'+f.id+'">Retry +1</button><span class="mono stuckn">'+n+' retr'+(n===1?'y':'ies')+(f.block.at!=null?' · blocked '+mmss(elapsed(t)-f.block.at):'')+'</span><span class="sp"></span><button class="btn sm" data-a="unblock" data-id="'+f.id+'">Resolved, continue</button><button class="btn sm" data-a="parkF" data-id="'+f.id+'">Park it</button></div><div class="row stuckalt" style="gap:6px;flex-wrap:wrap"><span class="hint">Different cause:</span>'+STUCK_ORDER.filter(function(k){return k!==f.block.k}).map(function(k){return'<button class="btn sm ghost" data-a="block" data-k="'+k+'" data-id="'+f.id+'">'+STUCK[k].s+'</button>'}).join('')+'</div></div>'}
  return'<div class="stuck" data-stuck="'+f.id+'"><span>Stuck?</span>'+STUCK_ORDER.map(function(k){return'<button class="btn sm ghost" data-a="block" data-k="'+k+'" data-id="'+f.id+'">'+STUCK[k].s+'</button>'}).join('')+'</div>';
}
document.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,t=cur();if(!t)return;
  if(a==='block'){var f=findF(t,b.dataset.id);if(!f)return;closeBlock(t,f);var at=elapsed(t);f.block={k:b.dataset.k,at:at};(f.blocks=f.blocks||[]).push({k:b.dataset.k,at:at});f.u=Date.now();saveTask(t);render();toast('Marked · '+STUCK[b.dataset.k].l,'Budget alerts for this finding are paused. Follow the steps on the finding.','warn');return}
  if(a==='retryF'){var r=findF(t,b.dataset.id);if(!r||!r.block)return;r.block.n=(r.block.n||0)+1;var hl=(r.blocks||[]).slice(-1)[0];if(hl)hl.n=r.block.n;r.u=Date.now();saveTask(t);render();if(r.block.n>=2&&r.block.k==='rec')toast('Two retries','Park it and come back after your next finding.','warn');return}
  if(a==='unblock'){var g=findF(t,b.dataset.id);if(!g)return;closeBlock(t,g);g.w1=1;g.w2=1;g.u=Date.now();saveTask(t);render();toast('Back on it','','ok');return}
  if(a==='parkF'){var h=findF(t,b.dataset.id);if(!h)return;closeBlock(t,h);h.status='draft';delete h.startAt;delete h.doneAt;h.parked=(h.parked||0)+1;h.u=Date.now();t.lastAct=elapsed(t);saveTask(t);render();toast('Parked','Back in Not started. Start the next draft.','ok');return}
});

/* ---------- time breakdown for your HDM (Hubstaff policy: share task ID + rough breakdown) ---------- */
function closeBlock(t,f){if(!f.block)return;var h=(f.blocks||[]).slice(-1)[0];if(h&&h.end==null)h.end=elapsed(t);delete f.block}
function breakdownText(t){
  var e=elapsed(t),c=counts(t),M=metrics(t),L=[],by={},fs=t.findings||[];
  fs.forEach(function(f){(f.blocks||[]).forEach(function(b){var end=b.end!=null?b.end:(f.block&&f.blocks.slice(-1)[0]===b?e:b.at);var k=STUCK[b.k]?b.k:'flow';var x=by[k]=by[k]||{t:0,f:{},r:0};x.t+=Math.max(0,end-b.at);x.f[f.id]=1;x.r+=b.n||0})});
  L.push('Time breakdown · '+(t.app||'Untitled app'));
  L.push('Task: '+(t.featherUrl||t.featherId||'(no Feather link)'));
  L.push('AHT tracked: '+hms(e)+(t.offset?' (includes '+hm(t.offset)+' from earlier days)':'')+(e>AHT*60?' · over 4:30 by '+hm(e-AHT*60):' · within 4:30'));
  L.push('Findings: '+c.all+' found · '+c.n+' logged ('+c.b+' Bugs, '+c.fr+' FRs)'+(c.n<30?' · LFS route':''));
  L.push('Average to capture one: '+(M.avgCap?mmss(M.avgCap*60):'—')+' · average to log one (rubric, Flow, Feather): '+(M.avgLog?mmss(M.avgLog*60):'—'));
  var ks=Object.keys(by);
  if(ks.length){L.push('Blocked time:');STUCK_ORDER.forEach(function(k){var x=by[k];if(!x)return;var nf=Object.keys(x.f).length;L.push('- '+STUCK[k].l+': '+mmss(x.t)+' across '+nf+' finding'+(nf>1?'s':'')+(x.r?' ('+x.r+' retr'+(x.r===1?'y':'ies')+')':''))})}
  else L.push('Blocked time: none recorded');
  var logs=fs.filter(function(f){return f.status==='done'&&f.startAt!=null&&f.doneAt!=null}).map(function(f){return{f:f,d:f.doneAt-f.startAt}}).sort(function(a,b){return b.d-a.d}).slice(0,3);
  if(logs.length){L.push('Slowest findings to log:');logs.forEach(function(x){var r=(x.f.blocks||[]).map(function(b){return STUCK[b.k]?STUCK[b.k].s:''}).filter(Boolean);L.push('- '+mmss(x.d)+' · '+String((x.f.rub&&x.f.rub.summary)||x.f.text||'').split('\n')[0].slice(0,90)+(r.length?' ['+r.join(', ')+']':''))})}
  L.push('Off-clock time, if any: ___ (estimate)');
  L.push('What is taking longer: ___');
  return L.join('\n');
}
function openBreakdown(t){var el=$('#tbModal');if(el)el.remove();el=document.createElement('div');el.id='tbModal';el.className='rmodal';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','tbTitle');
  el.innerHTML='<div class="rsheet"><div class="row"><div><h2 id="tbTitle" style="margin:0;font-size:18px">Time breakdown for your HDM</h2><p class="hint" style="margin:2px 0 0">Going over 4:30, or the same step keeps pushing you over? Send this with the task ID. Accurate records are the evidence the team uses to judge whether the AHT fits the workflow.</p></div><span class="sp"></span><button class="btn sm ghost" data-a="tbClose" aria-label="Close">✕</button></div><textarea class="in mono" id="tbText" rows="14" style="font-size:12.5px">'+esc(breakdownText(t))+'</textarea><div class="row rfoot"><span class="hint">Edit the last two lines before sending.</span><span class="sp"></span><button class="btn" data-a="tbClose">Close</button><button class="btn pri" data-a="tbCopy">Copy</button></div></div>';
  document.body.appendChild(el);var ta=$('#tbText');if(ta){grow(ta);ta.focus()}}
document.addEventListener('click',function(ev){var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
  if(a==='breakdown'){var t=cur();if(t)openBreakdown(t);return}
  if(a==='tbClose'){var m=$('#tbModal');if(m)m.remove();return}
  if(a==='tbCopy'){var v=($('#tbText')||{}).value||'';try{navigator.clipboard.writeText(v).then(function(){toast('Copied','Paste it to your HDM with the task ID.','ok')},function(){toast('Copy blocked','Select the text and copy it instead.','warn')})}catch(e){toast('Copy blocked','Select the text and copy it instead.','warn')}return}
});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'){var m=$('#tbModal');if(m)m.remove()}});

/* ---------- focus view: one glanceable HUD (default); details on demand ---------- */
function focusOn(){return!IDX.settings.full}
var CP_NAME={30:'Release check',45:'Triage window closes',120:'Release window closes (2:00)',270:'4:30 AHT'};
function heatOf(t){var e=elapsed(t)/60,cps=[30,120,270],nx=null;for(var i=0;i<cps.length;i++)if(cps[i]>e){nx=cps[i];break}
  if(nx==null)return{cls:'over',nx:null,left:e-270};var left=nx-e;return{cls:left<=10?'hot':left<=30?'warm':'cold',nx:nx,left:left}}
function hudInner(t){var e=elapsed(t),m=e/60,c=counts(t),h=heatOf(t),T=tgt(t),pf=planFound(m,T),F=c.all,ok=F>=pf-1,cps=[30,120];
  var nxt=h.nx==null?'Over 4:30 by '+hm(e-AHT*60)+' · keep Hubstaff on':CP_NAME[h.nx]+' in '+hm(h.left*60);
  var fx=(t.findings||[]).filter(function(x){return x.fix}),lf=fx.filter(function(x){return x.fix==='todo'}).length;var pace=hasAvg(t)&&c.n>=T&&c.n<30&&t.status!=='rework'?{c:'ok',w:'Average reached',d:'submit directly · goal 30'}:t.status==='rework'?{c:lf?'warn':'ok',w:lf?lf+' to fix':(fx.length?'All fixed':'Flag items to fix'),d:(fx.length?(fx.length-lf)+' of '+fx.length+' fixed':'')+(realC(t).need?(fx.length?' · ':'')+realC(t).need+' need real-app evidence':'')}:c.n>=30?{c:'ok',w:'30+ logged',d:c.b+' Bugs · '+c.fr+' FRs'}:m<45&&!t.huntDone?{c:'',w:'Exploring',d:F+' found so far'}:ok?{c:'ok',w:'On pace',d:'found '+F+' · plan '+Math.round(pf)+(T<30?' of '+T:'')}:{c:'warn',w:'Behind by '+Math.max(1,Math.round(pf-F)),d:'found '+F+' · plan '+Math.round(pf)};
  return'<div class="hclock"><span class="lab">AHT'+(running(t)?'':' · paused')+'</span><b class="mono">'+hms(e)+'</b><span class="hnext">'+esc(nxt)+'</span></div>'+
  '<div class="hbar" aria-hidden="true"><i style="width:'+Math.min(100,e/(AHT*60)*100)+'%"></i>'+cps.map(function(x){return'<u style="left:'+(x/AHT*100)+'%"></u>'}).join('')+'</div>'+
  '<div class="hnums"><div><b class="mono">'+c.draft+'</b><span>Drafts</span></div><div class="work"><b class="mono">'+c.prog+'</b><span>Working</span></div><div class="'+(c.n>=T?'hit':'')+'"><b class="mono">'+c.n+'<small>/'+T+'</small>'+(c.n>=T?' ✓':'')+'</b><span>'+(hasAvg(t)?'Logged · target':'Logged')+'</span></div></div>'+
  '<div class="hpace '+pace.c+'"><b>'+pace.w+'</b><span>'+pace.d+'</span></div>'}
function rdStrip(t){var due=rdRequired(t)&&t.status!=='active'&&t.status!=='rework'&&!t.rd;
  return'<div class="tgt rd'+(due?' none':'')+'"><span class="lab">Review Desk</span><span>'+(t.rd?'Logged '+day(t.rd):due?'Not logged yet: log it before Feather':'Log it before you submit or release')+'</span><span class="sp"></span><a class="btn sm ghost" href="'+RD_URL+'" target="_blank" rel="noopener">Open Review Desk</a><button class="btn sm'+(t.rd?'':' pri')+'" data-a="rdLog">'+(t.rd?'Undo':'Mark logged')+'</button></div>'}
function reuseNote(t){if(t.status!=='active')return'';var k=appKey(t.app),best=0,w=null;allTasks().forEach(function(x){if(x.id===t.id||appKey(x.app)!==k)return;var at=x.endedAt||x.updatedAt||x.createdAt||0;if(at>best&&at<=(t.createdAt||Date.now())){best=at;w=x}});
  if(!w||(t.createdAt||Date.now())-best>=7*864e5)return'';var d=Math.max(0,Math.floor(((t.createdAt||Date.now())-best)/864e5));
  return'<div class="tgt none"><span class="lab">Reuse</span><span>You worked on '+esc(t.app)+' '+(d?d+' day'+(d===1?'':'s')+' before this task':'earlier')+'. Findings may only be reused if your last work on the app was at least one week ago.</span></div>'}
function cpStrip(t){var fs=t.findings||[];if(!fs.length||elapsed(t)<7200)return'';var L=fs.filter(function(x){return x.status==='done'&&x.doneAt!=null&&x.doneAt<=7200}),Fd=fs.filter(function(x){return(x.at||0)<=7200}),n=L.length,under=n<10,rel=t.status==='active'&&under;
  var after=fs.filter(function(x){return x.status==='done'&&x.doneAt!=null&&x.doneAt>7200}).sort(function(a,b){return a.doneAt-b.doneAt})[0];
  return'<div class="tgt cp '+(under?'warn':'ok')+'" id="cpStrip"><span class="lab">At 2:00</span><b class="mono">'+n+' logged</b><span>'+Fd.length+' found · '+(under?'under 10 at 2:00'+(rel?': you can release now (log the release in Review Desk, then unclaim)':''):'10+ at 2:00: keep going to the target or 4:30')+(after&&under?' · next logged at '+hms(after.doneAt):'')+'</span></div>'}
function tgtStrip(t){return tgtStrip0(t)+cpStrip(t)+rdStrip(t)+reuseNote(t)}
function tgtStrip0(t){var T=tgt(t);
  if(VIEW.avgEdit)return'<form class="tgt edit" id="avgForm"><span class="lab">App target</span><input class="in mono" id="qAvg" type="number" min="1" max="30" value="'+(t.avg||'')+'" placeholder="e.g. 12" aria-label="App target from Review Desk" style="max-width:90px"><button class="btn sm pri" type="submit">Save</button>'+(t.avg?'<button class="btn sm ghost" type="button" data-a="avgClear">Use 30</button>':'')+'<button class="btn sm ghost" type="button" data-a="avgEdit">Cancel</button></form>';
  return hasAvg(t)?'<div class="tgt"><span class="lab">Target</span><b class="mono">'+T+'</b><span>app target · goal 30</span><span class="sp"></span><button class="btn sm ghost" data-a="avgEdit">Change</button></div>'
  :'<div class="tgt none"><span class="lab">Target</span><b class="mono">30</b><span>no target set · default 30</span><span class="sp"></span><button class="btn sm" data-a="avgEdit">Set app target</button></div>'}
function hudHtml(t){return'<div class="hud heat-'+heatOf(t).cls+'" id="hud">'+hudInner(t)+'</div>'}
function hruleHtml(t){var s=nextStep(t),h=heatOf(t),F=counts(t).all;
  if(t.status==='active'&&h.nx===120&&h.left<=15){var w=F<10?'under 10 → log the release and release':'10+ → keep going';return'<div class="hrule '+(F<10?'warn':'ok')+'" id="hrule" data-tip="2:00 checkpoint: under 10 found → log the release in Review Desk and release · 10+ → keep testing until the target or 4:30."><b>2:00 checkpoint · '+F+' found: '+w+'</b></div>'}
  if(/^(On pace for|Behind pace by|Well behind pace)/.test(s.h))return'<div id="hrule" hidden></div>';
  return'<div class="hrule '+s.tone+'" id="hrule" data-tip="'+esc(s.p)+'"><b>'+esc(s.h)+'</b></div>'}
function focusPanel(t,parts){
  var act=t.status==='active'||t.status==='mfr'||t.status==='rework',forms=(parts.clock.match(/<form class="row" id="(?:priorForm|syncForm)">[\s\S]*?<\/form>/g)||[]).join('');
  var title='<div class="ftitle"><div style="min-width:0"><b>'+esc(t.app||'Untitled app')+'</b><span class="pill '+OUT[t.status][1]+'">'+OUT[t.status][0]+'</span></div><span class="sp"></span>'+(t.featherUrl?'<a class="btn sm ghost" href="'+esc(t.featherUrl)+'" target="_blank" rel="noopener">Feather ↗</a>':'')+'<button class="btn sm ghost" data-a="actions" aria-expanded="'+!!VIEW.actions+'">'+(VIEW.actions?'Hide actions':'Task actions')+'</button></div>';
  var ctrl=act?'<div class="hctrl"><button class="btn '+(running(t)?'':'pri')+'" data-a="run">'+(running(t)?'Pause':'Resume')+'</button><button class="btn" data-a="sync">Sync Hubstaff</button><button class="btn ghost" data-a="prior">'+(t.offset?'+'+hm(t.offset)+' earlier':'Earlier days')+'</button><span class="sp"></span><button class="btn ghost" data-a="details" aria-expanded="'+!!VIEW.details+'">'+(VIEW.details?'Hide details':'Details')+'</button></div>':'<div class="hctrl"><span class="sp"></span><button class="btn ghost" data-a="details" aria-expanded="'+!!VIEW.details+'">'+(VIEW.details?'Hide details':'Details')+'</button></div>';
  return'<div class="rtop">'+parts.nb+title+(VIEW.actions?parts.head:'')+tgtStrip(t)+hudHtml(t)+hruleHtml(t)+ctrl+forms+'</div>'+(VIEW.details?'<div class="rrest">'+'<div class="mbar" id="mbar">'+mbarHtml(t)+'</div>'+parts.clock.replace(/<form class="row" id="(?:priorForm|syncForm)">[\s\S]*?<\/form>/g,'')+parts.gates+parts.notes+parts.pastHtml+'</div>':'');
}
document.addEventListener('click',function(ev){var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
  if(a==='details'){VIEW.details=!VIEW.details;render();return}
  if(a==='actions'){VIEW.actions=!VIEW.actions;render();return}
});
document.addEventListener('change',function(ev){
  if(ev.target.id==='focusOn'){IDX.settings.full=!ev.target.checked;saveIdx();render();return}
  if(ev.target.id==='triOn'){IDX.settings.triage=ev.target.checked;saveIdx();STAGES_NOTRI=null;var t=cur();if(t){markPastGates(t);saveTask(t)}render();return}
});

document.addEventListener('click',function(ev){var b=ev.target.closest('[data-a="fixF"]');if(!b)return;var t=cur(),f=t&&findF(t,b.dataset.id);if(!f)return;f.fix=b.dataset.v;f.u=Date.now();saveTask(t);render()});
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
  m.findings=Object.keys(fs).filter(function(id){return!tomb[id]}).map(function(id){return JSON.parse(JSON.stringify(fs[id]))}).sort(function(x,y){return(x.createdAt||0)-(y.createdAt||0)});
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
setInterval(function(){if(SESSION&&!sessOk())signOutLocal('Your sign-in expired. Enter your PIN again.')},60000);
function authScreen(){
  var a=VIEWAUTH;
  return'<div class="gate-wrap"><form class="card form" id="authForm" autocomplete="on"><div class="brand" style="padding:0">'+LOGO+'<div><b>AI Trainer Tasker</b><span class="lab">Private · one-time device PIN</span></div></div>'+
  '<p class="hint" style="margin:0">Open the Tasker from your CRM to sign in automatically, or enter your 6-digit PIN once. This device then stays signed in.</p><label for="aCode">PIN<input class="in mono" id="aCode" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" required style="font-size:22px;letter-spacing:.3em"></label><p class="hint err" id="aErr">'+esc(a.err)+'</p><div class="row"><button class="btn pri" type="submit"'+(a.busy?' disabled':'')+'>'+(a.busy?'Checking…':'Open Tasker')+'</button></div>'+
  '</form></div>';
}
function authSubmit(){
  var a=VIEWAUTH;if(a.busy)return;
  var code=($('#aCode').value||'').replace(/\D/g,'');if(code.length<6){a.err='Enter all 6 digits.';render();return}
  a.busy=true;a.err='';render();
  api({action:'verify',email:'dijaedadula@gmail.com',code:code},false).then(function(d){a.busy=false;SESSION={token:d.token,expires_at:d.expires_at,email:d.email};lsSet('session',SESSION);VIEW.mode=cur()?'task':'empty';render();toast('Signed in','This device stays signed in for a year.','ok');pull(true)})
  .catch(function(e){a.busy=false;a.err=e.message;render();var c=$('#aCode');if(c)c.focus()});
}
/* ---------- task history: every status change is recorded, so an MFR stays on the record even after the task is submitted ---------- */
function histBackfill(t){var st=t.status,end=t.endedAt||t.updatedAt||t.createdAt,e=Math.round(elapsed(t)),h=[{k:'claimed',to:'active',at:t.createdAt,e:0}];
  if(t.mfrRun)h.push({k:'mfrRun',at:end,inf:1});
  if(st==='active')return h;
  if(st==='mfr'||st==='form'){h.push({k:'status',from:'active',to:st,at:end,e:e,inf:1});return h}
  if(st==='rework'){var rf=t.reworkFrom==='mfr'?'mfr':'submitted';h.push({k:'status',from:'active',to:rf,at:end,e:e,inf:1});h.push({k:'status',from:rf,to:'rework',at:end,e:e,inf:1});return h}
  var from='active';if(t.mfrRun&&st!=='unclaimed'&&st!=='released'){h.push({k:'status',from:'active',to:'mfr',at:end,e:e,inf:1,note:'inferred from the MFR flag'});from='mfr'}
  h.push({k:'status',from:from,to:st,at:end,e:e,inf:1});return h}
function histOf(t){return t.hist||histBackfill(t)}
function lfsCount(t){return histOf(t).filter(function(x){return x.to==='lfs'}).length}
function mfrCount(t){return histOf(t).filter(function(x){return(x.to==='mfr'||x.to==='form'||x.to==='lfs')&&x.from!=='rework'}).length}
function reworkCount(t){var n=histOf(t).filter(function(x){return x.to==='rework'}).length;return Math.max(n,t.reworks||0)}
function syncHist(t){if(!t||!t.status)return;if(!t.hist)t.hist=histBackfill(t);var lastTo=null;for(var i=t.hist.length-1;i>=0;i--)if(t.hist[i].to){lastTo=t.hist[i].to;break}
  if(lastTo!==t.status)t.hist.push({k:'status',from:lastTo,to:t.status,at:Date.now(),e:Math.round(elapsed(t))})}
function logEv(t,k,note){if(!t.hist)t.hist=histBackfill(t);t.hist.push({k:k,at:Date.now(),e:Math.round(elapsed(t)),note:note||undefined})}
function mfrCand(t){return t.status==='submitted'&&!mfrCount(t)&&elapsed(t)>=255*60&&counts(t).n<tgt(t)}
function markMfr(t){var h=histOf(t).slice(),i=h.length-1;while(i>0&&h[i].k!=='status')i--;var last=h[i],at=Math.max((last&&last.at)||t.createdAt,t.createdAt)-1000;
  var ent={k:'status',from:'active',to:'mfr',at:at,e:Math.round(elapsed(t)),man:1,note:'added by you'};
  if(last&&last.k==='status'&&last.from==='active')last.from='mfr';
  h.splice(Math.max(1,i),0,ent);t.hist=h;t.mfrRun=true}
function unmarkMfr(t){var h=histOf(t).filter(function(x){return!x.man});for(var i=h.length-1;i>0;i--)if(h[i].k==='status'&&h[i].from==='mfr'&&!h.some(function(y,j){return j<i&&y.to==='mfr'})){h[i].from='active'}t.hist=h}
var EVL={lfs:'Submitted with LFS',mfr:'MFR submitted · awaiting review',form:'MFR submitted',submitted:'Submitted',outdated:'Outdated · submitted',unclaimed:'Unclaimed / released',released:'Closed by the HDM',rework:'Corrections requested',active:'In progress'};
function evText(x){if(x.k==='claimed')return'Claimed the task';if(x.k==='mfrRun')return'Started the MFR workflow';if(x.k==='note')return x.note||'Note';
  if(x.from==='rework'&&x.to==='mfr')return'Corrections done · back to MFR review';if(x.from==='rework'&&x.to==='submitted')return'Corrections done · resubmitted';
  if(x.from==='mfr'&&x.to==='submitted')return'MFR approved · submitted as-is';if(x.from==='mfr'&&x.to==='active')return'HDM: keep working';
  if(x.from&&x.from!=='active'&&x.to==='active')return'Reopened';return EVL[x.to]||x.to}
function histHtml(t){var h=histOf(t),m=mfrCount(t),r=reworkCount(t);
  var rows=h.map(function(x){return'<li><b>'+esc(evText(x))+'</b><span>'+new Date(x.at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+(x.e!=null?' · clock '+hm(x.e):'')+(x.inf?' · reconstructed from older data':'')+(x.man?' · added by you':'')+'</span>'+(x.man?'<button class="btn sm ghost" data-a="mfrDel">Remove</button>':'')+'</li>'}).join('');
  return'<div class="card thist"><div class="row"><span class="lab">Task history</span><span class="sp"></span>'+(m-lfsCount(t)>0?'<span class="pill warn">MFR ×'+(m-lfsCount(t))+'</span>':'')+(lfsCount(t)?'<span class="pill warn">LFS ×'+lfsCount(t)+'</span>':'')+(r?'<span class="pill info">Rework ×'+r+'</span>':'')+'</div><ol class="hlist">'+rows+'</ol>'+(t.status!=='active'&&!m?'<div class="row"><button class="btn sm" data-a="mfrAdd" title="Older tasks did not record the MFR. Add it to the history.">+ This task went through the MFR</button></div>':'')+'</div>'}
/* ---------- overview page: every task and every finding, with filters and sorting ---------- */
var TV=Object.assign({tab:'tasks',q:'',status:'all',app:'all',range:'all',need:false,sort:'recent',fq:'',ftype:'all',fprio:'all',fstatus:'all',freal:'all',fts:'all',fsort:'recent'},lsGet('tv',{}));
function tvSave(){lsSet('tv',TV)}
var OPENST={active:1,mfr:1,rework:1};
function lastAct(t){var m=Math.max(t.updatedAt||0,t.createdAt||0);(t.findings||[]).forEach(function(f){if((f.u||0)>m)m=f.u});return m}
function fPrio(f){return(f.rub&&f.rub.prio)||''}
function fSum(f){var s=(f.rub&&f.rub.summary)||String(f.text||'').split('\n')[0];return s||'(empty draft)'}
function fType(f){return(f.rub&&f.rub.type)||f.type}
function tvOpt(v,cur,l){return'<option value="'+v+'"'+(String(cur)===String(v)?' selected':'')+'>'+l+'</option>'}
function tvSel(key,cur,opts,label){return'<select class="in tvsel" data-tk="'+key+'" aria-label="'+label+'">'+opts.map(function(o){return tvOpt(o[0],cur,o[1])}).join('')+'</select>'}
function tvStatusOpts(){var o=[['all','All statuses'],['open','Open (in progress, MFR, rework)']];Object.keys(OUT).forEach(function(k){o.push([k,OUT[k][0]])});return o}
function tvAppOpts(){var apps={};allTasks().forEach(function(t){if(t.app)apps[appKey(t.app)]=t.app});return[['all','All apps']].concat(Object.keys(apps).sort().map(function(k){return[k,apps[k]]}))}
function tvTasks(){
  var q=TV.q.toLowerCase().trim(),now=Date.now(),lim={today:1,week:7,month:30}[TV.range];
  var ts=allTasks().filter(function(t){
    if(TV.status==='open'){if(!OPENST[t.status])return false}else if(TV.status!=='all'&&t.status!==TV.status)return false;
    if(TV.app!=='all'&&appKey(t.app)!==TV.app)return false;
    if(lim&&now-t.createdAt>lim*864e5)return false;
    if(TV.need&&!realC(t).need)return false;if(TV.mfr&&!mfrCount(t))return false;if(TV.cand&&!mfrCand(t))return false;
    if(q){var hay=(t.app+' '+(t.featherId||'')+' '+(t.notes||'')+' '+(t.findings||[]).map(ftxt).join(' ')).toLowerCase();if(hay.indexOf(q)<0)return false}
    return true});
  var S={recent:function(a,b){return lastAct(b)-lastAct(a)},'new':function(a,b){return b.createdAt-a.createdAt},old:function(a,b){return a.createdAt-b.createdAt},app:function(a,b){return String(a.app).localeCompare(String(b.app))||b.createdAt-a.createdAt},found:function(a,b){return counts(b).all-counts(a).all},logged:function(a,b){return counts(b).n-counts(a).n},time:function(a,b){return elapsed(b)-elapsed(a)},evidence:function(a,b){return realC(b).need-realC(a).need}};
  return ts.sort(S[TV.sort]||S.recent)}
var PRO={P0:0,P1:1,P2:2};
function tvFinds(){
  var q=TV.fq.toLowerCase().trim(),rows=[];
  allTasks().forEach(function(t){
    if(TV.fts==='open'){if(!OPENST[t.status])return}else if(TV.fts!=='all'&&t.status!==TV.fts)return;
    if(TV.app!=='all'&&appKey(t.app)!==TV.app)return;
    (t.findings||[]).forEach(function(f){
      if(TV.ftype!=='all'&&fType(f)!==TV.ftype)return;
      var p=fPrio(f);if(TV.fprio!=='all'&&(TV.fprio==='none'?p:p!==TV.fprio))return;
      if(TV.fstatus!=='all'&&f.status!==TV.fstatus)return;
      if(TV.freal==='any'&&!f.real)return;if(TV.freal==='none'&&f.real)return;if((TV.freal==='need'||TV.freal==='done')&&f.real!==TV.freal)return;
      if(q&&(ftxt(f)+' '+t.app).toLowerCase().indexOf(q)<0)return;
      rows.push({t:t,f:f})})});
  var T=function(r){return r.f.u||r.f.createdAt||0},S={recent:function(a,b){return T(b)-T(a)},'new':function(a,b){return(b.f.createdAt||0)-(a.f.createdAt||0)},old:function(a,b){return(a.f.createdAt||0)-(b.f.createdAt||0)},app:function(a,b){return String(a.t.app).localeCompare(String(b.t.app))||T(b)-T(a)},prio:function(a,b){return(PRO[fPrio(a.f)]==null?9:PRO[fPrio(a.f)])-(PRO[fPrio(b.f)]==null?9:PRO[fPrio(b.f)])||T(b)-T(a)},type:function(a,b){return String(fType(a.f)).localeCompare(String(fType(b.f)))||T(b)-T(a)},status:function(a,b){var o={progress:0,draft:1,done:2};return o[a.f.status]-o[b.f.status]||T(b)-T(a)},evidence:function(a,b){var o={need:0,done:1};return(o[a.f.real]==null?2:o[a.f.real])-(o[b.f.real]==null?2:o[b.f.real])||T(b)-T(a)}};
  return rows.sort(S[TV.fsort]||S.recent)}
function tvHtml(){
  var tabs='<div class="seg" role="group" aria-label="View">'+[['tasks','Tasks'],['finds','Findings'],['stats','Stats']].map(function(x){return'<button type="button" class="all" data-a="tvTab" data-tab="'+x[0]+'" aria-pressed="'+(TV.tab===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>';
  var head='<div class="row"><h1 style="margin:0;font-size:22px">All tasks &amp; findings</h1><span class="sp"></span>'+tabs+'<button class="btn sm" data-a="realScan" title="Find findings whose rubric compares with the real app and tag them, oldest tasks first">Scan for real-app</button>'+(TV.tab==='stats'?'':'<button class="btn sm" data-a="tvCsv">Export CSV</button>')+'<button class="btn sm ghost" data-a="tvClose">Back</button></div>';
  return'<div class="wrap lib"><div class="card tvcard">'+head+(TV.tab==='tasks'?tvTasksHtml():TV.tab==='stats'?tvStatsHtml():tvFindsHtml())+'</div></div>'}
/* ---------- stats tab: how the work is going ---------- */
function med(a){a=a.filter(function(x){return isFinite(x)}).sort(function(x,y){return x-y});if(!a.length)return null;var m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2}
function avgOf(a){a=a.filter(function(x){return isFinite(x)});return a.length?a.reduce(function(x,y){return x+y},0)/a.length:null}
var CLOSED={submitted:1,lfs:1,form:1,outdated:1,unclaimed:1,released:1},RELEASED={unclaimed:1,released:1};
function stWin(from,to){return allTasks().filter(function(t){return t.createdAt>=from&&t.createdAt<to})}
function stCalc(ts){
  var closed=ts.filter(function(t){return CLOSED[t.status]}),worked=closed.filter(function(t){return!RELEASED[t.status]}),rel=closed.filter(function(t){return RELEASED[t.status]});
  var logs=[],gaps=[],found=0,secs=0;
  ts.forEach(function(t){var fs=(t.findings||[]).slice().sort(function(a,b){return(a.at||0)-(b.at||0)});found+=counts(t).all;secs+=elapsed(t);
    fs.forEach(function(f,i){if(i&&f.at!=null&&fs[i-1].at!=null)gaps.push(f.at-fs[i-1].at);if(f.status==='done'&&f.startAt!=null&&f.doneAt!=null&&f.doneAt>=f.startAt)logs.push(f.doneAt-f.startAt)})});
  var reach=worked.filter(function(t){return counts(t).n>=tgt(t)});
  return{n:ts.length,open:ts.filter(function(t){return!CLOSED[t.status]}),closed:closed,worked:worked,rel:rel,reach:reach,
    byOut:{sub:ts.filter(function(t){return t.status==='submitted'||t.status==='outdated'}).length,mfr:ts.filter(function(t){return t.status==='mfr'||t.status==='form'||t.status==='lfs'}).length,rework:ts.filter(function(t){return t.status==='rework'}).length,rel:rel.length,open:ts.filter(function(t){return t.status==='active'}).length},
    avgLogged:avgOf(worked.map(function(t){return counts(t).n})),avgTarget:avgOf(worked.map(tgt)),avgTime:avgOf(worked.map(elapsed)),
    perHour:secs>600?found/(secs/3600):null,gap:med(gaps),logT:med(logs),
    relMed:med(rel.map(elapsed)),relEarly:rel.filter(function(t){return elapsed(t)<=1800}).length,relMid:rel.filter(function(t){return elapsed(t)>1800&&elapsed(t)<=7200}).length,relLate:rel.filter(function(t){return elapsed(t)>7200}).length,
    mfrTasks:ts.filter(function(t){return mfrCount(t)>0}).length,mfrSubs:ts.reduce(function(a,t){return a+mfrCount(t)},0),reworks:ts.reduce(function(a,t){return a+reworkCount(t)},0),stuck:ts.filter(function(t){return!RELEASED[t.status]&&elapsed(t)>=7200&&counts(t).all<10&&t.status!=='active'&&t.status!=='lfs'}).length}}
function stDelta(cur,prev,lowerBetter,fmt){if(cur==null||prev==null)return'';var d=cur-prev;if(Math.abs(d)<(Math.abs(prev)*.02))return'<small class="muted"> · same as before</small>';var good=lowerBetter?d<0:d>0;return'<small class="'+(good?'dg':'db')+'"> · '+(d>0?'▲ ':'▼ ')+fmt(Math.abs(d))+' vs previous</small>'}
function tvStatsHtml(){
  var days={week:7,month:30,all:0}[TV.srange||'month'],now=Date.now(),cur=stCalc(days?stWin(now-days*864e5,now+1):allTasks()),prev=days?stCalc(stWin(now-2*days*864e5,now-days*864e5)):null;
  var f1=function(x){return x==null?'—':(Math.round(x*10)/10).toString()},tile=function(v,l,sub){return'<div class="stt"><b class="mono">'+v+'</b><span>'+l+'</span>'+(sub?'<em>'+sub+'</em>':'')+'</div>'};
  var o=cur.byOut,tot=Math.max(1,o.sub+o.mfr+o.rework+o.rel+o.open),bar=function(n,c,l){return n?'<i class="'+c+'" style="flex:'+n+'" title="'+l+' · '+n+'"></i>':''};
  var reachPct=cur.worked.length?Math.round(cur.reach.length/cur.worked.length*100):null;
  var apps={};cur.worked.forEach(function(t){var k=appKey(t.app);(apps[k]=apps[k]||{app:t.app,t:[]}).t.push(t)});
  var rows=Object.keys(apps).map(function(k){var a=apps[k],ts=a.t,r=ts.filter(function(t){return counts(t).n>=tgt(t)}).length;return{app:a.app,n:ts.length,reach:r,logged:avgOf(ts.map(function(t){return counts(t).n})),target:avgOf(ts.map(tgt)),time:avgOf(ts.map(elapsed))}}).sort(function(a,b){return b.n-a.n||String(a.app).localeCompare(String(b.app))});
  var allT=allTasks(),fixTodo=0,evNeed=0,held=0;allT.forEach(function(t){fixTodo+=(t.findings||[]).filter(function(f){return f.fix==='todo'}).length;evNeed+=realC(t).need;if(t.status==='active'&&(now-t.createdAt)/864e5>=2)held++});
  var note=cur.worked.length<10?'<p class="hint" style="margin:0">Only '+cur.worked.length+' finished task'+(cur.worked.length===1?'':'s')+' in this window, so treat the averages as rough. They firm up around 20.</p>':'';
  return'<div class="tvfilters">'+tvSel('srange',TV.srange||'month',[['week','Last 7 days'],['month','Last 30 days'],['all','All time']],'Period')+'<span class="hint">'+cur.n+' task'+(cur.n===1?'':'s')+' claimed · '+cur.closed.length+' closed · '+cur.open.length+' open</span></div>'+note+
  '<div class="stgrid">'+tile(reachPct==null?'—':reachPct+'%','Reached the target',cur.reach.length+' of '+cur.worked.length+' worked tasks (app target, or 30)')+
    tile(f1(cur.avgLogged)+'<small> / '+f1(cur.avgTarget)+'</small>','Avg logged / target',prev?stDelta(cur.avgLogged,prev.avgLogged,false,f1):'')+
    tile(cur.avgTime==null?'—':hm(cur.avgTime),'Avg time per worked task','AHT 4:30')+
    tile(cur.perHour==null?'—':f1(cur.perHour),'Findings found per hour','all tasks in this period')+
    tile(cur.gap==null?'—':mmss(cur.gap),'Typical gap between findings',cur.logT==null?'':'log one in '+mmss(cur.logT)+(prev?stDelta(cur.logT,prev.logT,true,mmss):''))+
    tile(cur.relMed==null?'—':hm(cur.relMed),'Typical release time',cur.rel.length+' released · '+cur.relEarly+' by 0:30 · '+cur.relMid+' by 2:00 · '+cur.relLate+' after 2:00')+'</div>'+
  '<div class="stcard"><div class="lab">Outcomes</div><div class="stbar">'+bar(o.sub,'ok','Submitted')+bar(o.mfr,'warn','MFR / LFS')+bar(o.rework,'info','Rework')+bar(o.rel,'crit','Released')+bar(o.open,'mute','In progress')+'</div><div class="stkey"><span><i class="ok"></i>Submitted '+o.sub+'</span><span><i class="warn"></i>MFR '+o.mfr+'</span><span><i class="info"></i>Rework '+o.rework+'</span><span><i class="crit"></i>Released '+o.rel+'</span><span><i class="mute"></i>In progress '+o.open+'</span></div></div>'+
  '<div class="stcard"><div class="lab">MFR and rework · counted even when the task ended up submitted</div><div class="stkey"><span><b class="mono">'+cur.mfrTasks+'</b>&nbsp;of '+cur.n+' tasks went through the MFR</span><span><b class="mono">'+cur.mfrSubs+'</b>&nbsp;MFR submissions</span><span><b class="mono">'+cur.reworks+'</b>&nbsp;corrections requested</span></div>'+(function(){var n=allTasks().filter(mfrCand).length;return n?'<div class="row"><span class="hint">'+n+' older submitted task'+(n===1?'':'s')+' ended below the target with no MFR on record.</span><button class="btn sm pri" data-a="tvMfrReview">Review them</button></div>':''})()+'</div>'+
  '<div class="stcard"><div class="lab">Open loops</div><div class="stkey"><span><b class="mono">'+evNeed+'</b>&nbsp;real-app evidence missing</span><span><b class="mono">'+fixTodo+'</b>&nbsp;rework fixes to do</span><span><b class="mono">'+held+'</b>&nbsp;tasks held 2+ days</span><span><b class="mono">'+cur.stuck+'</b>&nbsp;tasks past 2:00 with under 10 found, not released</span></div></div>'+
  '<div class="stcard"><div class="lab">By app · tasks you worked to the end</div>'+(rows.length?'<div class="tvlist"><div class="tvrow sthead"><span>App</span><span>Tasks</span><span>Reached</span><span>Logged / target</span><span>Avg time</span></div>'+rows.slice(0,15).map(function(r){return'<div class="tvrow strow"><span class="tvmain"><b>'+esc(r.app)+'</b></span><span class="mono">'+r.n+'</span><span class="mono">'+r.reach+'/'+r.n+'</span><span class="mono">'+f1(r.logged)+' / '+f1(r.target)+'</span><span class="mono">'+hm(r.time)+'</span></div>'}).join('')+'</div>':'<p class="muted" style="margin:0">Nothing finished in this period yet.</p>')+'</div>'}
function tvTasksHtml(){
  var all=allTasks(),ts=tvTasks(),sum=function(f){return ts.reduce(function(a,t){return a+f(t)},0)};
  var kpi=function(n,l){return'<div><b class="mono">'+n+'</b><span>'+l+'</span></div>'};
  var rows=ts.map(function(t){var c=counts(t),r=realC(t);
    return'<button class="tvrow" data-a="open" data-id="'+t.id+'"><span class="tvmain"><b>'+esc(t.app||'Untitled app')+'</b><small>'+(t.featherId?esc(t.featherId.slice(0,10))+' · ':'')+'claimed '+day(t.createdAt)+'</small></span><span class="pill '+OUT[t.status][1]+'">'+OUT[t.status][0]+'</span><span class="mono tvn" title="Time on task">'+hm(elapsed(t))+'</span><span class="mono tvn" title="Logged / target">'+c.n+'/'+tgt(t)+'</span><span class="tvn" title="Found · Bugs · FRs">'+c.all+' found · '+c.b+'B '+c.fr+'FR</span><span class="tvn">'+(mfrCount(t)?'<span class="pill warn">MFR ×'+mfrCount(t)+'</span> ':'')+(reworkCount(t)?'<span class="pill info">Rework ×'+reworkCount(t)+'</span> ':'')+(r.need?'<span class="pill warn">Evidence · '+r.need+'</span>':r.all?'<span class="pill ok">Real app · '+r.all+'</span>':'')+'</span><span class="tvn muted">'+new Date(lastAct(t)).toLocaleDateString(undefined,{month:'short',day:'numeric'})+'</span></button>'}).join('');
  return'<div class="tvfilters"><input class="in" id="tvq" data-tk="q" placeholder="Search app, Feather ID, notes, finding text…" value="'+esc(TV.q)+'" aria-label="Search tasks">'+
    tvSel('status',TV.status,tvStatusOpts(),'Status')+tvSel('app',TV.app,tvAppOpts(),'App')+tvSel('range',TV.range,[['all','Any time'],['today','Last 24 hours'],['week','Last 7 days'],['month','Last 30 days']],'Claimed')+
    tvSel('sort',TV.sort,[['recent','Sort: recent activity'],['new','Newest claimed'],['old','Oldest claimed'],['app','App A–Z'],['found','Most found'],['logged','Most logged'],['time','Longest time'],['evidence','Most evidence needed']],'Sort')+
    '<label class="tvchk"><input type="checkbox" data-tk="need"'+(TV.need?' checked':'')+'> Evidence needed</label><label class="tvchk"><input type="checkbox" data-tk="mfr"'+(TV.mfr?' checked':'')+'> Went through MFR / LFS</label><button class="btn sm ghost" data-a="tvReset">Reset</button></div>'+
    (function(){var n=all.filter(mfrCand).length;if(!n&&!TV.cand)return'';return'<div class="banner"><span><b>'+n+' submitted task'+(n===1?'':'s')+' ended below the target with no MFR on record.</b> Older tasks did not track it. '+(TV.cand?'Showing them below.':'')+'</span>'+(TV.cand?'<button class="btn sm '+(TV.confirmMfr?'danger':'pri')+'" data-a="tvMfrAll">'+(TV.confirmMfr?'Confirm: record MFR on '+ts.length:'Record MFR on all '+ts.length+' shown')+'</button>'+(TV.confirmMfr?'<button class="btn sm ghost" data-a="tvMfrNo">Cancel</button>':'')+'<button class="btn sm ghost" data-a="tvReset">Show all</button>':'<button class="btn sm pri" data-a="tvMfrReview">Review them</button>')+'</div>'})()+'<div class="hnums tvk">'+kpi(ts.length+'<small>/'+all.length+'</small>','Tasks shown')+kpi(ts.filter(function(t){return OPENST[t.status]}).length,'Open')+kpi(ts.filter(function(t){return t.status==='submitted'||t.status==='form'||t.status==='outdated'}).length,'Submitted')+kpi(sum(function(t){return counts(t).n}),'Logged')+kpi(sum(function(t){return realC(t).need}),'Evidence needed')+'</div>'+
    (rows?'<div class="tvlist">'+rows+'</div>':'<p class="muted" style="margin:0">No tasks match these filters.</p>')}
function tvFindsHtml(){
  var rows=tvFinds(),n=rows.length,shown=rows.slice(0,300);
  var list=shown.map(function(r){var f=r.f,t=r.t,p=fPrio(f),ty=fType(f);
    return'<button class="tvrow tvf" data-a="goF" data-t="'+t.id+'" data-id="'+f.id+'"><span class="tvmain"><b>'+esc(fSum(f))+'</b><small>'+esc(t.app||'Untitled app')+' · '+day(t.createdAt)+' · found at '+hm(f.at||0)+' · '+OUT[t.status][0]+'</small></span><span class="chip '+(ty||'unk')+'">'+(ty==='bug'?'BUG':ty==='fr'?'FR':'?')+'</span><span class="tvn">'+(p?'<span class="pill '+(p==='P0'?'crit':p==='P1'?'warn':'info')+'">'+p+'</span>':'<span class="muted">—</span>')+'</span><span class="tvn">'+(f.status==='draft'?'Not started':f.status==='progress'?'In progress':'Done')+'</span><span class="tvn">'+(f.real==='need'?'<span class="pill warn">Evidence needed</span>':f.real==='done'?'<span class="pill ok">Evidence added</span>':'')+'</span></button>'}).join('');
  return'<div class="tvfilters"><input class="in" id="tvfq" data-tk="fq" placeholder="Search every finding: summary, steps, expected, actual…" value="'+esc(TV.fq)+'" aria-label="Search findings">'+
    tvSel('ftype',TV.ftype,[['all','All types'],['bug','Bugs'],['fr','FRs'],['unk','Untyped']],'Type')+tvSel('fprio',TV.fprio,[['all','All priorities'],['P0','P0'],['P1','P1'],['P2','P2'],['none','No priority yet']],'Priority')+
    tvSel('fstatus',TV.fstatus,[['all','Any progress'],['draft','Not started'],['progress','In progress'],['done','Done']],'Progress')+tvSel('freal',TV.freal,[['all','Real app: any'],['any','Real app only'],['need','Evidence needed'],['done','Evidence added'],['none','Not real app']],'Real app')+
    tvSel('fts',TV.fts,tvStatusOpts().map(function(o){return o[0]==='all'?['all','All tasks']:o}),'Task status')+tvSel('app',TV.app,tvAppOpts(),'App')+
    tvSel('fsort',TV.fsort,[['recent','Sort: recently edited'],['new','Newest'],['old','Oldest'],['prio','Priority'],['type','Type'],['status','Progress'],['app','App A–Z'],['evidence','Evidence needed first']],'Sort')+'<button class="btn sm ghost" data-a="tvReset">Reset</button></div>'+
    '<p class="hint" style="margin:0">'+n+' finding'+(n===1?'':'s')+(n>300?' · showing the first 300, narrow the filters to see the rest':'')+'. Click one to open it in its task.</p>'+(TV.freal==='need'&&n?'<div class="row"><button class="btn sm '+(TV.confirmBulk?'danger':'')+'" data-a="tvBulk">'+(TV.confirmBulk?'Confirm: mark '+n+' as evidence added':'Mark all '+n+' as evidence added')+'</button>'+(TV.confirmBulk?'<button class="btn sm ghost" data-a="tvBulkNo">Cancel</button>':'')+'<span class="hint">For findings whose screenshot or recording is already in Feather.</span></div>':'')+
    (list?'<div class="tvlist">'+list+'</div>':'<p class="muted" style="margin:0">No findings match these filters.</p>')}
function tvCsv(){
  var q=function(v){return'"'+String(v==null?'':v).replace(/"/g,'""')+'"'},lines;
  if(TV.tab==='tasks'){lines=[['app','feather_id','status','claimed','time','logged','target','found','bugs','frs','evidence_needed','real_app_tagged','mfr_submissions','reworks','history','last_activity'].join(',')].concat(tvTasks().map(function(t){var c=counts(t),r=realC(t);return[t.app,t.featherId||'',OUT[t.status][0],new Date(t.createdAt).toISOString().slice(0,10),hm(elapsed(t)),c.n,tgt(t),c.all,c.b,c.fr,r.need,r.all,mfrCount(t),reworkCount(t),histOf(t).map(function(x){return new Date(x.at).toISOString().slice(0,16)+' '+evText(x)}).join(' | '),new Date(lastAct(t)).toISOString()].map(q).join(',')}))}
  else{lines=[['app','feather_id','task_status','type','priority','progress','real_app','summary','found_at','created'].join(',')].concat(tvFinds().map(function(r){return[r.t.app,r.t.featherId||'',OUT[r.t.status][0],fType(r.f),fPrio(r.f),r.f.status,r.f.real||'',fSum(r.f),hm(r.f.at||0),r.f.createdAt?new Date(r.f.createdAt).toISOString():''].map(q).join(',')}))}
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));a.download='tasker-'+TV.tab+'-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
document.addEventListener('click',function(ev){var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
  if(a==='tv'){VIEW.mode='tasks';var sd=$('#side');if(sd)sd.classList.remove('open');render();var m=$('#main');if(m)m.scrollTop=0;return}
  if(a==='mfrAdd'){var t0=cur();if(t0){markMfr(t0);saveTask(t0);render();toast('MFR recorded','Added to this task\'s history.','ok')}return}
  if(a==='mfrDel'){var t1=cur();if(t1){unmarkMfr(t1);saveTask(t1);render()}return}
  if(a==='tvMfrReview'){TV.tab='tasks';TV.cand=true;TV.status='all';TV.range='all';TV.q='';TV.need=false;TV.mfr=false;tvSave();VIEW.mode='tasks';render();return}
  if(a==='tvMfrAll'){if(!TV.confirmMfr){TV.confirmMfr=true;render();return}TV.confirmMfr=false;var n=0;tvTasks().forEach(function(t){if(mfrCand(t)){markMfr(t);saveTask(t);n++}});TV.cand=false;tvSave();render();toast('MFR recorded',n+' task'+(n===1?'':'s')+' updated. Each has it in its history.','ok');return}
  if(a==='tvMfrNo'){TV.confirmMfr=false;render();return}
  if(a==='tvBulkNo'){TV.confirmBulk=false;render();return}
  if(a==='tvClose'){VIEW.mode=cur()?'task':'empty';render();return}
  if(a==='tvTab'){TV.tab=b.dataset.tab;tvSave();render();return}
  if(a==='tvCsv'){tvCsv();return}
  if(a==='realScan'){var r=realScan();render();toast('Real-app scan',r.found?'Tagged '+r.found+' finding'+(r.found===1?'':'s')+' in '+r.tasks+' task'+(r.tasks===1?'':'s')+', oldest first. Filter by Evidence needed to review them.':'No new findings compare with the real app.','ok');return}
  if(a==='tvBulk'){if(!TV.confirmBulk){TV.confirmBulk=true;render();return}TV.confirmBulk=false;var bt={};tvFinds().forEach(function(r){if(r.f.real==='need'){r.f.real='done';r.f.u=Date.now();bt[r.t.id]=r.t}});Object.keys(bt).forEach(function(id){saveTask(bt[id])});render();toast('Updated','Marked as evidence added.','ok');return}
  if(a==='tvReset'){if(TV.tab==='tasks'){TV.q='';TV.status='all';TV.range='all';TV.need=false;TV.mfr=false;TV.cand=false;TV.confirmMfr=false;TV.sort='recent'}else{TV.fq='';TV.ftype='all';TV.fprio='all';TV.fstatus='all';TV.freal='all';TV.fts='all';TV.fsort='recent'}TV.app='all';tvSave();render();return}
  if(a==='fReset'){VIEW.fq='';VIEW.ftype='all';VIEW.fprio='all';VIEW.filter='all';render();return}
  if(a==='goF'){var tid=b.dataset.t,fid=b.dataset.id;openTask(tid);var tt=TASKS[tid],ff=tt&&findF(tt,fid);VIEW.filter=ff?ff.status:'all';VIEW.fq='';VIEW.ftype='all';VIEW.fprio='all';render();setTimeout(function(){var el=document.querySelector('.f[data-fid="'+fid+'"]');if(el){el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(function(){el.classList.remove('flash')},1800)}},60);return}
});
document.addEventListener('input',function(ev){var el=ev.target,d=el.dataset;if(!d)return;
  if(d.tk){TV[d.tk]=el.type==='checkbox'?el.checked:el.value;tvSave();render();return}
  if(d.vk){VIEW[d.vk]=el.value;render()}});
/* ---------- real-app detection: tag findings whose rubric compares with the real app ---------- */
var REAL_RES=[/\b(real|original|actual|live|production|reference|official|genuine|upstream)\s+(app|application|product|site|website|platform|version|software|system)\b/i,
  /\b(clone|replica|copy)\b[^.\n]{0,60}\b(real|original|actual)\b|\b(real|original|actual)\b[^.\n]{0,60}\b(clone|replica)\b/i,
  /\b(compare[sd]?|comparison|compared)\s+(to|with|against)\s+(the\s+)?(real|original|actual|live)\b/i,
  /\b(missing|absent|lacks?|lacking|not present|does(n'?t| not) (exist|have|include|offer|support))\b[^.\n]{0,40}\b(in|from|on)\s+(the\s+)?(clone|replica)\b/i,
  /\b(clone|replica)\b[^.\n]{0,40}\b(is missing|lacks?|does(n'?t| not) (have|include|support|offer))\b/i];
function realText(f){var r=f.rub||{};return[f.text,r.summary,r.path,r.steps,r.expected,r.actual,r.raw].filter(Boolean).join('\n')}
function mentionsReal(f){var x=realText(f);return REAL_RES.some(function(re){return re.test(x)})}
function autoReal(t){var n=0;(t.findings||[]).forEach(function(f){if(!f.real&&!f.realNo&&mentionsReal(f)){f.real='need';f.realAuto=1;n++}});return n}
function realScan(){var tasks=0,fnd=0;allTasks().slice().sort(function(a,b){return a.createdAt-b.createdAt}).forEach(function(t){var n=autoReal(t);if(n){tasks++;fnd+=n;saveTask(t)}});return{tasks:tasks,found:fnd}}
var SSO_URL='https://qbubwemdvwflxvxwesrl.supabase.co/functions/v1/sso';
function ssoBoot(){var m=/[#&]sso=([0-9a-f]{64})/.exec(location.hash);if(!m)return;
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  if(sessOk())return;
  VIEWAUTH.busy=true;
  fetch(SSO_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'redeem',app:'tasker',pass:m[1]})}).then(function(r){return r.json().catch(function(){return{}}).then(function(d){return{ok:r.ok,d:d}})}).then(function(x){VIEWAUTH.busy=false;if(!x.ok||!x.d.token)throw new Error(x.d.error||'Sign-in failed. Enter your PIN.');SESSION={token:x.d.token,expires_at:x.d.expires_at,email:x.d.email};lsSet('session',SESSION);VIEW.mode=cur()?'task':'empty';render();toast('Signed in','Opened from your CRM.','ok');pull(true)}).catch(function(e){VIEWAUTH.busy=false;VIEWAUTH.err=e.message;render()});
}
(function(){if(!IDX.settings.realScan1){var r=realScan();IDX.settings.realScan1=1;saveIdx();if(r.found)setTimeout(function(){toast('Real-app scan','Tagged '+r.found+' finding'+(r.found===1?'':'s')+' in '+r.tasks+' task'+(r.tasks===1?'':'s')+' that compare with the real app, oldest first. Open All tasks & findings → Findings → Evidence needed.','warn')},800)}})();
ssoBoot();render();initCloud();checkGates();
var boot=document.getElementById('bootMsg');if(boot)boot.remove();
/* draft box: grows with what you type; Enter adds, Shift+Enter breaks the line */
document.addEventListener('input',function(ev){if(ev.target.id==='addIn')grow(ev.target)});
document.addEventListener('keydown',function(ev){var el=ev.target;if(el.id!=='addIn'||ev.key!=='Enter'||ev.shiftKey||ev.isComposing)return;ev.preventDefault();var f=$('#addForm');if(f){if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))}});
window.addEventListener('resize',function(){$$('.f textarea').forEach(grow);var a=$('#addIn');if(a)grow(a)});

})();

