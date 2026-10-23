
/* ============================ ПРАВИЛА ============================
   Чистая логика: ничего не рисует и не знает про экран. Меняет состояние через участников G.P
   и сообщает о произошедшем через addLog (дневник) и emit (события для интерфейса). */
function nbrs(k){const h=G.city.map[k];return DIRS.map(([dq,dr])=>K(h.q+dq,h.r+dr)).filter(x=>G.city.map[x])}
function hexDist(x,y){const A=G.city.map[x],B=G.city.map[y];return Math.max(Math.abs(A.q-B.q),Math.abs(A.r-B.r),Math.abs(A.q+A.r-B.q-B.r))}
function reveal(p,k){p.seen.add(k);for(const n of nbrs(k))p.seen.add(n)}
function addLog(t){G.log.unshift({n:G.night,time:fmtTime(G.time),t})}
// событие для интерфейса: остановить ходьбу, показать окно, анимацию и т. п.
function emit(type,data){const e={n:++G.evN,type,...(data||{})};G.ev.push(e);if(G.ev.length>200)G.ev.splice(0,G.ev.length-200);return e}
function bfs(from,to,seen){const prev={[from]:null};const q=[from];
  while(q.length){const c=q.shift();if(c===to)break;for(const n of nbrs(c)){if(n in prev)continue;if(seen&&!seen.has(n))continue;prev[n]=c;q.push(n)}}
  if(!(to in prev))return null;const p=[];let c=to;while(c&&c!==from){p.unshift(c);c=prev[c]}return p}
const DIRS8=["на север","на северо-восток","на восток","на юго-восток","на юг","на юго-запад","на запад","на северо-запад"];
function dirText(from,to){const A=G.city.map[from],B=G.city.map[to];const [ax,ay]=px(A.q,A.r),[bx,by]=px(B.q,B.r);
  const ang=Math.atan2(bx-ax,-(by-ay));const i=((Math.round(ang/(Math.PI/4))%8)+8)%8;const d=hexDist(from,to);
  return d===0?"в самом центре":`${DIRS8[i]}, ${d<=1?"совсем рядом":d<=2?"недалеко":d<=3?"в нескольких кварталах":"на окраине"}`}
const dname=k=>G.city.map[k].name;
const clanName=c=>c==="mortal"?"смертный":c?CLANS[c].name:"—";
function threatLvl(){return G?clamp(Math.floor(G.heat||0)+Math.floor((G.night-1)/3),0,12):0}
function threatTier(){const t=threatLvl();return t>=9?3:t>=5?2:t>=2?1:0}
const dice=n=>Array.from({length:Math.max(1,n)},()=>1+Math.floor(Math.random()*6));
function rollDice(a,mod=0){return dice(2+(a.status>=6?1:0)-(a.hunger>=4?1:0)+mod)}
const hit=d=>d.some(v=>v>=5),hits=d=>d.filter(v=>v>=5).length;

/* ---------- карты ---------- */
function descOf(clan){return clan&&clan!=="mortal"?pick(CLANS[clan].desc):pick(MORTAL_DESC)}
function pickClanFor(d){const C=G.case;
  if(C&&C.truth){const near=hexDist(d,C.truth.d)<=1;if(Math.random()<(near?.45:.14))return C.truth.clan}
  if(Math.random()<.12)return "mortal";return pick(Object.keys(CLANS))}
function mkCard(spec,d){let [k,rest]=spec.split(":");let pw=1;if(rest.endsWith("!")){pw=2;rest=rest.slice(0,-1)}
  let [name]=rest.split("|");let clan=pickClanFor(d);if(k==="p"&&clan==="mortal")clan=null;
  const C=G.case;const c={id:uid(),k,name,d,clan,n:G.night,pw};c.truth=!!(C&&C.truth&&clan===C.truth.clan&&hexDist(d,C.truth.d)<=1);return c}
function cardTags(c){return `${dname(c.d)} · ${c.clan==="mortal"?"смертный":c.clan?"связан: "+CLANS[c.clan].name:"без клана"} · ночь ${c.n}`}
function dirtyCard(a){const near=Object.values(G.city.map).filter(h=>h.t!=="ely"&&h.t!=="river"&&hexDist(h.k,a.haven)<=2);
  const names=[["i","Старая расписка гулю"],["i","Фотография убежища"],["i","Потерянный перстень"],["c","Гуль, который слишком много знает"],["c","Бывший слуга с длинным языком"]];const [k,name]=pick(names);
  return {id:uid(),k,name,d:pick(near).k,clan:a.clan,n:1,pw:2,dirty:true}}

/* ---------- город: фракции и влияние ---------- */
function initDistricts(){
  G.dist={};const hexes=Object.values(G.city.map).filter(h=>h.t!=="ely");
  const camShare=.25+Math.random()*.15,anaShare=.2+Math.random()*.15;
  // Камарилья тяготеет к центру, анархи — к окраинам и «своим» районам
  const lean={slum:.9,ind:.6,edge:.7,port:.5,club:.5,market:.3,rail:.3};
  const sorted=[...hexes].sort((a,b)=>(a.ring-b.ring)+(Math.random()-.5)*2.2);
  const nCam=Math.round(hexes.length*camShare),nAna=Math.round(hexes.length*anaShare);
  for(const h of hexes)G.dist[h.k]={c:0,own:null,contrib:{},pend:[]};
  sorted.slice(0,nCam).forEach(h=>{G.dist[h.k].c=3});
  const rest=hexes.filter(h=>G.dist[h.k].c===0).sort((a,b)=>(b.ring+(lean[b.t]||0)*3+Math.random()*2)-(a.ring+(lean[a.t]||0)*3+Math.random()*2));
  rest.slice(0,nAna).forEach(h=>{G.dist[h.k].c=-3});
  for(const h of hexes)setOwner(h.k,true);
  G.start={cam:countOwn("cam"),ana:countOwn("ana")};
}
function setOwner(k,silent){const D=G.dist[k];const o=D.c>=2?"cam":D.c<=-2?"ana":null;
  if(!silent&&o!==D.own){addLog(`<b>«${dname(k)}»</b> ${o?`теперь за ${o==="cam"?"Камарильей":"анархами"}`:"больше ничей"}.`)}D.own=o}
function countOwn(f){return Object.values(G.dist).filter(D=>D.own===f).length}
function addInfluence(a,k,n,fac){const D=G.dist[k];D.pend.push(fac==="cam"?n:-n);const C=D.contrib[a.id]=D.contrib[a.id]||{cam:0,ana:0};C[fac]+=n;a.contrib[fac]=(a.contrib[fac]||0)+n}
function loudAt(k,a){if(G.dist[k])G.dist[k].pend.push(G.dist[k].c>0?-1:G.dist[k].c<0?1:0);G.heat=clamp((G.heat||0)+.25,0,10);if(a)cityRumor(a,k)}
function leaveTrace(a,k,fac){const p=a.clan==="nos"?.2:.4;if(Math.random()<p)G.traces.push({id:uid(),d:k,clan:a.disguise||a.clan,real:a.id,fac,n:G.night,found:[]})}

/* ---------- слухи ---------- */
function cityRumor(a,k){const clan=Math.random()<.55?(a.disguise||a.clan):null;const kk=pick(["c","c","i","p"]);
  const dsc=clan?descOf(clan):pick(["лица никто не запомнил","было темно, и все смотрели в другую сторону","кто-то кричал, а потом всё стихло"]);
  const txt=kk==="c"?`В «${dname(k)}» кто-то шумел ночью: ${dsc}.`:kk==="i"?`В «${dname(k)}» после той ночи что-то нашли. Говорят, ${dsc}.`:`Говорят, неладно в «${dname(k)}», ${dirText("0,0",k)} от Элизиума.`;
  G.rumors.push({id:uid(),k:kk,txt,d:k,clan,n:G.night,w:1,src:"city"})}
function playerRumor(a,card){const D=G.dist[a.pos];const bonus=D&&D.own===a.fac&&DIST[G.city.map[a.pos].t][a.fac].e==="rumor"?1:0;
  const w=(a.clan==="tor"?2:1)+bonus;const hint=card.clan&&card.clan!=="mortal"?descOf(card.clan):card.clan==="mortal"?"кто-то из смертных":"";
  G.rumors.push({id:uid(),k:card.k,txt:`Говорят: ${card.name.toLowerCase()}, «${dname(card.d)}»${hint?" — "+hint:""}.`,d:card.d,clan:card.clan,n:G.night,w,src:"player"})}
function cellRumors(cell){const C=G.case;return G.rumors.filter(r=>cell.k.includes(r.k)&&!C.refuted.includes(r.id)&&(cell.key!=="clan"||r.clan))}
function leader(cell){const rs=cellRumors(cell);if(!rs.length)return null;const g={};
  for(const r of rs){const key=cell.key==="clan"?r.clan:r.d;(g[key]=g[key]||{key,w:0,rs:[]});g[key].w+=r.w;g[key].rs.push(r)}
  const best=Object.values(g).sort((a,b)=>b.w-a.w||Math.max(...b.rs.map(r=>r.n))-Math.max(...a.rs.map(r=>r.n)))[0];
  best.top=best.rs.sort((a,b)=>b.n-a.n)[0];return best}

/* ---------- дела Князя ---------- */
function openCase(){const used=G.casesDone.map(c=>c.id);const pool=CASES.filter(c=>!used.includes(c.id));const T=pick(pool.length?pool:CASES);
  const inPlay=actors().map(a=>a.clan);const r=Math.random();
  const clan=r<.1?"mortal":r<.65?pick(inPlay):pick(Object.keys(CLANS));
  const ds=Object.values(G.city.map).filter(h=>T.area.includes(h.t));const d=(ds.length?pick(ds):pick(Object.values(G.city.map).filter(h=>h.t!=="ely"))).k;
  G.case={id:T.id,opened:G.night,gath:0,cells:{},alibis:[],refuted:[],truth:{clan,d}};
  // город уже шепчется: намёк, где искать
  const near=pick([d,...nbrs(d)].filter(k=>G.city.map[k].t!=="ely"));
  G.rumors.push({id:uid(),k:"p",txt:`Говорят, всё случилось где-то ${dirText("0,0",near)} от Элизиума.`,d:near,clan:null,n:G.night,w:1,src:"city"});
  if(clan!=="mortal")G.rumors.push({id:uid(),k:"c",txt:`Шепчутся о том, кого видели той ночью: ${descOf(Math.random()<.6?clan:pick(Object.keys(CLANS)))}.`,d:near,clan:Math.random()<.6?clan:pick(Object.keys(CLANS)),n:G.night,w:1,src:"city"});
  addLog(`<b>Новое дело Князя: «${T.t}».</b>`);return T}
const tplOf=C=>CASES.find(t=>t.id===C.id);
function freeCells(){const C=G.case;if(!C)return [];return tplOf(C).cells.filter(c=>!C.cells[c.id])}
function fits(card,cell){return cell.k.includes(card.k)}
function casePlace(a,cellId,cardId){const C=G.case,cell=tplOf(C).cells.find(c=>c.id===cellId);const card=a.hand.find(c=>c.id===cardId);
  if(!card||C.cells[cellId]||!fits(card,cell))return false;a.hand=a.hand.filter(c=>c!==card);C.cells[cellId]={card,by:a.id};a.placed=(a.placed||0)+1;
  addLog(`<b>${Who(a)}</b> ${vb(a,"кладёте","кладёт")} в «${cell.l}»: ${card.name} (${cardTags(card)}).`);return true}
function caseRefute(a,cellId,cardId){const C=G.case,cell=tplOf(C).cells.find(c=>c.id===cellId);const L=leader(cell);const card=a.hand.find(c=>c.id===cardId);
  if(!card||!L||C.cells[cellId])return false;const val=cell.key==="clan"?card.clan:card.d;if(val===L.key)return false;
  for(const r of L.rs)C.refuted.push(r.id);a.hand=a.hand.filter(c=>c!==card);C.alibis.push({card,by:a.id,cell:cellId});
  addLog(`<b>${Who(a)}</b> ${vb(a,"оспариваете","оспаривает")} слух в «${cell.l}»: ${card.name}. Слух больше не в счёт.`);return true}
function accusedBy(a){const C=G.case;if(!C)return null;const w=tplOf(C).cells.find(c=>c.who);const v=C.cells[w.id];return v&&v.card.clan===a.clan&&v.by!==a.id?v:null}
function caseAlibi(a,cardId){const C=G.case,v=accusedBy(a);const card=a.hand.find(c=>c.id===cardId&&c.clan===a.clan);if(!v||!card)return false;
  const w=tplOf(C).cells.find(c=>c.who);delete C.cells[w.id];a.hand=a.hand.filter(c=>c!==card);C.alibis.push({card,by:a.id,cell:w.id});
  const acc=actorById(v.by);if(acc){acc.status=clamp(acc.status-2,0,10)}
  addLog(`<b>${Who(a)}</b> ${vb(a,"опровергаете","опровергает")} обвинение: ${card.name}. ${acc?`${Who(acc)} ${vb(acc,"теряете","теряет")} 2 Статуса за клевету при дворе.`:""}`);return true}
function exposeTargets(a){const tr=a.hand.filter(c=>c.trace&&c.trace.fac==="ana");const by={};for(const c of tr)(by[c.clan]=by[c.clan]||[]).push(c);
  return Object.entries(by).filter(([cl,cs])=>cs.length>=2&&cl!==a.clan&&actorOfClan(cl)).map(([cl])=>cl)}
function doExpose(a,clan){const tr=a.hand.filter(c=>c.trace&&c.trace.fac==="ana"&&c.clan===clan).slice(0,2);a.hand=a.hand.filter(c=>!tr.includes(c));
  const t=actorOfClan(clan);
  if(t&&t.fac==="ana"&&!t.exposed){t.exposed=true;t.status=clamp(t.status-3,0,10);a.status=clamp(a.status+2,0,10);a.exposedSomeone=true;
    addLog(`<b>Разоблачение.</b> ${Who(a)} ${vb(a,"выкладываете","выкладывает")} перед двором следы: клан ${CLANS[clan].name} тайно работал на анархов. ${isMe(t)?"Вас":"Его"} больше не защищает двор. Статус −3.`);
    if(G.sheriff===t.id)G.sheriff=null;return true}
  a.status=clamp(a.status-2,0,10);addLog(`<b>Ложное обвинение.</b> ${Who(a)} ${vb(a,"обвиняете","обвиняет")} клан ${CLANS[clan].name} в работе на анархов, но двор не верит. Статус −2.`);return false}
function needSheriff(att){const list=att.filter(a=>!a.exposed).sort((x,y)=>y.status-x.status||Math.random()-.5);if(!list.length)return;
  const cur=G.sheriff&&actorById(G.sheriff);if(!cur||!cur.alive||cur.exposed||list[0].status>=cur.status+2&&list[0]!==cur){G.sheriff=list[0].id;addLog(`<b>Шериф:</b> ${isMe(list[0])?"Князь назначает Шерифом вас":`Князь назначает Шерифом клан ${CLANS[list[0].clan].name}`}.`)}}
function sheriffRewrite(a,cellId,cardId){const C=G.case,cell=tplOf(C).cells.find(c=>c.id===cellId);const card=a.hand.find(c=>c.id===cardId);
  if(!card||!C.cells[cellId]||!fits(card,cell))return false;const old=C.cells[cellId];a.hand=a.hand.filter(c=>c!==card);C.cells[cellId]={card,by:a.id};a.placed=(a.placed||0)+1;
  addLog(`<b>Шериф переписывает «${cell.l}»:</b> вместо «${old.card.name}» — ${card.name}.`);return true}
/* связность истории: совпадения кланов и соседство районов между ячейками */
function storyValues(forced){const C=G.case,T=tplOf(C);const vals=[];
  for(const cell of T.cells){const v=C.cells[cell.id];if(v){vals.push({cell,card:v.card,by:v.by,src:"card"});continue}
    if(forced){const L=leader(cell);if(L){vals.push({cell,card:L.top,by:null,src:"rumor"});continue}}vals.push({cell,card:null})}
  return vals}
function coherence(vals){let s=0;const per=vals.map(()=>0);for(let i=0;i<vals.length;i++)for(let j=i+1;j<vals.length;j++){const a=vals[i].card,b=vals[j].card;if(!a||!b)continue;
  let m=0;if(a.clan&&b.clan&&a.clan!=="mortal"&&a.clan===b.clan)m++;if(a.d&&b.d&&hexDist(a.d,b.d)<=1)m++;s+=m;per[i]+=m;per[j]+=m}
  return {s,per,need:Math.max(2,vals.length-2)}}
function verdict(forced){const C=G.case,T=tplOf(C);const vals=storyValues(forced);const P=PERSONAS[G.persona];const txt=[];
  const wv=vals.find(v=>v.cell.who);let accused=wv&&wv.card?wv.card.clan:null;
  if(!accused||accused==="?"){const low=actors().filter(a=>!a.exposed).sort((a,b)=>a.status-b.status)[0];accused=low?low.clan:"mortal";txt.push("Князь так и не услышал, кто это сделал. Но двору нужен виновный — и Князь смотрит на того, у кого меньше всех веса при дворе.")}
  const co=coherence(vals);const coherent=co.s>=co.need;
  const sev=clamp(T.sev+P.sev+Math.floor((G.night-1)/4)-(coherent?0:1),1,4);
  txt.push(vals.map(v=>`<b>${v.cell.l}:</b> ${v.card?(v.src==="rumor"?"слух — "+v.card.txt:v.card.name+" ("+cardTags(v.card)+")"):"пусто"}`).join("<br>"));
  const contributors=[...new Set(vals.filter(v=>v.by).map(v=>v.by))].map(actorById).filter(a=>a&&a.alive);
  if(coherent){
    txt.push(`История складывается: совпадений ${co.s} при нужных ${co.need}. Князь верит.`);
    if(accused==="mortal")txt.push("Виновным назван смертный. Князь отдаёт его Шерифу, и город ничего не узнает.");
    else{const t=actorOfClan(accused);txt.push(`<b>Обвинён клан ${CLANS[accused].name}.</b> ${PUNISH[sev].txt}`);if(t){t.accused=true;punish(t,sev,txt)}else txt.push("Этого клана нет при дворе — наказание падёт на тех его членов, кого Шериф найдёт в городе.");(G.punished=G.punished||[]).push(accused)}
    for(const a of contributors){if(a.clan===accused)continue;a.status=clamp(a.status+1,0,10)}
    if(contributors.length)txt.push(`Те, чьи находки легли в дело, получают Статус +1: ${contributors.filter(a=>a.clan!==accused).map(who).join(", ")||"никто"}.`);
    if(accused===C.truth.clan){G.heat=clamp((G.heat||0)-2,0,10);txt.push("<b>И это правда.</b> Город остывает: тот, кто это сделал, наказан.");for(const v of vals)if(v.card&&v.card.truth&&v.by){const a=actorById(v.by);if(a&&a.alive)a.status=clamp(a.status+1,0,10)}}
    else{G.heat=clamp((G.heat||0)+2,0,10);txt.push("Но настоящий виновный всё ещё на свободе — и город это чувствует.")}
  }else{
    txt.push(`История рассыпается: совпадений ${co.s} при нужных ${co.need}. Князь в ярости.`);
    let worst=null,wv2=99;vals.forEach((v,i)=>{if(v.by&&co.per[i]<wv2){wv2=co.per[i];worst=actorById(v.by)}});
    if(!worst)worst=actors().filter(a=>!a.exposed).sort((a,b)=>a.status-b.status)[0];
    if(worst){txt.push(`Князь наказывает того, чья находка противоречила остальным сильнее всего: ${who(worst)}. ${PUNISH[1].txt}`);punish(worst,1,txt)}
    G.heat=clamp((G.heat||0)+1,0,10);
  }
  G.casesDone.push({id:C.id,t:T.t,accused,truth:C.truth.clan,coherent,night:G.night});
  G.case=null;return txt}
function punish(a,sev,txt){
  if(sev===1){a.status=clamp(a.status-1,0,10);a.money=Math.max(0,a.money-3)}
  if(sev===2){a.status=clamp(a.status-2,0,10);const sh=G.sheriff&&actorById(G.sheriff);for(let i=0;i<2&&a.hand.length;i++){const c=a.hand.splice(Math.floor(Math.random()*a.hand.length),1)[0];if(sh&&sh!==a&&!c.dirty)sh.hand.push(c)}}
  if(sev===3){a.status=clamp(a.status-3,0,10);a.hand=a.hand.filter(c=>c.dirty);moveHaven(a)}
  if(sev===4){if(G.deathMode==="final"){a.alive=false;txt&&txt.push(isMe(a)?"Вас приговорили. Рассвет вы встретите на крыше Элизиума.":`Клан ${CLANS[a.clan].name} лишается своего Сородича.`);a.dead="executed"}
    else{a.status=1;a.money=2;a.hand=[];moveHaven(a);txt&&txt.push(isMe(a)?"Вас казнили — но в городе просыпается новый неонат вашего клана. Вы играете за него.":`Клан ${CLANS[a.clan].name} присылает в город нового Сородича.`)}}}
function moveHaven(a){const used=new Set(["0,0",...actors().map(x=>x.haven)]);const c=Object.values(G.city.map).filter(h=>["res","old","club","theatre","slum","market"].includes(h.t)&&!used.has(h.k));
  const h=pick(c.length?c:Object.values(G.city.map).filter(h=>!used.has(h.k)&&h.t!=="ely"));a.haven=h.k;reveal(a,h.k);a.visited.add(h.k)}

/* ---------- осмотр района: событие и находка ---------- */
function eventFor(a,k){const h=G.city.map[k];const pool=EV[h.t]||EV.res;const usedK=a.usedEv;
  const fresh=pool.map((e,i)=>i).filter(i=>!usedK.includes(h.t+i));const i=fresh.length?pick(fresh):rnd(pool.length);usedK.push(h.t+i);
  const [t,x,c]=pool[i];return {t,x,c:withPass(c)}}
function withPass(cs){const free=cs.some(c=>c.o&&!c.ok&&!c.o.tm&&!(c.o.a>0)&&!(c.o.m<0));return free?cs:[...cs,{t:"Не задерживаться",o:{x:"Вы не задерживаетесь и идёте дальше."}}]}
function traceHere(a,k){return G.traces.find(t=>t.d===k&&t.real!==a.id&&!t.found.includes(a.id))}
function traceCard(t){return {id:uid(),k:"i",name:t.fac==="ana"?"След сделки с людьми Барона":"След сделки с людьми двора",d:t.d,clan:t.clan,n:t.n,pw:2,trace:{fac:t.fac}}}
function outcome(a,o,k){const r={...o};let card=null;
  if(o.c){card=mkCard(o.c,k);a.hand.push(card)}
  if(o.sell){const s=a.hand.filter(c=>!c.dirty&&!c.trace);if(s.length){const c=pick(s);a.hand=a.hand.filter(x=>x!==c);r.x=`Вы отдаёте «${c.name}». `+o.x}else{r.x="Продать нечего — вы просто болтаете со скупщиком.";r.m=0}}
  if(r.m)a.money=Math.max(0,a.money+r.m);if(r.h)a.hunger=clamp(a.hunger+r.h,0,CONFIG.hungerMax);if(r.s)a.status=clamp(a.status+r.s,0,10);
  if(r.a){a.alarm=clamp(a.alarm+r.a,0,CONFIG.alarmMax);if(r.a>0)loudAt(k,a)}
  const text=(r.x||"").replace(/\{DESC\}/g,card?descOf(card.clan):descOf(pick(Object.keys(CLANS))));
  return {text,card,tm:r.tm||0,fx:[r.m?`Деньги ${r.m>0?"+":"−"}${Math.abs(r.m)}`:"",r.h?`Голод ${r.h>0?"+":"−"}${Math.abs(r.h)}`:"",r.a?`Тревога ${r.a>0?"+":"−"}${Math.abs(r.a)}`:"",card?`в руку: ${card.name}`:""].filter(Boolean).join(" · ")}}

