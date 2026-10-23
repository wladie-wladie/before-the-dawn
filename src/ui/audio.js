/* ============================ ЗВУК ============================ */
// Базовый пэд на синусах + слой района. Без шумов: только тональные звуки.
let AC=null,master=null,ambOn=false,timers=[],layers={},curLayer=null,padNodes=[];
const audioEl=new Audio();audioEl.loop=true;
function vol(){return +$("#vol").value}
function impulse(sec){const len=Math.floor(AC.sampleRate*sec);const b=AC.createBuffer(2,len,AC.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);const pre=Math.floor(AC.sampleRate*.03);for(let i=0;i<len;i++){const t=i/AC.sampleRate;d[i]=(Math.random()*2-1)*(i<pre?i/pre:Math.exp(-t*3.2/sec))*.5}}return b}
function note(dest,f,t,att,dec,gain,type="sine"){const o=AC.createOscillator();o.type=type;o.frequency.value=f;const g=AC.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+att);g.gain.exponentialRampToValueAtTime(0.0001,t+att+dec);o.connect(g);g.connect(dest);o.start(t);o.stop(t+att+dec+.1)}
function loop(fn,min,max){const tick=()=>{if(!ambOn)return;fn();timers.push(setTimeout(tick,min+Math.random()*(max-min)))};timers.push(setTimeout(tick,min*0.5+Math.random()*min))}
function startAudio(){
  AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
  const t0=AC.currentTime;
  master=AC.createGain();master.gain.setValueAtTime(0,t0);master.gain.linearRampToValueAtTime(vol()*2,t0+6);
  const lp=AC.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2200;const hp=AC.createBiquadFilter();hp.type="highpass";hp.frequency.value=40;
  master.connect(hp);hp.connect(lp);lp.connect(AC.destination);
  const rev=AC.createConvolver();rev.buffer=impulse(5);const wet=AC.createGain();wet.gain.value=.55;rev.connect(wet);wet.connect(master);
  const bus=AC.createGain();bus.connect(master);bus.connect(rev);
  // пэд: не сплошной гул, а редкие «вдохи» — аккорд мягко нарастает, держится и затихает, потом тишина
  const CH=[[220,329.63,440],[174.61,261.63,349.23],[196,293.66,392],[164.81,246.94,329.63]];const LEV=[.06,.035,.02];
  let ci=0;
  const breathe=()=>{const t=AC.currentTime;const ch=CH[ci];ci=(ci+1)%CH.length;
    ch.forEach((f,k)=>{const o=AC.createOscillator();o.frequency.value=f;const g=AC.createGain();g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(LEV[k],t+6);g.gain.setValueAtTime(LEV[k],t+10);g.gain.exponentialRampToValueAtTime(0.0001,t+17);
      o.connect(g);g.connect(bus);o.start(t);o.stop(t+17.5)})};
  breathe();loop(breathe,24000,38000);
  // слои районов: у каждого свой гейн, громкость меняется при переходе
  const mk=()=>{const g=AC.createGain();g.gain.value=0;g.connect(bus);return g};
  layers={water:mk(),club:mk(),sacred:mk(),city:mk(),industry:mk(),nature:mk()};
  // вода: низкий туманный гудок и колокол буя
  loop(()=>{const t=AC.currentTime;note(layers.water,110,t,2.5,4,.035)},45000,80000);
  loop(()=>{const t=AC.currentTime;note(layers.water,880,t,.01,6,.025);note(layers.water,1320,t,.01,4,.01)},7000,13000);
  // клубы: глухая бочка сквозь стены и приглушённые аккорды
  loop(()=>{const t=AC.currentTime;for(let i=0;i<8;i++){const tt=t+i*.54;const o=AC.createOscillator();o.frequency.setValueAtTime(90,tt);o.frequency.exponentialRampToValueAtTime(48,tt+.18);const g=AC.createGain();g.gain.setValueAtTime(.0001,tt);g.gain.exponentialRampToValueAtTime(.06,tt+.01);g.gain.exponentialRampToValueAtTime(.0001,tt+.3);o.connect(g);g.connect(layers.club);o.start(tt);o.stop(tt+.35)}},14000,26000);
  loop(()=>{const t=AC.currentTime;[220,261.63,329.63].forEach(f=>note(layers.club,f,t,.4,2.5,.012,"triangle"))},4300,9000);
  // святыни и старый город: высокие колокольные ноты и органная квинта
  loop(()=>{const t=AC.currentTime;const f=[523.25,587.33,659.25,783.99][Math.floor(Math.random()*4)];note(layers.sacred,f,t,.01,7,.03);note(layers.sacred,f*2.76,t,.01,3,.006)},6000,12000);
  // жилые и деловые: далёкое пианино из окна
  loop(()=>{const t=AC.currentTime;const sc=[220,246.94,261.63,293.66,329.63,392,440];for(let i=0;i<3+Math.floor(Math.random()*3);i++)note(layers.city,sc[Math.floor(Math.random()*sc.length)],t+i*(.45+Math.random()*.3),.01,2.2,.022,"triangle")},5000,11000);
  // промзона: металлические отзвуки и низкий гул машин
  loop(()=>{const t=AC.currentTime;note(layers.industry,371,t,.005,2.2,.012);note(layers.industry,598,t,.005,1.4,.006)},9000,18000);
  // парк и пустыри: редкие птичьи «чириканья» и сверчки-тона
  loop(()=>{const t=AC.currentTime;const f=2200+Math.random()*900;for(let i=0;i<2+Math.floor(Math.random()*3);i++){const o=AC.createOscillator();o.frequency.setValueAtTime(f,t+i*.12);o.frequency.exponentialRampToValueAtTime(f*1.25,t+i*.12+.06);const g=AC.createGain();g.gain.setValueAtTime(.0001,t+i*.12);g.gain.exponentialRampToValueAtTime(.008,t+i*.12+.01);g.gain.exponentialRampToValueAtTime(.0001,t+i*.12+.09);o.connect(g);g.connect(layers.nature);o.start(t+i*.12);o.stop(t+i*.12+.12)}},4000,9000);
  loop(()=>{const t=AC.currentTime;note(layers.nature,587.33,t,1.2,3,.01)},14000,24000);
  // далёкие сирены: чем выше незримая угроза, тем чаще
  loop(()=>{if(Math.random()>threatLvl()/12)return;const t=AC.currentTime;const o=AC.createOscillator();o.type="sine";const g=AC.createGain();
    o.frequency.setValueAtTime(620,t);for(let i=0;i<6;i++){o.frequency.linearRampToValueAtTime(i%2?620:880,t+.9*(i+1))}
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.008,t+1.5);g.gain.exponentialRampToValueAtTime(.0001,t+5.6);o.connect(g);g.connect(bus);o.start(t);o.stop(t+5.8)},25000,50000);
  setDistrictSound(true);
}
function setDistrictSound(instant){
  noirSetDistrict();
  if(!AC||!ambOn||!myPos())return;
  const g=TYPES[G.city.map[myPos()].t].g;const t=AC.currentTime;
  for(const [k,node] of Object.entries(layers)){node.gain.cancelScheduledValues(t);node.gain.setTargetAtTime(k===g?1:0,t,instant?.5:1.6)}
  curLayer=g;
}
function stopAudio(){if(!AC||!master)return;timers.forEach(clearTimeout);timers=[];const t=AC.currentTime;const m=master;m.gain.cancelScheduledValues(t);m.gain.setValueAtTime(m.gain.value,t);m.gain.linearRampToValueAtTime(0,t+2.5);const ns=padNodes;padNodes=[];setTimeout(()=>{ns.forEach(n=>{try{n.stop()}catch(e){}});try{m.disconnect()}catch(e){}},2700)}
function footstep(){if(!AC)return;const dst=ambOn?master:NZ.on?NZ.nodes.master:null;if(!dst)return;const t=AC.currentTime;note(dst,120,t,.005,.18,.05);note(dst,100,t+.16,.005,.16,.035)}
let sndMode="off";
function setSound(m){
  if(sndMode==="amb"){ambOn=false;stopAudio()}if(sndMode==="noir")stopNoir();
  sndMode=m;if(m!=="off")audioEl.pause();
  if(m==="amb"){ambOn=true;startAudio()}if(m==="noir")startNoir();
  document.querySelectorAll("#snd button").forEach(b=>b.classList.toggle("on",b.dataset.m===m));
  try{localStorage.setItem("btd-sound",m)}catch(e){}
}
function initAudioUI(){
  document.querySelectorAll("#snd button").forEach(b=>b.onclick=()=>setSound(b.dataset.m));
  $("#trackIn").onchange=e=>{const f=e.target.files[0];if(!f)return;if(audioEl.src)URL.revokeObjectURL(audioEl.src);audioEl.src=URL.createObjectURL(f);audioEl.volume=vol();setSound("off");audioEl.play().then(()=>{$("#trackBtn").hidden=false;$("#trackBtn").textContent="Трек: пауза"}).catch(()=>{$("#trackBtn").hidden=false;$("#trackBtn").textContent="Трек: играть"})};
  $("#trackBtn").onclick=()=>{if(audioEl.paused){audioEl.play();$("#trackBtn").textContent="Трек: пауза"}else{audioEl.pause();$("#trackBtn").textContent="Трек: играть"}};
  $("#vol").oninput=()=>{audioEl.volume=vol();if(ambOn&&master)master.gain.setTargetAtTime(vol()*2,AC.currentTime,.3);if(NZ.on)NZ.nodes.master.gain.setTargetAtTime(vol()*1.6,AC.currentTime,.3)};
}
/* ============================ ЗВУК «НУАР» в духе Bloodlines ============================
   Своя музыка в этой эстетике: чистая гитара (синтез щипковой струны) с хорусом и задержкой,
   медленный трип-хоп бит в части районов, бас по сильной доле, минорные циклы.
   У каждой группы районов — свой стиль, смена на начале такта. Старый эмбиент сохранён отдельно. */
const NOIR_STYLES={
  // набережные и порт: меланхолия у воды, без бита
  water:{bpm:70,prog:[[57,60,64,69],[53,57,60,64],[48,52,55,60],[55,59,62,67]],root:[45,41,36,43],beat:0,arp:.55,bass:.55,keys:0,pent:false,cut:2600},
  // жилые, деловые, мэрия, больница: холодно, электропиано, тихий бит
  city:{bpm:78,prog:[[52,55,59,64],[48,52,55,59],[45,48,52,57],[47,51,54,59]],root:[40,36,33,35],beat:.55,arp:.4,bass:.6,keys:.5,pent:false,cut:2200},
  // клубы и театры: грув «из-за стены», бас активнее
  club:{bpm:84,prog:[[50,53,57,62],[46,50,53,58],[43,46,50,55],[45,49,52,57]],root:[38,34,31,33],beat:1,arp:.3,bass:1,keys:.25,pent:false,cut:900,walk:true},
  // старый город, собор, кладбище, Элизиум: медленно, высокие флажолеты, без бита
  sacred:{bpm:60,prog:[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,61]],root:[38,34,36,33],beat:0,arp:.35,bass:.4,keys:0,pent:false,cut:3000,high:true},
  // трущобы, промзона, вокзал: тьма, редкие низкие ноты, редкая бочка
  industry:{bpm:66,prog:[[40,47,52,55],[41,48,53,56],[40,47,52,55],[38,45,50,53]],root:[28,29,28,26],beat:.35,arp:.25,bass:.7,keys:0,pent:false,cut:1400,dark:true},
  // парк и пустыри: тихая гитара и воздух
  nature:{bpm:64,prog:[[57,64,67,71],[55,62,65,69],[53,60,64,67],[52,59,62,67]],root:[45,43,41,40],beat:0,arp:.4,bass:.35,keys:0,pent:false,cut:3200},
  // рынок: пентатоника щипковых, мягкий бит («тёмная Азия»)
  market:{bpm:74,prog:[[57,60,64],[55,58,62],[53,57,60],[52,55,59]],root:[45,43,41,40],beat:.5,arp:.5,bass:.6,keys:0,pent:true,cut:2800},
};
const NZ={on:false,timer:null,next:0,step:0,bar:0,style:"water",want:"water",nodes:{},rest:0};
const mtof=m=>440*Math.pow(2,(m-69)/12);
const ksCache={};
// щипковая струна (Karplus–Strong), считается заранее и кэшируется
function ksBuffer(freq,bright=.5,dur=3.4){
  const key=freq.toFixed(1)+"_"+bright;if(ksCache[key])return ksCache[key];
  const sr=AC.sampleRate,len=Math.floor(sr*dur),N=Math.max(2,Math.round(sr/freq));
  const b=AC.createBuffer(1,len,sr),d=b.getChannelData(0);
  let last=0;for(let i=0;i<N;i++){const w=Math.random()*2-1;last=last+(w-last)*bright;d[i]=last}
  const decay=.996-(freq>600?.004:0);
  d[N]=d[0]*decay;for(let i=N+1;i<len;i++)d[i]=decay*.5*(d[i-N]+d[i-N-1]);
  // мягкий спад в конце
  for(let i=len-sr*.3;i<len;i++)d[i]*=(len-i)/(sr*.3);
  return ksCache[key]=b;
}
function noirBuild(){
  const t0=AC.currentTime;const n=NZ.nodes={};
  n.master=AC.createGain();n.master.gain.setValueAtTime(0,t0);n.master.gain.linearRampToValueAtTime(vol()*1.6,t0+3);
  const hp=AC.createBiquadFilter();hp.type="highpass";hp.frequency.value=38;n.master.connect(hp);hp.connect(AC.destination);
  n.rev=AC.createConvolver();n.rev.buffer=impulse(4.2);n.revG=AC.createGain();n.revG.gain.value=.5;n.rev.connect(n.revG);n.revG.connect(n.master);
  // гитара: хорус → задержка с затуханием → реверберация
  n.gtr=AC.createGain();n.gtr.gain.value=.9;
  const dry=AC.createGain();dry.gain.value=.8;n.gtr.connect(dry);dry.connect(n.master);
  for(const [base,depth,rate] of [[.012,.0025,.6],[.019,.003,.43]]){const dl=AC.createDelay(.05);dl.delayTime.value=base;const l=AC.createOscillator();l.frequency.value=rate;const lg=AC.createGain();lg.gain.value=depth;l.connect(lg);lg.connect(dl.delayTime);l.start();NZ.nodes["lfo"+base]=l;const g=AC.createGain();g.gain.value=.35;n.gtr.connect(dl);dl.connect(g);g.connect(n.master);g.connect(n.rev)}
  n.dly=AC.createDelay(2);n.dly.delayTime.value=.6;n.fb=AC.createGain();n.fb.gain.value=.38;const dlp=AC.createBiquadFilter();dlp.type="lowpass";dlp.frequency.value=2000;
  n.gtr.connect(n.dly);n.dly.connect(dlp);dlp.connect(n.fb);n.fb.connect(n.dly);const dg=AC.createGain();dg.gain.value=.4;dlp.connect(dg);dg.connect(n.master);dg.connect(n.rev);
  n.gtr.connect(n.rev);
  // бит и бас — через общий фильтр (в клубах он «за стеной»)
  n.beatF=AC.createBiquadFilter();n.beatF.type="lowpass";n.beatF.frequency.value=2200;n.beatF.Q.value=.6;n.beat=AC.createGain();n.beat.gain.value=0;
  n.beat.connect(n.beatF);n.beatF.connect(n.master);const bs=AC.createGain();bs.gain.value=.12;n.beatF.connect(bs);bs.connect(n.rev);
  n.bass=AC.createGain();n.bass.gain.value=.8;n.bass.connect(n.beatF);
  n.keys=AC.createGain();n.keys.gain.value=.5;n.keys.connect(n.master);n.keys.connect(n.rev);
  n.str=AC.createGain();n.str.gain.value=.6;n.str.connect(n.master);n.str.connect(n.rev);
  // короткий шумовой буфер для рима и хэта (не фон — щелчки по 20–40 мс)
  const nb=AC.createBuffer(1,AC.sampleRate*.1,AC.sampleRate);const nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;n.noise=nb;
}
function pluck(m,t,v,bright){const src=AC.createBufferSource();src.buffer=ksBuffer(mtof(m),bright);const g=AC.createGain();g.gain.value=v;src.connect(g);g.connect(NZ.nodes.gtr);src.start(t)}
function kick(t,v){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.16);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.5*v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.42);o.connect(g);g.connect(NZ.nodes.beat);o.start(t);o.stop(t+.45)}
function click(t,v,f,len){const s=AC.createBufferSource();s.buffer=NZ.nodes.noise;const bp=AC.createBiquadFilter();bp.type="bandpass";bp.frequency.value=f;bp.Q.value=1.2;const g=AC.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+len);s.connect(bp);bp.connect(g);g.connect(NZ.nodes.beat);s.start(t);s.stop(t+len+.01)}
function rim(t,v){click(t,.18*v,1900,.06);const o=AC.createOscillator(),g=AC.createGain();o.type="triangle";o.frequency.value=380;g.gain.setValueAtTime(.08*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.08);o.connect(g);g.connect(NZ.nodes.beat);o.start(t);o.stop(t+.1)}
function bassNote(m,t,len,v){const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type="triangle";o.frequency.value=mtof(m);f.type="lowpass";f.frequency.value=320;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.32*v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(f);f.connect(g);g.connect(NZ.nodes.bass);o.start(t);o.stop(t+len+.05)}
function epChord(ch,t,v){for(const m of ch){const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),g2=AC.createGain();o.frequency.value=mtof(m+12);o2.frequency.value=mtof(m+12)*4.01;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.035*v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+3.2);g2.gain.setValueAtTime(.008*v,t);g2.gain.exponentialRampToValueAtTime(.0001,t+.5);
  o.connect(g);o2.connect(g2);g.connect(NZ.nodes.keys);g2.connect(NZ.nodes.keys);o.start(t);o2.start(t);o.stop(t+3.3);o2.stop(t+.6)}}
function bowed(m,t){const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type="sawtooth";o.frequency.value=mtof(m);const vib=AC.createOscillator(),vg=AC.createGain();vib.frequency.value=5;vg.gain.value=2.5;vib.connect(vg);vg.connect(o.frequency);
  f.type="bandpass";f.frequency.value=900;f.Q.value=.9;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+2.2);g.gain.exponentialRampToValueAtTime(.0001,t+6);o.connect(f);f.connect(g);g.connect(NZ.nodes.str);o.start(t);vib.start(t);o.stop(t+6.2);vib.stop(t+6.2)}
const PENT=[0,3,5,7,10];
function noirTick(){
  if(!NZ.on)return;
  while(NZ.next<AC.currentTime+.25){scheduleStep(NZ.step,NZ.next);const S=NOIR_STYLES[NZ.style];NZ.next+=60/S.bpm/4;NZ.step=(NZ.step+1)%16;if(NZ.step===0)nextBar()}
}
function nextBar(){
  NZ.bar++;
  if(NZ.want!==NZ.style&&NZ.bar%2===0){NZ.style=NZ.want;applyStyleMix(false)}
  if(NZ.rest>0)NZ.rest--;else if(NZ.bar%8===0&&Math.random()<.5)NZ.rest=1+Math.floor(Math.random()*2); // паузы для воздуха
}
function scheduleStep(step,t){
  const S=NOIR_STYLES[NZ.style];const ci=Math.floor(NZ.bar/2)%S.prog.length;const ch=S.prog[ci];const resting=NZ.rest>0;
  // бит
  if(S.beat&&!resting){
    if(step===0||(step===10&&Math.random()<.7)||(step===7&&Math.random()<.25))kick(t,S.beat);
    if(step===4||step===12)rim(t,S.beat);
    if(step%2===0&&Math.random()<.5)click(t,.035*S.beat,8000,.02);
  }
  // бас
  if(S.bass&&step===0)bassNote(S.root[ci],t,S.walk?.5:1.8,S.bass);
  if(S.bass&&S.walk&&!resting&&(step===6||step===10||step===14)&&Math.random()<.6)bassNote(S.root[ci]+pick([0,7,12,10]),t,.35,S.bass*.8);
  // электропиано на смену аккорда
  if(S.keys&&step===0&&NZ.bar%2===0&&!resting)epChord(ch.slice(0,3),t,S.keys);
  // гитара: редкое арпеджио восьмыми, много воздуха
  if(step%2===0&&!resting&&Math.random()<S.arp){
    let m;if(S.pent){m=S.root[ci]+24+PENT[Math.floor(Math.random()*5)]+(Math.random()<.3?12:0)}
    else{m=ch[(step/2+Math.floor(Math.random()*2))%ch.length]+(S.high&&Math.random()<.5?12:0)+(S.dark?-12:0)}
    pluck(m,t+(Math.random()*.012),.32+Math.random()*.2,S.pent?.75:S.dark?.25:.45);
  }
  // незримая угроза: низкие смычковые с «балканским» оттенком
  if(step===0&&NZ.bar%2===0&&Math.random()<threatLvl()/22)bowed(S.root[ci]+12+pick([0,1,7]),t);
}
function noirGroup(){if(!myPos())return "water";const t=G.city.map[myPos()].t;if(t==="market")return "market";return TYPES[t].g}
function applyStyleMix(instant){
  if(!NZ.on)return;const S=NOIR_STYLES[NZ.style];const t=AC.currentTime,n=NZ.nodes;
  n.beat.gain.setTargetAtTime(S.beat?.9:0,t,instant?.1:1.2);n.beatF.frequency.setTargetAtTime(S.cut,t,instant?.1:1.5);
  n.dly.delayTime.setTargetAtTime(60/S.bpm*.75,t,.5);
}
function startNoir(){
  AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
  noirBuild();NZ.on=true;NZ.style=NZ.want=noirGroup();NZ.bar=0;NZ.step=0;NZ.rest=0;NZ.next=AC.currentTime+.1;applyStyleMix(true);
  NZ.timer=setInterval(noirTick,60);
  // далёкие сирены, как и в эмбиенте
  NZ.siren=setInterval(()=>{if(!NZ.on||Math.random()>threatLvl()/12)return;const t=AC.currentTime;const o=AC.createOscillator();const g=AC.createGain();
    o.frequency.setValueAtTime(620,t);for(let i=0;i<6;i++)o.frequency.linearRampToValueAtTime(i%2?620:880,t+.9*(i+1));g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.006,t+1.5);g.gain.exponentialRampToValueAtTime(.0001,t+5.6);o.connect(g);g.connect(NZ.nodes.rev);o.start(t);o.stop(t+5.8)},30000);
}
function stopNoir(){if(!NZ.on)return;NZ.on=false;clearInterval(NZ.timer);clearInterval(NZ.siren);const t=AC.currentTime,m=NZ.nodes.master;m.gain.cancelScheduledValues(t);m.gain.setValueAtTime(m.gain.value,t);m.gain.linearRampToValueAtTime(0,t+2);
  const nodes=NZ.nodes;setTimeout(()=>{for(const k in nodes)if(k.startsWith("lfo"))try{nodes[k].stop()}catch(e){}try{m.disconnect()}catch(e){}},2300)}
function noirSetDistrict(){if(NZ.on)NZ.want=noirGroup()}