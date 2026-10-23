/* Рисунок районов генерируется вместе с городом из того же зерна (строки SVG, без DOM). */
/* ============================ ОТРИСОВКА ГЕКСА ============================ */
// Возвращает SVG-фрагмент в локальных координатах (центр 0,0). w — «окна» для мерцания.
function artFor(h,riverPath,map){
  const T=h.t;let s="";const lights=[];
  const box=(x,y,w,hh,fill)=>`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}" fill="${fill}"/>`;
  const windows=(x,y,w,hh,dens,col)=>{let o="";const cols=Math.max(1,Math.floor(w/4)),rows=Math.max(1,Math.floor(hh/5));
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)if(rng()<dens){const lx=x+1+i*4,ly=y+1.5+j*5;o+=`<rect class="win${rng()<.25?" fl":""}" style="transition-delay:${(rng()*2.2).toFixed(2)}s;animation-delay:${(rng()*6).toFixed(2)}s" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="1.8" height="2.2" fill="${col}"/>`}return o};
  const blocks=(n,minW,maxW,minH,maxH,fill,dens,col,spread=26)=>{let o="";for(let i=0;i<n;i++){const w=minW+rng()*(maxW-minW),hh=minH+rng()*(maxH-minH);const x=(rng()*2-1)*spread-w/2,y=(rng()*2-1)*spread-hh/2;o+=box(x,y,w,hh,fill)+windows(x,y,w,hh,dens,col)}return o};
  const trees=(n,spread,col)=>{let o="";for(let i=0;i<n;i++){const x=(rng()*2-1)*spread,y=(rng()*2-1)*spread,r=2.5+rng()*3.5;o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" opacity="${(.6+rng()*.4).toFixed(2)}"/>`}return o};
  const lamp=(x,y)=>`<circle class="lamp" cx="${x}" cy="${y}" r="5" fill="url(#glow)"/><circle cx="${x}" cy="${y}" r="1" fill="#ffe2a8"/>`;
  // улицы — пара линий через гекс
  const streets=(col="#2c3040")=>{let o="";const n=1+rnd(2);for(let i=0;i<n;i++){const a=rnd(3)*60,rad=a*Math.PI/180;o+=`<line x1="${(-40*Math.cos(rad)).toFixed(1)}" y1="${(-40*Math.sin(rad)).toFixed(1)}" x2="${(40*Math.cos(rad)).toFixed(1)}" y2="${(40*Math.sin(rad)).toFixed(1)}" stroke="${col}" stroke-width="3"/>`}return o};
  switch(T){
    case "ely":s+=streets("#3a3324")+`<circle r="17" fill="#3a3122" stroke="#6b5a3a" stroke-width="1.5"/><rect x="-11" y="-8" width="22" height="16" fill="#2a241a"/>`+windows(-11,-8,22,16,.9,"#f3cf86")+lamp(-24,14)+lamp(24,-14);break;
    case "gov":s+=streets()+`<rect x="-18" y="-10" width="36" height="20" fill="#2a3142"/><polygon points="-20,-10 0,-20 20,-10" fill="#323a4e"/>`+windows(-18,-8,36,16,.7,"#f2d79b")+lamp(-26,18)+lamp(26,18);break;
    case "biz":s+=blocks(5,7,13,12,26,"#273046",.6,"#bcd6ff",20);break;
    case "old":s+=streets("#3a3036")+blocks(9,6,10,6,10,"#33282e",.45,"#f2c27a",24)+lamp(rnd(20)-10,rnd(20)-10);break;
    case "cath":s+=streets("#352d38")+`<rect x="-10" y="-4" width="20" height="22" fill="#352c3a"/><polygon points="-6,-4 0,-30 6,-4" fill="#3e3444"/><circle cy="4" r="3.5" fill="#e9c27a" class="win fl"/>`+blocks(3,6,9,6,9,"#2e2732",.3,"#f2c27a",26);break;
    case "theatre":s+=streets("#3a2638")+`<rect x="-16" y="-9" width="32" height="18" rx="2" fill="#3a2337"/><rect x="-14" y="6" width="28" height="3" fill="#ff9fcb" class="neon"/>`+windows(-16,-9,32,14,.5,"#ffd2a8")+lamp(-24,16)+lamp(24,16);break;
    case "club":{s+=streets("#33233b")+blocks(5,8,12,8,12,"#2c1f36",.35,"#ffb3e0",24);for(let i=0;i<5;i++){const c=pick(["#ff4fb0","#4ff0ff","#b46bff"]);s+=`<rect class="neon" style="animation-delay:${(rng()*3).toFixed(2)}s" x="${(rng()*44-22).toFixed(1)}" y="${(rng()*44-22).toFixed(1)}" width="${(4+rng()*8).toFixed(1)}" height="1.6" fill="${c}"/>`}break}
    case "uni":s+=streets()+`<rect x="-20" y="-12" width="40" height="12" fill="#26314a"/><rect x="-8" y="2" width="16" height="14" fill="#26314a"/>`+windows(-20,-12,40,12,.6,"#ffe6a8")+trees(6,26,"#1f3326");break;
    case "hosp":s+=streets()+`<rect x="-16" y="-14" width="32" height="26" fill="#22323a"/><rect x="-2.5" y="-24" width="5" height="12" fill="#e65060"/><rect x="-6" y="-20.5" width="12" height="5" fill="#e65060"/>`+windows(-16,-12,32,22,.75,"#dff3ff");break;
    case "market":{s+=streets("#3a3426");for(let i=0;i<7;i++){const x=rng()*40-20,y=rng()*40-20;s+=`<polygon points="${x-5},${y+3} ${x},${y-3} ${x+5},${y+3}" fill="${pick(["#4a3a26","#3d3a2a","#4b2f2a"])}"/>`}s+=lamp(0,0);break}
    case "res":s+=streets()+blocks(7,7,12,7,12,"#262a36",.55,"#ffd88f",24)+trees(3,26,"#1d2b22");break;
    case "slum":s+=blocks(7,5,9,5,8,"#2c2723",.15,"#ffb15a",25)+`<circle class="fire" cx="${rnd(20)-10}" cy="${rnd(20)-10}" r="6" fill="url(#fire)"/>`;break;
    case "ind":s+=blocks(3,14,20,9,14,"#2a2a2a",.15,"#ffb46a",18)+`<rect x="10" y="-26" width="4" height="18" fill="#333"/><circle cx="12" cy="-27" r="1.4" fill="#ff5a4a" class="win fl"/>`;break;
    case "rail":s+=`<line x1="-40" y1="-6" x2="40" y2="-6" stroke="#3b3f48" stroke-width="2"/><line x1="-40" y1="6" x2="40" y2="6" stroke="#3b3f48" stroke-width="2"/>`+`<rect x="-14" y="-22" width="28" height="12" fill="#2a2f3a"/>`+windows(-14,-22,28,12,.7,"#ffe2a0")+`<rect x="-30" y="2" width="22" height="7" fill="#3a404d"/>`+windows(-30,2,22,7,.8,"#fff1c0");break;
    case "park":s+=`<ellipse cx="${rnd(10)-5}" cy="${rnd(10)-5}" rx="12" ry="7" fill="#132233" stroke="#24405c" stroke-width="1"/>`+trees(16,28,"#22402c")+lamp(-18,18);break;
    case "edge":{s+=trees(6,30,"#29331f");for(let i=0;i<5;i++){const x=rng()*44-22,y=rng()*44-22;s+=box(x,y,7,4,"#2a2c28")}s+=`<line x1="-36" y1="-20" x2="36" y2="20" stroke="#2c3a2c" stroke-width="1" stroke-dasharray="2 4"/>`;break}
    case "cem":{s+=trees(7,28,"#1f2e24");for(let i=0;i<14;i++){const x=rng()*48-24,y=rng()*48-24;s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="2.4" height="4" fill="#5b625f"/><rect x="${(x-1).toFixed(1)}" y="${(y+1).toFixed(1)}" width="4.4" height="1" fill="#5b625f"/>`}s+=`<rect x="-6" y="-6" width="12" height="10" fill="#3a403d"/><circle cy="-1" r="1.4" fill="#e6c27a" class="win fl"/>`;break}
    case "port":{s+=`<rect x="-40" y="4" width="80" height="40" fill="#0f1a26"/>`;for(let i=0;i<5;i++){s+=box(rng()*44-30,rng()*14-14,10,5,pick(["#5a2f2a","#2f4a5a","#5a532a","#3a3a3a"]))}s+=`<line x1="18" y1="-24" x2="18" y2="4" stroke="#6a6a6a" stroke-width="1.6"/><line x1="10" y1="-22" x2="30" y2="-22" stroke="#6a6a6a" stroke-width="1.6"/><circle cx="30" cy="-22" r="1.3" fill="#ff5a4a" class="win fl"/>`+lamp(-20,2);break}
  }
  return {svg:s};
}
function riverSvg(map,path){
  // лента воды через центры речных гексов
  const pts=path.map(k=>px(map[k].q,map[k].r));
  if(pts.length<2)return "";
  // продлеваем за край
  const ext=(a,b)=>[a[0]+(a[0]-b[0])*0.8,a[1]+(a[1]-b[1])*0.8];
  const all=[ext(pts[0],pts[1]),...pts,ext(pts[pts.length-1],pts[pts.length-2])];
  let d=`M${all[0][0].toFixed(1)},${all[0][1].toFixed(1)}`;
  for(let i=1;i<all.length-1;i++){const m=[(all[i][0]+all[i+1][0])/2,(all[i][1]+all[i+1][1])/2];d+=` Q${all[i][0].toFixed(1)},${all[i][1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`}
  d+=` L${all[all.length-1][0].toFixed(1)},${all[all.length-1][1].toFixed(1)}`;
  let bridges="";
  path.forEach((k,i)=>{if(!map[k].bridge||i===0||i===path.length-1)return;const [x,y]=px(map[k].q,map[k].r);const a=pts[Math.min(i+1,pts.length-1)],b=pts[Math.max(0,i-1)];const ang=Math.atan2(a[1]-b[1],a[0]-b[0])+Math.PI/2;
    const dx=Math.cos(ang)*22,dy=Math.sin(ang)*22;bridges+=`<line x1="${(x-dx).toFixed(1)}" y1="${(y-dy).toFixed(1)}" x2="${(x+dx).toFixed(1)}" y2="${(y+dy).toFixed(1)}" stroke="#4a4a52" stroke-width="7" stroke-linecap="round"/><line x1="${(x-dx).toFixed(1)}" y1="${(y-dy).toFixed(1)}" x2="${(x+dx).toFixed(1)}" y2="${(y+dy).toFixed(1)}" stroke="#6b6b75" stroke-width="1" stroke-dasharray="3 5"/>`+
      `<circle class="lamp" cx="${(x-dx*.6).toFixed(1)}" cy="${(y-dy*.6).toFixed(1)}" r="5" fill="url(#glow)"/><circle class="lamp" cx="${(x+dx*.6).toFixed(1)}" cy="${(y+dy*.6).toFixed(1)}" r="5" fill="url(#glow)"/>`});
  return `<path d="${d}" fill="none" stroke="#0e1826" stroke-width="34" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#132238" stroke-width="26" stroke-linecap="round"/>
    <path class="ripple" d="${d}" fill="none" stroke="#3a5a80" stroke-width="1" stroke-dasharray="2 14" opacity=".7"/><path class="ripple r2" d="${d}" fill="none" stroke="#5a7aa0" stroke-width=".8" stroke-dasharray="1 22" opacity=".5"/>${bridges}`;
}

