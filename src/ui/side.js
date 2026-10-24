
/* ============================ ИНТЕРФЕЙС «НОЧНОЙ ОПЕРАТИВНЫЙ ЦЕНТР» ============================
   Сверху — компактная строка: время, ночь, показатели. Справа — панель с вкладками
   Досье / Находки / Двор / Дневник: срочное обязательство, активное дело, район.
   Снизу — панель действий (что можно сделать сейчас и сколько это стоит) и последние находки.
   Цвета строго по смыслу: золото — действие и обязательство, тёмно-красный — опасность,
   холодный серо-синий — справка, слоновая кость — заголовки. */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// кубы: последние кубы по числу Голода — красные (кубы Голода), как в V5
function diceHtml(d,R){const hn=R?R.hun:Math.min(M.hunger||0,d.length);const v5=!!R;
  return d.map((v,i)=>{const h=i>=d.length-hn;const top=v5?10:6,good=v5?6:5;const f=v===top?"crit":v>=good?"success":(h&&v===1?"skull":"blank");
  return `<img class="die${v>=good?" s":""}" src="icons/dice/${h?"hunger":"normal"}-${f}.png" alt="${v}" title="${v}${h?" · куб Голода":""}" onerror="this.replaceWith(Object.assign(document.createElement('i'),{textContent:'${v}',className:'${v>=good?"s":""}'}))">`}).join("")}
// подпись броска V5: из чего собран пул и чем кончилось
function rollHtml(R,ok){if(!R)return "";const head=R.parts.map(x=>`${x[0]} <b>${x[1]}</b>`).join(" + ")+(R.mod?` ${R.mod>0?"+":"−"} <b>${Math.abs(R.mod)}</b>`:"");
  const verdict=R.messy?"грязный критический":R.crit&&ok?"критический успех":R.bestial?"звериный провал":ok?"успех":"провал";
  return `<div class="roll5"><span class="r5-pool">${head} = <b>${R.pool}</b> ${R.pool===1?"куб":R.pool<5?"куба":"кубов"}${R.hun?` · из них Голода ${R.hun}`:""}</span><span class="r5-res${ok?" ok":" bad"}${R.messy||R.bestial?" beast":""}">${R.succ} из ${R.need} · ${verdict}</span></div>`}
// подпись варианта: сколько кубов и какой пул
function poolTag(E,ch){if(!isV5())return "";const sp=choiceSpec(M,E,ch);if(!sp)return "";const P=poolOf(M,sp,0);return `<span class="r5-tag">${P.label}${E.kind==="infl"?"":" · "+P.n}</span>`}
const KICON={c:"☉",i:"◆",p:"⌖"};
/* ---------- значки (линии, 24×24) ---------- */
const ICO={
  home:"M4 11l8-7 8 7v9h-5v-6H9v6H4z",search:"M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5L20 20",
  drop:"M12 3c4 5 6 8.5 6 11.5a6 6 0 0 1-12 0C6 11.5 8 8 12 3z",flag:"M6 21V4m0 0h11l-2.5 4L17 12H6",
  talk:"M4 5h16v10H10l-5 4v-4H4z",eye:"M2 12s4-6.5 10-6.5S22 12 22 12s-4 6.5-10 6.5S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  mask:"M4 6c5 2 11 2 16 0 0 7-3 12-8 12S4 13 4 6zM8 10.5h2.5M13.5 10.5H16",ritual:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 6.5l1.7 3.8 4.1.4-3.1 2.8.9 4-3.6-2.1-3.6 2.1.9-4-3.1-2.8 4.1-.4z",
  shadow:"M12 4a3.2 3.2 0 1 0 0 6.4A3.2 3.2 0 0 0 12 4zM5.5 20c0-4 3-7 6.5-7s6.5 3 6.5 7",swap:"M4 8h14l-3.5-3.5M20 16H6l3.5 3.5",
  clock:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5V12l3 2",moon:"M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z",
  crown:"M4 18h16M5 18L4 8l5 4 3-6 3 6 5-4-1 10",doc:"M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5",people:"M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 19c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.5a3 3 0 0 1 0 5.5M17.5 13.5c2 .8 3.5 2.8 3.5 5.5",
  book:"M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14",cards:"M7 4h10v14H7zM4 7v13h11",pin:"M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  arrow:"M5 12h14M13 6l6 6-6 6",menu:"M5 12h.01M12 12h.01M19 12h.01",warn:"M12 4l9 16H3zM12 10v4M12 17v.5",x:"M6 6l12 12M18 6L6 18"};
const ico=(n,c="")=>`<svg class="ico${c?" "+c:""}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICO[n]||ICO.doc}"/></svg>`;
const DROP='<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M6 1c2.6 3.4 4 5.6 4 7.6a4 4 0 0 1-8 0C2 6.6 3.4 4.4 6 1z"/></svg>';
/* ---------- находка: миниатюра + имя ---------- */
const KART={c:"art/k_c.webp",i:"art/k_i.webp",p:"art/k_p.webp"};
const kimg=k=>KART[k]||"art/k_r.webp";
function cardHtml(c,btn){const dirty=c.dirty&&c.clan===M.clan&&M.hand.includes(c);
  return `<div class="crd k-${c.k}${dirty?" dirty":""}"><span class="crd-i" style="background-image:url(${kimg(c.k)})"><i>${KICON[c.k]||"✦"}</i></span><div class="crd-b"><b>${esc(c.name)}</b><span class="crd-k">${KIND[c.k]||"слух"}${c.pw>1?" · сильная":""}</span><span class="crd-t">${cardTags(c)}</span>
  ${dirty||c.trace?`<span class="crd-x">${dirty?'<span class="tag bad">грязь на себя</span>':""}${c.trace?`<span class="tag">след: ${c.trace.fac==="ana"?"анархи":"двор"}</span>`:""}</span>`:""}${btn||""}</div></div>`}
/* ---------- верхняя строка ---------- */
function hud(){if(!G||!M||!M.clan)return "";const left=Math.max(0,CONFIG.nightEnd-G.time);const pct=clamp((G.time-CONFIG.nightStart)/(CONFIG.nightEnd-CONFIG.nightStart)*100,0,100);
  const away=G.phase==="walk"&&M.pos!==M.haven&&!shelterAt(M,M.pos);const need=away?homeNeed(M):0;const urg=away?(left<=need+1?" crit":left<=need+4?" warn":""):"";
  const al=M.alarm/CONFIG.alarmMax;
  return `<div class="hud${urg}"><div class="clock"><span class="big">${fmtTime(G.time)}</span><span class="nt"><b>Ночь ${G.night} из ${CONFIG.nights}</b><span>до рассвета ${hm(left)}${away?` · <b class="homeway">домой ${hm(need)}</b>`:""}</span></span>
   <div class="sky" aria-hidden="true"><span style="left:${pct}%"></span></div></div>
  <div class="meters"><span class="m"><i>Статус</i><b>${M.status}</b></span><span class="m"><i>Деньги</i><b>${M.money}</b></span>
   <span class="m" title="Голод ${M.hunger} из ${CONFIG.hungerMax}"><i>Голод</i><b class="drops">${Array.from({length:CONFIG.hungerMax},(_,i)=>`<span class="${i<M.hunger?"on":""}">${DROP}</span>`).join("")}</b></span>
   <span class="m${al>=.7?" bad":al>=.4?" warn":""}"><i>Тревога</i><b>${M.alarm}/${CONFIG.alarmMax}</b></span><span class="m"><i>Находки</i><b>${M.hand.length}</b></span>
   <span class="m" title="Знаете только вы"><i>Тайно за</i><b style="color:${FAC[M.fac].color}">${FAC[M.fac].name}</b></span></div></div>`}
// Издание: "darkpack" — бесплатная фан-версия (GitHub Pages), "unbound" — сборка для itch.io по программе World of Darkness Unbound
const EDITION=(typeof window!=="undefined"&&window.BTD_EDITION)||"darkpack";
const NOTICE="Portions of the materials are the copyrights and trademarks of Paradox Interactive AB, and are used with permission. All rights reserved. For more information please visit worldofdarkness.com.";
function legalBadge(){return EDITION==="unbound"
  ?`<div class="gen-dp gen-ub"><img src="icons/legal/unbound.png" alt="World of Darkness Unbound"><span class="hint">Developed and published under license from Paradox Interactive. События игры не являются каноном World of Darkness.</span></div>`
  :`<div class="gen-dp hint"><img src="icons/legal/darkpack.png" alt="Dark Pack">Неофициальная фан-игра по Vampire: The Masquerade.</div>`}
/* ---------- общие блоки панели ---------- */
// pn — панель; tone: gold (обязательство), red (опасность), info (справка); art — фоновая картинка справа
const pn=(tone,eye,eyeIco,title,body,art)=>`<section class="pn${tone?" "+tone:""}${art?" has-art":""}">${art?`<span class="pn-art" style="background-image:url(${art})"></span>`:""}
  <div class="pn-in">${eye?`<span class="eyebrow">${eyeIco?ico(eyeIco):""}${eye}</span>`:""}${title?`<h2>${title}</h2>`:""}${body}</div></section>`;
const goBtn=(label,on,cls="go")=>`<button class="${cls}" onclick="${on}"><span>${label}</span>${ico("arrow")}</button>`;
function genCard(){const ready=UI.reveal==="ready";return pn("gold","Ночь первая · город №"+G.seed,"moon","Город, в котором предстоит жить вечно",`<p>Река режет его надвое. В центре — Элизиум. Часть районов держит Камарилья, часть — анархи, остальные ничьи. Каждый раз город и расклад сил собираются заново.</p>
  <p class="own">Вы — <b style="color:${CLANS[M.clan].color}">${CLANS[M.clan].name}</b>, тайно за <b style="color:${FAC[M.fac].color}">${FAC[M.fac].name}</b>.</p>
  ${legalBadge()}${ready?goBtn("Начать ночь","endReveal()"):'<p class="hint">Загораются огни…</p>'}`,"art/ev_old.webp")}
function introCard(){const g=GOALS.find(x=>x.id===M.goal);
  return pn("gold","Как играть","book","Ночь первая",`<ul class="how"><li><b>Осматривайтесь.</b> В каждом районе — свои события. Удачный выбор даёт находку: контакт ☉, предмет ◆ или место ⌖.</li>
  <li><b>Каждую вторую ночь Князь собирает двор</b> и требует объяснить происшествие. В деле есть ячейки. Кто выше Статусом, кладёт свою находку первым. Ячейки можно заполнять и между сборами — придя в Элизиум.</li>
  <li><b>Пустые ячейки займут слухи.</b> Князь заранее говорит, какие. Слух можно пустить и самому — в баре, клубе, на рынке, вокзале.</li>
  <li><b>Тайно работайте на свою сторону:</b> «Укрепить влияние» сдвигает район к ней. Утром все видят, чей район, но не видят, кто вложился. Только следы.</li>
  <li><b>В конце побеждает тот, у кого больше Власти:</b> Статус, деньги, должность Шерифа, выполненный замысел и победа вашей стороны.</li>
  <li>До 06:00 вернитесь в убежище ⌂ — рассвет на улице почти всегда смертелен.</li></ul>
  <p><b>Ваш тайный замысел:</b> ${g.t.replace("{X}",M.goalX?CLANS[M.goalX].name:"")}</p>
  <p class="hint">В руке у вас уже есть «грязь на себя» — карта, которая указывает на ваш клан. Держите её подальше от чужих рук или используйте с умом: в конце она отнимет Власть.</p>
  ${goBtn("Понятно","M.introDone=true;render()")}`)}
/* ---------- активное дело: ячейки — карточки улик ---------- */
function caseCard(active){const C=G.case;if(!C)return "";const T=tplOf(C);const P=PERSONAS[G.persona];const sev=clamp(T.sev+P.sev+Math.floor((G.night-1)/4),1,4);
  const filled=T.cells.filter(c=>C.cells[c.id]).length;
  const tiles=T.cells.map(cell=>{const v=C.cells[cell.id];const L=v?null:leader(cell);const tag=cell.k.map(k=>KICON[k]).join("");
    let b="";if(active&&!v){b+=`<button class="t-btn" ${can(ME,'place',{cell:cell.id})?"disabled":""} onclick="pickFor('place','${cell.id}')">Положить ${tag}</button>`;
      if(L)b+=`<button class="t-btn ghost" ${can(ME,'refute',{cell:cell.id})?"disabled":""} onclick="pickFor('refute','${cell.id}')">Оспорить</button>`}
    let face;
    if(v){const a=actorById(v.by)||{id:"?",clan:"tor"};face=`<span class="t-img" style="background-image:url(${kimg(v.card.k)})"></span><span class="t-n">${esc(v.card.name)}</span><span class="t-k">${KIND[v.card.k]||"слух"} · ${isMe(a)?"ваша":CLANS[a.clan].name}</span>`}
    else if(L)face=`<span class="t-img rum" style="background-image:url(${kimg()})"></span><span class="t-n rum">«${esc(L.top.txt)}»</span><span class="t-k">слух${L.w>1?` ×${L.w}`:""}</span>`;
    else face=`<span class="t-img empty">${tag}</span><span class="t-n dim">пусто</span><span class="t-k">слухов нет</span>`;
    return `<div class="tile-c${v?" full":L?" rum":" empty"}${cell.who?" who":""}"><span class="t-l">${cell.l}${cell.who?' <em>обвиняемый</em>':""}</span>${face}${b?`<span class="t-a">${b}</span>`:""}</div>`}).join("");
  const accused=accusedBy(M);const ex=active?exposeTargets(M):[];
  return pn("","Активное дело · ночь "+C.opened,"doc",T.t,`<p class="st"><span class="dot${C.gath>=P.patience-1?" bad":""}"></span>Открыто · ${filled} из ${T.cells.length} ячеек заполнены${active?" · вы в Элизиуме":""}</p>
   <div class="tiles">${tiles}</div>
   ${active&&accused?`<button class="go" ${can(ME,'alibi',{})?"disabled":""} onclick="pickFor('alibi')"><span>Опровергнуть обвинение против вашего клана</span>${ico("arrow")}</button>`:""}
   ${ex.map(c=>`<button class="danger" onclick="act('expose',{clan:'${c}'})">Разоблачить клан ${CLANS[c].name}: следы ведут к анархам</button>`).join("")}
   <details class="more"><summary>Почему это тревожит Князя</summary><p><i>${T.why}</i></p></details>
   <p class="hint">Князь ждёт: сборов ${C.gath} из ${P.patience}. Обвинённого ждёт: <b class="red">${PUNISH[sev].t}</b>. Находка в ячейке сильнее любого слуха.</p>`,"art/ev_cath.webp")}
/* ---------- район: где вы или куда смотрите ---------- */
function hereCard(){const k=UI.sel&&UI.sel!==M.pos?UI.sel:M.pos;const h=G.city.map[k];const isHere=k===M.pos;
  if(!M.seen.has(k))return pn("info","Район","pin","Туман",`<p class="hint">Подойдите ближе.</p>`);
  const D=G.dist[k];const R=DIST[h.t];const art=`art/ev_${SCENE_ART[h.t]||"res"}.webp`;
  const own=D?(D.own?`<b style="color:${FAC[D.own].color}">${FAC[D.own].name}</b> · ${Math.abs(D.c)>=4?"держится прочно":"держится шатко"}`:"<b>Ничей район</b>"):"Нейтральная земля двора";
  return pn("info",(isHere?"Вы здесь":"Район")+" · "+TYPES[h.t].n,"pin",M.visited.has(k)?h.name:TYPES[h.t].n,`<p>${TYPES[h.t].d}</p><p class="own">${own}${k===M.haven?' · <b class="gold">ваше убежище</b>':""}</p>
   ${D?`<details class="more"><summary>Что даёт район и как его взять</summary><div class="bon"><span style="color:${FAC.cam.color}">${R.cam.g} Камарилье:</span> ${R.cam.t}<br><span style="color:${FAC.ana.color}">${R.ana.g} Анархам:</span> ${R.ana.t}</div>
   <p class="hint">Как присоединить: ${R.how}${R.key.card?`, ключ — ${KIND[R.key.card]}`:""}${R.key.money?`, ключ — ${R.key.money} денег`:""}. Как теряют: ${R.lose}.</p></details>`:`<p class="hint">Здесь лежит дело Князя.</p>`}
   ${!isHere&&G.phase==="walk"?(()=>{const p=bfs(M.pos,k,M.seen);return p?goBtn(`Идти сюда · ${p.length*30} мин`,`walkTo('${k}')`):""})():""}`,art)}
/* ---------- срочное: сбор двора и рассвет ---------- */
function summonsCard(){if(!isGatherNight()||G.gathered===G.night||M.enc||UI.pick)return "";const p=bfs(M.pos,"0,0",M.seen);const t=p?p.length:0;const late=G.time+t>CONFIG.gTo;
  return pn("gold","Обязательство двора","crown","Князь ждёт в Элизиуме",`<p>Сбор с 23:00 до 01:00. ${G.case?"Дело «"+tplOf(G.case).t+"» ещё открыто.":"Князь откроет новое дело."} Не прийти — Статус −1, и за вас никто не скажет ни слова.</p>
   ${M.pos==="0,0"?(options(ME).some(o=>o.cmd==="courtEnter")?goBtn("Войти в галерею","act('courtEnter')"):'<p class="hint">Вы в Элизиуме. Сбор начнётся в 23:00.</p>'):late?'<p class="red">Вы уже не успеваете.</p>':goBtn(`Идти в Элизиум · ${t*30} мин`,"walkTo('0,0')")}`,"art/ev_ely.webp")}
function dawnCard(){if(G.phase!=="walk"||M.enc||UI.pick||M.pos===M.haven||shelterAt(M,M.pos))return "";const left=CONFIG.nightEnd-G.time,need=homeNeed(M);if(left>need+4)return "";
  return pn("red","Рассвет близко","warn",left<=need+1?"Солнце вот-вот взойдёт":"Пора возвращаться",`<p>До рассвета ${hm(left)}, дорога до убежища — ${hm(need)}.</p>${goBtn("Домой сейчас","goHome()","go red")}`)}
/* ---------- нижняя панель: действия и находки ---------- */
const OPT_ICO={goHome:"home",search:"search",hunt:"drop",influence:"flag",rumor:"talk",observe:"eye",disguise:"mask",ritual:"ritual",seek:"shadow",switchSide:"swap",wait:"clock",sleep:"moon",courtEnter:"crown"};
const OPT_SUB={goHome:"В убежище",search:"Найти улики",hunt:"Утолить Голод",influence:"Сдвинуть район",rumor:"Анонимно",observe:"Кто рядом",disguise:"Цимисх",ritual:"Тремер",seek:"Носферату",switchSide:"Один раз",wait:"Время идёт",sleep:"До заката",courtEnter:"Сбор двора"};
// короткие подписи для кнопок; полная — во всплывающей подсказке
const OPT_NAME={goHome:"Домой",search:"Осмотр",hunt:"Охота",influence:"Влияние",rumor:"Слух",observe:"Наблюдать",disguise:"Чужой облик",ritual:"Ритуал",seek:"Выйти из тени",switchSide:"Сменить сторону",wait:"Ждать",sleep:"Спать",courtEnter:"В галерею"};
// второстепенное прячем в «Ещё», чтобы главные действия и находки помещались в одну строку
const isMinor=o=>!o.primary&&(o.cmd==="observe"||o.cmd==="switchSide"||(o.cmd==="wait"&&!/сбора/.test(o.label))||(o.cmd==="sleep"&&M.pos!==M.haven));
function actBtn(o,n,cls="act"){const parts=o.label.split(" · ");const time=parts[1]||(o.cmd==="wait"?"30 мин":"");
  const name=o.cmd==="wait"&&/сбора/.test(o.label)?"Ждать сбора":OPT_NAME[o.cmd]||parts[0];
  return `<button class="${cls}${o.primary?" pri":""}" onclick="UI.more=false;doOption(${n})" title="${esc(o.label)}">${ico(OPT_ICO[o.cmd]||"clock")}<span class="a-t"><b>${name}</b><span>${time?ico("clock","s")+time:(OPT_SUB[o.cmd]||"")}</span></span></button>`}
function barHtml(){if(!G||!M||G.phase!=="walk"||M.enc||UI.pick||UI.ritualMode||UI.reveal)return "";
  const all=options(ME).map((o,n)=>({o,n}));const main=all.filter(x=>!isMinor(x.o)),minor=all.filter(x=>isMinor(x.o));
  const finds=M.hand.slice(-8).reverse();
  return `<div class="acts" role="group" aria-label="Действия">${main.map(x=>actBtn(x.o,x.n)).join("")}
   ${minor.length?`<div class="more-w"><button class="act more-b${UI.more?" on":""}" aria-expanded="${!!UI.more}" onclick="UI.more=!UI.more;render()">${ico("menu")}<span class="a-t"><b>Ещё</b><span>${minor.length} действ.</span></span></button>
   ${UI.more?`<div class="more-m">${minor.map(x=>actBtn(x.o,x.n,"act wide")).join("")}</div>`:""}</div>`:""}</div>
   <div class="finds"><button class="f-h" onclick="setTab('finds')"><span>Находки</span><b>${M.hand.length}</b></button><div class="f-row">${finds.map(c=>`<button class="f-c" onclick="setTab('finds')" title="${esc(c.name)} · ${KIND[c.k]||"слух"} · ${esc(cardTags(c))}"><span class="f-i" style="background-image:url(${kimg(c.k)})"></span><span class="f-t"><i>${KIND[c.k]||"слух"}</i><b>${esc(c.name)}</b></span></button>`).join("")||'<span class="hint">Пока пусто</span>'}</div></div>`}
/* ---------- выбор перед командой ---------- */
// выбор перед командой: карты для выбора даёт движок (cardsFor), интерфейс только показывает
function pickFor(cmd,cell){UI.pick={mode:cmd,cell};UI.tab="dossier";render()}
function pickCard(){const P=UI.pick;if(!P)return "";let title="",extra="";
  const back=`<button class="ghost" onclick="UI.pick=null;render()">Передумать</button>`;
  if(P.mode==="switchSide")return pn("gold","Выбор","swap","Сменить тайную сторону",`<p>Сейчас вы работаете на ${FAC[M.fac].name}. Сменить можно один раз за партию. Вклад в прежнюю сторону останется, но засчитывается только нынешняя.</p>
    <div class="choices"><button class="opt" ${can(ME,"switchSide",{pay:"money"})?"disabled":""} onclick="UI.pick=null;act('switchSide',{pay:'money'})">Заплатить 5 денег</button><button class="opt" onclick="UI.pick=null;act('switchSide',{pay:'status'})">Потерять 2 Статуса</button>${back}</div>`);
  if(P.mode==="disguise")return pn("gold","Выбор","mask","Чужое лицо",`<p>До рассвета на карте и в слухах вас будут видеть Сородичем другого клана.</p><div class="choices">${Object.keys(CLANS).filter(c=>!can(ME,"disguise",{clan:c})).map(c=>`<button class="opt" onclick="UI.pick=null;act('disguise',{clan:'${c}'})"><b style="color:${CLANS[c].color}">${CLANS[c].name}</b></button>`).join("")}${back}</div>`);
  const cell=P.cell&&cellOf(P.cell);const list=cardsFor(M,P.mode,{cell:P.cell});
  if(P.mode==="rumor"){title="Какую находку пустить слухом";extra="Карта уйдёт из руки и станет слухом в городе. Анонимно."}
  if(P.mode==="trade"){title="Что предложить в обмен";extra="Сородич отдаст взамен то, что ему нужно меньше всего."}
  if(P.mode==="place"){title=`Что положить в «${cell.l}»`;extra=cell.who?"Эта ячейка называет обвиняемого — по клану на карте.":""}
  if(P.mode==="refute"){title=`Чем оспорить слух в «${cell.l}»`;extra="Карта уйдёт в дело как алиби. Все слухи этой версии перестанут считаться."}
  if(P.mode==="alibi"){title="Чем опровергнуть обвинение";extra="Нужна карта, связанная с вашим кланом. Обвинитель потеряет 2 Статуса."}
  if(P.mode==="rewrite"){title=`Чем Шериф заменит «${cell.l}»`}
  const cancel=P.mode==="trade"?"UI.pick=null;act('trade',{cancel:true})":"UI.pick=null;render()";
  return pn("gold","Выбор находки","cards",title,`${extra?`<p class="hint">${extra}</p>`:""}<button class="ghost" onclick="${cancel}">Отмена</button><div class="pick">${list.map(c=>cardHtml(c,`<button class="t-btn" onclick="pickDone('${c.id}')">Выбрать</button>`)).join("")||'<p class="hint">Подходящих карт нет.</p>'}</div>`)}
function pickDone(card){const P=UI.pick;UI.pick=null;act(P.mode,{cell:P.cell,card})}
function ritualCard(){return UI.ritualMode?pn("gold","Ритуал","ritual","Выберите район",`<p>Нажмите на любой открытый район: вы увидите его и соседние, вместе с невидимыми.</p><button class="ghost" onclick="UI.ritualMode=false;render()">Отмена</button>`):""}
/* ---------- вкладки ---------- */
function handCard(){return pn("","Находки · "+M.hand.length,"cards","Ваши находки",M.hand.length?`<div class="hand">${M.hand.map(c=>cardHtml(c)).join("")}</div>`:'<p class="hint">Осматривайте районы — находки появятся здесь.</p>')}
function rivalsCard(){const cam=countOwn("cam"),ana=countOwn("ana"),all=Object.values(G.city.map).filter(h=>G.dist[h.k]).length||1;
  const rows=bots().map(b=>`<li style="--cc:${CLANS[b.clan].color}"><span class="cl-dot"></span><b>${CLANS[b.clan].name}</b><span class="cl-s">${b.alive?`Статус ${b.status} · находок ${b.hand.length}${G.sheriff===b.id?' · <b class="gold">Шериф</b>':""}${b.exposed?' · <span class="red">разоблачён: анархи</span>':""}`:'<span class="dim">погиб</span>'}</span></li>`).join("");
  return pn("","Двор · расклад сил","crown","Сородичи города",`<ul class="court-l">${rows}<li class="me" style="--cc:${CLANS[M.clan].color}"><span class="cl-dot"></span><b>Вы · ${CLANS[M.clan].name}</b><span class="cl-s">Статус ${M.status}${G.sheriff===ME?' · <b class="gold">Шериф</b>':""}${M.exposed?' · <span class="red">разоблачены</span>':""}</span></li></ul>
  <div class="bal" aria-label="Районы сторон"><span style="width:${cam/all*100}%;background:${FAC.cam.color}"></span><span style="width:${ana/all*100}%;background:${FAC.ana.color}"></span></div>
  <p class="hint"><b style="color:${FAC.cam.color}">Камарилья</b> держит ${cam} районов (в начале ${G.start.cam}), <b style="color:${FAC.ana.color}">анархи</b> — ${ana} (в начале ${G.start.ana}). Побеждает сторона, которая отыграла больше от начала.</p>
  <p class="hint">Ваш замысел: ${GOALS.find(x=>x.id===M.goal).t.replace("{X}",M.goalX?CLANS[M.goalX].name:"")}</p>`)}
function journalCard(){return pn("","Дневник","book","Что случилось",`<div class="log">${G.log.slice(0,80).map(l=>`<div><span class="n">Ночь ${l.n} · ${l.time}</span>${l.t}</div>`).join("")||'<p class="hint">Пока тихо.</p>'}</div>`)}
function dayCard(){return pn("gold","День","moon","Вы спите",`<p>${["Город живёт без вас: газеты печатают вчерашнее, полиция пишет рапорты.","Днём патрули ездят чаще обычного.","Сквозь сон вы слышите сирены.","Днём город не спит из-за вас: облавы, листовки, люди в штатском."][threatTier()]}</p>
  ${M.dayNote?`<p>${M.dayNote}</p>`:""}${goBtn(`Ночь ${G.night+1}`,"act('nextNight')")}`,"art/ev_res.webp")}
function endCard(){const F=G.final||facWinner();const rows=G.P.map(a=>({a,s:scoreOf(a,F.w)})).sort((x,y)=>y.s.total-x.s.total);const mine=rows.findIndex(r=>isMe(r.a));
  const head={done:"Двенадцать ночей прошло",lost:"Маскарад рухнул",dead:"Окончательная смерть",blood:"Вы остались одни"}[G.result]||"Конец";
  return pn(G.result==="done"||G.result==="blood"?"gold":"red","Итог партии","crown",head,`
   ${G.result==="dead"?`<p>${M.deathText||"Князь привёл приговор в исполнение."}</p>`:""}${G.result==="lost"?"<p>Слишком много людей видели слишком много. Князь отрекается от вас, и Шериф приходит до рассвета.</p>":""}
   ${G.result==="blood"?"<p>Все соперники мертвы. Город принадлежит вам — по праву того, кто последним остался в живых.</p>":""}
   ${G.result==="done"?`<p>${F.w?`<b>Город за ${F.w==="cam"?"Камарильей":"анархами"}.</b>`:"<b>Ни одна сторона не взяла верх.</b>"} Камарилья ${F.dc>=0?"+":""}${F.dc}, анархи ${F.da>=0?"+":""}${F.da} районов от начала.</p>
   <p class="big-r">${mine===0?"Вы побеждаете.":"Побеждает "+(isMe(rows[0].a)?"вы":"клан "+CLANS[rows[0].a.clan].name)+"."}</p>
   <ol class="score">${rows.map(r=>`<li${isMe(r.a)?' class="me"':""}><b>${isMe(r.a)?"Вы":CLANS[r.a.clan].name}</b> <span class="hint">тайно: ${FAC[r.a.fac].name}</span><span class="sc">${r.s.total}</span><span class="hint">${r.s.parts.join(", ")}</span></li>`).join("")}</ol>`:""}
   <span class="eyebrow">Дела Князя</span><ul class="how">${G.casesDone.map(c=>`<li>«${c.t}», ночь ${c.night}: обвинён ${clanName(c.accused)}${c.accused===c.truth?" — и это правда":`, а на самом деле — ${clanName(c.truth)}`}.</li>`).join("")||"<li>Ни одно дело не закрыто.</li>"}</ul>
   <div class="row">${goBtn("Новый город","newCity()")}<button class="ghost" onclick="newCity(G.seed)">Этот же город</button></div>`)}
// encCard остаётся для совместимости: встречи и осмотры показывает полноэкранная сцена
function encCard(){return ""}
function setTab(t){UI.tab=t;render();const s=document.getElementById("side");if(s)s.scrollTop=0}
const TABS=[["dossier","Досье","doc"],["finds","Находки","cards"],["sheet","Лист","people"],["court","Двор","crown"],["log","Дневник","book"]];
function sideHtml(){if(!G)return "";
  if(G.phase==="gen"||G.phase==="built"||G.phase==="setup"||!M)return "";
  if(UI.reveal&&G.phase==="walk")return genCard();
  const tab=UI.tab||"dossier";
  let body="";
  if(tab==="finds")body=handCard();else if(tab==="sheet")body=pn("","Лист персонажа · "+(PREDATORS[(M.sheet||{}).pred]||PREDATORS.sand).n,"people",CLANS[M.clan].name,sheetHtml(M.sheet||mkSheet(M.clan,"sand"),M.clan)+`<p class="hint">Пул броска — атрибут плюс навык или дисциплина. Успех — 6+ на d10, обычно нужно 2 успеха. Кубы Голода (${M.hunger}) могут дать грязный критический или звериный провал.</p>`);else if(tab==="court")body=rivalsCard();else if(tab==="log")body=journalCard();
  else if(G.phase==="walk")body=ritualCard()+pickCard()+dawnCard()+(!M.introDone&&!M.enc?introCard():"")+summonsCard()+caseCard(M.pos==="0,0"&&!M.enc&&!UI.pick)+(M.enc||UI.pick?"":hereCard());
  else if(G.phase==="court")body=caseCard(false);
  else if(G.phase==="day")body=dayCard()+caseCard(false);
  else if(G.phase==="end")body=endCard();
  const n=x=>x==="finds"?`<i>${M.hand.length}</i>`:"";
  const tabs=TABS.filter(t=>t[0]!=="sheet"||isV5());
  return `<nav class="tabs${tabs.length>4?" t5":""}" role="tablist">${tabs.map(([id,l,ic])=>`<button role="tab" aria-selected="${tab===id}" class="${tab===id?"on":""}" onclick="setTab('${id}')">${ico(ic)}<span>${l}</span>${n(id)}</button>`).join("")}</nav><div class="side-in">${body}</div>`}
