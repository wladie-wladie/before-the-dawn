
/* ============================ БРОСКИ ПО ПРАВИЛАМ V5 ============================
   Выбирается при создании персонажа. «Простые» — 2–3 шестигранника, любая 5–6 даёт удачу.
   «Как в V5» — пул десятигранников «атрибут + навык» (или дисциплина), успех — 6+,
   пара десяток — критический успех (+2 успеха), обычно нужно 2 успеха.
   Кубы Голода заменяют обычные: десятка Голода в критическом — «грязный» успех,
   единица Голода при провале — звериный провал. */
const ATTR={str:"Сила",dex:"Ловкость",sta:"Выносливость",cha:"Харизма",man:"Манипуляция",com:"Самообладание",int:"Интеллект",wit:"Смекалка",res:"Решимость"};
const ATTR_GROUPS=[["Физические",["str","dex","sta"]],["Социальные",["cha","man","com"]],["Ментальные",["int","wit","res"]]];
const SKILL={ath:"Атлетика",brawl:"Драка",larc:"Воровство",stealth:"Скрытность",anim:"Обращение с животными",etiq:"Этикет",insight:"Проницательность",intim:"Запугивание",pers:"Убеждение",street:"Уличное чутьё",subt:"Хитрость",aware:"Внимательность",fin:"Финансы",inv:"Расследование",occ:"Оккультизм"};
// листы кланов: атрибуты в порядке str dex sta cha man com int wit res (сумма как в V5: 4·3·3·3·2·2·2·2·1)
const SHEETS={
  tor:{a:[1,3,2,4,3,2,2,3,2],s:{pers:3,subt:2,etiq:2,insight:2,aware:1,stealth:1,ath:1,street:1}},
  ven:{a:[2,1,2,3,4,3,2,2,3],s:{etiq:3,intim:2,fin:2,pers:2,insight:1,subt:1,aware:1,inv:1}},
  nos:{a:[2,4,2,1,2,3,3,3,2],s:{stealth:3,larc:2,street:2,aware:2,inv:1,brawl:1,ath:1,occ:1}},
  bru:{a:[4,3,3,3,2,1,2,2,2],s:{brawl:3,intim:2,street:2,ath:2,pers:1,aware:1,larc:1,stealth:1}},
  tre:{a:[1,2,2,2,3,3,4,3,2],s:{occ:3,inv:2,aware:2,subt:2,etiq:1,intim:1,stealth:1,larc:1}},
  gan:{a:[3,3,4,1,2,2,2,3,2],s:{anim:3,ath:2,stealth:2,aware:2,brawl:1,street:1,intim:1,inv:1}},
  tzi:{a:[3,2,3,2,2,3,4,2,1],s:{intim:3,occ:2,inv:2,insight:2,brawl:1,stealth:1,etiq:1,aware:1}}};
// тип хищника: как вы кормитесь. Даёт пул охоты, +1 к навыку и районы, где охотиться легче
const PREDATORS={
  cat:{n:"Уличная кошка",line:"Берёте силой: подворотня, удар, короткий глоток.",pool:"str+brawl",skill:"brawl",fav:["slum","edge","port","rail","ind"],fx:"Охота в трущобах, порту и промзоне — +1 куб."},
  siren:{n:"Сирена",line:"Соблазняете: бар, взгляд, чужая квартира до утра.",pool:"cha+subt",skill:"subt",fav:["club","theatre","res"],fx:"Охота в клубах, театрах и жилых кварталах — +1 куб."},
  sand:{n:"Песочный человек",line:"Пьёте у спящих: окно, тишина, никто не проснётся.",pool:"dex+stealth",skill:"stealth",fav:["res","old","uni"],fx:"Охота в жилых кварталах, старом городе и у университета — +1 куб."},
  bag:{n:"Мешочник",line:"Кровь из пакетов: больница, банк крови, свой человек.",pool:"int+street",skill:"street",fav:["hosp","market"],fx:"Охота у больницы и на рынке — +1 куб."}};
const DISC_DOTS=[2,1,1];
// распределение точек при создании: атрибуты 4·3·3·3·2·2·2·2·1, навыки 3·2·2·2·1·1·1·1
const ATTR_NEED={4:1,3:3,2:4,1:1},SKILL_NEED={3:1,2:3,1:4};
function quotaLeft(need,vals){const left={...need};for(const v of Object.values(vals))if(v&&left[v]!=null)left[v]--;return left}
function quotaOk(need,vals,all){const left=quotaLeft(need,vals);return Object.values(left).every(x=>x===0)&&(!all||all.every(k=>vals[k]))}
function autoSheet(clan){const T=SHEETS[clan]||SHEETS.tor;const a={};Object.keys(ATTR).forEach((k,i)=>a[k]=T.a[i]);return {a,s:{...T.s},dp:(DISC[clan]||[])[0]}}
function sheetValid(c){return !!(c&&c.a&&c.s&&quotaOk(ATTR_NEED,c.a,Object.keys(ATTR))&&quotaOk(SKILL_NEED,c.s))}
function mkSheet(clan,pred,custom){const base=sheetValid(custom)?custom:autoSheet(clan);const a={...base.a};
  const s={};for(const [k,v] of Object.entries(base.s))if(v)s[k]=v;const P=PREDATORS[pred]||PREDATORS.sand;s[P.skill]=Math.min(4,(s[P.skill]||0)+1);
  const ds=DISC[clan]||[];const dp=ds.includes(base.dp)?base.dp:ds[0];const d={};ds.forEach(n=>d[n]=n===dp?2:1);return {a,s,d,pred:pred in PREDATORS?pred:"sand"}}
const isV5=()=>!!(G&&G.dice==="v5");
// пулы для выборов в событиях: «атрибут+навык», «атрибут+D:Дисциплина/запасной навык»
const POOLS={"Внушить ему, что вы — проверка":"man+D:Доминирование/subt","Пройти мимо них внутрь":"dex+stealth","Порыться в разрешениях на снос":"int+inv",
  "Стереть ему эту ночь":"man+D:Доминирование/subt","Оставить на месте и проследить, кто заберёт":"wit+stealth","Подняться на служебном лифте":"wit+stealth",
  "Покормиться, пока он пьян":"HUNT","Внушить ему открыть кейс":"man+D:Доминирование/intim","Осмотреть машину":"wit+inv","Пройти как гость":"man+etiq",
  "Спуститься":"res+aware","Посмотреть, кто придёт":"wit+aware","Изучить пятно":"int+inv","Покормиться громким, когда выйдет":"HUNT",
  "Подняться в часовую башню":"dex+ath","Обыскать ризницу":"wit+larc","Увести его в переулок":"cha+subt","Спуститься по следам":"wit+inv",
  "Порыться в её сумочке, пока она на сцене":"dex+larc","Покормиться в толпе":"HUNT","Сыграть ему роль":"man+subt","Пройти внутрь взглядом":"man+D:Доминирование/subt",
  "Разнять":"cha+intim","Помочь найти телефон":"cha+pers","Прижать его":"cha+intim","Покормиться в темноте":"HUNT","Посмотреть образцы":"int+inv",
  "Заглянуть в папку":"dex+larc","Помочь":"cha+pers","Изучить журнал":"int+inv","Стереть ему память":"man+D:Доминирование/subt","Осмотреть тело":"int+inv",
  "Поискать следы":"wit+inv","Покормиться":"HUNT","Пройти без спроса":"dex+stealth","Подняться к окну":"dex+ath","Посмотреть записи камеры":"int+inv",
  "Зайти":"res+aware","Зайти в подъезд":"wit+aware","Подняться":"dex+ath","Увести его за угол":"cha+subt","Обыскать":"wit+larc",
  "Проследить за художником":"dex+stealth","Помочь искать":"wit+aware","Вскрыть замок":"dex+larc","Вытащить, что не сгорело":"com+ath",
  "Припугнуть":"cha+intim","Заглянуть":"wit+aware","Посмотреть в ответ":"com+D:Присутствие/intim","Заглянуть в сумку":"dex+larc","Открыть чемодан":"dex+larc",
  "Посмотреть, кто к ней подойдёт":"wit+aware","Взять его журнал":"dex+larc","Догнать отставшего":"dex+ath","Изучить":"int+inv","Подождать заказчика":"com+aware",
  "Вытащить из огня":"com+ath","Пройти по верёвке":"dex+ath","Подойти":"cha+insight","Изучить круг":"int+occ","Подкрасться":"dex+stealth",
  "Проследить, куда несут":"dex+stealth","Увести одного за контейнеры":"cha+subt","Полистать журнал досмотра":"int+inv","Подняться на маяк":"dex+ath",
  "Осмотреть":"wit+inv","Перепрыгнуть":"dex+ath","Отвести им глаза":"wit+D:Затемнение/stealth"};
// запасной разбор по словам, если выбора нет в таблице
const POOL_WORDS=[[/покорм|охот/i,"HUNT"],[/внуш|стереть|приказ/i,"man+D:Доминирование/subt"],[/подкрас|незамет|проскольз|спрят|тайком|прослед/i,"dex+stealth"],
  [/вскры|сумк|карман|стащ|украс/i,"dex+larc"],[/пригроз|припуг|прижать|запуг/i,"cha+intim"],[/обман|соврат|притвор|роль/i,"man+subt"],
  [/поговор|расспрос|убед|уговор|помоч/i,"cha+pers"],[/изуч|обыск|осмотр|прочит|журнал|следы/i,"wit+inv"],[/подня|прыг|бежат|догн|лез/i,"dex+ath"],
  [/драк|удар|силой|отбить|выбить/i,"str+brawl"],[/ритуал|круг|знак|кровь/i,"int+occ"]];
function poolSpec(text){if(POOLS[text])return POOLS[text];for(const [re,s] of POOL_WORDS)if(re.test(text))return s;return "wit+aware"}
function huntSpec(a){const h=here(a);const P=PREDATORS[(a.sheet&&a.sheet.pred)||"sand"];return {spec:P.pool,mod:P.fav.includes(h.t)?1:0,tag:"охота: "+P.n}}
// разбор пула: атрибут, навык, дисциплина (если есть у клана, иначе запасной навык)
function poolOf(a,spec,mod=0){const sh=a.sheet||mkSheet(a.clan,"sand");if(spec==="HUNT"){const H=huntSpec(a);spec=H.spec;mod+=H.mod}
  const parts=spec.split("+");const out=[];
  for(const p of parts){if(ATTR[p])out.push([ATTR[p],sh.a[p]||0]);
    else if(p.startsWith("D:")){const [dn,fb]=p.slice(2).split("/");if(sh.d[dn])out.push([dn,sh.d[dn]]);else if(fb)out.push([SKILL[fb],sh.s[fb]||0])}
    else if(SKILL[p])out.push([SKILL[p],sh.s[p]||0])}
  let n=out.reduce((s,x)=>s+x[1],0)+mod;n=Math.max(2,n); // попытаться может каждый: не меньше двух кубов
  return {n,parts:out,mod,label:out.map(x=>x[0]).join(" + ")}}
const d10=n=>Array.from({length:Math.max(1,n)},()=>1+Math.floor(Math.random()*10));
// единый бросок для всех действий; need — сколько успехов нужно
function check(a,spec,mod=0,need=2){
  if(!isV5()){const d=rollDice(a,mod);return {d,ok:hit(d),n:hits(d),R:null}}
  const P=poolOf(a,spec,mod);const d=d10(P.n);const hun=Math.min(a.hunger||0,d.length);
  const isH=i=>i>=d.length-hun;let succ=d.filter(v=>v>=6).length;const tens=d.filter(v=>v===10).length;const pairs=Math.floor(tens/2);succ+=pairs*2;
  const crit=pairs>0,messy=crit&&d.some((v,i)=>v===10&&isH(i));const ok=succ>=need;const bestial=!ok&&d.some((v,i)=>v===1&&isH(i));
  return {d,ok,n:succ,R:{v5:1,label:P.label,parts:P.parts,mod:P.mod,pool:P.n,hun,need,succ,crit,messy,bestial}}}
// последствия «грязного» критического и звериного провала
function beastFx(a,X){if(!X.R)return "";if(X.R.messy){a.alarm=clamp(a.alarm+1,0,CONFIG.alarmMax);loudAt(a.pos,a);return "Грязный критический: Зверь проступает наружу. Тревога +1"}
  if(X.R.bestial){a.hunger=clamp(a.hunger+1,0,CONFIG.hungerMax);return "Звериный провал: Голод +1"}return ""}
// для экрана: какой пул у варианта выбора
function choiceSpec(a,E,ch){if(!E)return null;if(E.kind==="infl")return inflSpec(a,ch.inf||{});if(E.kind==="meet")return ch.roll?"str+brawl+D:Мощь":null;return ch.ok?poolSpec(ch.t):null}
function inflSpec(a,inf){return inf.money?"man+fin":inf.card?"man+pers":inf.beast?(a.clan==="tre"?"int+D:Магия крови/occ":"cha+D:Анимализм/anim"):"cha+pers"}
