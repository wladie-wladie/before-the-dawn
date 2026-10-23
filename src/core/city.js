/* ============================ ГОРОД: типы районов и имена (из v0.9) ============================ */
const TYPES = {
  ely:   {n:"Элизиум",          g:"sacred", base:"#2b2519", d:"Нейтральная земля двора Князя. Здесь не охотятся и не повышают голос."},
  gov:   {n:"Мэрия",            g:"city",   base:"#1f2433", d:"Колонны, флаги, охрана у входа. Ночью здесь решают то, что днём только подписывают."},
  biz:   {n:"Деловой квартал",  g:"city",   base:"#1b2232", d:"Стеклянные башни, где свет горит до утра. Деньги здесь не спят — и некоторые владельцы тоже."},
  old:   {n:"Старый город",     g:"sacred", base:"#262027", d:"Узкие улицы, брусчатка, дома старше этой страны. Камень помнит больше, чем люди."},
  cath:  {n:"Собор",            g:"sacred", base:"#25202a", d:"Шпиль виден из любой точки города. Многие Сородичи обходят эту площадь стороной."},
  theatre:{n:"Театральный квартал",g:"club",base:"#2a1d2a", d:"Афиши, бархат, служебные входы. Артисты и публика здесь одинаково голодны до внимания."},
  club:  {n:"Неоновая миля",    g:"club",   base:"#241a2c", d:"Неон, очереди, басы из подвалов. Лучшие охотничьи угодья города — и самые людные."},
  uni:   {n:"Университет",      g:"city",   base:"#1d2430", d:"Читальни, лаборатории, общежития. Здесь задают слишком много вопросов."},
  hosp:  {n:"Больница",         g:"city",   base:"#1c2629", d:"Белый свет приёмного покоя и банк крови этажом ниже."},
  market:{n:"Рынок",            g:"city",   base:"#26221b", d:"Днём — торговые ряды, ночью — тенты, коты и те, кто покупает без чеков."},
  res:   {n:"Жилой квартал",    g:"city",   base:"#1e2129", d:"Дворы, окна, телевизоры. Тысячи спящих, которые ничего не должны заметить."},
  slum:  {n:"Трущобы",          g:"industry",base:"#231f1c",d:"Брошенные дома, костры в бочках. Здесь пропадают люди, и никто не ищет."},
  ind:   {n:"Промзона",         g:"industry",base:"#1f1f1f",d:"Цеха, трубы, ржавые ворота. Ночная смена не смотрит по сторонам."},
  rail:  {n:"Вокзал",           g:"industry",base:"#1f2226",d:"Последняя электричка, первые поезда. Люди приезжают и уезжают — удобно."},
  park:  {n:"Парк",             g:"nature", base:"#17221b", d:"Тёмные аллеи, пруд, скамейки. Тишина, в которой слышно чужие шаги."},
  edge:  {n:"Пустыри",          g:"nature", base:"#1a1d18", d:"Край города: гаражи, бурьян, линии электропередач. Здесь начинается ничья земля."},
  cem:   {n:"Кладбище",         g:"sacred", base:"#1b1e1d", d:"Старые склепы и новые ряды. Мёртвым здесь спокойнее, чем живым."},
  port:  {n:"Порт",             g:"water",  base:"#182028", d:"Краны, контейнеры, запах мазута. Здесь грузят то, о чём не пишут в декларациях."},
  river: {n:"Набережная",       g:"water",  base:"#151c26", d:"Чёрная вода под фонарями. Мосты связывают берега, которые не любят друг друга."},
};
const UNIQUE = ["gov","cath","uni","hosp","rail","cem"];
const NAMES = {
  ely:["Элизиум «Галерея Ровена»"],
  gov:["Площадь Ратуши"], cath:["Собор Святого Лазаря"], uni:["Университетский холм"], hosp:["Городская клиническая №1"], rail:["Северный вокзал"], cem:["Ваганьковская роща"],
  biz:["Стеклянный квартал","Биржевая","Башни Меридиан","Банковский переулок","Сити-Плаза"],
  old:["Брусчатка","Гильдейская","Часовая улица","Квартал Алхимиков","Подворье","Медный переулок"],
  theatre:["Бульвар Премьер","Оперная площадь","Кулисы"],
  club:["Неоновая миля","Бархатная улица","Подвалы на Южной","Квартал Огней","Красный фонарь","Стробоскоп"],
  market:["Старый рынок","Блошиные ряды","Крытый рынок"],
  res:["Кирпичные дворы","Сиреневый квартал","Улица Литейщиков","Колодцы","Тихий проезд","Спальный Восток","Ольховка","Дворы на Садовой","Шестой микрорайон","Каменный проезд"],
  slum:["Нижние бараки","Чёрная слобода","Пустые окна","Шанхай","Гнилой угол","Барачный тупик"],
  ind:["Литейный завод","Склады на Ржавой","Химкомбинат","Депо","Котельная №3","Цементный"],
  park:["Парк Победы","Лебединый пруд","Ботанический сад","Старый сквер","Липовая аллея","Вязовая роща","Сквер Поэтов","Оранжерея"],
  edge:["Гаражи","Пустошь","Высоковольтная","Свалка","Ветряный холм","Овраги","Дачи","Глиняный карьер"],
  port:["Западные доки","Грузовой причал","Рыбный порт","Пятый терминал"],
  river:["Набережная Фонарей","Каменный мост","Чугунный мост","Нижняя набережная","Лодочная станция","Разводной мост","Плавни"],
};
/* ============================ СЛУЖЕБНОЕ ============================ */
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
let rng=Math.random;
const rnd=n=>Math.floor(rng()*n), pick=a=>a[rnd(a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const K=(q,r)=>q+","+r;
const ring=(q,r)=>Math.max(Math.abs(q),Math.abs(r),Math.abs(-q-r));
const R=42, SQ=Math.sqrt(3);
const px=(q,r)=>[R*SQ*(q+r/2),R*1.5*r];
const hexPts=(cx,cy,k=1)=>{let p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);p.push([cx+R*k*Math.cos(a),cy+R*k*Math.sin(a)])}return p};
const ptsStr=p=>p.map(([x,y])=>x.toFixed(1)+","+y.toFixed(1)).join(" ");
const fmtTime=h=>{const t=h%48;return String(Math.floor(t/2)).padStart(2,"0")+":"+(t%2?"30":"00")};
let G=null; // состояние партии: мир + игроки G.P (см. core/state.js)

/* ============================ ГЕНЕРАЦИЯ ============================ */
function generate(seed){
  rng=mulberry(seed);
  const N=CONFIG.radius;const map={};
  for(let q=-N;q<=N;q++)for(let r=-N;r<=N;r++){if(ring(q,r)<=N)map[K(q,r)]={q,r,k:K(q,r),ring:ring(q,r),t:null,river:false}}
  const nb=k=>{const h=map[k];return DIRS.map(([dq,dr])=>K(h.q+dq,h.r+dr)).filter(x=>map[x])};
  // река: от края к противоположному краю, огибая центр
  const edge=Object.values(map).filter(h=>h.ring===N);
  const a=pick(edge);const b=map[K(-a.q,-a.r)];
  let cur=a.k;const path=[cur];const seen=new Set([cur]);
  for(let guard=0;guard<40&&cur!==b.k;guard++){
    const opts=nb(cur).filter(x=>!seen.has(x)&&x!=="0,0");
    if(!opts.length)break;
    opts.sort((x,y)=>dd(x,b.k)-dd(y,b.k)+(rng()-.5)*1.6);
    cur=opts[0];
    // не заходить в ближнее кольцо центра
    if(map[cur].ring<1){continue}
    path.push(cur);seen.add(cur);
  }
  function dd(x,y){const A=map[x],B=map[y];return Math.max(Math.abs(A.q-B.q),Math.abs(A.r-B.r),Math.abs(A.q+A.r-B.q-B.r))}
  path.forEach(k=>{map[k].river=true;map[k].t="river"});
  const riverPath=path;
  // центр
  map["0,0"].t="ely";
  const free=()=>Object.values(map).filter(h=>!h.t);
  const place=(t,filter)=>{const c=shuffle(free().filter(filter));if(c.length){c[0].t=t;return c[0]}return null};
  // уникальные с логикой положения
  place("gov",h=>h.ring===1);
  place("old",h=>h.ring===1);place("old",h=>h.ring===1||h.ring===2);
  place("cath",h=>h.ring<=2);
  place("uni",h=>h.ring===2);
  place("hosp",h=>h.ring===2||h.ring===3);
  place("rail",h=>h.ring===3);
  place("cem",h=>h.ring>=3);
  // порт — у реки, ближе к краю
  const riverAdj=h=>nb(h.k).some(x=>map[x].river);
  for(let i=0;i<2;i++)place("port",h=>riverAdj(h)&&h.ring>=2);
  // остальные по кольцам с весами и «сгустками» одинаковых районов
  const W={
    1:{old:5,biz:4,theatre:3,market:1},
    2:{old:3,biz:3,theatre:2,club:3,res:3,market:2,park:1},
    3:{res:5,club:2,park:1.5,ind:2,market:1,slum:2},
    4:{res:2.5,ind:3,edge:5,slum:2,park:1.2},
  };
  // проходим по свободным от центра к краю
  const order=free().sort((x,y)=>x.ring-y.ring||rng()-.5);
  for(const h of order){
    const w={...W[Math.min(4,Math.max(1,h.ring))]};
    const same={};for(const n of nb(h.k)){const t=map[n].t;if(t)same[t]=(same[t]||0)+1}
    for(const [t,c] of Object.entries(same)){if(w[t]===undefined)continue;if(c>=2&&["park","club","slum","ind"].includes(t))w[t]*=0.3;else w[t]+=1.3*c} // соседи тянут свой тип, но без огромных пятен
    const CAP={ind:6,slum:5,park:6,club:4,edge:8,res:13,old:6,biz:4,theatre:2,market:3};
    for(const t in w){const n=Object.values(map).filter(m=>m.t===t).length;if(CAP[t]&&n>=CAP[t])w[t]=0}
    const tot=Object.values(w).reduce((s,v)=>s+v,0)||1;let x=rng()*tot;let chosen="res";
    for(const [t,v] of Object.entries(w)){x-=v;if(x<=0){chosen=t;break}}
    h.t=chosen;
  }
  // имена: уникальные по списку, без повторов
  const used={};
  for(const h of Object.values(map)){
    const list=NAMES[h.t];const i=(used[h.t]=(used[h.t]||0));
    h.name=list[i%list.length]+(i>=list.length?" "+["II","III","IV"][Math.floor(i/list.length)-1]:"");
    used[h.t]++;
  }
  // мосты: участки реки, где обе стороны — суша на противоположных берегах; просто помечаем часть речных гексов
  riverPath.forEach((k,i)=>{map[k].bridge=i%2===1||rng()<.25});
  // художественные детали гекса (детерминированы сидом)
  for(const h of Object.values(map))h.art=artFor(h,riverPath,map);
  return {map,riverPath,seed};
}

