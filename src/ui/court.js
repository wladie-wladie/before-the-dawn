
/* ============================ ЭКРАН СБОРА В ЭЛИЗИУМЕ ============================
   Сверху — дело и слово Князя, снизу — ячейки-карточки, под ними ваши находки. */
function cSel(id){UI.csel=UI.csel===id?null:id;render()}
function cDo(mode,cell){const id=UI.csel;if(!id)return;UI.csel=null;act(mode,{cell,card:id})}
function slotHtml(C,cell,turn,sheriff){const v=C.cells[cell.id],L=v||!G.case?null:leader(cell);const sel=UI.csel&&M.hand.find(c=>c.id===UI.csel);
  const tag=cell.k.map(k=>`<span title="${KIND[k]}">${KICON[k]}</span>`).join("");let body,acts="";
  if(v){const a=actorById(v.by);body=`<div class="sl-card"><span class="sl-img" style="background-image:url(${kimg(v.card.k)})"></span><b>${esc(v.card.name)}</b><span class="hint">${cardTags(v.card)}</span><span class="sl-by">положил${a&&a.id==="me"?"и вы":": клан "+(a?CLANS[a.clan].name:"?")}</span></div>`;
    if(sheriff&&sel&&!can(ME,'rewrite',{cell:cell.id,card:sel.id}))acts=`<button class="primary" onclick="cDo('rewrite','${cell.id}')">Переписать этой картой</button>`}
  else{body=L?`<div class="sl-rum"><span class="eyebrow">Слух${L.w>1?` ×${L.w}`:""}</span><p>${esc(L.top.txt)}</p></div>`:`<div class="sl-empty">пусто</div>`;
    if(turn&&sel){if(!can(ME,'place',{cell:cell.id,card:sel.id}))acts+=`<button class="primary" onclick="cDo('place','${cell.id}')">Положить сюда</button>`;
      if(L&&!can(ME,'refute',{cell:cell.id,card:sel.id}))acts+=`<button onclick="cDo('refute','${cell.id}')">Оспорить слух</button>`}}
  const hl=sel&&!v&&turn&&!can(ME,'place',{cell:cell.id,card:sel.id})?" can":"";
  return `<div class="slot${v?" full":""}${hl}${cell.who?" who":""}"><div class="sl-h"><span class="sl-l">${cell.l}</span><span class="sl-k">${tag}</span></div>${cell.who?'<span class="sl-who">обвиняемый</span>':""}${body}${acts?`<div class="sl-a">${acts}</div>`:""}</div>`}
function courtScreen(){const Ct=G.court,P=G.prince;if(!Ct)return "";const C=G.case||Ct.snap;
  const T=C?tplOf(C):CASES[0];
  const per=PERSONAS[G.persona];const sev=clamp(T.sev+per.sev+Math.floor((G.night-1)/4),1,4);
  const turn=Ct.phase==="turns",sheriff=Ct.phase==="sheriff";
  const order=Ct.order.map((id,i)=>{const a=actorById(id);return `<span class="ord${i===Ct.i&&turn?" now":""}${i<Ct.i?" past":""}" style="--cc:${CLANS[a.clan].color}">${a.id==="me"?"Вы":CLANS[a.clan].name} <i>${a.status}</i></span>`}).join("");
  const top=`<section class="ct-top"><span class="eyebrow">Элизиум · сбор двора · ночь ${G.night}</span>
    <h1>${T.t}</h1><p class="ct-why">«${T.why}»</p>
    <p class="ct-meta">Князь ${P.name} · ${per.line} Обвинённого ждёт: <b>${PUNISH[sev].t}</b>.${G.case?` Сборов по делу: ${C.gath} из ${per.patience}.`:""}</p>
    <div class="ct-order"><span class="hint">Слово по Статусу:</span>${order}${G.sheriff?`<span class="hint">· Шериф: ${G.sheriff==="me"?"вы":CLANS[actorById(G.sheriff).clan].name}</span>`:""}</div></section>`;
  const slots=C?`<section class="ct-slots">${T.cells.map(c=>slotHtml(C,c,turn,sheriff)).join("")}</section>`:"";
  const log=Ct.lines.length?`<div class="ct-log">${Ct.lines.map(l=>`<p>${l}</p>`).join("")}</div>`:"";
  let bottom="";
  if(Ct.phase==="intro")bottom=`<div class="ct-act"><p>${Ct.fresh?"Князь поднимается с кресла и говорит о том, что случилось. Зал затихает.":"Князь напоминает: дело всё ещё открыто."}</p><button class="primary" onclick="act('courtListen')">Слушать двор</button></div>`;
  else if(turn||sheriff){const sel=UI.csel;const alibi=turn&&accusedBy(M);const ex=turn?exposeTargets(M):[];
    bottom=`<div class="ct-act"><p><b>${turn?"Ваше слово.":"Право Шерифа."}</b> ${turn?"Выберите находку внизу, затем ячейку — или промолчите.":"Выберите находку и заполненную ячейку, чтобы переписать её — один раз за сбор."}</p>
      <div class="row">${turn?`<button class="ghost" onclick="UI.csel=null;act('pass')">Промолчать</button>`:`<button class="ghost" onclick="UI.csel=null;act('courtSkip')">Не переписывать</button>`}
      ${alibi?`<button class="primary" ${sel&&!can(ME,'alibi',{card:sel})?"":"disabled"} onclick="const id=UI.csel;UI.csel=null;act('alibi',{card:id})">Опровергнуть обвинение выбранной картой</button>`:""}
      ${ex.map(c=>`<button onclick="act('expose',{clan:'${c}'})">Разоблачить клан ${CLANS[c].name}</button>`).join("")}</div></div>
      <div class="ct-hand">${M.hand.map(c=>`<button class="hc${UI.csel===c.id?" on":""}" onclick="cSel('${c.id}')"><span class="hc-i" style="background-image:url(${kimg(c.k)})"></span><b>${esc(c.name)}</b><span class="hint">${cardTags(c)}</span>${c.dirty&&c.clan===M.clan?'<span class="tag bad">грязь на себя</span>':""}${c.trace?'<span class="tag">след</span>':""}</button>`).join("")||'<p class="hint">Находок нет.</p>'}</div>`}
  else bottom=`<div class="ct-act ct-res">${(Ct.res||[]).map(t=>`<p>${t}</p>`).join("")}<button class="primary" onclick="act('courtLeave')">Покинуть Элизиум</button></div>`;
  return `<div class="ct-in">${top}${slots}${log}${bottom}</div>`}

