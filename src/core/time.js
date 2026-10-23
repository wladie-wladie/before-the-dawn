
/* ============================ ВРЕМЯ, СБОР ДВОРА, РАССВЕТ ============================ */
const humans=()=>G.P.filter(p=>p.control==="human");
function advance(n=1){for(let i=0;i<n;i++){if(G.time>=CONFIG.nightEnd)break;G.time++;botsStep();gatherCheck()}}
function isGatherNight(){return G.night%2===0}
const gatherOpen=()=>isGatherNight()&&G.gathered!==G.night&&G.time>=CONFIG.gFrom&&G.time<=CONFIG.gTo;
function gatherCheck(){if(!isGatherNight()||G.gathered===G.night||G.phase==="court")return;
  if(G.time>CONFIG.gTo){G.gathered=G.night;gatherAuto()}}
// время, потраченное участником: человек двигает часы города, бот просто занят
function spendTime(p,n){if(!n)return;if(p.control==="human")advance(n);else p.busy=(p.busy||0)+Math.max(0,n-1)}

/* ---------- рассвет: предупреждения ---------- */
function homeNeed(p){const q=bfs(p.pos,p.haven,null);return q?q.length:0}
function shelterAt(p,k){const D=G.dist[k];if(!D||!D.own||D.own!==p.fac)return false;return DIST[G.city.map[k].t][p.fac].e==="shelter"}
function dawnWarnCheck(p,rush){if(G.phase!=="walk"||p.pos===p.haven||rush||shelterAt(p,p.pos))return null;const need=homeNeed(p),left=CONFIG.nightEnd-G.time;
  if(left<=need+1&&p.warn2!==G.night){p.warn2=G.night;p.warn1=G.night;return emit("dawnWarn",{pid:p.id,lvl:2,left,need})}
  if(left<=need+4&&p.warn1!==G.night){p.warn1=G.night;return emit("dawnWarn",{pid:p.id,lvl:1,left,need})}
  return null}

/* ---------- сбор двора ---------- */
function attendees(){return actors().filter(a=>a.control==="human"?a.pos==="0,0":a.attend)}
function startCourt(){const fresh=!G.case;if(fresh)openCase();
  const att=attendees();for(const b of att)b.pos="0,0";needSheriff(att);
  const order=[...att].filter(a=>!a.exposed).sort((a,b)=>b.status-a.status||Math.random()-.5).map(a=>a.id);
  G.court={phase:"intro",fresh,order,i:0,lines:[],res:null};G.phase="court";emit("court",{fresh})}
// боты говорят по очереди, пока слово не дойдёт до живого игрока
function courtAdvance(){const Ct=G.court;
  while(Ct.i<Ct.order.length){const a=actorById(Ct.order[Ct.i]);if(a&&a.control==="human"&&a.alive&&G.case)break;if(a&&a.alive&&G.case)botCourtTurn(a,Ct.lines);Ct.i++}
  if(Ct.i>=Ct.order.length||!G.case){Ct.phase="sheriff";const sh=G.sheriff&&actorById(G.sheriff);
    if(sh&&sh.control!=="human"&&sh.alive&&G.case){botSheriff(sh,Ct.lines);Ct.phase="result";courtResult()}else if(!sh||!G.case){Ct.phase="result";courtResult()}}}
const courtTurnOf=()=>{const Ct=G.court;return Ct&&Ct.phase==="turns"?Ct.order[Ct.i]:null};
function courtResult(){const Ct=G.court,C=G.case;if(!C){Ct.res=["Дело закрыто."];return}Ct.snap=C;
  const all=freeCells().length===0;C.gath++;const pat=PERSONAS[G.persona].patience;
  if(all)Ct.res=verdict(false);else if(C.gath>=pat){Ct.res=["<b>Терпение Князя кончилось.</b> Пустые места в деле займут слухи.",...verdict(true)]}
  else{const left=pat-C.gath;const N=Math.max(1,Math.min(left*2,CONFIG.nights-G.night));G.case.deadline=G.night+N;
    Ct.res=[`<b class="ct-wait">Решение ещё не вынесено.</b>`,`«Я выслушал вас, — говорит Князь. — Этого мало. На то, чтобы разобраться в ситуации, даю вам ${N} ${N===1?"ночь":N<5?"ночи":"ночей"}. ${left===1?"Следующий сбор — последний: дальше я решу сам.":`Я жду вас на следующих сборах — ещё ${left}.`} А пока слухи нашёптывают мне вот что:»`,
    freeCells().map(cell=>{const L=leader(cell);return `<b>${cell.l}:</b> ${L?L.top.txt+(L.w>1?` <span class="hint">(повторяют ${L.w} раза)</span>`:""):"тишина — если никто ничего не принесёт, Князь решит сам"}`}).join("<br>")]}
  emit("verdict",{res:Ct.res})}
function gatherAuto(){const fresh=!G.case;if(fresh)openCase();const att=bots().filter(b=>b.alive&&b.attend);needSheriff(att);const lines=[];
  G.court={lines,res:null,phase:"auto"};
  for(const b of [...att].filter(a=>!a.exposed).sort((a,b)=>b.status-a.status)){if(G.case)botCourtTurn(b,lines)}
  const sh=G.sheriff&&actorById(G.sheriff);G.court.phase="sheriff";if(sh&&sh.control!=="human"&&sh.alive&&att.includes(sh))botSheriff(sh,lines);
  courtResult();const res=G.court.res;G.court=null;
  for(const h of humans()){h.status=clamp(h.status-1,0,10)}
  addLog(`<b>Сбор двора прошёл без вас.</b> Статус −1. ${lines.join(" ")} ${res.join(" ").replace(/<br>/g," · ")}`);
  for(const h of humans())if(h.dead){endGame("dead");return}}

/* ---------- рассвет и новая ночь ---------- */
function caughtByDawn(p){const h=G.city.map[p.pos];
  if(p.clan==="gan"&&["park","edge","cem"].includes(h.t)){p.hunger=clamp(p.hunger+1,0,CONFIG.hungerMax);p.dayNote=`Солнце встаёт, а вы уходите в землю «${h.name}», как в тёмную воду. Голод +1.`;addLog(`<b>Рассвет.</b> ${p.dayNote}`);emit("sun",{pid:p.id,kind:"meld",night:G.night,text:p.dayNote+" Зверь спас вас — в этот раз."});return}
  const cover=["cem","old","slum","ind","port","res","rail","market","theatre","hosp","uni"].includes(h.t);let q=cover?.5:.2;if(p.clan==="nos")q+=.25;if(p.hunger>=4)q-=.1;
  if(Math.random()<q){p.hunger=CONFIG.hungerMax-1;p.alarm=clamp(p.alarm+2,0,CONFIG.alarmMax);p.status=clamp(p.status-1,0,10);p.burned=true;
    p.dayNote=`Первый луч касается руки, когда вы уже ломаете дверь подвала в «${h.name}». Вы выжили — едва. Голод почти на пределе, Тревога +2, Статус −1. Следующей ночью вы очнётесь только к полуночи.`;addLog(`<b>Рассвет застаёт вас вне убежища.</b> ${p.dayNote}`);emit("sun",{pid:p.id,kind:"burn",night:G.night,text:p.dayNote})}
  else{p.deathText=`Вы не успели. Рассвет застаёт вас в «${h.name}»${cover?", и ни одна дверь не открылась вовремя":", где негде спрятаться"}. Через минуту от вас остаётся только пепел.`;p.dead="sun";emit("sun",{pid:p.id,kind:"death",night:G.night,text:p.deathText+(G.deathMode==="respawn"?" Но кровь клана не кончается — где-то в городе просыпается новый неонат.":"")})}}
function dawn(){if(G.phase!=="walk")return;const p=me();p.enc=null;p.dayNote=p.dayNote||null;emit("dawn",{});
  const safe=p.pos===p.haven||shelterAt(p,p.pos);if(!safe)caughtByDawn(p);else if(p.pos!==p.haven){p.wakeAt=p.pos;addLog(`<b>Рассвет.</b> Вы пережидаете день в «${dname(p.pos)}» — у своих.`)}else addLog("<b>Рассвет.</b> Вы засыпаете в убежище за мгновение до первых лучей.");
  if(p.dead){if(G.deathMode==="respawn"){respawn(p,"Солнце");}else{endGame("dead");return}}
  // рассвет: итоги влияния за ночь — результат виден всем, вклад скрыт
  for(const [k,D] of Object.entries(G.dist)){if(D.pend.length){D.c=clamp(D.c+D.pend.reduce((s,v)=>s+v,0),-6,6);D.pend=[];setOwner(k)}}
  G.heat=clamp((G.heat||0)-.3,0,10);
  if(p.alarm>=CONFIG.alarmMax){endGame("lost");return}
  if(G.night>=CONFIG.nights){endGame("done");return}
  if(winByBlood())return;
  G.phase="day"}
function respawn(p,why){p.dead=null;p.alive=true;p.status=1;p.money=2;p.hand=[];p.hunger=2;p.alarm=0;moveHaven(p);p.pos=p.haven;addLog(`<b>${why} забрал вас.</b> В городе просыпается новый неонат клана ${CLANS[p.clan].name}. Теперь это вы.`)}
function nextNight(){const p=me();
  G.night++;G.time=CONFIG.nightStart;p.pos=p.wakeAt||p.haven;p.wakeAt=null;p.visitedTonight=new Set([p.pos]);p.hunger=clamp(p.hunger+1,0,CONFIG.hungerMax);p.alarm=Math.max(0,p.alarm-1);
  p.disguise=null;p.obs=null;p.ritual=null;p.dayNote=null;G.phase="walk";
  if(p.burned){p.burned=false;G.time=48;addLog("<b>Вы приходите в себя только к полуночи.</b>")}
  for(const b of bots())if(b.alive)botDusk(b);
  duskBonuses();
  addLog(`<b>Ночь ${G.night}.</b>${isGatherNight()?` Сегодня в 23:00 — сбор двора в Элизиуме.${G.case?" Дело «"+tplOf(G.case).t+"» всё ещё открыто.":" Князь откроет новое дело."}`:""}`);
  emit("night",{night:G.night})}
function duskBonuses(){const M=me();let got={money:0,hunger:0,cards:0,status:0};
  for(const [k,D] of Object.entries(G.dist)){if(!D.own)continue;const B=DIST[G.city.map[k].t][D.own];if(!B||B.e==="none")continue;
    const cs=actors().filter(a=>a.fac===D.own&&D.contrib[a.id]&&D.contrib[a.id][D.own]>0);const top=cs.sort((a,b)=>D.contrib[b.id][D.own]-D.contrib[a.id][D.own])[0];
    if(B.e==="money")for(const a of cs){a.money+=B.v;if(a===M)got.money+=B.v}
    if(B.e==="hunger")for(const a of cs){a.hunger=Math.max(0,a.hunger-1);if(a===M)got.hunger++}
    if(B.e==="card"&&top){const ev=EV[G.city.map[k].t]||EV.res;const specs=ev.flatMap(e=>e[2].flatMap(ch=>[ch.o,ch.ok].filter(o=>o&&o.c).map(o=>o.c)));if(specs.length){top.hand.push(mkCard(pick(specs),k));if(top===M)got.cards++}}
    if(B.e==="status"&&top&&G.night%2===0){top.status=clamp(top.status+1,0,10);if(top===M)got.status++}
    if(B.e==="calm")G.heat=clamp((G.heat||0)-.3,0,10);
    if(B.e==="spread"){const n=nbrs(k).filter(x=>G.dist[x]);if(n.length)G.dist[pick(n)].pend.push(D.own==="cam"?1:-1)}}
  const parts=[got.money?`деньги +${got.money}`:"",got.hunger?`голод −${got.hunger}`:"",got.cards?`карт +${got.cards}`:"",got.status?`Статус +${got.status}`:""].filter(Boolean);
  if(parts.length)addLog(`<b>Ваши районы приносят своё:</b> ${parts.join(", ")}.`)}
function winByBlood(){const M=me();if(G.deathMode==="final"&&bots().every(b=>!b.alive)&&M.alive){endGame("blood");return true}return false}

/* ---------- итог: Власть ---------- */
function facWinner(){const dc=countOwn("cam")-G.start.cam,da=countOwn("ana")-G.start.ana;return {dc,da,w:dc>da?"cam":da>dc?"ana":null}}
function scoreOf(a,W){if(!a.alive)return {total:0,parts:["погиб"]};const P=[];let t=0;const add=(v,l)=>{if(v){t+=v;P.push(`${l} ${v>0?"+":""}${v}`)}};
  add(a.status*2,"Статус ×2");add(Math.floor(a.money/3),"деньги");add(G.sheriff===a.id?2:0,"Шериф");
  const g=GOALS.find(x=>x.id===a.goal);if(g&&g.ok(a))add(4,"замысел");
  if(a.hand.some(c=>c.dirty&&c.clan===a.clan))add(-3,"грязь на себя");
  if(W&&a.fac===W)add(3+Math.floor((a.contrib[W]||0)/2),`победа ${W==="cam"?"Камарильи":"анархов"}`);
  if(a.exposed)add(-2,"разоблачён");return {total:t,parts:P}}
function endGame(result){G.phase="end";G.result=result;G.final=facWinner();emit("end",{result})}
