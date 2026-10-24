
/* ============================ СЦЕНА РАЙОНА ============================
   Любое происшествие (осмотр, встреча, влияние, случай на улице) открывается во весь экран:
   атмосферный фон района, текст, варианты (бросок — красным), итог с кубами, находки внизу.
   Выбор по-прежнему идёт командами движка: choose / close. */
const SCENE_ART={club:"club",theatre:"club",port:"port",rail:"ind",ind:"ind",cem:"cem",ely:"ely",gov:"ely",res:"res",market:"res",
  old:"old",uni:"old",cath:"cath",park:"park",river:"park",biz:"biz",hosp:"biz",slum:"slum",edge:"slum"};
function sceneHtml(){if(!G||G.phase!=="walk"||!M||!M.enc)return "";const E=M.enc;const h=G.city.map[E.h]||G.city.map[M.pos];
  const kind={ev:"осмотр",meet:"встреча",infl:"влияние",note:"находка"}[E.kind]||"";
  const art=`art/ev_${SCENE_ART[h.t]||"res"}.webp`;
  let body;
  if(E.res)body=`<p class="sc-choice">${esc(E.res.choice||"")}</p>${E.res.dice||E.res.roll?`<div class="dice sc-dice">${E.res.dice?diceHtml(E.res.dice,E.res.roll):""}${E.res.roll?"":` <span class="hint">${E.res.ok?"удача":"неудача"}</span>`}</div>${rollHtml(E.res.roll,E.res.ok)}`:""}
    <p class="sc-text">${E.res.text}</p>${E.res.fx?`<p class="fx">${E.res.fx}</p>`:""}<button class="go sc-go" onclick="act('close')"><span>Дальше</span>${ico("arrow")}</button>`;
  else body=`<p class="sc-text">${E.e.x||""}</p>${E.e.hint?`<p class="sc-hint"><b>${SKILL[E.e.hint.k]} ${"●".repeat(E.e.hint.v)}</b> ${E.e.hint.text}</p>`:""}<div class="sc-opts">${E.e.c.map((c,i)=>{const roll=c.ok||c.roll||c.inf||c.spec;const sure=roll&&!c.inf&&isV5()&&(()=>{const sp=choiceSpec(M,E,c);return sp&&E.kind!=="meet"&&sureOf(M,sp)})();
      return `<button class="sc-opt${c.disc?" disc":sure?" sure":roll?" roll":""}" ${c.dis?"disabled":""} onclick="act('choose',{i:${i}})"><span>${c.t}${c.disc?`<span class="r5-tag">дисциплина · без броска · проверка крови</span>`:sure?`<span class="r5-tag">${poolOf(M,choiceSpec(M,E,c)).label} · уверенно, без броска</span>`:roll?poolTag(E,c):""}</span>${c.disc?'<em class="dsc">кровь</em>':sure?'<em class="sr">уверенно</em>':roll?'<em><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5.5" cy="5.5" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="10.5" cy="10.5" r="1.2" fill="currentColor"/></svg>бросок</em>':"<i>›</i>"}</button>`}).join("")}</div>`;
  const finds=M.hand.slice(-6).reverse();
  sceneHtml.key=E.h+"|"+E.e.t;sceneHtml.art=art;
  return `<div class="sc-wrap">
    <div class="sc-card"><div class="sc-eye">${TYPES[h.t].n}${M.visited.has(h.k)&&h.name!==TYPES[h.t].n?" · "+h.name:""}${kind?" · "+kind:""}</div><h2>${E.e.t}</h2>${body}</div>
    <div class="sc-foot"><div class="sc-k">Находки <span class="tag">${M.hand.length}</span></div><div class="sc-finds">${finds.length?finds.map(c=>cardHtml(c)).join(""):'<p class="hint">Пока ничего. Находки появятся здесь.</p>'}</div></div>
    <div class="sc-side"><canvas class="sc-mini" width="150" height="120" aria-hidden="true"></canvas></div>
   </div>`}
function drawMini(){const c=document.querySelector("#scene .sc-mini");if(!c)return;const D=Math.min(2,devicePixelRatio||1);c.width=150*D;c.height=120*D;const g=c.getContext("2d");g.setTransform(D,0,0,D,0,0);
  const N=CONFIG.radius;const s=Math.min(150/((2*N+1)*1.73+1),120/((2*N)*1.5+2))*.98;
  for(const h of Object.values(G.city.map)){const x=75+s*1.73*(h.q+h.r/2),y=60+s*1.5*h.r;g.beginPath();for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);g.lineTo(x+s*.95*Math.cos(a),y+s*.95*Math.sin(a))}g.closePath();
    const seenK=M.seen.has(h.k);const D2=G.dist[h.k];
    g.fillStyle=h.k===M.pos?CLANS[M.disguise||M.clan].color:!seenK?"rgba(255,255,255,.03)":h.t==="river"?"rgba(40,60,90,.7)":D2&&D2.own?FAC[D2.own].color+"55":"rgba(232,227,214,.12)";g.fill();
    g.strokeStyle="rgba(232,227,214,.18)";g.lineWidth=.7;g.stroke()}}
// фон держим отдельно: при каждой отрисовке меняется только текст, картинка не мигает
function renderScene(){const sc=document.getElementById("scene");if(!sc)return;const h=sceneHtml();sc.hidden=!h;document.body.classList.toggle("sc-open",!!h);
  if(!h){sc.innerHTML="";sc.dataset.key="";return}
  if(sc.dataset.key!==sceneHtml.key){sc.dataset.key=sceneHtml.key;sc.innerHTML=`<div class="sc-bg" style="background-image:url(${sceneHtml.art})"></div><div class="sc-layer"></div>`}
  sc.querySelector(".sc-layer").innerHTML=h;drawMini()}
