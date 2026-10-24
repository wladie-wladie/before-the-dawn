/* ============================ 3D-КАРТА ============================
   Всё внутри одной функции-модуля, чтобы имена сцены не пересекались с именами игры.
   Наружу: MAP3D.on, setOn(), rebuild(), update(), moved(k), focus(). */
const MAP3D=(()=>{if(typeof THREE==="undefined")return {on:false,ok:false,setOn(){},rebuild(){},update(){},moved(){},focus(){}};
const W=0.1, HR=R*W*0.985;
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
let seed=0,wx="rain";
/* ---------- палитра ---------- */
const P={sky:0x06070d,fog:0x121624,fogD:.017,
  sodium:0xff9440, cold:0xcfdcff,
  neon:[0x39ff88,0xff3f9e,0xa86bff,0xff3a30],   // зелёный, розовый, фиолетовый, красный — как вывески в Bloodlines
  facade:0x1d1e24,facade2:0x23201f,water:0x070b12,street:0x16181d,
  cam:0xcfa661,ana:0xc4544b,me:0xe8a0b8,tree:0x18261c,grave:0x5d625f,label:"#e8e3d6"};
let WATER=[],LAMPS=[],PL=[],world=null,precip=null,mist=[],hexes={},labels=[],owner={},blinkers=[],flick=[];
/* ---------- текстуры ---------- */
// окна: горит мало, и по-разному — тёплые жилые, холодные «телевизорные», редкие цветные
function windowTex(pLit,warmth){const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");
  g.fillStyle="#000";g.fillRect(0,0,128,128);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){if(Math.random()>pLit)continue;const r=Math.random();
    g.fillStyle=r<warmth?"#f0b06a":r<warmth+.2?"#8fb0ff":r<.97?"#d8c8a8":"#ff5a4a";g.globalAlpha=.25+Math.random()*.6;g.fillRect(x*16+4,y*16+5,8,7)}
  g.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
function radialTex(inner=1){const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");const gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,`rgba(255,255,255,${inner})`);gr.addColorStop(.35,"rgba(255,255,255,.35)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
// конус света: ярче у лампы, растворяется к земле
function coneTex(){const c=document.createElement("canvas");c.width=4;c.height=128;const g=c.getContext("2d");const gr=g.createLinearGradient(0,0,0,128);
  gr.addColorStop(0,"rgba(255,255,255,.9)");gr.addColorStop(.5,"rgba(255,255,255,.25)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,4,128);return new THREE.CanvasTexture(c)}
function mistTex(){const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d");
  for(let i=0;i<40;i++){const x=Math.random()*256,y=Math.random()*256,r=30+Math.random()*70;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,"rgba(255,255,255,.18)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,256,256)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
// вывеска: рамка и пара абстрактных знаков (без читаемых надписей)
function signTex(col){const c=document.createElement("canvas");c.width=64;c.height=160;const g=c.getContext("2d");const css="#"+new THREE.Color(col).getHexString();
  g.fillStyle="#050505";g.fillRect(0,0,64,160);g.strokeStyle=css;g.lineWidth=5;g.strokeRect(6,6,52,148);g.lineWidth=6;g.lineCap="round";
  for(let i=0;i<4;i++){const y=28+i*32;g.beginPath();if(i%2){g.arc(32,y,10,0,Math.PI*1.6)}else{g.moveTo(18,y-8);g.lineTo(46,y+8);g.moveTo(46,y-8);g.lineTo(18,y+8)}g.stroke()}
  return new THREE.CanvasTexture(c)}
const TX={pool:radialTex(1),cone:coneTex(),mist:mistTex(),dot:radialTex(1)};


/* ---------- нарисованные текстуры от GPT (фасады, земля, крыши) ---------- */
const FAC_NAMES=["brick1","brick2","bar","stone","metal","glass","mansion","gothic","ruin"];
const GROUND_NAMES=["asphalt","paving","cobble","tar","tiles","grass","gravel","concrete","water"];
const ART={fac:{},gnd:{},ready:false};
function bright(img,dim){// эмиссия = сама картинка приглушённо + яркие окна во всю силу
  const c=document.createElement("canvas");c.width=img.width;c.height=img.height;const g=c.getContext("2d");g.drawImage(img,0,0);const d=g.getImageData(0,0,c.width,c.height);
  for(let i=0;i<d.data.length;i+=4){const r=d.data[i],gg=d.data[i+1],b=d.data[i+2];const L=.3*r+.59*gg+.11*b;const k=L>105?Math.min(1.6,(L-80)/70):dim;d.data[i]=Math.min(255,r*k);d.data[i+1]=Math.min(255,gg*k);d.data[i+2]=Math.min(255,b*k)}
  g.putImageData(d,0,0);return c}
function loadArt(done){const list=[...FAC_NAMES.map(n=>["fac",n,"art/f_"+n+".webp"]),...GROUND_NAMES.map(n=>["gnd",n,"art/g_"+n+".webp"])];let left=list.length;
  for(const [kind,n,src] of list){const im=new Image();im.onload=()=>{ART[kind][n]=im;if(--left===0)fin()};im.onerror=()=>{if(--left===0)fin()};im.src=src}
  function fin(){ART.ready=Object.keys(ART.fac).length>0;done()}}
const FAC_BY_TYPE={res:["brick1","brick2"],old:["stone","brick2"],club:["brick1","brick2"],theatre:["stone"],ely:["mansion"],gov:["mansion"],cath:["gothic"],uni:["stone"],hosp:["glass"],biz:["glass"],
  market:["brick2"],slum:["ruin"],edge:["ruin"],ind:["metal"],rail:["metal"],port:["metal"],cem:["gothic"],park:["stone"]};
let CUR_T="res";const FM={};
function facMat(n){if(FM[n])return FM[n];const im=ART.fac[n];if(!im)return null;
  const t=new THREE.Texture(im);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;t.needsUpdate=true;
  const e=new THREE.CanvasTexture(bright(im,n==="glass"?.35:.42));e.wrapS=e.wrapT=THREE.RepeatWrapping;
  return FM[n]=new THREE.MeshStandardMaterial({map:t,emissiveMap:e,emissive:0xffffff,emissiveIntensity:1,roughness:.88,metalness:.05})}
const GMT={};function gndMat(n,rep=3){const key=n+rep;if(GMT[key])return GMT[key];const im=ART.gnd[n];if(!im)return null;const t=new THREE.Texture(im);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=8;t.needsUpdate=true;
  return GMT[key]=new THREE.MeshStandardMaterial({map:t,roughness:n==="water"?.42:.5,metalness:n==="water"?.15:.2,color:n==="water"?0x5a6a80:0x8890a0})}

let M={};function mats(){const wl=[windowTex(.10,.75),windowTex(.16,.7),windowTex(.06,.5),windowTex(.22,.8)];
  M={walls:wl.map((t,i)=>new THREE.MeshStandardMaterial({color:i%2?P.facade2:P.facade,roughness:.88,metalness:.05,emissive:0xffffff,emissiveMap:t,emissiveIntensity:[1.5,1.1,1.8,.9][i]})),
     glass:new THREE.MeshStandardMaterial({color:0x0e131c,roughness:.3,metalness:.5,emissive:0xffffff,emissiveMap:windowTex(.18,.2),emissiveIntensity:.9}),
     roof:new THREE.MeshStandardMaterial({color:0x121318,roughness:.95}),
     stone:new THREE.MeshStandardMaterial({color:0x2a2828,roughness:.9}),
     metal:new THREE.MeshStandardMaterial({color:0x2e3138,roughness:.55,metalness:.6}),
     rust:new THREE.MeshStandardMaterial({color:0x3a2a22,roughness:.8,metalness:.3}),
     tree:new THREE.MeshStandardMaterial({color:P.tree,roughness:1}),
     grave:new THREE.MeshStandardMaterial({color:P.grave,roughness:1}),
     water:new THREE.MeshStandardMaterial({color:P.water,roughness:.18,metalness:.6}),
     street:new THREE.MeshStandardMaterial({color:P.street,roughness:.38,metalness:.25}),  // мокрый асфальт
     curb:new THREE.MeshStandardMaterial({color:0x2a2c31,roughness:.8}),
     line:new THREE.MeshStandardMaterial({color:0x6a5a2a,roughness:.6,emissive:0x2a2008}),
     sodium:new THREE.MeshBasicMaterial({color:new THREE.Color(P.sodium).multiplyScalar(1.55)}),   // лампы ярче единицы — их подхватывает bloom
     cold:new THREE.MeshBasicMaterial({color:new THREE.Color(P.cold).multiplyScalar(1.4)}),
     red:new THREE.MeshBasicMaterial({color:new THREE.Color(0xff2a20).multiplyScalar(2.5)}),
     fire:new THREE.MeshBasicMaterial({color:new THREE.Color(0xff7a2a).multiplyScalar(2.4)}),
     warm:new THREE.MeshBasicMaterial({color:new THREE.Color(0xffc070).multiplyScalar(1.6)})}}
const wall=()=>M.walls[Math.floor(Math.random()*M.walls.length)];

/* ---------- геометрия ---------- */
function boxGeo(w,h,d){const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;
  const f=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];const tx=ART.ready?1.05:1/.55,ty=ART.ready?.9:2;for(let i=0;i<24;i++){const [su,sv]=f[Math.floor(i/4)];uv.setXY(i,uv.getX(i)*su/tx,uv.getY(i)*sv/ty)}return g}
function add(grp,mesh,x,y,z){mesh.position.set(x,y,z);grp.add(mesh);return mesh}
const rr=(a,b)=>a+Math.random()*(b-a);
// точка внутри гекса с запасом от края
const insideHex=(x,z,k)=>Math.abs(x)<=HR*.866*k&&Math.abs(z)+Math.abs(x)*.577<=HR*k;
function inHex(k=.72){for(;;){const x=rr(-1,1)*HR*k,z=rr(-1,1)*HR*k;if(insideHex(x,z,k))return [x,z]}}
// коробка не вылезает за гекс: ужимаем, пока все углы внутри
function fitBox(x,z,w,d,rot=0){for(let i=0;i<8;i++){const c=Math.cos(rot),s=Math.sin(rot);let ok=true;
    for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const px=x+(a*w/2)*c-(b*d/2)*s,pz=z+(a*w/2)*s+(b*d/2)*c;if(!insideHex(px,pz,.93)){ok=false;break}}
    if(ok)return [w,d];w*=.85;d*=.85}return [w,d]}
function block(grp,x,z,w,h,d,mat,rot=0,shop=false){[w,d]=fitBox(x,z,w,d,rot);
  const fp=grp.userData.fp||(grp.userData.fp=[]);for(let i=0;i<6;i++){const r=Math.hypot(w,d)/2;if(!fp.some(o=>Math.hypot(o.x-x,o.z-z)<(o.r+r)*.82))break;w*=.85;d*=.85}
  {const r=Math.hypot(w,d)/2;if(fp.some(o=>Math.hypot(o.x-x,o.z-z)<(o.r+r)*.82))return {skip:true,w,h,d};fp.push({x,z,r})}
  if(ART.ready&&mat!==M.roof){const pool=FAC_BY_TYPE[CUR_T]||FAC_BY_TYPE.res;mat=facMat(pool[Math.floor(Math.random()*pool.length)])||mat}
  mat=mat||wall();let m;
  if(shop&&ART.ready&&h>1.1){// первый этаж — бар с витриной, выше — жилой кирпич
    m=add(grp,new THREE.Mesh(boxGeo(w,.9,d),facMat("bar")),x,.45,z);m.rotation.y=rot;const u=add(grp,new THREE.Mesh(boxGeo(w,h-.9,d),mat),x,.9+(h-.9)/2,z);u.rotation.y=rot}
  else{m=add(grp,new THREE.Mesh(boxGeo(w,h,d),mat),x,h/2,z);m.rotation.y=rot}
  const r=add(grp,new THREE.Mesh(new THREE.BoxGeometry(w*1.02,.08,d*1.02),(ART.ready&&gndMat("tar",1))||M.roof),x,h+.04,z);r.rotation.y=rot;
  // на некоторых крышах — водонапорная башня, как над Сиэтлом из Bloodlines 2
  if(h>1.2&&w>.6&&Math.random()<.18)waterTower(grp,x+rr(-.15,.15)*w,h,z+rr(-.15,.15)*d);
  return {m,w,d,h}}
function waterTower(grp,x,y,z){const t=new THREE.Group();for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]])add(t,new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.3,4),M.metal),a*.09,.15,b*.09);
  add(t,new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.26,10),M.rust),0,.43,0);add(t,new THREE.Mesh(new THREE.ConeGeometry(.16,.12,10),M.roof),0,.62,0);t.position.set(x,y,z);grp.add(t)}
// фонарь: столб, лампа, конус в тумане, пятно на асфальте
function lamp(grp,x,z,kind,h=.9){const col=kind==="cold"?P.cold:P.sodium;
  add(grp,new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,h,5),M.metal),x,h/2,z);
  add(grp,new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),kind==="cold"?M.cold:M.sodium),x,h,z);
  const cone=add(grp,new THREE.Mesh(new THREE.ConeGeometry(.42,h,16,1,true),new THREE.MeshBasicMaterial({color:col,map:TX.cone,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})),x,h/2,z);
  // ореол вокруг лампы в мокром воздухе
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.pool,color:col,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.set(.9,.9,1);add(grp,halo,x,h,z);
  const pool=add(grp,new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9),new THREE.MeshBasicMaterial({color:col,map:TX.pool,transparent:true,opacity:kind==="cold"?.4:.55,blending:THREE.AdditiveBlending,depthWrite:false})),x,.03,z);pool.rotation.x=-Math.PI/2;
  if(Math.random()<.12)flick.push({m:pool,c:cone,base:pool.material.opacity,ph:Math.random()*9});   // изредка фонарь «моргает»
  LAMPS.push({grp,x,y:h,z,col});return pool}
function colorPool(grp,x,z,col,s=1.2,o=.28){const p=add(grp,new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({color:col,map:TX.pool,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false})),x,.035,z);p.rotation.x=-Math.PI/2;return p}
// неоновая вывеска на фасаде + цветное пятно на улице под ней
function sign(grp,b,x,z,col){if(b.skip)return;const tex=signTex(col);const m=new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color(1,1,1).multiplyScalar(1.8)});
  const h=Math.min(1,b.h*.75);const s=add(grp,new THREE.Mesh(new THREE.BoxGeometry(.06,h,.3),[M.roof,M.roof,M.roof,M.roof,m,m]),x+b.w/2+.05,b.h*.5,z+b.d/2-.16);s.rotation.y=Math.PI/2;
  colorPool(grp,x+b.w/2+.35,z+b.d/2+.25,col,1.7,.5)}
function redLight(grp,x,y,z){const m=add(grp,new THREE.Mesh(new THREE.SphereGeometry(.05,6,5),M.red.clone()),x,y,z);blinkers.push({m,ph:Math.random()*6});return m}
function tree(grp,x,z,s=1){treeNice(grp,x,z,s)}
function streets(){return []}
function streetsOld(grp,n=1+Math.floor(Math.random()*2)){const out=[];for(let i=0;i<n;i++){const a=Math.floor(Math.random()*3)*Math.PI/3+Math.PI/6;
  const s=add(grp,new THREE.Mesh(new THREE.BoxGeometry(HR*1.72,.02,.5),streetMat()),0,.01,0);s.rotation.y=a;
  for(let k=-3;k<=3;k++){const d=add(grp,new THREE.Mesh(new THREE.BoxGeometry(.22,.005,.025),M.line),Math.cos(-a)*k*.5,.022,Math.sin(-a)*k*.5);d.rotation.y=a}
  for(const sd of [-1,1]){const c=add(grp,new THREE.Mesh(new THREE.BoxGeometry(HR*1.72,.035,.06),M.curb),Math.cos(a+Math.PI/2)*.28*sd*-1,.017,Math.sin(a+Math.PI/2)*.28*sd);c.rotation.y=a}
  out.push(a)}return out}
// один-два фонаря на квартал, у улицы; холодные реже
function streetLamps(){}
function streetLampsOld(grp,angles,n){for(let i=0;i<n;i++){const a=angles[i%angles.length]||0;const t=rr(-.55,.55)*HR;const off=.34*(i%2?1:-1);
  const x=Math.cos(-a)*t+Math.cos(-a+Math.PI/2)*off,z=Math.sin(-a)*t+Math.sin(-a+Math.PI/2)*off;if(insideHex(x,z,.9))lamp(grp,x,z,Math.random()<.3?"cold":"sodium")}}

/* ---------- кварталы по типам районов ---------- */
const BUILD={
 ely(g){const a=streets(g,2);const b=block(g,0,0,2.4,1.3,1.8,M.walls[0]);add(g,new THREE.Mesh(new THREE.CylinderGeometry(.85,1.1,.5,12),M.stone),0,1.55,0);
   add(g,new THREE.Mesh(new THREE.SphereGeometry(.7,16,10,0,Math.PI*2,0,Math.PI/2),M.stone),0,1.8,0);add(g,new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,.05),M.warm),0,.7,.92);
   colorPool(g,0,1.4,0xffb060,2.2,.35);for(const [x,z] of [[-1.7,1.5],[1.7,1.5]])lamp(g,x,z,"sodium",1)},
 gov(g){const a=streets(g);block(g,0,0,2.8,1.2,1.5,M.walls[2]);for(let i=-3;i<=3;i++)add(g,new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1,6),M.stone),i*.38,.5,.8);
   const p=add(g,new THREE.Mesh(new THREE.ConeGeometry(1.8,.45,4,1),M.stone),0,1.42,0);p.rotation.y=Math.PI/4;p.scale.z=.5;streetLamps(g,a,2)},
 biz(g){const a=streets(g,1);let tall=null;for(let i=0;i<5;i++){const [x,z]=inHex(.55);const h=rr(2.2,5.8);const b=block(g,x,z,rr(.7,1.1),h,rr(.7,1.1),M.glass);if(!tall||h>tall.h)tall={x,z,h}}
   redLight(g,tall.x,tall.h+.12,tall.z);streetLamps(g,a,1)},
 old(g){const a=streets(g);for(let i=0;i<12;i++){const [x,z]=inHex();const w=rr(.45,.8),h=rr(.6,1.1),d=rr(.45,.8),rot=rr(0,.4);const b=block(g,x,z,w,h,d,null,rot);
   if(b.skip)continue;const rf=add(g,new THREE.Mesh(new THREE.ConeGeometry(Math.max(b.w,b.d)*.72,.4,4),(ART.ready&&gndMat("tiles",2))||M.roof),x,h+.22,z);rf.rotation.y=Math.PI/4+rot}streetLamps(g,a,1)},
 cath(g){const a=streets(g);block(g,0,.3,1.1,1.7,2.2,M.stone);add(g,new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,2.4,8),M.stone),0,1.2,-1);
   add(g,new THREE.Mesh(new THREE.ConeGeometry(.4,2.2,8),M.roof),0,3.5,-1);add(g,new THREE.Mesh(new THREE.CircleGeometry(.22,12),M.warm),0,1.3,1.41);colorPool(g,0,1.9,0xffa050,1.4,.3);
   for(let i=0;i<5;i++){const [x,z]=inHex();if(Math.abs(x)>1.1)block(g,x,z,.55,.7,.55)}},
 theatre(g){const a=streets(g);const b=block(g,0,0,2.4,1.4,1.5,M.walls[1]);add(g,new THREE.Mesh(new THREE.BoxGeometry(2,.12,.05),M.warm),0,1.05,b.d/2+.03);colorPool(g,0,1.3,0xffc070,2,.32);
   sign(g,b,0,0,P.neon[1]);for(let i=0;i<5;i++){const [x,z]=inHex();if(Math.abs(z)>1.1)block(g,x,z,.65,rr(.7,1.3),.65)}streetLamps(g,a,1)},
 club(g){const a=streets(g,2);const bs=[];for(let i=0;i<7;i++){const [x,z]=inHex(.62);const h=rr(1.2,1.9),w=rr(.65,1);bs.push({b:block(g,x,z,w,h,w,null,0,i<4),x,z})}
   // две вывески разных цветов на весь квартал — не на каждый дом
   const cols=[...P.neon].sort(()=>Math.random()-.5);bs.slice(0,2).forEach((o,i)=>sign(g,o.b,o.x,o.z,cols[i]));streetLamps(g,a,1)},
 uni(g){const a=streets(g);block(g,0,-.6,2.8,1,1);block(g,-1,.9,.9,.9,1.1);block(g,1.1,.9,.9,1.2,1.1);for(let i=0;i<8;i++){const [x,z]=inHex();if(Math.abs(x)<1.6&&Math.abs(z)<1.5)continue;tree(g,x,z,.9)}streetLamps(g,a,1)},
 hosp(g){const a=streets(g);const b=block(g,0,0,2.2,2,1.7,M.walls[3]);add(g,new THREE.Mesh(new THREE.BoxGeometry(.6,.18,.18),M.red),0,2.3,0);add(g,new THREE.Mesh(new THREE.BoxGeometry(.18,.6,.18),M.red),0,2.3,0);
   colorPool(g,0,1.3,0xdff0ff,1.8,.3);streetLamps(g,a,1)},
 market(g){const a=streets(g);for(let i=0;i<12;i++){const [x,z]=inHex();const t=add(g,new THREE.Mesh(new THREE.ConeGeometry(.4,.4,4),new THREE.MeshStandardMaterial({color:[0x3a2e22,0x2e2c24,0x3b2622][i%3],roughness:1})),x,.42,z);t.rotation.y=Math.PI/4;add(g,new THREE.Mesh(new THREE.BoxGeometry(.45,.22,.45),M.roof),x,.11,z)}
   colorPool(g,0,0,0xffa050,1.8,.25);streetLamps(g,a,1)},
 res(g){const a=streets(g);for(let i=0;i<8;i++){const [x,z]=inHex(.66);block(g,x,z,rr(.6,1.1),rr(1,2),rr(.55,.9),null,rr(0,.3))}for(let i=0;i<3;i++){const [x,z]=inHex();tree(g,x,z,.7)}streetLamps(g,a,Math.random()<.5?1:2)},
 slum(g){for(let i=0;i<11;i++){const [x,z]=inHex();block(g,x,z,rr(.4,.75),rr(.3,.65),rr(.4,.65),M.walls[2],rr(-.6,.6))}const [fx,fz]=inHex(.4);
   add(g,new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.24,8),M.rust),fx,.12,fz);add(g,new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),M.fire),fx,.27,fz);
   const p=colorPool(g,fx,fz,0xff7a2a,1.3,.45);flick.push({m:p,base:.45,ph:Math.random()*9,fire:true})},
 ind(g){for(let i=0;i<4;i++){const [x,z]=inHex(.58);block(g,x,z,rr(1.1,1.6),rr(.7,1),rr(.9,1.3),M.walls[2])}const [x,z]=inHex(.5);
   add(g,new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,3,8),M.rust),x,1.5,z);redLight(g,x,3.1,z);lamp(g,...inHex(.8),"cold",1.2)},
 rail(g){for(const dz of[-.35,.35])add(g,new THREE.Mesh(new THREE.BoxGeometry(HR*1.7,.05,.06),M.metal),0,.04,dz);
   block(g,0,-1.3,2.2,.9,.9,M.walls[1]);add(g,new THREE.Mesh(new THREE.BoxGeometry(1.8,.36,.42),M.glass),-1,.22,0);lamp(g,-1.5,1.1,"cold",1);lamp(g,1.5,1.1,"sodium",1)},
 park(g){const p=add(g,new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.02,20),M.water),rr(-.5,.5),.02,rr(-.5,.5));p.scale.z=.6;for(let i=0;i<20;i++){const [x,z]=inHex(.82);tree(g,x,z,rr(.7,1.15))}lamp(g,-1.1,1.3,"sodium")},
 edge(g){for(let i=0;i<5;i++){const [x,z]=inHex();block(g,x,z,.55,.32,.38,M.roof)}for(let i=0;i<7;i++){const [x,z]=inHex(.85);tree(g,x,z,.8)}
   const [x,z]=inHex(.4);add(g,new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,2.2,4),M.metal),x,1.1,z);redLight(g,x,2.25,z)},
 cem(g){for(let i=0;i<24;i++){const [x,z]=inHex();add(g,new THREE.Mesh(new THREE.BoxGeometry(.11,.26,.05),M.grave),x,.13,z)}block(g,0,0,.75,.75,.75,M.stone);
   add(g,new THREE.Mesh(new THREE.ConeGeometry(.56,.48,4),M.roof),0,1,0).rotation.y=Math.PI/4;for(let i=0;i<5;i++){const [x,z]=inHex(.6);add(g,new THREE.Mesh(new THREE.SphereGeometry(.025,5,4),M.fire),x,.1,z)}
   for(let i=0;i<6;i++){const [x,z]=inHex(.85);tree(g,x,z,.8)}},
 port(g){add(g,new THREE.Mesh(new THREE.BoxGeometry(HR*1.6,.02,HR*.75),M.water),0,.02,HR*.42);
   for(let i=0;i<9;i++){const [x,z]=inHex(.58);if(z>.35)continue;add(g,new THREE.Mesh(new THREE.BoxGeometry(.85,.32,.34),new THREE.MeshStandardMaterial({color:[0x4a2a24,0x24384a,0x4a4424,0x30302e][i%4],roughness:.8})),x,.16+Math.floor(Math.random()*2)*.33,z)}
   for(const x of[-1,1.1]){add(g,new THREE.Mesh(new THREE.BoxGeometry(.11,2.6,.11),M.rust),x,1.3,.15);add(g,new THREE.Mesh(new THREE.BoxGeometry(.09,.09,1.9),M.rust),x,2.6,.8);redLight(g,x,2.72,1.7)}
   lamp(g,-.2,-.9,"cold",1.3)},
 river(g){},
};

/* ---------- город ---------- */
function streetMat(){if(!ART.ready||!ART.gnd.asphalt)return M.street;if(!GMT.street){const t=new THREE.Texture(ART.gnd.asphalt);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,.5);t.needsUpdate=true;GMT.street=new THREE.MeshStandardMaterial({map:t,roughness:.35,metalness:.25,color:0x9098a8})}return GMT.street}
const GROUND_BY_TYPE={old:"cobble",park:"grass",cem:"grass",edge:"gravel",slum:"gravel",ind:"concrete",port:"concrete",rail:"concrete",ely:"paving",gov:"paving"};
const GM=[];function groundMat(t){if(ART.ready){const m=gndMat(GROUND_BY_TYPE[t]||"paving",4);if(m)return m}const m=new THREE.MeshStandardMaterial({color:new THREE.Color(TYPES[t].base).multiplyScalar(.75),roughness:.85,metalness:.05});m.userData.base=m.color.clone();GM.push(m);return m}
function ownership(c){owner={};const hs=Object.values(c.map).filter(h=>h.t!=="ely"&&h.t!=="river");const lean={slum:.9,ind:.6,edge:.7,port:.5,club:.5,market:.3,rail:.3};
  [...hs].sort((a,b)=>(a.ring-b.ring)+(Math.random()-.5)*2.2).slice(0,Math.round(hs.length*.3)).forEach(h=>owner[h.k]="cam");
  hs.filter(h=>!owner[h.k]).sort((a,b)=>(b.ring+(lean[b.t]||0)*3+Math.random()*2)-(a.ring+(lean[a.t]||0)*3+Math.random()*2)).slice(0,Math.round(hs.length*.25)).forEach(h=>owner[h.k]="ana")}
function skyDome(){// небо: сверху почти чёрное, у горизонта — грязное зарево города
  const g=new THREE.SphereGeometry(300,24,12);const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:"varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"varying vec3 p;void main(){float h=clamp(p.y/300.,0.,1.);vec3 top=vec3(.012,.014,.025);vec3 hor=vec3(.11,.07,.09);gl_FragColor=vec4(mix(hor,top,pow(h,.35)),1.);}"});return new THREE.Mesh(g,m)}
function setWeather(w,silent){wx=w;if(!silent)lsSet("btd3d-wx",w);if(precip){scene.remove(precip);precip.geometry.dispose()}precip=null;
  if(w==="rain"){const N=5000,pos=new Float32Array(N*6);for(let i=0;i<N;i++){const x=rr(-45,45),y=rr(0,40),z=rr(-40,40);pos.set([x,y,z,x+.04,y-.55,z],i*6)}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));precip=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x8a9ac0,transparent:true,opacity:.22}));precip.userData.kind="rain"}
  if(w==="snow"){const N=6000,pos=new Float32Array(N*3);for(let i=0;i<N;i++)pos.set([rr(-45,45),rr(0,40),rr(-40,40)],i*3);
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));precip=new THREE.Points(g,new THREE.PointsMaterial({color:0xdfe6f5,size:.12,map:TX.dot,transparent:true,opacity:.8,depthWrite:false}));precip.userData.kind="snow"}
  if(precip)scene.add(precip);
  // снег светлее и туманнее, как в Сиэтле Bloodlines 2
  if(scene.fog){scene.fog.color.setHex(w==="snow"?0x1d2232:P.fog);scene.fog.density=w==="snow"?.021:w==="clear"?.012:P.fogD}
  // под снегом земля и крыши светлеют, асфальт — серая каша
  const snow=w==="snow";if(M.street)M.street.color.setHex(snow?0x3a3e48:P.street);if(M.roof)M.roof.color.setHex(snow?0x6a7080:0x121318);if(M.tree)M.tree.color.setHex(snow?0x48524c:P.tree);
  for(const m of GM)m.color.copy(snow?new THREE.Color(0x5c6270):m.userData.base);
  document.querySelectorAll("[data-wx]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.wx===w))}
const cam={target:new THREE.Vector3(),dist:30,theta:.55,phi:.95,goal:null};
function placeCam(){const c=cam;const s=Math.sin(c.phi);camera.position.set(c.target.x+c.dist*s*Math.sin(c.theta),c.target.y+c.dist*Math.cos(c.phi),c.target.z+c.dist*s*Math.cos(c.theta));camera.lookAt(c.target)}

/* ============================ ПЛАНИРОВКА ГОРОДА ============================
   Улицы — одна сеть на весь город:
   • вдоль каждой границы гексов идёт улица (её половина у каждого соседа), так кварталы всегда соединены;
   • через некоторые границы проходит проспект: от центра гекса к середине ребра и дальше в соседа —
     решение принимается для ребра, а не для гекса, поэтому обе стороны всегда совпадают;
   • мост — продолжение проспекта через реку.
   Дома встают на участки вдоль тротуаров, фасадом к улице, и не пересекаются ни с улицами, ни друг с другом. */
const ST_HALF=.27, WALK=.13, APO=HR*Math.sqrt(3)/2, INSET=ST_HALF+WALK;
const NO_AVENUE=new Set(["ely","gov","cath","uni","hosp","park","cem","port","rail","edge","market","theatre"]);
const LOT={res:{w:[.55,.9],d:[.6,.85],h:[1,2.1]},old:{w:[.42,.68],d:[.45,.65],h:[.6,1.1],tiles:true},club:{w:[.6,.9],d:[.6,.85],h:[1.25,1.9],shop:true},
  biz:{w:[1,1.35],d:[.95,1.25],h:[2,3.6]},slum:{w:[.4,.65],d:[.4,.6],h:[.3,.7],gap:.35},ind:{w:[1.15,1.6],d:[1,1.35],h:[.6,1]}};
const hashS=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)};
const vert=i=>{const a=(60*i-30)*Math.PI/180;return [HR*Math.cos(a),HR*Math.sin(a)]};
const edgeDir=i=>{const a=60*i*Math.PI/180;return [Math.cos(a),Math.sin(a)]};
// сосед через ребро i: центр соседа лежит на 2·апофему в направлении середины ребра
function neighbor(h,i){const [cx,cz]=px(h.q,h.r).map(v=>v*W);const [dx,dz]=edgeDir(i);const tx=cx+dx*2*APO,tz=cz+dz*2*APO;
  for(const [a,b] of DIRS){const n=city.map[K(h.q+a,h.r+b)];if(!n)continue;const [nx,nz]=px(n.q,n.r).map(v=>v*W);if(Math.hypot(nx-tx,nz-tz)<.5)return n}return null}
const BRIDGE={};
function bridgeAxis(h){if(BRIDGE[h.k]!==undefined)return BRIDGE[h.k];let best=0,bs=-1;
  for(let i=0;i<3;i++){const a=neighbor(h,i),b=neighbor(h,i+3);const s=(a&&a.t!=="river"?1:0)+(b&&b.t!=="river"?1:0)+(hashS(h.k+i)%100)/1000;if(s>bs){bs=s;best=i}}return BRIDGE[h.k]=best}
const onBridge=(h,i)=>h.t==="river"&&h.bridge&&(i%3)===bridgeAxis(h);
function avenue(h,i){const n=neighbor(h,i);if(!n)return false;const j=(i+3)%6;
  if(h.t==="river"||n.t==="river")return onBridge(h,i)||onBridge(n,j);
  if(NO_AVENUE.has(h.t)||NO_AVENUE.has(n.t))return false;
  return hashS([h.k,n.k].sort().join("|"))%100<52}

/* --- геометрия улиц --- */
// кольцо вдоль границы гекса между отступами a и b (от края внутрь); UV — по миру, чтобы текстура не тянулась
function bandGeo(a,b,y){const pos=[],uv=[],idx=[];const sc=k=>(APO-k)/APO;
  for(let i=0;i<6;i++){const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const p=[[x0*sc(a),z0*sc(a)],[x1*sc(a),z1*sc(a)],[x1*sc(b),z1*sc(b)],[x0*sc(b),z0*sc(b)]];const o=pos.length/3;
    for(const [x,z] of p){pos.push(x,y,z);uv.push(x/1.2,z/1.2)}idx.push(o,o+2,o+1,o,o+3,o+2)}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
let WALKM=null;function walkMat(){if(WALKM)return WALKM;const m=(ART.ready&&gndMat("paving",1));WALKM=m?m.clone():M.curb;if(WALKM.map){WALKM.map=WALKM.map.clone();WALKM.map.repeat.set(1,1);WALKM.map.needsUpdate=true}return WALKM}
let ROADM=null;function roadMat(){if(ROADM)return ROADM;const s=streetMat();ROADM=s.clone();if(ROADM.map){ROADM.map=s.map.clone();ROADM.map.repeat.set(1,1);ROADM.map.needsUpdate=true}return ROADM}
function strip(g,x0,z0,x1,z1,w,y,mat){const L=Math.hypot(x1-x0,z1-z0);if(L<.01)return;const geo=new THREE.PlaneGeometry(L,w);geo.rotateX(-Math.PI/2);
  const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*L/1.2,uv.getY(i)*w/1.2);const m=new THREE.Mesh(geo,mat);m.position.set((x0+x1)/2,y,(z0+z1)/2);m.rotation.y=-Math.atan2(z1-z0,x1-x0);g.add(m);return m}
function dashes(g,x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0),n=Math.floor(L/.5);for(let k=0;k<n;k++){const t=(k+.5)/n;const d=add(g,new THREE.Mesh(new THREE.BoxGeometry(.2,.004,.022),M.line),x0+(x1-x0)*t,.024,z0+(z1-z0)*t);d.rotation.y=-Math.atan2(z1-z0,x1-x0)}}
function distSeg(px,pz,ax,az,bx,bz){const vx=bx-ax,vz=bz-az;const t=Math.max(0,Math.min(1,((px-ax)*vx+(pz-az)*vz)/(vx*vx+vz*vz||1)));return Math.hypot(px-ax-vx*t,pz-az-vz*t)}

/* --- участки и дома --- */
function corners(r){const [ux,uz]=r.u,nx=-uz,nz=ux;const hw=r.w/2,hd=r.d/2;return [[r.x+ux*hw+nx*hd,r.z+uz*hw+nz*hd],[r.x-ux*hw+nx*hd,r.z-uz*hw+nz*hd],[r.x-ux*hw-nx*hd,r.z-uz*hw-nz*hd],[r.x+ux*hw-nx*hd,r.z+uz*hw-nz*hd]]}
function overlap(a,b){const A=corners(a),B=corners(b);for(const P of [A,B])for(let i=0;i<4;i++){const [x0,z0]=P[i],[x1,z1]=P[(i+1)%4];const ax=-(z1-z0),az=x1-x0;
  const pa=A.map(([x,z])=>x*ax+z*az),pb=B.map(([x,z])=>x*ax+z*az);if(Math.max(...pa)<Math.min(...pb)+.02||Math.max(...pb)<Math.min(...pa)+.02)return false}return true}
// дом с фасадом к улице: карниз, крыша, у баров — витрина, козырёк и вывеска поперёк улицы
function building(g,r,h,type,o={}){const grp=new THREE.Group();grp.position.set(r.x,0,r.z);grp.rotation.y=-Math.atan2(r.u[1],r.u[0]);g.add(grp);
  // в локальных координатах дома: x — вдоль улицы, улица — со стороны −z (нормаль в квартал смотрит в +z)
  const pool=FAC_BY_TYPE[type]||FAC_BY_TYPE.res;const fac=(ART.ready&&facMat(pool[Math.floor(Math.random()*pool.length)]))||wall();
  const W_=r.w,D_=r.d;
  if(o.shop&&ART.ready){add(grp,new THREE.Mesh(boxGeo(W_,.9,D_),facMat("bar")),0,.45,0);add(grp,new THREE.Mesh(boxGeo(W_,h-.9,D_),fac),0,.9+(h-.9)/2,0)}
  else add(grp,new THREE.Mesh(boxGeo(W_,h,D_),fac),0,h/2,0);
  // карниз и крыша
  add(grp,new THREE.Mesh(new THREE.BoxGeometry(W_+.06,.05,D_+.06),M.stone),0,h-.03,0);
  if(o.tiles){const rf=add(grp,new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(W_,D_)*.52,.38,4),(ART.ready&&gndMat("tiles",2))||M.roof),0,h+.19,0);rf.rotation.y=Math.PI/4;rf.scale.set(W_/Math.hypot(W_,D_)*1.41,1,D_/Math.hypot(W_,D_)*1.41)}
  else{add(grp,new THREE.Mesh(new THREE.BoxGeometry(W_,.06,D_),(ART.ready&&gndMat("tar",1))||M.roof),0,h+.03,0);if(h>1.2&&W_>.6&&Math.random()<.2)waterTower(grp,rr(-.2,.2)*W_,h,rr(0,.25)*D_)}
  // козырёк над входом
  if(o.shop||Math.random()<.25){const aw=add(grp,new THREE.Mesh(new THREE.BoxGeometry(W_*.7,.03,.22),o.shop?new THREE.MeshStandardMaterial({color:0x3a1418,roughness:.8}):M.roof),0,.82,-D_/2-.11);aw.rotation.x=.25}
  if(o.sign){const tex=signTex(o.sign);const m=new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color(1,1,1).multiplyScalar(1.8)});const sh=Math.min(.85,h*.5);
    const sx=(W_/2-.1)*(Math.random()<.5?1:-1);add(grp,new THREE.Mesh(new THREE.BoxGeometry(.05,sh,.32),[m,m,M.roof,M.roof,M.roof,M.roof]),sx,1+sh/2,-D_/2-.17);
    const wp=new THREE.Vector3(sx,0,-D_/2-.45);const c=wp.applyAxisAngle(new THREE.Vector3(0,1,0),grp.rotation.y);colorPool(g,r.x+c.x,r.z+c.z,o.sign,1.6,.5)}
  return grp}
function frontage(lots,ax,az,bx,bz,nrm,spec,radials,type,out){const L=Math.hypot(bx-ax,bz-az);const u=[(bx-ax)/L,(bz-az)/L];let t=.05;
  const kIn=1-(INSET-.02)/APO;
  while(t<L-.25){const w=Math.min(rr(...spec.w),L-t),d=rr(...spec.d);if(w<.35)break;
    const cx=ax+u[0]*(t+w/2)+nrm[0]*(d/2+.02),cz=az+u[1]*(t+w/2)+nrm[1]*(d/2+.02);
    // у дома локальная +z смотрит в квартал, значит направление вдоль улицы выбираем так, чтобы (−u.z,u.x) совпало с нормалью
    const uu=(-u[1]*nrm[0]+u[0]*nrm[1])>0?u:[-u[0],-u[1]];const r={x:cx,z:cz,u:uu,w,d};
    const cs=corners(r);let ok=cs.every(([x,z])=>insideHex(x,z,kIn))&&!lots.some(o=>overlap(o,r));
    if(ok)for(const s of radials){if(cs.concat([[cx,cz]]).some(([x,z])=>distSeg(x,z,...s)<INSET-.03)){ok=false;break}}
    if(ok&&Math.hypot(cx,cz)<INSET+.45&&radials.length)ok=false;   // площадь на перекрёстке в центре
    if(ok&&!(spec.gap&&Math.random()<spec.gap)){lots.push(r);out.push(r);t+=w+(Math.random()<.15?.18:.02)}else t+=.12}}
function car(g,x,z,ang){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=ang;g.add(c);
  add(c,new THREE.Mesh(new THREE.BoxGeometry(.36,.1,.16),new THREE.MeshStandardMaterial({color:[0x1a1c22,0x2a1416,0x1c2430,0x2c2a26][Math.floor(Math.random()*4)],roughness:.35,metalness:.6})),0,.07,0);
  add(c,new THREE.Mesh(new THREE.BoxGeometry(.2,.07,.14),new THREE.MeshStandardMaterial({color:0x0b0d12,roughness:.2,metalness:.7})),-.02,.15,0);
  for(const s of [-1,1])add(c,new THREE.Mesh(new THREE.BoxGeometry(.01,.025,.03),M.red),-.18,.08,s*.055)}

function layoutHex(g,h){
  // 1. улица и тротуар вдоль всей границы
  const road=new THREE.Mesh(bandGeo(0,ST_HALF,.012),roadMat());g.add(road);
  const walk=new THREE.Mesh(bandGeo(ST_HALF,INSET,.03),walkMat());g.add(walk);
  // бордюр — тонкая светлая кромка по краю тротуара
  const curb=new THREE.Mesh(bandGeo(ST_HALF-.015,ST_HALF+.015,.034),M.curb);g.add(curb);
  // 2. проспекты через центр
  const av=[];for(let i=0;i<6;i++)if(avenue(h,i))av.push(i);
  const radials=[];
  for(const i of av){const [dx,dz]=edgeDir(i);const ex=dx*APO,ez=dz*APO;radials.push([0,0,ex,ez]);
    strip(g,0,0,ex,ez,ST_HALF*2,.014,roadMat());dashes(g,dx*.5,dz*.5,dx*(APO-ST_HALF),dz*(APO-ST_HALF));
    const nx=-dz,nz=dx;for(const s of [-1,1]){const ox=nx*(ST_HALF+WALK/2)*s,oz=nz*(ST_HALF+WALK/2)*s;strip(g,dx*(INSET+.1)+ox,dz*(INSET+.1)+oz,dx*(APO-ST_HALF)+ox,dz*(APO-ST_HALF)+oz,WALK,.032,walkMat())}}
  if(av.length){const pl=add(g,new THREE.Mesh(new THREE.CircleGeometry(INSET+.05,20),roadMat()),0,.016,0);pl.rotation.x=-Math.PI/2}
  // 3. участки вдоль тротуаров
  const spec=LOT[h.t];const lots=[],placed=[];
  if(spec){
    for(let i=0;i<6;i++){const sc=(APO-INSET)/APO;const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const [dx,dz]=edgeDir(i);
      frontage(lots,x0*sc,z0*sc,x1*sc,z1*sc,[-dx,-dz],spec,radials,h.t,placed)}
    for(const i of av){const [dx,dz]=edgeDir(i);const nx=-dz,nz=dx;for(const s of [-1,1]){const off=INSET*s;
      const a=[dx*(INSET+.45)+nx*off,dz*(INSET+.45)+nz*off],b=[dx*(APO-INSET)+nx*off,dz*(APO-INSET)+nz*off];
      // нормаль в квартал — от улицы
      frontage(lots,...(s>0?a:b),...(s>0?b:a),[nx*s,nz*s],spec,radials,h.t,placed)}}
    // дома
    const signs=h.t==="club"?[...P.neon].sort(()=>Math.random()-.5).slice(0,2):[];
    let tall=null;
    placed.forEach((r,idx)=>{const hh=rr(...spec.h);const o={shop:spec.shop&&Math.random()<.7,tiles:spec.tiles};if(signs.length&&o.shop&&idx%3===0)o.sign=signs.shift();
      // нормаль улицы направлена в −z дома: перестраиваем направление u так, чтобы фасад смотрел на улицу
      building(g,r,hh,h.t,o);if(!tall||hh>tall.h)tall={r,h:hh}});
    if(h.t==="biz"&&tall)redLight(g,tall.r.x,tall.h+.12,tall.r.z);
    if(h.t==="ind"){const [x,z]=inHex(.25);add(g,new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,3,8),M.rust),x,1.5,z);redLight(g,x,3.1,z)}
    if(h.t==="slum"){const [fx,fz]=inHex(.3);add(g,new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.24,8),M.rust),fx,.12,fz);add(g,new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),M.fire),fx,.27,fz);
      const p=colorPool(g,fx,fz,0xff7a2a,1.3,.45);flick.push({m:p,base:.45,ph:Math.random()*9,fire:true})}
    // двор: пара деревьев там, где нет домов
    for(let k=0;k<12;k++){const [x,z]=inHex(.55);const r={x,z,u:[1,0],w:.4,d:.4};if(lots.some(o=>overlap(o,r))||radials.some(s=>distSeg(x,z,...s)<INSET+.1))continue;if(h.t!=="ind"&&h.t!=="biz")treeNice(g,x,z,.8);if(Math.random()<.5)break}
  }else if(SPECIAL[h.t])SPECIAL[h.t](g,h);else{CUR_T=h.t;(BUILD[h.t]||BUILD.res)(g)}
  // набережная: стенка к воде и парапет по краю улицы
  for(let i=0;i<6;i++){const n=neighbor(h,i);if(!n||n.t!=="river")continue;const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const L=HR,ang=-Math.atan2(z1-z0,x1-x0);
    const w=add(g,new THREE.Mesh(boxGeo(L,.42,.06),(ART.ready&&facMat("stone"))||M.stone),(x0+x1)/2,-.2,(z0+z1)/2);w.rotation.y=ang;
    const pp=add(g,new THREE.Mesh(new THREE.BoxGeometry(L,.1,.06),M.stone),(x0+x1)/2*.995,.06,(z0+z1)/2*.995);pp.rotation.y=ang;
    for(let k=1;k<6;k++){const t=k/6;add(g,new THREE.Mesh(new THREE.BoxGeometry(.07,.16,.07),M.stone),(x0+(x1-x0)*t)*.995,.08,(z0+(z1-z0)*t)*.995)}}
  // 4. машины у бордюра и фонари на тротуарах
  for(let k=0;k<2;k++){if(Math.random()<.4)continue;const i=Math.floor(Math.random()*6);const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const t=rr(.25,.75);const sc=(APO-ST_HALF*.55)/APO;
    car(g,(x0+(x1-x0)*t)*sc,(z0+(z1-z0)*t)*sc,-Math.atan2(z1-z0,x1-x0))}
  let nl=0;for(const i of av){const [dx,dz]=edgeDir(i);const s=nl%2?1:-1;const f=rr(.45,.65)*APO;lamp(g,dx*f-dz*(ST_HALF+.05)*s,dz*f+dx*(ST_HALF+.05)*s,Math.random()<.3?"cold":"sodium");nl++}
  if(nl<2&&!SPECIAL[h.t]){const i=Math.floor(Math.random()*6);const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const sc=(APO-ST_HALF-.06)/APO;const t=rr(.3,.7);lamp(g,(x0+(x1-x0)*t)*sc,(z0+(z1-z0)*t)*sc,Math.random()<.3?"cold":"sodium")}
}
function riverHex(g,h){if(!h.bridge)return;const i=bridgeAxis(h);const [dx,dz]=edgeDir(i);
  strip(g,-dx*APO,-dz*APO,dx*APO,dz*APO,ST_HALF*2+.12,.06,M.stone);strip(g,-dx*APO,-dz*APO,dx*APO,dz*APO,ST_HALF*2,.07,roadMat());
  for(const s of [-1,1]){const nx=-dz*(ST_HALF+.05)*s,nz=dx*(ST_HALF+.05)*s;const r=strip(g,-dx*APO+nx,-dz*APO+nz,dx*APO+nx,dz*APO+nz,.03,.16,M.metal)}
  for(const t of [-1.3,0,1.3]){const pr=add(g,new THREE.Mesh(new THREE.BoxGeometry(.32,.42,ST_HALF*2+.16),(ART.ready&&facMat("stone"))||M.stone),dx*t,-.16,dz*t);pr.rotation.y=-Math.atan2(dz,dx)}
  lamp(g,-dz*(ST_HALF+.05),dx*(ST_HALF+.05),"sodium",.8);lamp(g,dz*(ST_HALF+.05)+dx*1.4,-dx*(ST_HALF+.05)+dz*1.4,"sodium",.8)}

/* ============================ ОСОБЫЕ РАЙОНЫ ============================
   Те же улицы по периметру, но внутри — своя планировка: сад особняка, площадь собора, парк, кладбище, порт. */
const INNER=APO-INSET-.04;            // апофема внутренней части гекса (до тротуара)
function innerHex(g,mat,y=.02){const m=add(g,new THREE.Mesh(new THREE.CylinderGeometry(INNER/.866,INNER/.866,.02,6),mat),0,y,0);
  if(mat.map){/* текстура по миру: повторяем пропорционально размеру */}return m}
function gmat(n,rep){return (ART.ready&&gndMat(n,rep))||M.street}
function fence(g,k,gap){// кованая ограда по внутреннему краю, gap — номер ребра с воротами
  const sc=(APO-k)/APO;for(let i=0;i<6;i++){const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const L=HR*sc,n=Math.floor(L/.22);
    for(let j=0;j<=n;j++){const t=j/n;if(i===gap&&t>.38&&t<.62)continue;add(g,new THREE.Mesh(new THREE.BoxGeometry(.018,.2,.018),M.metal),(x0+(x1-x0)*t)*sc,.1,(z0+(z1-z0)*t)*sc)}
    for(const [a,b] of i===gap?[[0,.38],[.62,1]]:[[0,1]]){const r=strip(g,(x0+(x1-x0)*a)*sc,(z0+(z1-z0)*a)*sc,(x0+(x1-x0)*b)*sc,(z0+(z1-z0)*b)*sc,.02,.19,M.metal)}}}
function wallRing(g,k,h,mat){const sc=(APO-k)/APO;for(let i=0;i<6;i++){const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const L=HR*sc;const w=add(g,new THREE.Mesh(new THREE.BoxGeometry(L,h,.07),mat),(x0+x1)/2*sc,h/2,(z0+z1)/2*sc);w.rotation.y=-Math.atan2(z1-z0,x1-x0)}}
const TREEM=[];function treeMat(){if(!TREEM.length)for(const c of [0x122016,0x172618,0x1d2a17,0x241f14,0x2a1c12])TREEM.push(new THREE.MeshStandardMaterial({color:c,roughness:1,flatShading:true}));
  const r=Math.random();return TREEM[r<.75?Math.floor(Math.random()*3):3+Math.floor(Math.random()*2)]}
function treeNice(g,x,z,s=1){s*=rr(.85,1.15);const m=treeMat();add(g,new THREE.Mesh(new THREE.CylinderGeometry(.025*s,.045*s,.42*s,6),M.rust),x,.21*s,z);
  // крона — неровное облако из 4–6 комков, нижние шире
  const n=4+Math.floor(Math.random()*3);for(let i=0;i<n;i++){const a=Math.random()*6.28,r=rr(0,.13)*s,y=rr(.42,.78)*s;const k=rr(.13,.22)*s*(1.2-(y/s-.42));
    const b=add(g,new THREE.Mesh(new THREE.IcosahedronGeometry(k,1),m),x+Math.cos(a)*r,y,z+Math.sin(a)*r);b.scale.y=rr(.75,1)}}
function cypress(g,x,z,s=1){add(g,new THREE.Mesh(new THREE.ConeGeometry(.09*s,.75*s,7),new THREE.MeshStandardMaterial({color:0x101c14,roughness:1})),x,.38*s,z)}
function rectLot(x,z,w,d,ang=0){return {x,z,u:[Math.cos(ang),Math.sin(ang)],w,d}}
function perimeterLots(g,h,spec,lots){const placed=[];for(let i=0;i<6;i++){const sc=(APO-INSET)/APO;const [x0,z0]=vert(i),[x1,z1]=vert(i+1);const [dx,dz]=edgeDir(i);
  frontage(lots,x0*sc,z0*sc,x1*sc,z1*sc,[-dx,-dz],spec,[],h.t,placed)}return placed}
// дом с фасадом нужного типа (для особых районов)
function hall(g,x,z,w,d,h,fac,ang=0){const grp=new THREE.Group();grp.position.set(x,0,z);grp.rotation.y=-ang;g.add(grp);
  add(grp,new THREE.Mesh(boxGeo(w,h,d),(ART.ready&&facMat(fac))||wall()),0,h/2,0);add(grp,new THREE.Mesh(new THREE.BoxGeometry(w+.08,.06,d+.08),M.stone),0,h-.03,0);
  add(grp,new THREE.Mesh(new THREE.BoxGeometry(w,.06,d),(ART.ready&&gndMat("tar",1))||M.roof),0,h+.03,0);return grp}
const SPECIAL={
 ely(g,h){innerHex(g,gmat("grass",5));fence(g,INSET+.06,1);
   // подъездная аллея от ворот к особняку
   const [dx,dz]=edgeDir(1);strip(g,dx*(INNER-.05),dz*(INNER-.05),dx*.6,dz*.6,.5,.03,gmat("paving",1));
   const m=hall(g,-dx*.35,-dz*.35,2.3,1.3,1.35,"mansion",Math.atan2(dz,dx)+Math.PI/2);
   add(m,new THREE.Mesh(new THREE.CylinderGeometry(.55,.65,.35,16),M.stone),0,1.55,0);add(m,new THREE.Mesh(new THREE.SphereGeometry(.52,18,10,0,Math.PI*2,0,Math.PI/2),M.stone),0,1.72,0);
   for(let i=-2;i<=2;i++)add(m,new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,1.05,8),M.stone),i*.28,.52,.72);add(m,new THREE.Mesh(new THREE.BoxGeometry(1.5,.08,.3),M.stone),0,1.08,.75);
   // фонтан
   const fx=dx*1.55,fz=dz*1.55;add(g,new THREE.Mesh(new THREE.CylinderGeometry(.38,.42,.12,18),M.stone),fx,.06,fz);add(g,new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.02,18),gmat("water",1)),fx,.12,fz);
   add(g,new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,.35,8),M.stone),fx,.25,fz);colorPool(g,fx,fz,0xffb060,1.3,.3);
   for(const s of [-1,1])car(g,dx*1+(-dz)*.45*s,dz*1+dx*.45*s,-Math.atan2(dz,dx));
   for(const s of [-1,1])lamp(g,dx*2.3+(-dz)*.38*s,dz*2.3+dx*.38*s,"sodium",.8);
   for(let k=0;k<14;k++){const a=rr(0,6.28),r=rr(1.7,INNER-.15);const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.hypot(x-fx,z-fz)<.7||distSeg(x,z,dx*INNER,dz*INNER,dx*.6,dz*.6)<.45)continue;cypress(g,x,z,rr(.9,1.3))}},
 cath(g,h){innerHex(g,gmat("cobble",4));const lots=[rectLot(0,0,2.2,2.9,Math.PI/6)];
   const spec={w:[.42,.62],d:[.45,.6],h:[.6,1.05],tiles:true};const placed=perimeterLots(g,h,spec,lots);placed.forEach(r=>building(g,r,rr(...spec.h),"old",{tiles:true}));
   const c=hall(g,0,0,1,1.9,1.5,"gothic",Math.PI/6);const roof=add(c,new THREE.Mesh(new THREE.CylinderGeometry(.01,.62,.7,4,1),gmat("tiles",1)),0,1.85,0);roof.rotation.y=Math.PI/4;roof.scale.set(.85,1,2.15);
   add(c,new THREE.Mesh(boxGeo(.5,2.4,.5),(ART.ready&&facMat("gothic"))||M.stone),0,1.2,-1.15);add(c,new THREE.Mesh(new THREE.ConeGeometry(.36,1.7,8),M.roof),0,3.25,-1.15);
   add(c,new THREE.Mesh(new THREE.CircleGeometry(.2,14),M.warm),0,1.2,.96);colorPool(g,0,0,0xffa050,2.6,.28);lamp(g,1.2,-.6,"sodium",.9)},
 park(g,h){innerHex(g,gmat("grass",5));const pond=add(g,new THREE.Mesh(new THREE.CylinderGeometry(.95,.95,.02,28),gmat("water",1)),.5,.03,-.3);pond.scale.z=.65;
   add(g,new THREE.Mesh(new THREE.TorusGeometry(.95,.04,6,28),M.stone),.5,.04,-.3).rotation.x=Math.PI/2;
   for(const i of [0,2,4]){const [dx,dz]=edgeDir(i);strip(g,dx*INNER,dz*INNER,.5+dx*.9,-.3+dz*.6,.16,.035,gmat("gravel",1));lamp(g,dx*1.9-dz*.15,dz*1.9+dx*.15,"sodium",.75)}
   // ротонда
   const rx=-1.2,rz=.9;for(let k=0;k<6;k++){const a=k*Math.PI/3;add(g,new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.5,6),M.stone),rx+Math.cos(a)*.25,.25,rz+Math.sin(a)*.25)}
   add(g,new THREE.Mesh(new THREE.SphereGeometry(.3,12,6,0,6.28,0,Math.PI/2),M.stone),rx,.5,rz);
   for(let k=0;k<34;k++){const a=rr(0,6.28),r=rr(.3,INNER-.15);const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.hypot((x-.5),(z+.3)/.65)<1.15||Math.hypot(x-rx,z-rz)<.45)continue;treeNice(g,x,z,rr(.8,1.3))}},
 cem(g,h){innerHex(g,gmat("grass",5));wallRing(g,INSET+.08,.22,M.stone);
   hall(g,0,0,.7,.9,.75,"gothic",0);const rf=add(g,new THREE.Mesh(new THREE.ConeGeometry(.55,.5,4),M.roof),0,1.0,0);rf.rotation.y=Math.PI/4;rf.scale.set(.75,1,.95);
   for(let row=-5;row<=5;row++)for(let col=-6;col<=6;col++){const x=col*.42+(row%2)*.21,z=row*.5;if(Math.abs(x)<.7&&Math.abs(z)<.8)continue;if(!insideHex(x,z,(INNER-.15)/APO)||Math.random()<.35)continue;
     add(g,new THREE.Mesh(new THREE.BoxGeometry(.12,rr(.16,.28),.05),M.grave),x,.1,z);if(Math.random()<.06){add(g,new THREE.Mesh(new THREE.SphereGeometry(.02,5,4),M.fire),x+.06,.06,z+.04)}}
   for(let k=0;k<12;k++){const a=rr(0,6.28),r=rr(1,INNER-.2);cypress(g,Math.cos(a)*r,Math.sin(a)*r,rr(1,1.5))}
   lamp(g,.6,.75,"cold",.8)},
 port(g,h){innerHex(g,gmat("concrete",4));
   // ковш с водой — со стороны реки
   let wi=0;for(let i=0;i<6;i++){const n=neighbor(h,i);if(n&&n.t==="river"){wi=i;break}}const [dx,dz]=edgeDir(wi);const ang=Math.atan2(dz,dx);
   const bx=dx*(INNER-.75),bz=dz*(INNER-.75);const basin=add(g,new THREE.Mesh(new THREE.BoxGeometry(1.3,.02,2.6),gmat("water",1)),bx,.03,bz);basin.rotation.y=-ang;
   const lots=[rectLot(bx,bz,2.7,1.45,ang+Math.PI/2)];
   for(const s of [-1,1]){const cx=bx-dx*.85+(-dz)*.7*s,cz=bz-dz*.85+dx*.7*s;const cr=new THREE.Group();cr.position.set(cx,0,cz);cr.rotation.y=-ang;g.add(cr);
     for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]])add(cr,new THREE.Mesh(new THREE.BoxGeometry(.05,1.3,.05),M.rust),a*.18,.65,b*.18);add(cr,new THREE.Mesh(new THREE.BoxGeometry(.45,.25,.45),M.rust),0,1.4,0);
     add(cr,new THREE.Mesh(new THREE.BoxGeometry(1.9,.07,.07),M.rust),.55,1.62,0);redLight(cr,1.48,1.7,0);lots.push(rectLot(cx,cz,.6,.6))}
   // штабеля контейнеров
   const cc=[0x5a2a20,0x203a52,0x4a4a24,0x3a3c40,0x6a4a20];for(let k=0;k<8;k++){const a=rr(0,6.28),r=rr(.3,1.6);const x=-dx*r*.6+Math.cos(a)*.6,z=-dz*r*.6+Math.sin(a)*.6;const L=rectLot(x,z,.9,.36,ang+Math.PI/2);if(lots.some(o=>overlap(o,L)))continue;lots.push(L);
     const n=1+Math.floor(Math.random()*3);for(let j=0;j<n;j++){const c=add(g,new THREE.Mesh(new THREE.BoxGeometry(.85,.3,.32),new THREE.MeshStandardMaterial({color:cc[Math.floor(Math.random()*cc.length)],roughness:.7,metalness:.3})),x,.15+j*.31,z);c.rotation.y=-(ang+Math.PI/2)}}
   const spec={w:[1,1.4],d:[.8,1.1],h:[.7,1]};perimeterLots(g,h,spec,lots).forEach(r=>building(g,r,rr(...spec.h),"port",{}));lamp(g,bx-dx*1.5,bz-dz*1.5,"cold",1.3)},
};


/* ============================ 3D-КАРТА В ИГРЕ ============================
   Сцена строится из того же G.city, что и 2D-карта. Туман, принадлежность районов,
   персонаж и замеченные соперники берутся из состояния игры при каждой отрисовке.
   Ходит по-прежнему движок: клик → clickHex → команды move; фигурка лишь идёт следом по улицам. */
let city=null,havenK=null,mounted=false,on=false,follow=true,need=true;
const VIEW_KEY="btd-view";
const hasGL=(()=>{try{const c=document.createElement("canvas");return !!(c.getContext("webgl")||c.getContext("experimental-webgl"))}catch(e){return false}})();
function wantOn(){let v=null;try{v=localStorage.getItem(VIEW_KEY)}catch(e){}return hasGL&&v!=="2d"}
const host=document.createElement("div");host.id="map3d";const lblBox=document.createElement("div");lblBox.className="lbl3d";
const renderer=hasGL?new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"}):null;
if(renderer)renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(42,1,0.5,600);
let composer=null,bloom=null;
function setupPost(){if(!THREE.EffectComposer)return;composer=new THREE.EffectComposer(renderer);composer.addPass(new THREE.RenderPass(scene,camera));
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(256,256),.95,.55,.62);composer.addPass(bloom)}

/* --- постройка города --- */
let tok=null,tokAt=null,route=[],botTok=[];
function hexCenter(k){const h=city.map[k];const [a,b]=px(h.q,h.r);return [a*W,b*W]}
function edgeMid(k,i){const [cx,cz]=hexCenter(k);const [dx,dz]=edgeDir(i);return [cx+dx*APO*.97,cz+dz*APO*.97]}
function vertW(k,i){const [cx,cz]=hexCenter(k);const [x,z]=vert(((i%6)+6)%6);return [cx+x*.97,cz+z*.97]}
function edgeTo(h,n){for(let i=0;i<6;i++){const m=neighbor(h,i);if(m&&m.k===n.k)return i}return -1}
function ringPath(k,a,b){const pts=[];if(a===b)return [edgeMid(k,b)];const fw=((b-a)+6)%6;
  if(fw<=3){for(let i=1;i<=fw;i++)pts.push(vertW(k,a+i))}else{for(let i=0;i<6-fw;i++)pts.push(vertW(k,a-i))}pts.push(edgeMid(k,b));return pts}
function buildCity(){if(!renderer)return;
  if(world){scene.remove(world);world.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
  city=G.city;seed=G.seed;mats();blinkers=[];flick=[];LAMPS=[];WATER=[];GM.length=0;WALKM=null;ROADM=null;for(const k in BRIDGE)delete BRIDGE[k];
  const r0=Math.random;Math.random=mulberry(seed^0x5bd1);
  world=new THREE.Group();hexes={};labels.forEach(l=>l.el.remove());labels=[];
  scene.background=new THREE.Color(P.sky);scene.fog=new THREE.FogExp2(P.fog,P.fogD);world.add(skyDome());
  world.add(new THREE.AmbientLight(0x2a3458,.9));const moon=new THREE.DirectionalLight(0x8ea4d8,.45);moon.position.set(-30,50,-20);world.add(moon);
  world.add(new THREE.HemisphereLight(0x253055,0x0a0806,.3));
  const base=add(world,new THREE.Mesh(new THREE.CircleGeometry(70,48),new THREE.MeshStandardMaterial({color:0x05060a,roughness:1})),0,-.45,0);base.rotation.x=-Math.PI/2;
  for(const h of Object.values(city.map)){
    const [x,z]=hexCenter(h.k);const g=new THREE.Group();g.position.set(x,0,z);const isRiver=h.t==="river";
    const hexTop=r=>{const q=new THREE.CircleGeometry(r,6);q.rotateZ(Math.PI/6);q.rotateX(-Math.PI/2);return q};   // только верх гекса, без боковых стенок
    const ground=new THREE.Mesh(hexTop(HR*1.003),isRiver?((ART.ready&&gndMat("water",3))||M.water):groundMat(h.t));
    ground.position.y=isRiver?-.35:0;if(isRiver)WATER.push(ground.material);ground.userData.k=h.k;g.add(ground);
    CUR_T=h.t;if(!isRiver)layoutHex(g,h);else riverHex(g,h);
    const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return new THREE.Vector3(Math.sin(a)*HR*.94,.06,Math.cos(a)*HR*.94)})),
      new THREE.LineBasicMaterial({color:0x555566,transparent:true,opacity:.18}));g.add(ring);
    // неизведанный район — просто тёмная земля вровень с городом
    const fogCap=new THREE.Mesh(hexTop(HR*1.01),new THREE.MeshBasicMaterial({color:0x07080d}));fogCap.position.y=isRiver?-.34:.02;g.add(fogCap);
    const dim=new THREE.Object3D();g.add(dim);
    world.add(g);hexes[h.k]={h,g,ground,ring,fogCap,dim};
    const el=document.createElement("div");el.className="lbl";lblBox.appendChild(el);labels.push({el,k:h.k,pos:new THREE.Vector3(x,1.3,z)});
  }
  // туман у земли
  mist=[];for(let i=0;i<4;i++){const t=TX.mist.clone();t.needsUpdate=true;t.repeat.set(3,3);const m=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshBasicMaterial({map:t,color:0x7d88a8,transparent:true,opacity:.1,depthWrite:false}));
    m.rotation.x=-Math.PI/2;m.position.y=.35+i*.45;world.add(m);mist.push({m,t,sp:(i%2?1:-1)*(.004+i*.002)})}
  // метка убежища — тонкий столб света; персонаж; соперники
  {const pin=new THREE.Group();add(pin,new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.6,8,1,true),new THREE.MeshBasicMaterial({color:P.me,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false})),0,1.3,0);
   add(pin,new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:new THREE.Color(P.me).multiplyScalar(1.8)})),0,2.6,0);pin.visible=false;world.add(pin);world.userData.pin=pin}
  tok=figure(0xe8a0b8,true);world.add(tok);tokAt=null;route=[];botTok=[];
  extras();
  Math.random=r0;scene.add(world);need=true;update()}
function figure(col,mine){const g=new THREE.Group();const coat=new THREE.MeshStandardMaterial({color:0x14131a,roughness:.6,metalness:.2});
  add(g,new THREE.Mesh(new THREE.CylinderGeometry(.05,.085,.32,10),coat),0,.16,0);add(g,new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),new THREE.MeshStandardMaterial({color:0xcfc2bd,roughness:.7})),0,.37,0);
  const base=add(g,new THREE.Mesh(new THREE.CylinderGeometry(mine?.07:.06,mine?.07:.06,.012,14),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.4)})),0,.006,0);
  colorPool(g,0,0,col,mine?1:.7,mine?.5:.35);if(mine){const L=new THREE.PointLight(col,.6,1.6,2);L.position.y=.5;g.add(L)}g.userData.base=base;return g}
function setFigColor(g,col){g.userData.base.material.color.set(new THREE.Color(col).multiplyScalar(1.4));g.children.forEach(o=>{if(o.material&&o.material.blending===THREE.AdditiveBlending)o.material.color.set(col);if(o.isPointLight)o.color.set(col)})}

/* --- персонаж идёт по улицам за командами move --- */
function spotOf(k){const h=city.map[k];// где стоять, когда пришли «ниоткуда» (загрузка, новая ночь)
  const [cx,cz]=hexCenter(k);let best=0,bd=1e9;for(let i=0;i<6;i++){const [x,z]=edgeMid(k,i);const d=Math.hypot(x,z);if(d<bd){bd=d;best=i}}return {k,e:h.t==="river"&&h.bridge?-1:best}}
function posOf(at){return at.e<0?hexCenter(at.k):edgeMid(at.k,at.e)}
function moved(to){if(!city||!tokAt)return;const A=city.map[tokAt.k],B=city.map[to];if(!A||!B)return;const i=edgeTo(A,B);if(i<0){tokAt=spotOf(to);route=[posOf(tokAt)];return}
  const pts=[];if(tokAt.e<0)pts.push(edgeMid(A.k,i));else if(A.t==="river")pts.push(...ringPath(A.k,tokAt.e,i));else pts.push(...ringPath(A.k,tokAt.e,i));
  const j=(i+3)%6;if(B.t==="river"&&B.bridge&&(j%3)===bridgeAxis(B)){pts.push(hexCenter(B.k));tokAt={k:B.k,e:-1}}else tokAt={k:B.k,e:j};
  route.push(...pts);follow=UI.zoom!=="far";need=true}
function tickToken(dt){if(!tok||!route.length)return;const left0=route.reduce((s,p,i)=>{const a=i?route[i-1]:[tok.position.x,tok.position.z];return s+Math.hypot(p[0]-a[0],p[1]-a[1])},0);
  // темп подстраивается под шаги движка: путь до цели проходится примерно за полсекунды
  let left=Math.max(2.4,left0/.55)*dt;while(left>0&&route.length){const [tx,tz]=route[0];const p=tok.position;const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
    if(d<=left){p.x=tx;p.z=tz;left-=d;route.shift()}else{p.x+=dx/d*left;p.z+=dz/d*left;tok.rotation.y=Math.atan2(dx,dz);left=0}}
  tok.children[0].position.y=.16+(route.length?Math.abs(Math.sin(performance.now()/110))*.015:0)}

/* --- синхронизация с игрой: туман, стороны, подписи, соперники, погода --- */
let lastNight=-1;
function update(){if(!renderer||!city||!G)return;const m=me();const playing=m&&m.clan&&["walk","day","end","court"].includes(G.phase);
  const rv=UI.reveal?(UI.revealR??99):-1;
  for(const H of Object.values(hexes)){const k=H.h.k;const seenK=!playing||m.seen.has(k)||H.h.ring<=rv;const vis=!playing||m.visited.has(k);
    H.fogCap.visible=!seenK;H.g.children.forEach(o=>{if(o!==H.fogCap&&o!==H.ground&&o!==H.ring&&o!==H.dim)o.visible=seenK});
    const D=G.dist&&G.dist[k];const own=playing&&D&&D.own;H.ring.visible=seenK;H.ring.material.color.set(own?FAC[own].color:0x555566);H.ring.material.opacity=own?(Math.abs(D.c)>=4?.85:.5):.16;
    if(playing&&G.phase==="walk"&&!m.enc&&nbrs(m.pos).includes(k))H.ring.material.opacity=Math.max(H.ring.material.opacity,.45)}
  for(const l of labels){const h=city.map[l.k];const seenK=!playing||m.seen.has(l.k)||h.ring<=rv;const vis=!playing||m.visited.has(l.k);l.el.dataset.on=seenK?"1":"0";l.el.textContent=vis?h.name:TYPES[h.t].n;l.el.classList.toggle("dim",!vis)}
  if(playing){const pin=world.userData.pin;const [hx,hz]=hexCenter(m.haven);pin.position.set(hx,0,hz);pin.visible=true;
    setFigColor(tok,CLANS[m.disguise||m.clan].color);tok.visible=G.phase==="walk"||G.phase==="court";
    if(!tokAt||(tokAt.k!==m.pos&&!route.length)){tokAt=spotOf(m.pos);const [x,z]=posOf(tokAt);tok.position.set(x,0,z);route=[]}
    // замеченные соперники — фигурки цвета клана на краю их района
    const seenB=G.phase==="walk"?visibleTo(m):[];while(botTok.length<seenB.length){const f=figure(0x888888,false);world.add(f);botTok.push(f)}
    botTok.forEach((f,i)=>{const b=seenB[i];f.visible=!!b;if(!b)return;const ritualTrue=m.ritual&&G.time<=m.ritual.until&&hexDist(b.pos,m.ritual.c)<=1;setFigColor(f,CLANS[ritualTrue?b.clan:(b.disguise||b.clan)].color);
      const [x,z]=edgeMid(b.pos,(i*2+1)%6);f.position.set(x*.88+hexCenter(b.pos)[0]*.12,0,z*.88+hexCenter(b.pos)[1]*.12)})}
  else{tok.visible=false;botTok.forEach(f=>f.visible=false)}
  syncExtras(m,playing);
  if(G.night!==lastNight){lastNight=G.night;setWeather(G.night%4===0?"snow":G.night%3===0?"clear":"rain",true)}
  need=true}

/* --- патрули, ритуал, дело Князя ---
   Те же правила, что на 2D-карте: число патрулей растёт с тревогой города, круг ритуала держится до его конца,
   печать над Элизиумом висит, пока у Князя открыто дело. */
let cops=[],ritual=null,seal=null;
function sealTex(){const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");g.translate(64,64);
  const gr=g.createRadialGradient(0,0,0,0,0,64);gr.addColorStop(0,"rgba(255,215,120,.55)");gr.addColorStop(1,"rgba(255,215,120,0)");g.fillStyle=gr;g.fillRect(-64,-64,128,128);
  g.fillStyle="#ffe2a0";g.beginPath();for(let i=0;i<8;i++){const r=i%2?9:30,a=i*Math.PI/4-Math.PI/2;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();
  g.strokeStyle="rgba(255,226,160,.8)";g.lineWidth=3;g.beginPath();g.arc(0,0,40,0,Math.PI*2);g.stroke();return new THREE.CanvasTexture(c)}
function copCar(){const g=new THREE.Group();const body=new THREE.MeshStandardMaterial({color:0x10131a,roughness:.35,metalness:.6});
  add(g,new THREE.Mesh(new THREE.BoxGeometry(.38,.1,.17),body),0,.07,0);add(g,new THREE.Mesh(new THREE.BoxGeometry(.2,.07,.15),new THREE.MeshStandardMaterial({color:0xd8dce4,roughness:.5})),-.02,.15,0);
  const blue=add(g,new THREE.Mesh(new THREE.BoxGeometry(.05,.03,.06),new THREE.MeshBasicMaterial({color:new THREE.Color(0x3a6bff).multiplyScalar(2.4)})),-.02,.2,-.035);
  const red=add(g,new THREE.Mesh(new THREE.BoxGeometry(.05,.03,.06),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff2a3a).multiplyScalar(2.4)})),-.02,.2,.035);
  const pb=colorPool(g,0,0,0x3a6bff,1.6,.0),pr=colorPool(g,0,0,0xff2a3a,1.6,.0);g.userData={blue,red,pb,pr,ph:Math.random()*6};return g}
function extras(){cops=[];ritual=null;
  const rr2=R*2.6*W;const rg=new THREE.Group();const ringM=new THREE.MeshBasicMaterial({color:new THREE.Color(0x9a86ea).multiplyScalar(1.6),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const ring=add(rg,new THREE.Mesh(new THREE.RingGeometry(rr2-.05,rr2+.05,96),ringM),0,.12,0);ring.rotation.x=-Math.PI/2;
  for(let i=0;i<24;i++){if(i%2)continue;const a=i/24*Math.PI*2;const d=add(rg,new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(0xb8a6ff).multiplyScalar(2)})),Math.cos(a)*rr2,.18,Math.sin(a)*rr2)}
  const veil=add(rg,new THREE.Mesh(new THREE.CylinderGeometry(rr2,rr2,1.6,64,1,true),new THREE.MeshBasicMaterial({color:0x7a66d0,transparent:true,opacity:.06,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})),0,.8,0);
  rg.visible=false;world.add(rg);ritual=rg;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:sealTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));sp.scale.set(1.3,1.3,1);const [ex,ez]=hexCenter("0,0");sp.position.set(ex,3.6,ez);sp.visible=false;world.add(sp);seal=sp}
function syncExtras(m,playing){if(!world||!ritual)return;
  // патрули: как на 2D-карте — по одному на каждые две ступени тревоги, в открытых районах
  const want=[];if(playing&&["walk","court"].includes(G.phase)){const n=Math.floor(threatLvl()/2);const list=Object.values(city.map).filter(h=>h.t!=="river"&&h.t!=="ely"&&m.seen.has(h.k));
    for(let i=0;i<Math.min(n,list.length);i++)want.push(list[(i*7919+G.night*31)%list.length].k)}
  while(cops.length<want.length){const c=copCar();world.add(c);cops.push(c)}
  cops.forEach((c,i)=>{const k=want[i];c.visible=!!k;if(!k)return;const e=(i*3+G.night)%6;const [x,z]=edgeMid(k,e);const [cx,cz]=hexCenter(k);
    c.position.set(x*.9+cx*.1,0,z*.9+cz*.1);const [dx,dz]=edgeDir(e);c.rotation.y=Math.atan2(dx,dz)});
  // круг ритуала Тремер
  const R1=playing&&m.ritual&&G.time<=m.ritual.until;ritual.visible=!!R1;if(R1){const [x,z]=hexCenter(m.ritual.c);ritual.position.set(x,0,z)}
  // печать дела над Элизиумом
  seal.visible=!!(playing&&G.case&&m.seen.has("0,0"))}
function tickExtras(T){for(const c of cops){if(!c.visible)continue;const u=c.userData;const f=Math.sin(T*9+u.ph)>0;u.blue.visible=f;u.red.visible=!f;u.pb.material.opacity=f?.45:0;u.pr.material.opacity=f?0:.45}
  if(ritual&&ritual.visible){ritual.rotation.y=T*.15;ritual.children[ritual.children.length-1].material.opacity=.05+.03*Math.sin(T*1.6)}
  if(seal&&seal.visible){seal.position.y=3.6+Math.sin(T*1.2)*.15;seal.material.rotation=Math.sin(T*.5)*.15}}

/* --- камера: «к себе», «район», «весь город» --- */
function focus(instant){if(!city)return;const m=me();const far=UI.zoom==="far"||!m||!m.clan;follow=!far;
  const t=far?new THREE.Vector3():tok.position.clone();const d=far?Math.max(40,CONFIG.radius*11):UI.zoom==="mid"?22:13;
  cam.goal={t,d,phi:far?.9:1.02};if(instant){cam.target.copy(t);cam.dist=d;cam.phi=cam.goal.phi;cam.goal=null;placeCam()}need=true}

/* --- ввод --- */
let drag=null,pinch=null,moved_=0;
/* управление как в «Эпохе Сумерек»: левая кнопка — тянуть карту (точка под курсором остаётся под курсором),
   правая — вращать и наклонять вокруг центра экрана, колесо — плавное приближение к точке под курсором,
   щелчок без сдвига — выбрать район; на сенсорном экране — один палец тянет, два — масштаб */
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function groundAt(cx,cy){const r=renderer.domElement.getBoundingClientRect();mouse.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);
  const v=new THREE.Vector3();return ray.ray.intersectPlane(groundPlane,v)?v:null}
let zGo=null;
function zoomStep(){if(!zGo)return;const done=Math.abs(Math.log(zGo.d/cam.dist))<.004;cam.dist=done?zGo.d:cam.dist*Math.pow(zGo.d/cam.dist,.24);placeCam();
  const h=groundAt(zGo.sx,zGo.sy);if(h&&zGo.w){cam.target.x+=zGo.w.x-h.x;cam.target.z+=zGo.w.z-h.z;placeCam()}need=true;if(done)zGo=null}
function bindInput(){const el=renderer.domElement;const pts=new Map();
  el.addEventListener("pointerdown",e=>{el.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);cam.goal=null;zGo=null;
    if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1]);drag=null;return}
    drag={x:e.clientX,y:e.clientY,b:e.button,id:e.pointerId,mode:e.button===2?"orb":"pan",w:groundAt(e.clientX,e.clientY)};moved_=0});
  el.addEventListener("pointermove",e=>{if(pts.has(e.pointerId))pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2&&pinch){const [a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d>0){cam.dist=Math.min(95,Math.max(5,cam.dist*pinch/d));pinch=d;need=true}return}
    if(!drag||drag.id!==e.pointerId){hoverAt(e);return}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;moved_+=Math.abs(dx)+Math.abs(dy);if(moved_<6)return;
    if(drag.mode==="orb"){cam.theta-=dx*.0052;cam.phi=Math.min(1.3,Math.max(.12,cam.phi-dy*.0044))}
    else if(drag.w){placeCam();const h=groundAt(e.clientX,e.clientY);if(h){cam.target.x+=drag.w.x-h.x;cam.target.z+=drag.w.z-h.z}follow=false}
    need=true});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(drag&&drag.id===e.pointerId){if(drag.mode==="pan"&&moved_<6&&e.type==="pointerup"){const k=hexAt(e);if(k)clickHex(k)}drag=null}};
  el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
  el.addEventListener("contextmenu",e=>e.preventDefault());
  el.addEventListener("wheel",e=>{e.preventDefault();cam.goal=null;const base=zGo?zGo.d:cam.dist;
    const d=Math.min(95,Math.max(4,base*Math.exp(e.deltaY*(e.deltaMode?.05:.0015))));zGo={d,sx:e.clientX,sy:e.clientY,w:groundAt(e.clientX,e.clientY)};follow=false;need=true},{passive:false});}
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let hov=null;
function hexAt(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);
  const hit=ray.intersectObjects(Object.values(hexes).map(H=>H.ground),false)[0];return hit?hit.object.userData.k:null}
function hoverAt(e){const k=hexAt(e);if(k===hov)return;if(hov&&hexes[hov])update();hov=k;if(k&&hexes[k]&&hexes[k].ring.visible){hexes[k].ring.material.opacity=1}renderer.domElement.style.cursor=k?"pointer":"grab"}

/* --- цикл --- */
function resize(){if(!on)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(composer){composer.setSize(w,h);bloom.resolution.set(w,h)}need=true}
let t0=performance.now();
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.1,(t-t0)/1000);t0=t;const T=t/1000;
  if(!on||document.hidden||document.body.classList.contains("sc-open")||!world)return;
  if(window.BTD_TEST){if(t-(frame.R||0)<2500)return;frame.R=t} // в автотестах (программный рендер) рисуем редко
  if(cam.goal){const g=cam.goal,k=1-Math.pow(.02,dt);cam.target.lerp(g.t,k);cam.dist+=(g.d-cam.dist)*k;cam.phi+=(g.phi-cam.phi)*k;if(cam.target.distanceTo(g.t)<.05&&Math.abs(cam.dist-g.d)<.1)cam.goal=null}
  zoomStep();tickToken(dt);if(follow&&tok&&!cam.goal&&!drag&&!zGo){const p=tok.position;cam.target.x+=(p.x-cam.target.x)*Math.min(1,dt*3);cam.target.z+=(p.z-cam.target.z)*Math.min(1,dt*3)}
  placeCam();
  if(LAMPS.length&&(!frame.L||t-frame.L>350)){frame.L=t;const v=new THREE.Vector3();const ls=LAMPS.map(l=>{l.grp.localToWorld(v.set(l.x,l.y,l.z));return {p:v.clone(),c:l.col,d:v.distanceToSquared(cam.target)}}).sort((a,b)=>a.d-b.d).slice(0,PL.length);
    PL.forEach((L,i)=>{const l=ls[i];if(!l){L.intensity=0;return}L.position.copy(l.p).y-=.05;L.color.setHex(l.c);L.intensity=1.6})}
  if(precip&&!reduce){const p=precip.geometry.attributes.position;
    if(precip.userData.kind==="rain"){for(let i=0;i<p.count;i+=2){let y=p.getY(i)-dt*26;if(y<0)y+=40;p.setY(i,y);p.setY(i+1,y-.55)}}
    else{for(let i=0;i<p.count;i++){let y=p.getY(i)-dt*1.6;if(y<0)y+=40;p.setY(i,y)}}p.needsUpdate=true}
  if(!reduce){for(const m of mist){m.t.offset.x+=m.sp*dt;m.t.offset.y+=m.sp*.6*dt}for(const w of new Set(WATER))if(w.map){w.map.offset.x+=dt*.012;w.map.offset.y+=dt*.006}
    for(const b of blinkers){b.m.visible=Math.sin(T*2.2+b.ph)>.2}
    tickExtras(T);
    for(const f of flick){const v=f.fire?f.base*(.75+.25*Math.sin(T*9+f.ph)*Math.sin(T*3.3+f.ph)):(Math.sin(T*.7+f.ph)>.96?f.base*.15:f.base);f.m.material.opacity=v;if(f.c)f.c.material.opacity=v/3.5}}
  if(composer)composer.render();else renderer.render(scene,camera);
  const r=renderer.domElement.getBoundingClientRect();for(const l of labels){if(l.el.dataset.on!=="1"){l.el.style.display="none";continue}const v=l.pos.clone().project(camera);
    const vis=v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05&&cam.dist<40;l.el.style.display=vis?"block":"none";if(vis){l.el.style.transform=`translate(${((v.x+1)/2*r.width).toFixed(0)}px,${((1-v.y)/2*r.height).toFixed(0)}px) translate(-50%,-50%)`;l.el.style.opacity=Math.max(.25,Math.min(1,1.3-(camera.position.distanceTo(l.pos)/30))).toFixed(2)}}}
const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- включение и переключение 2D/3D --- */
function mount(){if(mounted||!renderer)return;mounted=true;host.appendChild(renderer.domElement);host.appendChild(lblBox);
  setupPost();for(let i=0;i<10;i++){const L=new THREE.PointLight(0xffffff,0,4.5,2);scene.add(L);PL.push(L)}bindInput();
  addEventListener("resize",resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(host);requestAnimationFrame(frame)}
function attach(){const w=document.getElementById("mapwrap");if(w&&host.parentNode!==w)w.appendChild(host);document.body.classList.toggle("v3d",on)}
function setOn(v){on=!!v&&!!renderer;try{localStorage.setItem(VIEW_KEY,on?"3d":"2d")}catch(e){}attach();if(on){mount();resize();if(G&&G.city!==city)buildCity();update();focus(true)}
  document.querySelectorAll("[data-view] .ib-t").forEach(b=>b.textContent=on?"2D":"3D")}
function rebuild(){attach();if(!on)return;mount();if(ART.ready)buildCity();else loadArt(()=>{buildCity();focus(true)})}
on=wantOn();
return {get on(){return on},ok:!!renderer,setOn,rebuild,update:()=>{if(on)update()},moved:k=>{if(on)moved(k)},focus:i=>{if(on)focus(i)}};

})();
