
/* ============================ КОМАНДЫ ============================
   Любое действие человека или бота — команда: dispatch(id, "имя", {аргументы}).
   У команды есть проверка can(): null — можно, строка — почему нельзя.
   Интерфейс ничего не решает сам: кнопки берёт из options(), карты для выбора — из cardsFor(),
   а доступность — из can(). Результат команды — список событий (emit), по ним экран
   останавливает ходьбу, открывает окна и показывает, что сработало автоматически. */
const CMD={};
function dispatch(pid,name,args={},ctx={}){const p=actorById(pid)||(CMD[name]&&CMD[name].sys?{id:pid}:null),c=CMD[name];
  if(!p||!c)return {ok:false,reason:"нет такой команды",events:[]};
  const why=c.can?c.can(p,args,ctx):null;if(why)return {ok:false,reason:why,events:[]};
  const n0=G.evN;c.run(p,args,ctx);return {ok:true,events:G.ev.filter(e=>e.n>n0)}}
const can=(pid,name,args={},ctx={})=>{const p=actorById(pid),c=CMD[name];if(!p||!c)return "нет такой команды";return c.can?c.can(p,args,ctx):null};
const stops=r=>r.events.some(e=>["enc","court","dawnWarn","dawn","sun","end"].includes(e.type));

// время человека: часы города идут, на рассвете — день; иначе — проверка, не пора ли предупредить
function humanSpend(p,n){spendTime(p,n);if(p.control!=="human")return false;if(G.time>=CONFIG.nightEnd&&G.phase==="walk"){dawn();return true}dawnWarnCheck(p);return false}
const free=(p)=>G.phase!=="walk"?"сейчас не ночь в городе":!p.alive?"вы мертвы":p.enc?"сначала закончите с тем, что происходит":null;
const here=p=>G.city.map[p.pos];

/* ---------- начало партии ---------- */
CMD.toSetup={sys:true,can:()=>G.phase==="built"?null:"город ещё строится",run:()=>{G.phase="setup"}};
CMD.start={sys:true,can:(p,a)=>G.phase!=="setup"?"не время":!a.clan||!a.fac?"выберите клан и сторону":null,
  run:(p,a)=>startGame(a.clan,a.fac,a.death||"final",a.dice,a.pred,a.sheet)};
function startGame(clan,fac,death,diceMode,pred,custom){
  const cands=Object.values(G.city.map).filter(h=>["res","old","club","theatre","slum","market"].includes(h.t)&&h.ring>=2&&h.ring<=3);
  const h=pick(cands.length?cands:Object.values(G.city.map).filter(h=>h.t!=="river"&&h.t!=="ely"));
  const M=mkPlayer(ME,"human",clan,h.k);M.fac=fac;M.facStart=fac;G.P=[M];G.deathMode=death;G.dice=diceMode==="v5"?"v5":"simple";M.sheet=mkSheet(clan,pred,custom);
  reveal(M,h.k);M.visited.add(h.k);M.visitedTonight.add(h.k);M.seen.add("0,0");reveal(M,"0,0");
  G.prince=pick(PRINCES);G.persona=pick(Object.keys(PERSONAS));
  initDistricts();
  const others=shuffle(Object.keys(CLANS).filter(c=>c!==clan)).slice(0,CONFIG.bots);
  const used=new Set([M.haven,"0,0"]);
  for(const [i,c] of others.entries()){const hs=Object.values(G.city.map).filter(x=>!["river","ely"].includes(x.t)&&!used.has(x.k)&&hexDist(x.k,M.haven)>=3&&x.ring>=2);const hh=pick(hs.length?hs:Object.values(G.city.map).filter(x=>x.t!=="ely"));used.add(hh.k);const B=mkBot(i,c,hh.k);B.sheet=mkSheet(c,pick(Object.keys(PREDATORS)));G.P.push(B)}
  M.hand=[dirtyCard(M)];const g=pick(GOALS);M.goal=g.id;if(g.id==="punish")M.goalX=pick(Object.keys(CLANS).filter(c=>c!==clan));
  G.phase="walk";
  addLog(`<b>Ночь 1.</b> Вы просыпаетесь в убежище «${h.name}». Город поделён: Камарилья держит ${G.start.cam} районов, анархи — ${G.start.ana}, остальные ничьи.`);
  addLog(`<b>Гонец Князя:</b> вторая ночь, 23:00 — сбор двора в Элизиуме. Князь ${G.prince.name} хочет говорить с каждым.`);
  emit("start",{})}

/* ---------- ходьба: один шаг в соседний район ---------- */
CMD.move={can:(p,a)=>free(p)||(!a.to||!nbrs(p.pos).includes(a.to)?"туда не дойти за один шаг":null),
  run:(p,a)=>{
    if(p.control!=="human"){p.pos=a.to;return}
    if(G.time>=CONFIG.nightEnd){dawn();return}
    const k=a.to;p.pos=k;advance(1);if(G.phase!=="walk")return;
    const warn=dawnWarnCheck(p,a.rush);
    const first=!p.visited.has(k),firstT=!p.visitedTonight.has(k);reveal(p,k);p.visited.add(k);p.visitedTonight.add(k);
    const h=G.city.map[k];if(first)addLog(`Вы впервые в районе «${h.name}» (${TYPES[h.t].n}).`);emit("moved",{pid:p.id,to:k,first});
    if(!a.rush&&k==="0,0"&&gatherOpen()){startCourt();return}
    if(!a.rush&&meetCheck(p))return;
    if(!a.rush&&h.t!=="ely"&&firstT&&Math.random()<CONFIG.walkEnc){const [t,x,c]=pick(STREET);p.enc={kind:"ev",h:k,e:enrichEvent(p,{t,x,c:withPass(c)}),res:null};emit("enc",{pid:p.id,kind:"street"});return}
    if(G.time===CONFIG.nightEnd-2)addLog("<b>Небо на востоке сереет.</b> Час до рассвета.");
    if(warn)return;
    if(G.time>=CONFIG.nightEnd)dawn()}};

/* ---------- действия в районе ---------- */
CMD.search={can:p=>free(p)||(here(p).t==="ely"?"в Элизиуме не осматриваются":p.searched[p.pos]===G.night?"здесь вы сегодня уже искали":null),
  run:p=>{p.searched[p.pos]=G.night;const k=p.pos;
    const tr=traceHere(p,k);if(tr&&Math.random()<.6){tr.found.push(p.id);const c=traceCard(tr);p.hand.push(c);
      p.enc={kind:"note",h:k,e:{t:"След",x:""},res:{text:`Вы находите то, что кто-то хотел спрятать: ${c.name.toLowerCase()}. Примета: ${descOf(c.clan)}.`,fx:`в руку: ${c.name}`,choice:"Осмотреться"}};emit("enc",{pid:p.id,kind:"trace"});humanSpend(p,1);return}
    const ev=enrichEvent(p,eventFor(p,k));p.enc={kind:"ev",h:k,e:ev,res:null};emit("enc",{pid:p.id,kind:"search"});humanSpend(p,1)}};
CMD.choose={can:(p,a)=>!p.enc?"выбирать не из чего":p.enc.res?"выбор уже сделан":!p.enc.e.c[a.i]?"нет такого варианта":p.enc.e.c[a.i].dis?"сейчас недоступно":null,
  run:(p,a)=>{const E=p.enc;if(E.kind==="infl")return chooseInfluence(p,a.i);if(E.kind==="meet")return chooseMeet(p,a.i);
    const ch=E.e.c[a.i];let o=ch.o,d=null,ok=null,X=null,pre="",extra="";
    if(ch.disc){const R=rouse(p);extra=R.fx;pre=ch.dx+" ";ok=true}
    else if(ch.ok){const sp=poolSpec(ch.t);const S=sureOf(p,sp);
      if(S){const n=Math.floor(S.n/2);X={d:null,ok:true,n,R:{v5:1,sure:1,label:S.label,parts:S.parts,mod:S.mod,pool:S.n,hun:0,need:2,succ:n}}}else X=check(p,sp);
      d=X.d;ok=X.ok;o=ok?ch.ok:ch.fail}
    const r=outcome(p,o,E.h);const bf=X?beastFx(p,X):"";E.res={text:pre+r.text,dice:d,roll:X&&X.R,ok,fx:[r.fx,bf,extra].filter(Boolean).join(" · "),choice:ch.t};
    if(r.tm){if(p.control==="human")advance(r.tm);else p.busy=(p.busy||0)+r.tm}
    emit("result",{pid:p.id,ok,dice:d})}};
CMD.close={can:p=>!p.enc?"нечего закрывать":p.enc.res?null:"сначала сделайте выбор",
  run:p=>{p.enc=null;
    if(p.control==="human"&&p.alarm>=CONFIG.alarmMax){endGame("lost");return}
    if(p.hunger>=CONFIG.hungerMax)beastRises(p)
    if(p.control==="human"&&G.time>=CONFIG.nightEnd)dawn()}};
CMD.hunt={can:p=>free(p)||(p.pos==="0,0"?"в Элизиуме не охотятся":null),
  run:p=>{const h=here(p);const busy=["club","res","market","theatre","rail"].includes(h.t);const X=check(p,"HUNT",(isV5()?0:1)-(threatLvl()>=6?1:0));const d=X.d,ok=X.ok;
    if(ok)p.hunger=clamp(p.hunger-(busy?2:1),0,CONFIG.hungerMax);else{p.alarm++;loudAt(p.pos,p)}
    const bf=beastFx(p,X);if(isMe(p))addLog(`Охота в «${h.name}»${X.R?` (${X.R.label}, успехов ${X.R.succ})`:` [${d.join(" ")}]`}: ${bf?bf+". ":""}${ok?(busy?"в толпе легко найти добычу. Голод −2.":"добычи мало, но хватило. Голод −1."):"вас заметили. Тревога +1."}`);
    emit("hunt",{pid:p.id,ok,dice:d});
    if(humanSpend(p,2))return;if(p.control==="human"&&p.alarm>=CONFIG.alarmMax){endGame("lost");return}
    if(p.hunger>=CONFIG.hungerMax)beastRises(p)}};
// Голод 5: Зверь рвётся наружу. В V5 его можно удержать (Самообладание + Решимость)
function beastRises(p){if(holdBeast(p)){p.hunger=CONFIG.hungerMax-1;if(isMe(p))addLog("<b>Зверь рвётся наружу</b>, но вы удерживаете его — Самообладание и Решимость. Голод 4, ненадолго.");return}
  p.hunger=2;p.alarm=clamp(p.alarm+2,0,CONFIG.alarmMax);loudAt(p.pos,p);if(isMe(p))addLog("<b>Зверь вырывается наружу.</b> Вы приходите в себя в чужом подъезде. Тревога +2.");emit("beast",{pid:p.id})}
CMD.wait={can:p=>free(p),run:p=>{if(isMe(p))addLog("Вы ждёте, наблюдая за улицей.");if(humanSpend(p,1))return;if(p.pos==="0,0"&&gatherOpen()&&p.control==="human")startCourt()}};
CMD.sleep={can:p=>free(p)||(p.pos!==p.haven?"спать можно только в убежище":null),run:p=>{G.time=CONFIG.nightEnd;dawn()}};
CMD.observe={can:p=>free(p),run:p=>{p.obs={c:p.pos,until:G.time+3};const seen=visibleTo(p,true);
  addLog(`<b>Вы наблюдаете за улицами.</b> ${seen.length?"В двух кварталах от вас: "+seen.map(b=>`${clanName(b.disguise||b.clan)} в «${dname(b.pos)}»`).join(", ")+".":"Никого из Сородичей поблизости."}`);humanSpend(p,1)}};
CMD.disguise={can:(p,a)=>free(p)||(p.clan!=="tzi"?"только Цимисхи":p.disguiseUsed===G.night?"сегодня уже было":a.clan&&(!CLANS[a.clan]||a.clan==="tzi")?"нет такого облика":null),
  run:(p,a)=>{p.disguise=a.clan;p.disguiseUsed=G.night;if(isMe(p))addLog(`<b>Чужое лицо.</b> Кости встают по-новому. До рассвета вас видят Сородичем клана ${CLANS[a.clan].name}.`);humanSpend(p,1)}};
CMD.ritual={can:(p,a)=>free(p)||(p.clan!=="tre"?"только Тремеры":p.ritualUsed===G.night?"сегодня уже было":a.k&&!p.seen.has(a.k)?"этот район вы не видите":null),
  run:(p,a)=>{const k=a.k;p.ritualUsed=G.night;p.hunger=clamp(p.hunger+1,0,CONFIG.hungerMax);p.ritual={c:k,until:G.time+2};
    const in1=G.P.filter(b=>b!==p&&b.alive&&hexDist(b.pos,k)<=1);addLog(`<b>Ритуал.</b> Кровь на стекле показывает «${dname(k)}» и соседние районы: ${in1.length?in1.map(b=>`${CLANS[b.clan].name}${b.disguise?" (под видом клана "+CLANS[b.disguise].name+")":""} в «${dname(b.pos)}»`).join(", "):"никого из Сородичей"}. Голод +1.`);
    humanSpend(p,2)}};
CMD.switchSide={can:(p,a)=>free(p)||(p.pos!==p.haven?"только в убежище":p.switched?"сторону меняют один раз за партию":a.pay==="money"&&p.money<5?"нужно 5 денег":null),
  run:(p,a)=>{if(a.pay==="money")p.money-=5;else p.status=clamp(p.status-2,0,10);
    p.fac=p.fac==="cam"?"ana":"cam";p.switched=true;if(isMe(p))addLog(`<b>Вы меняете сторону.</b> Теперь вы тайно работаете на ${p.fac==="cam"?"Камарилью":"анархов"}. Об этом знаете только вы.`);humanSpend(p,2)}};
/* влияние: единый способ для всех, кубики и ключ района */
CMD.influence={can:p=>free(p)||(!G.dist[p.pos]?"Элизиум ничей и не меняет хозяина":null),
  run:p=>{const h=here(p),R=DIST[h.t],key=R.key;const D=G.dist[p.pos];const c=[];const base=2+(p.status>=6?1:0)-(p.hunger>=4?1:0);
    const nd=(inf,m)=>isV5()?poolOf(p,inflSpec(p,inf),m).n:Math.max(1,base+m);
    if(isV5()){const S=["slum","port","market","edge","rail","ind","club"],E2=["gov","biz","theatre","uni","old","cath","res","hosp"];
      c.push({t:`Уговорами · ${nd({how:"pers"},0)} куб.`,inf:{how:"pers"}});
      if(S.includes(h.t))c.push({t:`Через людей улицы · ${nd({how:"street"},0)} куб.`,inf:{how:"street"}});
      if(E2.includes(h.t))c.push({t:`Через приличия и нужных людей · ${nd({how:"etiq"},0)} куб.`,inf:{how:"etiq"}});
      c.push({t:`Страхом · ${nd({how:"intim"},0)} куб. · при провале шум`,inf:{how:"intim"}})}
    else c.push({t:`Работать без вложений · ${nd({},0)} куб.`,inf:{}});
    if(key.card){const cs=p.hand.filter(x=>x.k===key.card&&!x.dirty&&!x.trace);if(cs.length)c.push({t:`Отдать ${KIND[key.card]} «${cs[0].name}» · ${nd({card:1},2)} куб.`,inf:{card:cs[0].id}})}
    if(key.money)c.push({t:`Заплатить ${key.money} денег · ${nd({money:1},2)} куб.`,inf:{money:key.money},dis:p.money<key.money});
    if(p.clan==="gan"&&["park","edge"].includes(h.t))c.push({t:`Пометить угодья по-звериному · ${nd({beast:1},2)} куб.`,inf:{beast:1}});
    if(p.clan==="tre"&&h.t==="cem")c.push({t:`Провести ритуал над могилами · ${nd({beast:1},2)} куб.`,inf:{beast:1}});
    p.enc={kind:"infl",h:p.pos,e:{t:`Влияние: «${h.name}»`,x:`Способ — ${R.how}. Сейчас район ${D.own?"за "+FAC[D.own].name:"ничей"}${D.own?(Math.abs(D.c)>=4?", держится прочно":", держится шатко"):""}. ${isV5()?"Успехи (6+ на d10) сдвигают район: 1–2 успеха — шаг, 3–4 — два шага":"Каждая 5–6 сдвигает район"} к вашей тайной стороне — ${p.fac==="cam"?"Камарилье":"анархам"}. Итог станет виден на рассвете, а кто вложился — нет.`,c},res:null};
    emit("enc",{pid:p.id,kind:"influence"})}};
function chooseInfluence(p,i){const E=p.enc,ch=E.e.c[i];const inf=ch.inf;let mod=0;
  if(inf.card){p.hand=p.hand.filter(x=>x.id!==inf.card);mod+=2}if(inf.money){p.money-=inf.money;mod+=2}if(inf.beast)mod+=2;
  const X=check(p,inflSpec(p,inf),mod,1);const d=X.d;const n=X.R?Math.floor((X.n+1)/2):X.n;if(n)addInfluence(p,p.pos,n,p.fac);leaveTrace(p,p.pos,p.fac);
  let fx="";if(!n&&(X.R?(X.R.bestial||inf.how==="intim"):d.includes(1))){p.alarm++;loudAt(p.pos,p);fx="Тревога +1"}else{const bf=beastFx(p,X);if(bf)fx=bf}
  E.res={dice:d,roll:X.R,ok:n>0,choice:ch.t,text:n?`Район поддаётся: ${n} ${n===1?"шаг":"шага"} к вашей стороне. Утром город увидит, к кому он склонился.`:"Ничего не вышло. Люди здесь не готовы слушать.",fx};
  emit("result",{pid:p.id,ok:n>0,dice:d});humanSpend(p,2)}
CMD.rumor={can:(p,a)=>free(p)||(!TALK.includes(here(p).t)?"слухи пускают в людных местах: бар, клуб, рынок, вокзал":!p.hand.length?"нечего рассказать":a.card&&!p.hand.some(c=>c.id===a.card)?"такой карты нет":null),
  run:(p,a)=>{const c=p.hand.find(x=>x.id===a.card);p.hand=p.hand.filter(x=>x!==c);playerRumor(p,c);
    if(isMe(p))addLog(`<b>Вы пускаете слух</b> в «${dname(p.pos)}»: ${c.name.toLowerCase()}. Никто не знает, что это вы.${p.clan==="tor"?" Тореадора слушают охотнее: слух весит вдвое.":""}`);humanSpend(p,1)}};

/* ---------- встречи с Сородичами ---------- */
function visibleTo(v,obsOnly){return G.P.filter(b=>{if(b===v||!b.alive)return false;if(b.pos===v.pos)return true;
  if(v.ritual&&G.time<=v.ritual.until&&hexDist(b.pos,v.ritual.c)<=1)return true;if(b.clan==="nos")return false;
  if(v.clan==="gan"&&hexDist(b.pos,v.pos)<=1)return true;if(v.obs&&G.time<=v.obs.until&&hexDist(b.pos,v.obs.c)<=2)return true;return false})}
function meetCheck(p){if(p.enc)return false;const b=bots().find(b=>b.alive&&b.pos===p.pos&&b.met!==G.night&&p.pos!=="0,0");if(!b)return false;if(p.clan==="nos")return false;meetScene(p,b);return true}
CMD.seek={can:(p,a)=>free(p)||(p.clan!=="nos"?"только Носферату выбирают, когда выйти из тени":!G.P.some(b=>b.id===a.bot&&b.alive&&b.pos===p.pos&&b.met!==G.night)?"здесь никого нет":null),
  run:(p,a)=>meetScene(p,actorById(a.bot))};
function meetScene(p,b){b.met=G.night;const shown=b.disguise||b.clan;const C=CLANS[shown].name;const mine=b.hand.find(c=>c.clan===p.clan&&!c.hold);
  const c=[];let x=`Навстречу выходит Сородич клана ${C}. Вы видели его в Элизиуме. ${b.exposed?"Двор знает, что он работает на анархов. ":""}`;
  if(mine&&p.money>=3&&Math.random()<.55){x+=`Он показывает вам «${mine.name}» — это про ваш клан. «Три монеты — и это останется у меня. Иначе ляжет в дело Князя».`;
    c.push({t:"Заплатить 3",m:"pay",card:mine.id});if(isV5())c.push({t:"Напомнить ему об обычаях двора",m:"etiq",card:mine.id,spec:"man+etiq"});c.push({t:"Отказать",m:"refuse",card:mine.id})}
  else{c.push({t:"Предложить обмен картами",m:"trade"});c.push({t:"Купить у него карту · 3 денег",m:"buy",dis:p.money<3});
    if(p.hand.some(x=>x.clan===b.clan))c.push({t:"Пригрозить уликой против его клана",m:"threat"});
    if(isV5()){c.push({t:"Уговорить отдать карту даром",m:"coax",spec:"cha+pers"});if(!(p.known&&p.known[b.id]))c.push({t:"Прочитать его: на кого он работает",m:"read",spec:"wit+insight"});c.push({t:"Запугать",m:"scare",spec:"cha+intim"})}
    if(p.clan==="bru")c.push({t:"Отобрать карту силой",m:"steal",roll:1,spec:"str+brawl+D:Мощь"});
    c.push({t:"Разойтись",m:"leave"})}
  p.enc={kind:"meet",h:p.pos,b:b.id,e:{t:`Сородич клана ${C}`,x,c},res:null};emit("enc",{pid:p.id,kind:"meet",bot:b.id})}
function botValue(b,card){let v=1;if(card.clan&&card.clan!==b.clan&&card.clan!=="mortal")v+=1;if(card.clan===b.clan)v+=2;if(G.case&&freeCells().some(cl=>fits(card,cl)))v+=1;return v}
function chooseMeet(p,i){const E=p.enc,ch=E.e.c[i];const b=actorById(E.b);let text="",fx="",d=null,ok=null;
  if(ch.m==="pay"){p.money-=3;const c=b.hand.find(x=>x.id===ch.card);if(c)c.hold=true;text="Он прячет карту и деньги. «Приятно иметь дело». Надолго ли его хватит — неизвестно.";fx="Деньги −3"}
  else if(ch.m==="refuse"){b.grudge+=2;text="Он пожимает плечами: «Как знаете». Теперь он ищет повод выложить эту карту в дело."}
  else if(ch.m==="trade"){p.enc=null;p.tradeWith=b.id;emit("tradeAsk",{pid:p.id,bot:b.id});return}
  else if(ch.m==="buy"){const s=b.hand.filter(c=>!c.dirty&&botValue(b,c)<=2);if(s.length){const c=pick(s);b.hand=b.hand.filter(x=>x!==c);p.hand.push(c);p.money-=3;b.money+=3;text=`Он продаёт вам «${c.name}».`;fx=`в руку: ${c.name} · Деньги −3`}else text="«Мне нечего продать. Всё, что у меня есть, пригодится самому»."}
  else if(ch.m==="threat"){const c=p.hand.find(x=>x.clan===b.clan);if(b.money>=3){b.money-=3;p.money+=3;text=`Он смотрит на «${c.name}» и молча отсчитывает три монеты.`;fx="Деньги +3"}else if(b.hand.length){const g=b.hand.filter(x=>!(x.dirty&&x.clan===b.clan));const gv=g.length?pick(g):null;if(gv){b.hand=b.hand.filter(x=>x!==gv);p.hand.push(gv);text=`Денег у него нет. Он отдаёт вам «${gv.name}».`;fx=`в руку: ${gv.name}`}else text="Ему нечем откупиться. Он запоминает ваше лицо."}b.grudge+=1}
  else if(ch.m==="steal"){const X=check(p,"str+brawl+D:Мощь",isV5()?0:1);d=X.d;ok=X.ok;E.roll=X.R;if(ok&&b.hand.length){const c=b.hand.splice(Math.floor(Math.random()*b.hand.length),1)[0];p.hand.push(c);text=`Короткая стычка в тени. «${c.name}» теперь у вас.`;fx=`в руку: ${c.name} · Тревога +1`}else{text="Он вырывается и уходит, зажимая рану.";fx="Тревога +1"}p.alarm++;loudAt(p.pos,p);b.grudge+=2}
  else if(ch.m==="etiq"){const X=check(p,"man+etiq");d=X.d;ok=X.ok;E.roll=X.R;const c=b.hand.find(x=>x.id===ch.card);
    if(ok){if(c)c.hold=true;text="Вы вполголоса напоминаете, что при дворе так не поступают — и что Князь не любит шантажистов. Он морщится и убирает карту. Пока она молчит."}
    else{b.grudge+=2;text="«Обычаи — для тех, у кого нет козырей». Он уходит, и карта уходит с ним."}}
  else if(ch.m==="coax"){const X=check(p,"cha+pers");d=X.d;ok=X.ok;E.roll=X.R;const s=b.hand.filter(c=>!c.dirty&&botValue(b,c)<=2);
    if(ok&&s.length){const c=pick(s);b.hand=b.hand.filter(x=>x!==c);p.hand.push(c);text=`Слово за слово — и он сам протягивает вам «${c.name}»: «Считайте, что вы мне должны».`;fx=`в руку: ${c.name}`}
    else if(ok)text="Он бы и рад, но отдавать ему нечего.";else{b.grudge+=1;text="Он смеётся вам в лицо: «Даром? При дворе даром только умирают»."}}
  else if(ch.m==="read"){const X=check(p,"wit+insight");d=X.d;ok=X.ok;E.roll=X.R;
    if(ok){p.known=p.known||{};p.known[b.id]=b.fac;text=`По тому, как он говорит о Князе и о Бароне, всё ясно: тайно он работает на ${b.fac==="ana"?"анархов":"Камарилью"}.`;fx="Двор: его сторона теперь видна вам"}
    else text="Его лицо ничего не выдаёт. Старые Сородичи хорошо умеют молчать."}
  else if(ch.m==="scare"){const X=check(p,"cha+intim");d=X.d;ok=X.ok;E.roll=X.R;
    if(ok){if(b.money>=2){b.money-=2;p.money+=2;text="Вы подходите на шаг ближе, чем принято. Он отступает и откупается двумя монетами.";fx="Деньги +2"}
      else{const g=b.hand.filter(x=>!(x.dirty&&x.clan===b.clan));const gv=g.length?pick(g):null;if(gv){b.hand=b.hand.filter(x=>x!==gv);p.hand.push(gv);text=`Денег у него нет. Он суёт вам «${gv.name}» и уходит быстрым шагом.`;fx=`в руку: ${gv.name}`}else text="Ему нечем откупиться, но он запомнит этот страх."}b.grudge+=1}
    else{b.grudge+=2;text="Он не из пугливых. Теперь он ищет повод вам отомстить."}}
  else text="Вы киваете друг другу и расходитесь.";
  E.res={text,fx,dice:d,roll:E.roll||null,ok,choice:ch.t};E.roll=null;emit("result",{pid:p.id,ok,dice:d})}
CMD.trade={can:(p,a)=>!p.tradeWith?"обмен не предлагали":a.cancel?null:!p.hand.some(c=>c.id===a.card)?"такой карты нет":null,
  run:(p,a)=>{const b=actorById(p.tradeWith);p.tradeWith=null;if(a.cancel||!b)return;const c=p.hand.find(x=>x.id===a.card);
    const give=b.hand.filter(x=>!(x.dirty&&x.clan===b.clan)).sort((x,y)=>botValue(b,x)-botValue(b,y))[0];
    if(!give||botValue(b,c)<botValue(b,give)&&Math.random()<.6){addLog(`Клан ${CLANS[b.clan].name} не берёт «${c.name}»: «Мне это ни к чему».`);emit("trade",{ok:false});return}
    p.hand=p.hand.filter(x=>x!==c);b.hand=b.hand.filter(x=>x!==give);p.hand.push(give);b.hand.push(c);addLog(`<b>Обмен.</b> Вы отдаёте «${c.name}» и получаете «${give.name}».`);emit("trade",{ok:true})}};

/* ---------- дело Князя: на сборе (ctx.court / ход по очереди) и между сборами в Элизиуме ---------- */
// где можно работать с делом: на сборе — только в свою очередь, вне сбора — в Элизиуме ночью
function caseCtx(p,ctx){if(!G.case)return "дела нет";if(ctx.court)return null;
  if(G.phase==="court")return courtTurnOf()===p.id?null:"сейчас говорит другой";
  return free(p)||(p.pos!=="0,0"?"дело лежит в Элизиуме":null)}
const cellOf=id=>G.case&&tplOf(G.case).cells.find(c=>c.id===id);
// какие карты подходят для команды — интерфейс берёт выбор отсюда
function cardsFor(p,name,a={}){const cell=a.cell&&cellOf(a.cell);
  if(name==="place"||name==="rewrite")return cell?p.hand.filter(c=>fits(c,cell)):[];
  if(name==="refute"){const L=cell&&leader(cell);return L?p.hand.filter(c=>(cell.key==="clan"?c.clan:c.d)!==L.key):[]}
  if(name==="alibi")return p.hand.filter(c=>c.clan===p.clan);
  if(name==="rumor"||name==="trade")return p.hand;
  return []}
const cardCheck=(p,name,a)=>{const list=cardsFor(p,name,a);if(!list.length)return "подходящих карт нет";if(a.card&&!list.some(c=>c.id===a.card))return "эта карта не подходит";return null};
function caseDone(p,ctx){if(ctx.court)return;if(G.phase==="court"){G.court.lines.push(G.log[0].t);G.court.i++;courtAdvance()}else humanSpend(p,1)}
CMD.place={can:(p,a,ctx)=>caseCtx(p,ctx)||(!cellOf(a.cell)?"нет такой ячейки":G.case.cells[a.cell]?"ячейка занята":cardCheck(p,"place",a)),
  run:(p,a,ctx)=>{casePlace(p,a.cell,a.card);caseDone(p,ctx)}};
CMD.refute={can:(p,a,ctx)=>caseCtx(p,ctx)||(!cellOf(a.cell)?"нет такой ячейки":G.case.cells[a.cell]?"ячейка занята":!leader(cellOf(a.cell))?"слуха нет":cardCheck(p,"refute",a)),
  run:(p,a,ctx)=>{caseRefute(p,a.cell,a.card);caseDone(p,ctx)}};
CMD.alibi={can:(p,a,ctx)=>caseCtx(p,ctx)||(!accusedBy(p)?"вас никто не обвиняет":cardCheck(p,"alibi",a)),
  run:(p,a,ctx)=>{caseAlibi(p,a.card);caseDone(p,ctx)}};
CMD.expose={can:(p,a,ctx)=>caseCtx(p,ctx)||(!exposeTargets(p).includes(a.clan)?"нужно два следа, ведущих к анархам":null),
  run:(p,a,ctx)=>{doExpose(p,a.clan);caseDone(p,ctx)}};
CMD.rewrite={can:(p,a)=>!G.court||G.court.phase!=="sheriff"?"переписывают после выступлений":G.sheriff!==p.id?"это право Шерифа":!G.case||!G.case.cells[a.cell]?"ячейка пуста":cardCheck(p,"rewrite",a),
  run:(p,a)=>{sheriffRewrite(p,a.cell,a.card);if(p.control==="human"){G.court.lines.push(G.log[0].t);G.court.phase="result";courtResult()}}};
CMD.pass={can:p=>courtTurnOf()===p.id?null:"сейчас не ваше слово",run:p=>{G.court.lines.push(isMe(p)?"Вы молчите.":`${Who(p)} молчит.`);G.court.i++;courtAdvance()}};
CMD.courtEnter={can:p=>free(p)||(p.pos!=="0,0"?"сбор идёт в Элизиуме":!gatherOpen()?"сейчас сбора нет":null),run:()=>startCourt()};
CMD.courtListen={can:()=>G.court&&G.court.phase==="intro"?null:"не время",run:()=>{G.court.phase="turns";courtAdvance()}};
CMD.courtSkip={can:p=>G.court&&G.court.phase==="sheriff"&&G.sheriff===p.id?null:"не время",run:()=>{G.court.phase="result";courtResult()}};
CMD.courtLeave={can:()=>G.court&&G.court.phase==="result"?null:"князь ещё не закончил",
  run:p=>{G.gathered=G.night;G.court=null;G.phase="walk";G.time=Math.min(CONFIG.nightEnd,Math.max(G.time+2,CONFIG.gTo));addLog("Двор расходится.");
    for(const b of bots())if(b.alive&&b.pos==="0,0")b.target=null;
    if(p.dead){endGame("dead");return}winByBlood()}};
CMD.nextNight={can:()=>G.phase==="day"?null:"ещё не день",run:()=>nextNight()};

/* ---------- что можно сделать прямо сейчас: интерфейс рисует кнопки из этого списка ---------- */
// need: какой выбор интерфейс должен спросить перед командой (карта, облик, район, способ оплаты)
function options(pid){const p=actorById(pid);if(!p||G.phase!=="walk"||p.enc)return [];const h=here(p);const o=[];
  const add=(cmd,label,x={})=>o.push({cmd,label,...x,reason:x.need?can(pid,cmd,{}):can(pid,cmd,x.args||{})});
  const t=homeNeed(p),left=CONFIG.nightEnd-G.time;
  if(p.pos!==p.haven)o.push({cmd:"goHome",label:`Домой · ${t*30} мин`,primary:left<=t+3,reason:null,ui:true});
  if(p.pos==="0,0"){if(isGatherNight()&&G.gathered!==G.night){if(gatherOpen())add("courtEnter","Войти в галерею",{primary:true});else if(G.time<CONFIG.gFrom)add("wait","Ждать сбора · 30 мин")}}
  else{if(!can(pid,"search"))add("search","Осмотреться · 30 мин",{primary:true});
    add("hunt","Охотиться · 1 ч");add("influence","Укрепить влияние · 1 ч");
    if(TALK.includes(h.t)&&p.hand.length)add("rumor","Пустить слух · 30 мин",{need:"card"})}
  add("observe","Наблюдать · 30 мин");
  if(p.clan==="tzi"&&p.disguiseUsed!==G.night)add("disguise","Принять чужой облик · 30 мин",{need:"clan"});
  if(p.clan==="tre"&&p.ritualUsed!==G.night)add("ritual","Ритуал: увидеть район · 1 ч",{need:"hex"});
  if(p.clan==="nos"){const hs=bots().filter(x=>x.alive&&x.pos===p.pos&&x.met!==G.night);if(hs.length&&p.pos!=="0,0")add("seek","Выйти из тени к Сородичу",{args:{bot:hs[0].id}})}
  if(p.pos===p.haven&&!p.switched)add("switchSide","Сменить тайную сторону",{need:"pay"});
  add("wait","Переждать 30 мин");
  if(p.pos===p.haven)add("sleep","Лечь спать до рассвета");
  return o.filter(x=>!x.reason||x.need)}
