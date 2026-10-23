
/* ============================ ПРИЛОЖЕНИЕ: состояние экрана, ходьба, отрисовка ============================
   UI — только то, что касается экрана этого игрока: камера, выделение, открытые окна, путь.
   Игра меняется только через act() → dispatch() движка; по событиям экран решает, что показать. */
const UI={zoom:"near",cam:null,dragged:false,hover:null,sel:null,pick:null,csel:null,ritualMode:false,alert:null,sun:null,path:[],rush:false,setup:{}};
let M=null; // участник этого экрана, обновляется при каждой отрисовке
let walkT=null;

function act(name,args={}){const r=dispatch(ME,name,args);if(!r.ok){if(r.reason)console.warn(name,r.reason);render();return r}react(r);render();return r}
// реакция экрана на события движка
function react(r){for(const e of r.events){if(e.pid&&e.pid!==ME)continue;
  if(e.type==="dawnWarn"){UI.alert={lvl:e.lvl,left:e.left,need:e.need}}
  if(e.type==="sun"){UI.sun={kind:e.kind,night:e.night,text:e.text}}
  if(e.type==="moved"){footstep();setDistrictSound();focusCam()}
  if(e.type==="start"){M=me();focusCam(true)}
  if(e.type==="night"){focusCam(true);setDistrictSound()}
  if(e.type==="tradeAsk"){UI.pick={mode:"trade"}}}
  if(r.events.some(e=>(!e.pid||e.pid===ME)&&["enc","court","dawnWarn","dawn","sun","end","tradeAsk"].includes(e.type)))UI.path=[]}

/* ---------- ходьба по пути: каждый шаг — команда move ---------- */
function clickHex(k){const m=me();if(!m)return;
  if(UI.ritualMode){if(m.seen.has(k)){UI.ritualMode=false;act("ritual",{k})}return}
  if(G.phase!=="walk"||m.enc||UI.pick)return;
  if(k===m.pos||!m.seen.has(k)){UI.sel=k;render();return}
  walkTo(k)}
function walkTo(k){const m=me();const p=bfs(m.pos,k,m.seen);if(!p)return;UI.rush=false;UI.path=p;kickWalk()}
function goHome(){const m=me();UI.alert=null;UI.pick=null;
  if(m.enc&&(m.enc.res||m.enc.kind!=="meet")){if(m.enc.res)dispatch(ME,"close");else m.enc=null}
  const p=bfs(m.pos,m.haven,null);if(p&&p.length){UI.path=p;UI.rush=true;kickWalk()}else render()}
function kickWalk(){if(walkT){clearTimeout(walkT);walkT=null}walkStep()}
function walkStep(){walkT=null;if(!UI.path.length){UI.rush=false;render();return}
  const to=UI.path.shift();const r=dispatch(ME,"move",{to,rush:UI.rush});
  if(!r.ok){UI.path=[];UI.rush=false;render();return}
  react(r);render();
  if(UI.path.length)walkT=setTimeout(walkStep,reduceMotion()?40:(UI.rush?200:340));else UI.rush=false}

// кнопка из options(): если команде нужен выбор — сначала спрашиваем его
function doOption(n){const o=options(ME)[n];if(!o)return;
  if(o.cmd==="goHome")return goHome();
  if(o.need==="card")return pickFor(o.cmd);
  if(o.need==="clan"||o.need==="pay"){UI.pick={mode:o.cmd};return render()}
  if(o.need==="hex"){UI.ritualMode=true;return render()}
  act(o.cmd,o.args||{})}

/* ---------- новая партия ---------- */
function newCity(seed){
  const s=seed??Math.floor(Math.random()*1e9);const city=generate(s);rng=Math.random;
  G=newWorld(s,city);Object.assign(UI,{cam:null,sel:null,pick:null,csel:null,ritualMode:false,alert:null,sun:null,path:[],rush:false,setup:{}});
  buildBoard();render();
  const total=CONFIG.radius+1;
  for(let r=0;r<=CONFIG.radius;r++)setTimeout(()=>{document.querySelectorAll(`.tile[data-ring="${r}"]`).forEach(el=>el.classList.add("on"))},250+r*420);
  setTimeout(()=>{$("#river")&&$("#river").classList.add("on")},250+total*420);
  setTimeout(()=>{$("#map").classList.add("lit");if(G.phase==="gen"){G.phase="built";render()}},600+total*420+600);
}

/* ---------- отрисовка: каждый экран — свой модуль ---------- */
function render(){if(!G)return;M=me();$("#hud").innerHTML=hud();let s="";
  if(G.phase==="gen"||G.phase==="built")s=genCard();
  else if(G.phase==="setup")s="";
  else if(G.phase==="walk")s=(UI.ritualMode?`<div class="card intro"><h2>Ритуал</h2><p>Нажмите на любой открытый район: вы увидите его и соседние, вместе с невидимыми.</p><button onclick="UI.ritualMode=false;render()">Отмена</button></div>`:"")+pickCard()+encCard()+(!M.introDone&&!M.enc?introCard():"")+summonsCard()+caseCard(M.pos==="0,0"&&!M.enc&&!UI.pick)+(M.enc||UI.pick?"":hereCard()+actionsCard())+handCard()+rivalsCard()+journalCard();
  else if(G.phase==="court")s=caseCard(false)+rivalsCard()+journalCard();
  else if(G.phase==="day")s=dayCard()+caseCard(false)+rivalsCard()+journalCard();
  else if(G.phase==="end")s=endCard()+journalCard();
  {const su=$("#setup");if(su){const on=G.phase==="setup";su.hidden=!on;if(on){su.innerHTML=setupScreen();document.body.classList.add("su-open")}else{su.innerHTML="";document.body.classList.remove("su-open")}}}
  {const ct=$("#court");if(ct){const on=G.phase==="court"&&!!G.court;ct.hidden=!on;ct.innerHTML=on?courtScreen():"";document.body.classList.toggle("ct-open",on)}}
  {const ov=$("#ovl");if(ov){const h=sunHtml()||alertHtml();ov.hidden=!h;ov.innerHTML=h}}
  $("#side").innerHTML=s;$("#zoom").hidden=!M;document.querySelectorAll("#zoom button").forEach(b=>b.classList.toggle("on",b.dataset.z===UI.zoom));
  drawFog();drawMarks();save()}

/* ---------- сохранение ---------- */
function save(){if(!G||!me()||G.phase==="end")return;try{localStorage.setItem(SAVE_KEY,serialize())}catch(e){}}
function load(){try{const t=localStorage.getItem(SAVE_KEY);if(!t)return false;const o=deserialize(t);if(!o.P||!o.P.length||o.phase==="end")return false;
  G=o;UI.cam=null;buildBoard();document.querySelectorAll(".tile").forEach(el=>el.classList.add("on"));$("#river").classList.add("on");$("#map").classList.add("lit");focusCam(true);render();return true}catch(e){console.warn(e);return false}}
function boot(){initAudioUI();document.querySelectorAll("#zoom button").forEach(b=>b.onclick=()=>setZoom(b.dataset.z));if(!load())newCity()}
boot();
