/* ============================ РАССВЕТ: предупреждение и сцена ============================ */
const hm=h=>`${Math.floor(h/2)?Math.floor(h/2)+" ч":""}${h%2?" 30 мин":""}`.trim()||"0 мин";
function alertHtml(){const A=UI.alert;if(!A)return "";
  return `<div class="dawn-alert lvl${A.lvl}"><div class="da-box"><span class="eyebrow">${A.lvl===2?"Рассвет вот-вот":"Небо светлеет"}</span>
   <h2>${A.lvl===2?"Солнце вот-вот взойдёт":"До рассвета "+hm(A.left)}</h2>
   <p>${A.lvl===2?`До рассвета ${hm(A.left)}, а дорога до убежища — ${hm(A.need)}. Ещё немного — и вы сгорите.`:`Дорога до убежища — ${hm(A.need)}. Если солнце застанет вас на улице, можно не проснуться.`}</p>
   <div class="row"><button class="primary" onclick="UI.alert=null;goHome()">Домой сейчас</button><button class="ghost" onclick="UI.alert=null;render()">Ещё задержусь</button></div></div></div>`}
function sunHtml(){const S=UI.sun;if(!S)return "";
  return `<div class="sun-scene ${S.kind}"><div class="sun-glow"></div><div class="sun-box"><span class="eyebrow">Ночь ${S.night} · 06:00</span><h1>${S.kind==="death"?"Рассвет":"Рассвет застал вас на улице"}</h1><p>${S.text}</p>
   <button class="primary" onclick="UI.sun=null;render()">${G.phase==="end"?"К итогам":"Дальше"}</button></div></div>`}
