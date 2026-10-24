
/* ============================ СОЗДАНИЕ ПЕРСОНАЖА: полноэкранный выбор ============================
   Эмблемы — собственные рисунки игры, не официальные знаки кланов. */
const EMB={
 tor:'<path d="M14 10c6 3 14 3 20 0 2 9 1 19-4 25-3 3-9 3-12 0-5-6-6-16-4-25z"/><path d="M17 20c2-1.5 4-1.5 6 0M25 20c2-1.5 4-1.5 6 0"/><path d="M19 29c3 2 7 2 10 0"/><path d="M34 10c3 4 4 9 3 13"/>',
 ven:'<circle cx="24" cy="21" r="11"/><circle cx="24" cy="21" r="6.5"/><path d="M24 14.5v13M17.5 21h13"/><path d="M17 31c-.5 4 1 7 2 7s1.5-3 1-6M28 32c0 3 1 5 2 5s1-2 .5-5"/>',
 nos:'<path d="M8 34C8 18 15 9 24 9s16 9 16 25"/><path d="M14 34c0-9 4-15 10-15s10 6 10 15"/><path d="M18 27c3-2.5 9-2.5 12 0-3 2.5-9 2.5-12 0z"/><circle cx="24" cy="27" r="1.4"/>',
 bru:'<rect x="7" y="17" width="15" height="13" rx="6.5"/><rect x="26" y="17" width="15" height="13" rx="6.5"/><path d="M22 20l4 -4M22 27l4 4"/><path d="M11 23.5h7M30 23.5h7"/>',
 tre:'<path d="M8 15c5-2 11-2 16 2 5-4 11-4 16-2v19c-5-2-11-2-16 2-5-4-11-4-16-2z"/><path d="M24 17v19"/><path d="M24 4c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z"/>',
 gan:'<ellipse cx="24" cy="31" rx="7.5" ry="6.5"/><ellipse cx="13" cy="21" rx="3.2" ry="4.2" transform="rotate(-20 13 21)"/><ellipse cx="20" cy="15" rx="3.2" ry="4.4"/><ellipse cx="28" cy="15" rx="3.2" ry="4.4"/><ellipse cx="35" cy="21" rx="3.2" ry="4.2" transform="rotate(20 35 21)"/>',
 tzi:'<rect x="17" y="6" width="14" height="7" rx="3"/><rect x="16" y="15.5" width="16" height="7" rx="3"/><rect x="17" y="25" width="14" height="7" rx="3"/><rect x="19" y="34.5" width="10" height="6" rx="3"/><path d="M10 9h4M10 19h4M34 28h4M34 37h4"/>',
 cam:'<path d="M8 16L24 7l16 9z"/><path d="M10 16h28M11 38h26M9 41h30"/><path d="M14 18v19M21 18v19M27 18v19M34 18v19"/>',
 ana:'<path d="M24 6c5 6 8 10 8 15a8 8 0 0 1-16 0c0-3 1.5-5 3-7 .5 3 2 4.5 3 4.5 0-4 1-8 2-12.5z"/><path d="M20 30h8l-2 12h-4z"/><path d="M18 30h12"/>',
 final:'<path d="M20 14h8v24h-8z"/><path d="M24 14V9"/><path d="M17 38h14M15 41h18"/><path d="M27 6c-2 1-3 2-3 3"/>',
 respawn:'<path d="M20 22h8v16h-8z"/><path d="M24 22c-3-3-3-6 0-10 3 4 3 7 0 10z"/><path d="M17 38h14M15 41h18"/><path d="M12 16l3 2M36 16l-3 2M24 4v3"/>',
};
// Свои значки кланов: положите файлы icons/clans/<клан>.svg или .png рядом с игрой (ven, tor, nos, bru, tre, gan, tzi) —
// игра покажет их вместо встроенных эмблем. Например, официальные символы из набора Dark Pack.
const ICON_OK={},NAME_OK={};
(function probeIcons(){const ids=[...Object.keys(CLANS),"ana","cam"];for(const id of ids){const dir=FAC[id]?"factions":"clans";
  const im=new Image();im.onload=()=>{ICON_OK[id]=im.src;if(G&&G.phase==="setup")render()};im.src=`icons/${dir}/${id}.png`;
  const nm=new Image();nm.onload=()=>{NAME_OK[id]=nm.src;if(G&&G.phase==="setup")render()};nm.src=`icons/${dir}/names/${id}.png`}})();
// значки — силуэты с прозрачным фоном; окрашиваем их в цвет клана через CSS-маску
const maskOf=u=>`-webkit-mask-image:url('${u}');mask-image:url('${u}')`;
const emb=(k,col)=>ICON_OK[k]?`<span class="emb emb-img" aria-hidden="true" style="color:${col};${maskOf(ICON_OK[k])}"></span>`:`<svg class="emb" viewBox="0 0 48 48" aria-hidden="true" style="color:${col}"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${EMB[k]}</g></svg>`;
const wordmark=(k,col)=>NAME_OK[k]?`<span class="su-wm" aria-hidden="true" style="color:${col};${maskOf(NAME_OK[k])}"></span>`:"";
const CLAN_GROUPS=[["Правители и повелители",["ven","tzi"]],["Бойцы и защитники",["bru","gan"]],["Соблазнители",["tor"]],["Искатели знания",["tre"]],["Скрытые",["nos"]]];
const DISC_ICON={"Прорицание":"auspex","Стремительность":"celerity","Присутствие":"presence","Доминирование":"dominate","Стойкость":"fortitude","Затемнение":"obfuscate","Анимализм":"animalism","Мощь":"potence","Магия крови":"blood-sorcery","Превращение":"protean"};
const discHtml=d=>`<i><span class="dic" aria-hidden="true" style="${maskOf("icons/disc/"+DISC_ICON[d]+".png")}"></span>${d}</i>`;
function setupSteps(n){const sel=(UI.setup.sel||{});const st=["Клан","Тайная сторона","Правила"].concat(sel.dice==="v5"?["Персонаж"]:[]);
  return `<ol class="steps">${st.map((t,i)=>`<li class="${i===n?"on":i<n?"done":""}">${i<n?`<button onclick="setupBack(${i})">${i+1}. ${t}</button>`:`<span>${i+1}. ${t}</span>`}</li>`).join("")}</ol>`}
function setupBack(i){const S=UI.setup;if(i<=0){S.clan=null;S.fac=null}if(i<=1){S.fac=null}S.rules=false;render()}
function setupScreen(){const S=UI.setup;const sel=S.sel||{};
  if(!S.clan){const c=sel.clan?CLANS[sel.clan]:null;
    return `<div class="su-in">${setupSteps(0)}<header class="su-head"><h1>Выберите <em>клан</em></h1><p>Клан — это ваша кровь, ваша сила и ваше проклятие. От него зависит, как вас видят на улицах и что вы умеете, когда город засыпает.</p></header>
     <div class="su-grid">${CLAN_GROUPS.flatMap(([g,ids])=>ids.map(id=>{const C=CLANS[id];return `<button class="su-card${sel.clan===id?" on":""}" style="--cc:${C.color}" onclick="UI.setup.sel={...UI.setup.sel,clan:'${id}'};render()">
       <span class="su-grp">${g}</span>${emb(id,C.color)}${wordmark(id,C.color)}<span class="su-name">${C.name}</span><span class="su-line">${C.line}</span><span class="su-disc">${DISC[id].map(discHtml).join("")}</span>
       <span class="su-pas"><b>Способность.</b> ${C.pas}</span></button>`})).join("")}</div>
     <div class="su-bar">${c?`${emb(sel.clan,c.color)}<div class="su-bar-t"><b style="color:${c.color}">${c.name}</b><span class="hint">${c.lean>=.5?"Обычно тянется к анархам":"Обычно держится Камарильи"}</span></div><button class="primary" onclick="UI.setup.clan='${sel.clan}';render()">Дальше</button>`:'<span class="hint">Выберите клан, чтобы продолжить.</span>'}</div></div>`}
  if(!S.fac){const C=CLANS[S.clan];const f=sel.fac;
    const card=(id,title,tag,lines)=>`<button class="su-big${f===id?" on":""}" style="--cc:${FAC[id].color}" onclick="UI.setup.sel={...UI.setup.sel,fac:'${id}'};render()">${emb(id,FAC[id].color)}${wordmark(id,FAC[id].color)}<span class="su-name">${title}</span><span class="su-tag">${tag}</span><ul>${lines.map(l=>`<li>${l}</li>`).join("")}</ul></button>`;
    return `<div class="su-in">${setupSteps(1)}<header class="su-head"><h1>На кого вы работаете <em>на самом деле</em></h1><p>При дворе все кланяются Князю. Но каждую ночь вы тайно сдвигаете районы к одной из сторон. Об этом не знает никто — пока вас не выдадут следы.</p></header>
     <div class="su-two">${card("cam","Камарилья","Порядок, Маскарад, Элизиум",["Районы в центре держатся крепче","Районы приносят Статус, деньги и спокойный город","Быть камарильщиком при дворе не стыдно — это видимая сторона"])}
     ${card("ana","Анархи","Свобода, улица, своя правда",["Окраины, трущобы и порт — ваша естественная земля","Районы приносят деньги, находки и убежища на рассвете","Если двор узнает, вас разоблачат и лишат защиты"])}</div>
     <p class="su-note">${C.name} ${C.lean>=.5?"обычно тянутся к анархам":"обычно держатся Камарильи"}, но решать вам. Сменить сторону можно и потом, в убежище, — за деньги или Статус.</p>
     <div class="su-bar">${f?`${emb(f,FAC[f].color)}<div class="su-bar-t"><b style="color:${FAC[f].color}">${FAC[f].name}</b><span>Ваш выбор останется тайной.</span></div><button class="primary" onclick="UI.setup.fac='${f}';render()">Дальше</button>`:'<span class="hint">Выберите сторону, чтобы продолжить.</span>'}</div></div>`}
  const go=`act('start',{clan:UI.setup.clan,fac:UI.setup.fac,death:UI.setup.sel.death,dice:UI.setup.sel.dice,pred:UI.setup.sel.pred||'sand',sheet:UI.setup.sel.sh})`;
  if(!S.rules){const d=sel.death,r=sel.dice;
    const card=(key,id,title,tag,lines,col,icon)=>`<button class="su-big su-rule${sel[key]===id?" on":""}" style="--cc:${col}" onclick="UI.setup.sel={...UI.setup.sel,${key}:'${id}'};render()">${icon}<span class="su-name">${title}</span><span class="su-tag">${tag}</span><ul>${lines.map(l=>`<li>${l}</li>`).join("")}</ul></button>`;
    const die=(f,c)=>`<img class="su-die" src="icons/dice/${c}-${f}.png" alt="">`;
    return `<div class="su-in">${setupSteps(2)}<header class="su-head"><h1>Правила <em>этой ночи</em></h1><p>Что будет, если вас убьют, и как бросать кубы, когда исход решает удача.</p></header>
   <section class="su-group"><h2>Если вас убьют</h2><div class="su-two">${card("death","final","Окончательная смерть","Одна жизнь",["Погибли — партия окончена","Соперники тоже умирают насовсем","Вырезать всех врагов — тоже путь к победе"],"#c9c2b0",emb("final","#c9c2b0"))}
   ${card("death","respawn","Новый неонат","Кровь продолжается",["Погибли — играете за нового Сородича своего клана","Он начинает почти с нуля: Статус 1, без находок","Партия идёт до конца, что бы ни случилось"],"#e2a64e",emb("respawn","#e2a64e"))}</div></section>
   <section class="su-group"><h2>Броски</h2><div class="su-two">${card("dice","simple","Просто","2–3 куба, без листа",["Бросаете 2–3 шестигранника, любая 5 или 6 — удача","Статус и Голод добавляют или отнимают куб","Быстро и понятно — для первой партии"],"#9fb3c8",`<span class="su-dice">${die("success","normal")}${die("blank","normal")}</span>`)}
   ${card("dice","v5","Как в V5","Атрибут + навык",["Лист персонажа: атрибуты, навыки и дисциплины клана","Пул десятигранников, успех — 6+, обычно нужно 2 успеха","Пара десяток — критический; кубы Голода могут дать грязный успех или звериный провал","Тип хищника решает, как вы охотитесь"],"#d9a85a",`<span class="su-dice">${die("crit","normal")}${die("success","normal")}${die("skull","hunger")}</span>`)}</div></section>
   <div class="su-bar">${d&&r?`<div class="su-bar-t"><b>${CLANS[S.clan].name} · ${FAC[S.fac].name} · ${d==="final"?"одна жизнь":"новый неонат"} · ${r==="v5"?"броски V5":"простые броски"}</b><span>${r==="v5"?"Осталось выбрать, как вы охотитесь.":"Двенадцать ночей. Город уже ждёт."}</span></div>${r==="v5"?`<button class="primary" onclick="UI.setup.rules=true;render()">Дальше</button>`:`<button class="primary" onclick="${go}">Выйти в ночь</button>`}`:`<span class="hint">${!d&&!r?"Выберите правило смерти и способ бросков.":!d?"Выберите, что будет после смерти.":"Выберите, как бросать кубы."}</span>`}</div></div>`}
  const pr=sel.pred;const C=suSheet();const ok=sheetValid(C);
  const aL=quotaLeft(ATTR_NEED,C.a),sL=quotaLeft(SKILL_NEED,C.s);
  const qTxt=(L,lv)=>lv.map(v=>`<span class="q${L[v]===0?" done":L[v]<0?" over":""}">${v}: <b>${Math.max(0,L[v])}</b></span>`).join("");
  const row=(kind,k,name,max,L,cur,extra="")=>`<div class="sh-r ed"><span>${name}${extra}</span><span class="dots ed">${Array.from({length:max},(_,i)=>{const v=i+1;const can=v===cur||L[v]>0;return `<button class="${v<=cur?"on":""}" ${can?"":"disabled"} aria-label="${name}: ${v}" onclick="suDot('${kind}','${k}',${v})"></button>`}).join("")}</span></div>`;
  const ds=DISC[S.clan]||[];
  return `<div class="su-in">${setupSteps(3)}<header class="su-head"><h1>Ваш <em>персонаж</em></h1><p>Выберите, как вы кормитесь, и распределите точки. Из них собираются пулы во всех бросках: атрибут + навык или дисциплина.</p></header>
   <section class="su-group"><h2>Тип хищника</h2><div class="su-grid su-preds">${Object.entries(PREDATORS).map(([id,P])=>`<button class="su-card${pr===id?" on":""}" style="--cc:#d9a85a" onclick="UI.setup.sel={...UI.setup.sel,pred:'${id}'};render()"><span class="su-name">${P.n}</span><span class="su-line">${P.line}</span>
     <span class="su-tag">Охота: ${P.pool.split("+").map(x=>ATTR[x]||SKILL[x]).join(" + ")}</span><span class="su-pas">+1 к навыку «${SKILL[P.skill]}». ${P.fx}</span></button>`).join("")}</div></section>
   <section class="su-group"><h2>Лист персонажа</h2>
    <div class="sh-tools"><button class="primary" onclick="suAuto()">Заполнить автоматически</button><button class="ghost" onclick="suReset()">Сбросить</button><span class="hint">Автоматически — типичный лист клана ${CLANS[S.clan].name}. Можно заполнить и поправить.</span></div>
    <section class="sheet ed">
     <div class="sh-col"><span class="eyebrow">Атрибуты</span><span class="quota">Осталось: ${qTxt(aL,[4,3,2,1])}</span>${ATTR_GROUPS.map(([g,ks])=>`<div class="sh-g"><span class="sh-gn">${g}</span>${ks.map(k=>row("a",k,ATTR[k],4,aL,C.a[k]||0)).join("")}</div>`).join("")}</div>
     <div class="sh-col"><span class="eyebrow">Навыки</span><span class="quota">Осталось: ${qTxt(sL,[3,2,1])}</span>${Object.keys(SKILL).map(k=>row("s",k,SKILL[k],3,sL,C.s[k]||0,pr&&PREDATORS[pr].skill===k?' <i class="plus" title="от типа хищника">+1</i>':"")).join("")}</div>
     <div class="sh-col"><span class="eyebrow">Дисциплины</span><span class="hint">Главная дисциплина получает 2 точки, остальные — по одной.</span>${ds.map(n=>`<button class="sh-disc${C.dp===n?" on":""}" onclick="suDisc('${n}')"><span>${discHtml(n)}</span>${dots(C.dp===n?2:1)}</button>`).join("")}</div>
    </section></section>
   <div class="su-bar">${pr&&ok?`<div class="su-bar-t"><b>${CLANS[S.clan].name} · ${PREDATORS[pr].n}</b><span>Двенадцать ночей. Город уже ждёт.</span></div><button class="primary" onclick="${go}">Выйти в ночь</button>`:`<span class="hint">${!pr?"Выберите тип хищника. ":""}${!ok?"Распределите все точки атрибутов и навыков — или нажмите «Заполнить автоматически».":""}</span>`}</div></div>`}
// ручное заполнение листа: по умолчанию пусто, «Заполнить автоматически» ставит лист клана
function suSheet(){const S=UI.setup;if(!S.sel.sh||S.sel.sh.clan!==S.clan)S.sel={...S.sel,sh:{clan:S.clan,a:{},s:{},dp:(DISC[S.clan]||[])[0]}};return S.sel.sh}
function suDot(kind,k,v){const C=suSheet();const cur=C[kind][k]||0;C[kind][k]=cur===v?0:v;render()}
function suDisc(n){suSheet().dp=n;render()}
function suAuto(){const S=UI.setup;S.sel={...S.sel,sh:{clan:S.clan,...autoSheet(S.clan)}};render()}
function suReset(){const S=UI.setup;S.sel={...S.sel,sh:null};render()}
// лист персонажа: точки атрибутов, навыков и дисциплин
const dots=(n,max=5)=>`<span class="dots" aria-label="${n} из ${max}">${Array.from({length:max},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}</span>`;
function sheetHtml(sh,clan){return `<section class="sheet"><div class="sh-col"><span class="eyebrow">Атрибуты</span>${ATTR_GROUPS.map(([g,ks])=>`<div class="sh-g"><span class="sh-gn">${g}</span>${ks.map(k=>`<div class="sh-r"><span>${ATTR[k]}</span>${dots(sh.a[k])}</div>`).join("")}</div>`).join("")}</div>
  <div class="sh-col"><span class="eyebrow">Навыки</span>${Object.keys(SKILL).filter(k=>sh.s[k]).sort((x,y)=>sh.s[y]-sh.s[x]).map(k=>`<div class="sh-r"><span>${SKILL[k]}</span>${dots(sh.s[k])}</div>`).join("")}<span class="hint">Остальные навыки — 0.</span></div>
  <div class="sh-col"><span class="eyebrow">Дисциплины</span>${Object.entries(sh.d).map(([n,v])=>`<div class="sh-r"><span>${discHtml(n)}</span>${dots(v)}</div>`).join("")}<span class="eyebrow" style="margin-top:10px">Хищник</span><div class="sh-r"><span>${PREDATORS[sh.pred].n}</span></div></div></section>`}
