
/* ============================ ИНТЕРФЕЙС ============================ */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// кубы: последние кубы по числу Голода — красные (кубы Голода), как в V5
function diceHtml(d){const hn=Math.min(M.hunger||0,d.length);return d.map((v,i)=>{const h=i>=d.length-hn;const f=v===6?"crit":v===5?"success":(h&&v===1?"skull":"blank");
  return `<img class="die${v>=5?" s":""}" src="icons/dice/${h?"hunger":"normal"}-${f}.png" alt="${v}" title="${v}${h?" · куб Голода":""}" onerror="this.replaceWith(Object.assign(document.createElement('i'),{textContent:'${v}',className:'${v>=5?"s":""}'}))">`}).join("")}
const KICON={c:"☉",i:"◆",p:"⌖"};
function cardHtml(c,btn){return `<div class="crd k-${c.k}${c.dirty&&c.clan===M.clan&&M.hand.includes(c)?" dirty":""}"><div class="crd-h"><span class="ki" title="${KIND[c.k]||"слух"}">${KICON[c.k]||"✦"}</span><b>${esc(c.name)}</b>${c.pw>1?'<span class="tag">сильная</span>':""}${c.dirty&&c.clan===M.clan&&M.hand.includes(c)?'<span class="tag bad">грязь на себя</span>':""}${c.trace?`<span class="tag">след: ${c.trace.fac==="ana"?"анархи":"двор"}</span>`:""}</div>
  <span class="hint">${KIND[c.k]||"слух"} · ${cardTags(c)}</span>${btn||""}</div>`}
function hud(){if(!G||!M||!M.clan)return "";const left=Math.max(0,CONFIG.nightEnd-G.time);const pct=(G.time-CONFIG.nightStart)/(CONFIG.nightEnd-CONFIG.nightStart)*100;
  const away=G.phase==="walk"&&M.pos!==M.haven&&!shelterAt(M,M.pos);const need=away?homeNeed(M):0;const urg=away?(left<=need+1?" crit":left<=need+4?" warn":""):"";
  return `<div class="hud${urg}"><div class="clock"><span class="big">${fmtTime(G.time)}</span><span class="hint">ночь ${G.night} из ${CONFIG.nights} · до рассвета ${hm(left)}${away?` · <b class="homeway">домой ${hm(need)}</b>`:""}</span><div class="sky"><span style="width:${pct}%"></span></div></div>
  <div class="meters"><span>Статус <b>${M.status}</b></span><span>Деньги <b>${M.money}</b></span><span>Голод <b class="pips">${"●".repeat(M.hunger)}${"○".repeat(CONFIG.hungerMax-M.hunger)}</b></span><span>Тревога <b>${M.alarm}/${CONFIG.alarmMax}</b></span><span>Карты <b>${M.hand.length}</b></span>
  <span title="Знаете только вы">Тайно за: <b style="color:${FAC[M.fac].color}">${FAC[M.fac].name}</b></span></div></div>`}
// Издание: "darkpack" — бесплатная фан-версия (GitHub Pages), "unbound" — сборка для itch.io по программе World of Darkness Unbound
const EDITION=(typeof window!=="undefined"&&window.BTD_EDITION)||"darkpack";
const NOTICE="Portions of the materials are the copyrights and trademarks of Paradox Interactive AB, and are used with permission. All rights reserved. For more information please visit worldofdarkness.com.";
function legalBadge(){return EDITION==="unbound"
  ?`<div class="gen-dp gen-ub"><img src="icons/legal/unbound.png" alt="World of Darkness Unbound"><span class="hint">Developed and published under license from Paradox Interactive. События игры не являются каноном World of Darkness.</span></div>`
  :`<div class="gen-dp hint"><img src="icons/legal/darkpack.png" alt="Dark Pack">Неофициальная фан-игра по Vampire: The Masquerade.</div>`}
function genCard(){return `<div class="card intro"><span class="eyebrow">Город строится</span><h2>Город, в котором предстоит жить вечно</h2>
  <p>Река режет его надвое. В центре — Элизиум. Часть районов держит Камарилья, часть — анархи, остальные ничьи. Каждый раз город и расклад сил собираются заново.</p>
  <p class="hint">Город №${G.seed}.</p>${legalBadge()}${G.phase==="built"?`<div class="row"><button onclick="newCity()">Другой город</button><button class="primary" onclick="act('toSetup')">Войти в город</button></div>`:'<p class="hint">Загораются огни…</p>'}</div>`}
function introCard(){const g=GOALS.find(x=>x.id===M.goal);
  return `<div class="card intro"><span class="eyebrow">Как играть</span><h2>Ночь первая</h2>
  <ul><li><b>Осматривайтесь.</b> В каждом районе — свои события. Удачный выбор даёт находку: контакт ☉, предмет ◆ или место ⌖.</li>
  <li><b>Каждую вторую ночь Князь собирает двор</b> и требует объяснить происшествие. В деле есть ячейки. Кто выше Статусом, кладёт свою находку первым. Ячейки можно заполнять и между сборами — придя в Элизиум.</li>
  <li><b>Пустые ячейки займут слухи.</b> Князь заранее говорит, какие. Слух можно пустить и самому — в баре, клубе, на рынке, вокзале.</li>
  <li><b>Тайно работайте на свою сторону:</b> «Укрепить влияние» сдвигает район к ней. Утром все видят, чей район, но не видят, кто вложился. Только следы.</li>
  <li><b>В конце побеждает тот, у кого больше Власти:</b> Статус, деньги, должность Шерифа, выполненный замысел и победа вашей стороны.</li>
  <li>До 06:00 вернитесь в убежище ⌂ — рассвет на улице почти всегда смертелен.</li></ul>
  <p><b>Ваш тайный замысел:</b> ${g.t.replace("{X}",M.goalX?CLANS[M.goalX].name:"")}</p>
  <p class="hint">В руке у вас уже есть «грязь на себя» — карта, которая указывает на ваш клан. Держите её подальше от чужих рук или используйте с умом: в конце она отнимет Власть.</p>
  <button class="primary" onclick="M.introDone=true;render()">Понятно</button></div>`}
function caseCard(active){const C=G.case;if(!C)return "";const T=tplOf(C);const P=PERSONAS[G.persona];const sev=clamp(T.sev+P.sev+Math.floor((G.night-1)/4),1,4);
  const rows=T.cells.map(cell=>{const v=C.cells[cell.id];const L=v?null:leader(cell);
    const tag=cell.k.map(k=>KICON[k]).join("");let body;
    if(v)body=`${cardHtml(v.card)}<span class="hint">положил: ${who(actorById(v.by)||{id:"?",clan:"tor"})}</span>`;
    else body=L?`<span class="rum">Слух: ${esc(L.top.txt)}${L.w>1?` <span class="hint">(×${L.w})</span>`:""}</span>`:`<span class="hint">пусто, слухов нет</span>`;
    let b="";if(active&&!v){b+=`<button ${can(ME,'place',{cell:cell.id})?"disabled":""} onclick="pickFor('place','${cell.id}')">Положить ${tag}</button>`;
      if(L){b+=`<button ${can(ME,'refute',{cell:cell.id})?"disabled":""} onclick="pickFor('refute','${cell.id}')">Оспорить слух</button>`}}
    return `<div class="cell"><div class="cell-h"><b>${cell.l}</b> <span class="hint">${tag} ${cell.who?"· обвиняемый":""}</span></div>${body}${b?`<div class="row">${b}</div>`:""}</div>`}).join("");
  const accused=accusedBy(M);const ex=active?exposeTargets(M):[];
  return `<div class="card case"><span class="eyebrow">Дело Князя · открыто в ночь ${C.opened}</span><h2>${T.t}</h2>
   <details><summary class="hint">Почему это тревожит Князя</summary><p><i>${T.why}</i></p></details>
   ${rows}
   ${active&&accused?`<div class="row"><button class="primary" ${can(ME,'alibi',{})?"disabled":""} onclick="pickFor('alibi')">Опровергнуть обвинение против вашего клана</button></div>`:""}
   ${ex.map(c=>`<div class="row"><button onclick="act('expose',{clan:'${c}'})">Разоблачить клан ${CLANS[c].name}: следы ведут к анархам</button></div>`).join("")}
   <p class="hint">Князь ждёт: сборов прошло ${C.gath} из ${P.patience}. Обвинённого ждёт: <b>${PUNISH[sev].t}</b>. Любая находка в ячейке сильнее слуха.</p></div>`}
function hereCard(){const k=UI.sel&&UI.sel!==M.pos?UI.sel:M.pos;const h=G.city.map[k];const isHere=k===M.pos;
  if(!M.seen.has(k))return `<div class="card"><h2>Туман</h2><p class="hint">Подойдите ближе.</p></div>`;
  const D=G.dist[k];const R=DIST[h.t];
  return `<div class="card here"><span class="eyebrow">${isHere?"Вы здесь":"Район"} · ${TYPES[h.t].n}</span><h2>${M.visited.has(k)?h.name:TYPES[h.t].n}</h2><p>${TYPES[h.t].d}</p>
   ${D?`<p>${D.own?`<b style="color:${FAC[D.own].color}">${FAC[D.own].name}</b> · ${Math.abs(D.c)>=4?"держится прочно":"держится шатко"}`:"<b>Ничей район</b>"}</p>
   <div class="bon"><span style="color:${FAC.cam.color}">${R.cam.g} Камарилье:</span> ${R.cam.t}<br><span style="color:${FAC.ana.color}">${R.ana.g} Анархам:</span> ${R.ana.t}</div>
   <p class="hint">Как присоединить: ${R.how}${R.key.card?`, ключ — ${KIND[R.key.card]}`:""}${R.key.money?`, ключ — ${R.key.money} денег`:""}. Как теряют: ${R.lose}.</p>`:`<p class="hint">Нейтральная земля двора. Здесь лежит дело Князя.</p>`}
   ${k===M.haven?'<p class="hint">Ваше убежище.</p>':""}
   ${!isHere&&G.phase==="walk"?(()=>{const p=bfs(M.pos,k,M.seen);return p?`<button class="primary" onclick="walkTo('${k}')">Идти сюда · ${p.length*30} мин</button>`:""})():""}</div>`}
// кнопки действий — из options(): движок говорит, что доступно, сколько стоит и что нужно выбрать
function actionsCard(){if(G.phase!=="walk"||M.enc||UI.pick)return "";const t=homeNeed(M),left=CONFIG.nightEnd-G.time;
  const b=options(ME).map((o,n)=>`<button class="${o.primary?"primary":""}" onclick="doOption(${n})">${o.label}</button>`);
  return `<div class="card"><div class="row">${b.join("")}</div><p class="hint">Шаг в соседний район — 30 минут.${left<=t+3&&M.pos!==M.haven?' <b style="color:var(--blood)">Пора домой: рассвет на улице может стать последним.</b>':""}</p></div>`}
function encCard(){const E=M.enc;if(!E)return "";const h=G.city.map[E.h];
  if(E.res)return `<div class="enc"><span class="eyebrow">${h.name}</span><h2>${E.e.t}</h2><p class="hint">${esc(E.res.choice)}</p>
    ${E.res.dice?`<p class="dice">${diceHtml(E.res.dice)} <span class="hint">${E.res.ok?"удача":"неудача"}</span></p>`:""}
    <p>${E.res.text}</p>${E.res.fx?`<p class="fx">${E.res.fx}</p>`:""}<button class="primary" onclick="act('close')">Дальше</button></div>`;
  return `<div class="enc"><span class="eyebrow">${h.name}${E.kind==="ev"?" · осмотр":""}</span><h2>${E.e.t}</h2><p>${E.e.x}</p>
   <div class="choices">${E.e.c.map((c,i)=>`<button ${c.dis?"disabled":""} onclick="act('choose',{i:${i}})">${c.t}${c.ok||c.roll?' <span class="risk">бросок</span>':""}</button>`).join("")}</div></div>`}
// выбор перед командой: карты для выбора даёт движок (cardsFor), интерфейс только показывает
function pickFor(cmd,cell){UI.pick={mode:cmd,cell};render()}
function pickCard(){const P=UI.pick;if(!P)return "";let title="",extra="";
  if(P.mode==="switchSide")return `<div class="enc"><h2>Сменить тайную сторону</h2><p>Сейчас вы работаете на ${FAC[M.fac].name}. Сменить можно один раз за партию. Вклад в прежнюю сторону останется, но засчитывается только нынешняя.</p>
    <div class="choices"><button ${can(ME,"switchSide",{pay:"money"})?"disabled":""} onclick="UI.pick=null;act('switchSide',{pay:'money'})">Заплатить 5 денег</button><button onclick="UI.pick=null;act('switchSide',{pay:'status'})">Потерять 2 Статуса</button><button onclick="UI.pick=null;render()">Передумать</button></div></div>`;
  if(P.mode==="disguise")return `<div class="enc"><h2>Чужое лицо</h2><p>До рассвета на карте и в слухах вас будут видеть Сородичем другого клана.</p><div class="choices">${Object.keys(CLANS).filter(c=>!can(ME,"disguise",{clan:c})).map(c=>`<button onclick="UI.pick=null;act('disguise',{clan:'${c}'})"><b style="color:${CLANS[c].color}">${CLANS[c].name}</b></button>`).join("")}<button onclick="UI.pick=null;render()">Передумать</button></div></div>`;
  const cell=P.cell&&cellOf(P.cell);const list=cardsFor(M,P.mode,{cell:P.cell});
  if(P.mode==="rumor"){title="Какую находку пустить слухом";extra="Карта уйдёт из руки и станет слухом в городе. Анонимно."}
  if(P.mode==="trade"){title="Что предложить в обмен";extra="Сородич отдаст взамен то, что ему нужно меньше всего."}
  if(P.mode==="place"){title=`Что положить в «${cell.l}»`;extra=cell.who?"Эта ячейка называет обвиняемого — по клану на карте.":""}
  if(P.mode==="refute"){title=`Чем оспорить слух в «${cell.l}»`;extra="Карта уйдёт в дело как алиби. Все слухи этой версии перестанут считаться."}
  if(P.mode==="alibi"){title="Чем опровергнуть обвинение";extra="Нужна карта, связанная с вашим кланом. Обвинитель потеряет 2 Статуса."}
  if(P.mode==="rewrite"){title=`Чем Шериф заменит «${cell.l}»`}
  const cancel=P.mode==="trade"?"UI.pick=null;act('trade',{cancel:true})":"UI.pick=null;render()";
  return `<div class="enc"><h2>${title}</h2>${extra?`<p class="hint">${extra}</p>`:""}<div class="choices">${list.map(c=>cardHtml(c,`<button onclick="pickDone('${c.id}')">Выбрать</button>`)).join("")||'<p class="hint">Подходящих карт нет.</p>'}
    <button onclick="${cancel}">Отмена</button></div></div>`}
function pickDone(card){const P=UI.pick;UI.pick=null;act(P.mode,{cell:P.cell,card})}
function handCard(){return `<details class="card" ${M.hand.length<=6?"open":""}><summary><h2 style="display:inline">Находки</h2> <span class="tag">${M.hand.length}</span></summary>
  ${M.hand.length?`<div class="hand">${M.hand.map(c=>cardHtml(c)).join("")}</div>`:'<p class="hint">Осматривайте районы — находки появятся здесь.</p>'}</details>`}
function summonsCard(){if(!isGatherNight()||G.gathered===G.night||M.enc||UI.pick)return "";const p=bfs(M.pos,"0,0",M.seen);const t=p?p.length:0;const late=G.time+t>CONFIG.gTo;
  return `<div class="card intro"><span class="eyebrow">Сбор двора</span><h2>Князь ждёт в Элизиуме</h2><p>С 23:00 до 01:00. ${G.case?"Дело «"+tplOf(G.case).t+"» ещё открыто.":"Князь откроет новое дело."} Не прийти — Статус −1, и за вас никто не скажет ни слова.</p>
   ${M.pos==="0,0"?"":`<button class="${late?"":"primary"}" onclick="walkTo('0,0')">Идти в Элизиум · ${t*30} мин</button>`}${late&&M.pos!=="0,0"?'<p class="hint" style="color:var(--blood)">Вы уже не успеваете.</p>':""}</div>`}
function rivalsCard(){return `<details class="card" open><summary><h2 style="display:inline">Двор</h2></summary><ul>
  ${bots().map(b=>`<li><b style="color:${CLANS[b.clan].color}">${CLANS[b.clan].name}</b> — ${b.alive?`Статус ${b.status}, находок ${b.hand.length}${G.sheriff===b.id?" · <b>Шериф</b>":""}${b.exposed?' · <span style="color:var(--blood)">разоблачён: анархи</span>':""}`:"погиб"}</li>`).join("")}
  <li><b>Вы</b> — Статус ${M.status}${G.sheriff===ME?" · <b>Шериф</b>":""}${M.exposed?' · <span style="color:var(--blood)">разоблачены</span>':""}</li></ul>
  <p class="hint">Камарилья держит ${countOwn("cam")} районов (в начале ${G.start.cam}), анархи — ${countOwn("ana")} (в начале ${G.start.ana}). Побеждает сторона, которая отыграла больше от начала.</p>
  <p class="hint">Ваш замысел: ${GOALS.find(x=>x.id===M.goal).t.replace("{X}",M.goalX?CLANS[M.goalX].name:"")}</p></details>`}
function journalCard(){return `<details class="card"><summary><h2 style="display:inline">Дневник</h2></summary><div class="log">${G.log.slice(0,60).map(l=>`<div><span class="n">Н${l.n} ${l.time}</span> ${l.t}</div>`).join("")}</div></details>`}
function dayCard(){return `<div class="card intro"><span class="eyebrow">День</span><h2>Вы спите</h2><p>${["Город живёт без вас: газеты печатают вчерашнее, полиция пишет рапорты.","Днём патрули ездят чаще обычного.","Сквозь сон вы слышите сирены.","Днём город не спит из-за вас: облавы, листовки, люди в штатском."][threatTier()]}</p>
  ${M.dayNote?`<p>${M.dayNote}</p>`:""}<div class="row"><button class="primary" onclick="act('nextNight')">Ночь ${G.night+1}</button></div></div>`}
function endCard(){const F=G.final||facWinner();const rows=G.P.map(a=>({a,s:scoreOf(a,F.w)})).sort((x,y)=>y.s.total-x.s.total);const mine=rows.findIndex(r=>isMe(r.a));
  const head={done:"Двенадцать ночей прошло",lost:"Маскарад рухнул",dead:"Окончательная смерть",blood:"Вы остались одни"}[G.result]||"Конец";
  return `<div class="card intro"><span class="eyebrow">Итог партии</span><h2>${head}</h2>
   ${G.result==="dead"?`<p>${M.deathText||"Князь привёл приговор в исполнение."}</p>`:""}${G.result==="lost"?"<p>Слишком много людей видели слишком много. Князь отрекается от вас, и Шериф приходит до рассвета.</p>":""}
   ${G.result==="blood"?"<p>Все соперники мертвы. Город принадлежит вам — по праву того, кто последним остался в живых.</p>":""}
   ${G.result==="done"?`<p>${F.w?`<b>Город за ${F.w==="cam"?"Камарильей":"анархами"}.</b>`:"<b>Ни одна сторона не взяла верх.</b>"} Камарилья ${F.dc>=0?"+":""}${F.dc}, анархи ${F.da>=0?"+":""}${F.da} районов от начала.</p>
   <p><b>${mine===0?"Вы побеждаете.":"Побеждает "+(isMe(rows[0].a)?"вы":"клан "+CLANS[rows[0].a.clan].name)+"."}</b></p>
   <ul>${rows.map(r=>`<li><b>${isMe(r.a)?"Вы":CLANS[r.a.clan].name}</b> (тайно: ${FAC[r.a.fac].name}) — Власть ${r.s.total}<br><span class="hint">${r.s.parts.join(", ")}</span></li>`).join("")}</ul>`:""}
   <h3>Дела Князя</h3><ul>${G.casesDone.map(c=>`<li>«${c.t}», ночь ${c.night}: обвинён ${clanName(c.accused)}${c.accused===c.truth?" — и это правда":`, а на самом деле — ${clanName(c.truth)}`}.</li>`).join("")||"<li>Ни одно дело не закрыто.</li>"}</ul>
   <div class="row"><button class="primary" onclick="newCity()">Новый город</button><button onclick="newCity(G.seed)">Этот же город</button></div></div>`}
