const $ = s => document.querySelector(s);
const reduceMotion=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
/* ============================ КАМЕРА ============================ */
function bounds(){const N=CONFIG.radius;const w=R*SQ*(2*N+1)+R,h=R*1.5*(2*N)+2*R+10;return {x:-w/2,y:-h/2,w,h}}
function targetCam(){
  const b=bounds();
  if(UI.zoom==="far"||!myPos())return b;
  const h=G.city.map[myPos()];const [x,y]=px(h.q,h.r);const W=UI.zoom==="mid"?b.w*0.8:b.w*0.58;const H=W*0.78;
  return {x:x-W/2,y:y-H/2,w:W,h:H};
}
let camAnim=null;
function focusCam(instant){MAP3D.focus(instant);
  const t=targetCam();
  if(!UI.cam||instant||reduceMotion()){UI.cam=t;applyCam();return}
  const from={...UI.cam};const t0=performance.now();const dur=520;
  cancelAnimationFrame(camAnim);
  const step=now=>{const k=Math.min(1,(now-t0)/dur);const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    UI.cam={x:from.x+(t.x-from.x)*e,y:from.y+(t.y-from.y)*e,w:from.w+(t.w-from.w)*e,h:from.h+(t.h-from.h)*e};applyCam();if(k<1)camAnim=requestAnimationFrame(step)};
  camAnim=requestAnimationFrame(step);
}
function applyCam(){if(!UI.cam)UI.cam=targetCam();const c=UI.cam;const m=$("#map");if(m&&c)m.setAttribute("viewBox",`${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.w.toFixed(1)} ${c.h.toFixed(1)}`)}
function setZoom(z){UI.zoom=z;focusCam();render()}


/* ---------- прокрутка и масштаб карты: перетаскивание, колесо, щипок ---------- */
function initPanZoom(){
  const svg=$("#map");if(!svg)return;
  const pts=new Map();let start=null,pinch=null;
  const scale=()=>{const c=UI.cam,r=svg.getBoundingClientRect();return Math.max(c.w/r.width,c.h/r.height)};
  const world=(cx,cy)=>{const c=UI.cam,r=svg.getBoundingClientRect(),k=scale();const ox=(r.width*k-c.w)/2,oy=(r.height*k-c.h)/2;return [c.x-ox+(cx-r.left)*k,c.y-oy+(cy-r.top)*k]};
  const clampCam=()=>{const b=bounds(),c=UI.cam;const minW=b.w*.25,maxW=b.w*1.25;if(c.w<minW){const f=minW/c.w;c.x-=(c.w*f-c.w)/2;c.y-=(c.h*f-c.h)/2;c.w*=f;c.h*=f}
    if(c.w>maxW){const f=maxW/c.w;c.x-=(c.w*f-c.w)/2;c.y-=(c.h*f-c.h)/2;c.w*=f;c.h*=f}
    c.x=clamp(c.x,b.x-c.w*.5,b.x+b.w-c.w*.5);c.y=clamp(c.y,b.y-c.h*.5,b.y+b.h-c.h*.5)};
  const zoomAt=(f,cx,cy)=>{const [wx,wy]=world(cx,cy);const c=UI.cam;c.x=wx-(wx-c.x)*f;c.y=wy-(wy-c.y)*f;c.w*=f;c.h*=f;clampCam();applyCam()};
  svg.addEventListener("dragstart",e=>e.preventDefault());
  svg.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;if(e.pointerType==="mouse")e.preventDefault();cancelAnimationFrame(camAnim);pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===1){start={x:e.clientX,y:e.clientY,cam:{...UI.cam}};UI.dragged=false}
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])}}});
  window.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2&&pinch){const [a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d>0){zoomAt(pinch.d/d,(a[0]+b[0])/2,(a[1]+b[1])/2);pinch.d=d;UI.dragged=true}return}
    if(start){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>6)UI.dragged=true;
      if(UI.dragged){const k=scale();UI.cam.x=start.cam.x-dx*k;UI.cam.y=start.cam.y-dy*k;clampCam();applyCam()}}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size){start=null;setTimeout(()=>{UI.dragged=false},0)}};
  window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);
  svg.addEventListener("wheel",e=>{e.preventDefault();cancelAnimationFrame(camAnim);zoomAt(e.deltaY>0?1.12:1/1.12,e.clientX,e.clientY)},{passive:false});
}
/* ============================ ПОСТРОЕНИЕ КАРТЫ ============================ */
function buildBoard(){
  const c=G.city;let tiles="",labels="";
  for(const h of Object.values(c.map)){
    const [x,y]=px(h.q,h.r);
    tiles+=`<g class="tile" data-ring="${h.ring}" data-k="${h.k}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <clipPath id="cp${h.q}_${h.r}"><polygon points="${ptsStr(hexPts(0,0,.98))}"/></clipPath>
      <g class="in"><polygon points="${ptsStr(hexPts(0,0,.98))}" fill="${TYPES[h.t].base}"/>
      <g clip-path="url(#cp${h.q}_${h.r})">${h.t==="river"?"":h.art.svg}</g>
      <polygon class="edge" points="${ptsStr(hexPts(0,0,.98))}" fill="none" stroke="#0b0c12" stroke-width="2"/></g>
    </g>`;
  }
  const b=bounds();
  $("#mapwrap").innerHTML=`<svg id="map" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" role="img" aria-label="Карта города">
    <defs><radialGradient id="glow"><stop offset="0" stop-color="#ffd58a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>
      <radialGradient id="fire"><stop offset="0" stop-color="#ffb04a" stop-opacity=".9"/><stop offset=".5" stop-color="#ff6a2a" stop-opacity=".4"/><stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/></radialGradient>
      <radialGradient id="fogg"><stop offset="0" stop-color="#0c0d14" stop-opacity=".88"/><stop offset="1" stop-color="#0c0d14" stop-opacity=".96"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="4"/></filter></defs>
    <rect x="${b.x-200}" y="${b.y-200}" width="${b.w+400}" height="${b.h+400}" fill="var(--night)"/>
    <g id="tiles">${tiles}</g>
    <g id="river">${riverSvg(c.map,c.riverPath)}</g>
    <g id="fog"></g><g id="marks"></g><g id="hits"></g></svg>`;
  // кликабельные зоны поверх всего
  let hits="";for(const h of Object.values(c.map)){const [x,y]=px(h.q,h.r);hits+=`<polygon data-k="${h.k}" points="${ptsStr(hexPts(x,y,.98))}" fill="transparent"/>`}
  $("#hits").innerHTML=hits;initPanZoom();
  $("#hits").querySelectorAll("polygon").forEach(p=>{p.onclick=()=>{if(UI.dragged)return;clickHex(p.dataset.k)};p.onmouseenter=()=>{UI.hover=p.dataset.k;drawMarks()};p.onmouseleave=()=>{UI.hover=null;drawMarks()}});
  MAP3D.rebuild();
}
function drawFog(){
  if(G.phase==="gen"||G.phase==="built"||G.phase==="setup"||!me()){$("#fog").innerHTML="";return}
  const M=me();
  let s="";
  for(const h of Object.values(G.city.map)){
    const [x,y]=px(h.q,h.r);
    if(!M.seen.has(h.k))s+=`<polygon points="${ptsStr(hexPts(x,y,1.02))}" fill="url(#fogg)"/>`;
    else if(!M.visited.has(h.k))s+=`<polygon points="${ptsStr(hexPts(x,y,1.0))}" fill="#0c0d14" opacity=".45"/>`;
  }
  $("#fog").innerHTML=s;
}

function drawMarks(){if(!G||!$("#marks"))return;let s="";const M=me();
  if(["walk","day","end","court"].includes(G.phase)&&M&&M.clan){
    for(const h of Object.values(G.city.map)){if(!M.seen.has(h.k))continue;const [x,y]=px(h.q,h.r);const D=G.dist[h.k];
      if(D&&D.own)s+=`<polygon points="${ptsStr(hexPts(x,y,.93))}" fill="none" stroke="${FAC[D.own].color}" stroke-width="${Math.abs(D.c)>=4?2.4:1.3}" stroke-opacity=".8" ${Math.abs(D.c)>=4?"":'stroke-dasharray="5 3"'}/>`;
      if(D){const R=DIST[h.t];s+=`<text x="${x}" y="${y+18}" text-anchor="middle" class="bong"><tspan fill="${FAC.cam.color}">${R.cam.g}</tspan><tspan dx="4" fill="${FAC.ana.color}">${R.ana.g}</tspan></text>`}}
    if(G.phase==="walk"&&!M.enc)for(const n of nbrs(M.pos)){const h=G.city.map[n];const [x,y]=px(h.q,h.r);s+=`<polygon points="${ptsStr(hexPts(x,y,.86))}" fill="none" stroke="#d9c9a0" stroke-width="1.2" stroke-dasharray="3 3" opacity=".6"/>`}
    if(UI.hover&&G.phase==="walk"&&M.seen.has(UI.hover)&&UI.hover!==M.pos){const p=bfs(M.pos,UI.hover,M.seen);if(p){const pts=[M.pos,...p].map(k=>px(G.city.map[k].q,G.city.map[k].r));s+=`<polyline points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="var(--lamp)" stroke-width="2" stroke-dasharray="4 4" opacity=".8"/>`;const [x,y]=pts[pts.length-1];s+=`<text x="${x}" y="${y-28}" text-anchor="middle" class="tip">${p.length*30} мин</text>`}}
    for(const h of Object.values(G.city.map)){if(!M.seen.has(h.k))continue;const [x,y]=px(h.q,h.r);const vis=M.visited.has(h.k);s+=`<text x="${x}" y="${y+30}" text-anchor="middle" class="lbl ${vis?"":"dim"}">${vis?h.name:TYPES[h.t].n}</text>`}
    {const n=Math.floor(threatLvl()/2);const list=Object.values(G.city.map).filter(h=>h.t!=="river"&&h.t!=="ely"&&M.seen.has(h.k));for(let i=0;i<Math.min(n,list.length);i++){const h=list[(i*7919+G.night*31)%list.length];const [x,y]=px(h.q,h.r);s+=`<circle class="police" cx="${x-14}" cy="${y-12}" r="2.4" fill="#4a7bff"/><circle class="police p2" cx="${x-9}" cy="${y-12}" r="2.4" fill="#ff3b4a"/>`}}
    if(M.ritual&&G.time<=M.ritual.until){const h=G.city.map[M.ritual.c];const [x,y]=px(h.q,h.r);s+=`<circle cx="${x}" cy="${y}" r="${R*2.6}" fill="none" stroke="#9a86ea" stroke-width="1.5" stroke-dasharray="2 4"/>`}
    if(G.phase==="walk"){const seenB=visibleTo(M);const byHex={};for(const b of seenB)(byHex[b.pos]=byHex[b.pos]||[]).push(b);
      for(const [k,bs] of Object.entries(byHex)){const h=G.city.map[k];const [x,y]=px(h.q,h.r);bs.forEach((b,i)=>{const ritualTrue=M.ritual&&G.time<=M.ritual.until&&hexDist(b.pos,M.ritual.c)<=1;const shown=ritualTrue?b.clan:(b.disguise||b.clan);const col=CLANS[shown].color;
        s+=`<circle cx="${x+14-i*12}" cy="${y+6}" r="7" fill="#0b0c12" stroke="${col}" stroke-width="2"/><text x="${x+14-i*12}" y="${y+9}" text-anchor="middle" font-size="8" font-weight="700" fill="${col}">${CLANS[shown].name[0]}</text>`})}}
    {const h=G.city.map["0,0"];const [x,y]=px(h.q,h.r);if(G.case)s+=`<text x="${x+20}" y="${y-16}" text-anchor="middle" class="haven" style="fill:#ffd36b">✦</text>`}
    {const h=G.city.map[M.haven];const [x,y]=px(h.q,h.r);s+=`<text x="${x}" y="${y-22}" text-anchor="middle" class="haven">⌂</text>`}
    {const h=G.city.map[M.pos];const [x,y]=px(h.q,h.r);const col=CLANS[M.disguise||M.clan].color;s+=`<circle cx="${x}" cy="${y}" r="16" fill="${col}" opacity=".18" class="aura"/><circle cx="${x}" cy="${y}" r="8" fill="${col}" stroke="#fff" stroke-width="2"/>`}}
  $("#marks").innerHTML=s;const m=$("#map");if(m){m.classList.remove("th1","th2","th3");const t=threatTier();if(t)m.classList.add("th"+t)}}

