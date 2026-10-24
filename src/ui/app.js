
/* ============================ ПРИЛОЖЕНИЕ: состояние экрана, ходьба, отрисовка ============================
   UI — только то, что касается экрана этого игрока: камера, выделение, открытые окна, путь.
   Игра меняется только через act() → dispatch() движка; по событиям экран решает, что показать. */
const UI={tab:"dossier",zoom:"near",cam:null,dragged:false,hover:null,sel:null,pick:null,csel:null,ritualMode:false,alert:null,sun:null,path:[],rush:false,setup:{}};
let M=null; // участник этого экрана, обновляется при каждой отрисовке
let walkT=null;

function act(name,args={}){const r=dispatch(ME,name,args);if(!r.ok){if(r.reason)console.warn(name,r.reason);render();return r}react(r);render();return r}
// реакция экрана на события движка
function react(r){for(const e of r.events){if(e.pid&&e.pid!==ME)continue;
  if(e.type==="dawnWarn"){UI.alert={lvl:e.lvl,left:e.left,need:e.need}}
  if(e.type==="sun"){UI.sun={kind:e.kind,night:e.night,text:e.text}}
  if(e.type==="moved"){footstep();setDistrictSound();MAP3D.moved(e.to);if(!MAP3D.on)focusCam()}
  if(e.type==="start"){M=me();focusCam(true);revealCity()}
  if(e.type==="night"){UI.tab="dossier";focusCam(true);setDistrictSound()}
  if(e.type==="tradeAsk"){UI.pick={mode:"trade"}}}
  if(r.events.some(e=>(!e.pid||e.pid===ME)&&["enc","court","dawnWarn","dawn","sun","end","tradeAsk"].includes(e.type)))UI.path=[]}

/* ---------- ходьба по пути: каждый шаг — команда move ---------- */
function clickHex(k){const m=me();if(!m)return;
  if(UI.ritualMode){if(m.seen.has(k)){UI.ritualMode=false;act("ritual",{k})}return}
  if(G.phase!=="walk"||m.enc||UI.pick||UI.reveal)return;
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
  if(UI.path.length)walkT=setTimeout(walkStep,reduceMotion()?40:MAP3D.on?(UI.rush?330:620):(UI.rush?200:340));else UI.rush=false}

// кнопка из options(): если команде нужен выбор — сначала спрашиваем его
function doOption(n){const o=options(ME)[n];if(!o)return;
  if(o.cmd==="goHome")return goHome();
  if(o.need==="card")return pickFor(o.cmd);
  if(o.need==="clan"||o.need==="pay"){UI.pick={mode:o.cmd};return render()}
  if(o.need==="hex"){UI.ritualMode=true;return render()}
  act(o.cmd,o.args||{})}

/* ---------- новая партия ----------
   Сначала создание персонажа, город строится за ним невидимо; показ города — после «Выйти в ночь». */
function newCity(seed){
  const s=seed??Math.floor(Math.random()*1e9);const city=generate(s);rng=Math.random;
  G=newWorld(s,city);Object.assign(UI,{tab:"dossier",reveal:false,cam:null,sel:null,pick:null,csel:null,ritualMode:false,alert:null,sun:null,path:[],rush:false,setup:{}});
  buildBoard();G.phase="built";dispatch(ME,"toSetup");render()}
// показ города: районы загораются кольцами от Элизиума, камера сначала видит весь город
let revealT=[];
function revealCity(){try{scrollTo(0,0)}catch(e){}revealT.forEach(clearTimeout);revealT=[];UI.reveal="lighting";const total=CONFIG.radius+1;const fast=reduceMotion();
  setZoom("far");
  UI.revealR=-1;
  for(let r=0;r<=CONFIG.radius;r++)revealT.push(setTimeout(()=>{document.querySelectorAll(`.tile[data-ring="${r}"]`).forEach(el=>el.classList.add("on"));UI.revealR=r;MAP3D.update()},fast?0:400+r*520));
  revealT.push(setTimeout(()=>{$("#river")&&$("#river").classList.add("on")},fast?0:400+total*520));
  revealT.push(setTimeout(()=>{$("#map")&&$("#map").classList.add("lit");if(UI.reveal){UI.reveal="ready";render()}},fast?0:900+total*520))}
function endReveal(){revealT.forEach(clearTimeout);document.querySelectorAll(".tile").forEach(el=>el.classList.add("on"));$("#river")&&$("#river").classList.add("on");$("#map")&&$("#map").classList.add("lit");UI.reveal=false;setZoom("near")}

/* ---------- отрисовка: каждый экран — свой модуль ---------- */
function render(){if(!G)return;M=me();$("#hud").innerHTML=hud();
  {const su=$("#setup");if(su){const on=G.phase==="setup";su.hidden=!on;if(on){su.innerHTML=setupScreen();document.body.classList.add("su-open")}else{su.innerHTML="";document.body.classList.remove("su-open")}}}
  {const ct=$("#court");if(ct){const on=G.phase==="court"&&!!G.court;ct.hidden=!on;ct.innerHTML=on?courtScreen():"";document.body.classList.toggle("ct-open",on)}}
  renderScene();
  {const hm=$("#home");if(hm){const h=homeHtml();hm.hidden=!h;hm.innerHTML=h;document.body.classList.toggle("hm-open",!!h)}}
  {const ov=$("#ovl");if(ov){const h=sunHtml()||alertHtml();ov.hidden=!h;ov.innerHTML=h}}
  {const sd=$("#side"),st=sd.querySelector(".side-in")?sd.querySelector(".side-in").scrollTop:0;sd.innerHTML=sideHtml();const si=sd.querySelector(".side-in");if(si&&UI._tab===UI.tab)si.scrollTop=st;UI._tab=UI.tab}
  {const bar=$("#bar"),h=barHtml();bar.hidden=!h;bar.innerHTML=h;document.body.classList.toggle("has-bar",!!h)}
  $("#zoom").hidden=!M;document.querySelectorAll("#zoom [data-z]").forEach(b=>b.classList.toggle("on",b.dataset.z===UI.zoom));
  drawFog();drawMarks();MAP3D.update();save()}
// пробел: камера возвращается к персонажу в исходном ракурсе
function camHome(){if(!G||!me()||!me().clan)return;if(UI.zoom==="far"){UI.zoom="near";render()}if(MAP3D.on)MAP3D.recenter();else focusCam()}
function closeMenu(){const m=$("#setMenu");if(m){m.hidden=true;$("#setBtn").setAttribute("aria-expanded","false")}}

/* ---------- сохранение ---------- */
function save(){if(!G||!me()||G.phase==="end")return;try{localStorage.setItem(SAVE_KEY,serialize())}catch(e){}}
function load(){try{const t=localStorage.getItem(SAVE_KEY);if(!t)return false;const o=deserialize(t);if(!o.P||!o.P.length||o.phase==="end")return false;
  G=o;UI.cam=null;buildBoard();document.querySelectorAll(".tile").forEach(el=>el.classList.add("on"));$("#river").classList.add("on");$("#map").classList.add("lit");focusCam(true);render();return true}catch(e){console.warn(e);return false}}
function boot(){initAudioUI();document.querySelectorAll("#zoom [data-z]").forEach(b=>b.onclick=()=>setZoom(b.dataset.z));
  const vb=document.querySelector("[data-view]");if(vb){vb.hidden=!MAP3D.ok;vb.onclick=()=>{MAP3D.setOn(!MAP3D.on);render()}}
  const sb=$("#setBtn"),sm=$("#setMenu");sb.onclick=e=>{e.stopPropagation();sm.hidden=!sm.hidden;sb.setAttribute("aria-expanded",String(!sm.hidden))};
  document.addEventListener("click",e=>{if(!sm.hidden&&!sm.contains(e.target))closeMenu();if(UI.more&&!e.target.closest(".more-w")){UI.more=false;render()}});document.addEventListener("keydown",e=>{if(e.code==="Space"&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const t=e.target;if(t&&t.matches&&t.matches("input,textarea,select,[contenteditable]"))return;
    if(UI.home||!sm.hidden||G.phase==="setup"||document.body.classList.contains("sc-open")||document.body.classList.contains("ct-open")||!$("#ovl").hidden)return;
    e.preventDefault();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();camHome();return}
  if(e.key!=="Escape")return;if(!sm.hidden)return closeMenu();if(UI.home&&UI.home!=="main")return homeOpen("main");if(UI.home&&hasGame())return homeClose();if(!UI.home)homeOpen()});
  const top=document.querySelector(".top");const setTop=()=>document.documentElement.style.setProperty("--topH",top.offsetHeight+"px");setTop();if(window.ResizeObserver)new ResizeObserver(setTop).observe(top);addEventListener("resize",setTop);
  MAP3D.setOn(MAP3D.on);if(!load())newCity();homeOpen()}
boot();
