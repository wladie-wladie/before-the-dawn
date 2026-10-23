
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
const DISC={tor:["Прорицание","Стремительность","Присутствие"],ven:["Доминирование","Стойкость","Присутствие"],nos:["Анимализм","Затемнение","Мощь"],
  bru:["Стремительность","Мощь","Присутствие"],tre:["Прорицание","Доминирование","Магия крови"],gan:["Анимализм","Стойкость","Превращение"],tzi:["Анимализм","Доминирование","Превращение"]};
const DISC_ICON={"Прорицание":"auspex","Стремительность":"celerity","Присутствие":"presence","Доминирование":"dominate","Стойкость":"fortitude","Затемнение":"obfuscate","Анимализм":"animalism","Мощь":"potence","Магия крови":"blood-sorcery","Превращение":"protean"};
const discHtml=d=>`<i><span class="dic" aria-hidden="true" style="${maskOf("icons/disc/"+DISC_ICON[d]+".png")}"></span>${d}</i>`;
function setupSteps(n){const st=["Клан","Тайная сторона","Правила смерти"];
  return `<ol class="steps">${st.map((t,i)=>`<li class="${i===n?"on":i<n?"done":""}">${i<n?`<button onclick="setupBack(${i})">${i+1}. ${t}</button>`:`<span>${i+1}. ${t}</span>`}</li>`).join("")}</ol>`}
function setupBack(i){const S=UI.setup;if(i<=0){S.clan=null;S.fac=null}if(i<=1){S.fac=null}S.death=null;render()}
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
  const d=sel.death;
  const card=(id,title,tag,lines)=>`<button class="su-big${d===id?" on":""}" style="--cc:${id==="final"?"#c9c2b0":"#e2a64e"}" onclick="UI.setup.sel={...UI.setup.sel,death:'${id}'};render()">${emb(id,id==="final"?"#c9c2b0":"#e2a64e")}<span class="su-name">${title}</span><span class="su-tag">${tag}</span><ul>${lines.map(l=>`<li>${l}</li>`).join("")}</ul></button>`;
  return `<div class="su-in">${setupSteps(2)}<header class="su-head"><h1>Что будет, <em>если вас убьют</em></h1><p>Город не прощает ошибок: рассвет на улице, приговор Князя, Маскарад, который рухнул из-за вас.</p></header>
   <div class="su-two">${card("final","Окончательная смерть","Одна жизнь",["Погибли — партия окончена","Соперники тоже умирают насовсем","Вырезать всех врагов — тоже путь к победе"])}
   ${card("respawn","Новый неонат","Кровь продолжается",["Погибли — играете за нового Сородича своего клана","Он начинает почти с нуля: Статус 1, без находок","Партия идёт до конца, что бы ни случилось"])}</div>
   <div class="su-bar">${d?`<div class="su-bar-t"><b>${CLANS[S.clan].name} · ${FAC[S.fac].name} · ${d==="final"?"одна жизнь":"новый неонат"}</b><span>Двенадцать ночей. Город уже ждёт.</span></div><button class="primary" onclick="UI.setup.death='${d}';act('start',{clan:UI.setup.clan,fac:UI.setup.fac,death:'${d}'})">Выйти в ночь</button>`:'<span class="hint">Выберите правило, чтобы начать.</span>'}</div></div>`}
